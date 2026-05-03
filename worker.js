// textstat — streaming SMS Backup & Restore parser
// Runs in a Web Worker. Single pass, indexOf-based attribute extraction
// so multi-megabyte base64 MMS lines don't blow up regex / DOM parsers.

'use strict';

// ---------- HTML entity decode (fast path: skip if no '&') ----------

const NAMED_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function decodeEntities(s) {
  if (!s || s.indexOf('&') < 0) return s;
  return s.replace(/&(?:(amp|lt|gt|quot|apos)|#(\d+)|#x([0-9a-fA-F]+));/g,
    (_m, named, dec, hex) => {
      if (named) return NAMED_ENTITIES[named];
      try {
        if (dec) return String.fromCodePoint(parseInt(dec, 10));
        if (hex) return String.fromCodePoint(parseInt(hex, 16));
      } catch { return ''; }
      return '';
    });
}

// ---------- attribute extraction ----------

// fast: locate ` name="` then next `"`. Caller must ensure the attribute uses
// double quotes (true for all the fields we care about in this dump format).
function getAttr(line, name, startFrom) {
  const key = ' ' + name + '="';
  const i = line.indexOf(key, startFrom || 0);
  if (i < 0) return null;
  const start = i + key.length;
  const end = line.indexOf('"', start);
  if (end < 0) return null;
  return line.substring(start, end);
}

// ---------- contact key normalization ----------

function normalizePhone(addr) {
  if (!addr) return '';
  // strip non-digits; keep last 10 (US) or all if shorter / shortcode
  const digits = addr.replace(/[^\d]/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return digits || addr;
}

function contactKey(address, name) {
  const cleanName = (name || '').trim();
  if (cleanName && cleanName !== '(Unknown)') return 'n:' + cleanName.toLowerCase();
  return 'p:' + normalizePhone(address);
}

// ---------- emoji detection ----------

// Match a single grapheme that contains an emoji-presentation pictograph.
// We use \p{Extended_Pictographic} to catch emoji code points; Intl.Segmenter
// joins ZWJ sequences (👨‍👩‍👧, 🏳️‍🌈, etc.) into single graphemes.
const EMOJI_RE = /\p{Extended_Pictographic}/u;
const segmenter = (typeof Intl !== 'undefined' && Intl.Segmenter)
  ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  : null;

function countEmojis(text, emojiMap) {
  if (!text) return;
  if (segmenter) {
    for (const { segment } of segmenter.segment(text)) {
      if (EMOJI_RE.test(segment)) {
        emojiMap.set(segment, (emojiMap.get(segment) || 0) + 1);
      }
    }
  } else {
    // fallback: per-codepoint (won't merge ZWJ sequences but still useful)
    for (const ch of text) {
      if (EMOJI_RE.test(ch)) {
        emojiMap.set(ch, (emojiMap.get(ch) || 0) + 1);
      }
    }
  }
}

// ---------- stop words ----------

const STOP_WORDS = new Set((
  'the be to of and a in that have i it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us is was are were am been being has had does did doing should not would have having will shall having got many such own same own both each few more very can may might must up down out off over under again further then once here there when where why how all any both each few more most other some such no nor not only own same so than too very s t can will just don should now im ive id ill youre theyre weve dont didnt cant wont were thats whats hes shes its theyve youve youll theyll wed couldnt wouldnt shouldnt aint hasnt havent hadnt isnt arent wasnt werent doesnt didnt ya yo go gonna wanna gotta got im im sure okay ok like really got actually maybe probably though kinda sorta http https www com net org html png jpg jpeg gif mp4 amp quot apos null'
).split(/\s+/).filter(Boolean));

// strip URLs so http/https/domain fragments don't dominate the word list
const URL_RE = /\bhttps?:\/\/\S+/gi;
const WORD_RE = /[a-z][a-z']{2,}/g; // 3+ chars, must start with a letter

function countWords(text, wordMap) {
  if (!text || text.length < 3) return;
  const cleaned = text.indexOf('http') >= 0 ? text.replace(URL_RE, ' ') : text;
  const lower = cleaned.toLowerCase();
  let m;
  WORD_RE.lastIndex = 0;
  while ((m = WORD_RE.exec(lower)) !== null) {
    const w = m[0];
    if (w.length > 24) continue;
    if (STOP_WORDS.has(w)) continue;
    wordMap.set(w, (wordMap.get(w) || 0) + 1);
  }
}

// ---------- stats container ----------

// ---------- RCS detection ----------

// RCS reactions in Google Messages export look like:  " <ZWSP>❤️<ZWSP> to <LDQUO> original text <RDQUO> "
// (zero-width spaces around the emoji, curly quotes around the quoted body).
// Both SMS and MMS containers can carry these.
const ZW = '[\\s\\u200B-\\u200D\\u2060\\uFEFF\\uFE0F]';      // whitespace + ZWSP/ZWNJ/ZWJ/WJ/BOM/VS16
const QUOTE_OPEN = '[\\u201C\\u201F\\u2018\\u201B"\']';
const QUOTE_CLOSE = '[\\u201D\\u201E\\u2019\\u201A"\']';
const REACTION_RE = new RegExp(
  '^' + ZW + '*\\p{Extended_Pictographic}(?:\\p{Extended_Pictographic}|' + ZW + ')*to\\s+' +
  QUOTE_OPEN + '[\\s\\S]+' + QUOTE_CLOSE + '\\s*$', 'u'
);
const STRIP_LEADING_ZW = new RegExp('^' + ZW + '+');

function detectReactionEmoji(body) {
  if (!body || body.length > 600) return null;
  if (!REACTION_RE.test(body)) return null;
  const stripped = body.replace(STRIP_LEADING_ZW, '');
  if (segmenter) {
    for (const { segment } of segmenter.segment(stripped)) {
      if (EMOJI_RE.test(segment)) return segment;
    }
  }
  const m = stripped.match(/\p{Extended_Pictographic}/u);
  return m ? m[0] : null;
}

function makeStats() {
  return {
    totalMessages: 0,
    sentSms: 0, recvSms: 0,
    sentMms: 0, recvMms: 0,
    rcsCount: 0,
    reactionsSent: 0, reactionsRecv: 0,
    reactionEmojis: new Map(),
    charsSent: 0, charsRecv: 0,
    hourSent: new Array(24).fill(0),
    hourRecv: new Array(24).fill(0),
    dowSent: new Array(7).fill(0),
    dowRecv: new Array(7).fill(0),
    monthCounts: new Map(),     // 'YYYY-MM' -> count
    dayCounts: new Map(),       // 'YYYY-MM-DD' -> count
    contacts: new Map(),        // key -> { displayName, addresses:Set, sent, recv, total, charsSent, charsRecv }
    groups: new Map(),          // groupKey -> { participants:Set, name, count }
    wordsSent: new Map(),
    wordsRecv: new Map(),
    emojisSent: new Map(),
    emojisRecv: new Map(),
    firstTs: null,
    lastTs: null,
    longestSentBody: { len: 0, preview: '', contact: '', photo: null, sent: true, ts: 0 },
    longestRecvBody: { len: 0, preview: '', contact: '', photo: null, sent: false, ts: 0 },
    skippedNoText: 0,
  };
}

const MAX_RUN_MESSAGES = 30;

function trackRun(c, isSent, text) {
  if (isSent) {
    if (c.curMessages.length < MAX_RUN_MESSAGES) c.curMessages.push(text || '');
    c.curRun++;
    if (c.curRun > c.maxRun) {
      c.maxRun = c.curRun;
      c.maxMessages = c.curMessages.slice();
    }
  } else {
    c.curRun = 0;
    c.curMessages = [];
  }
}

function recordMessage(stats, kind, isSent, ts, address, contactName, text, isGroup, opts) {
  stats.totalMessages++;
  if (kind === 'sms') {
    if (isSent) stats.sentSms++; else stats.recvSms++;
  } else {
    if (isSent) stats.sentMms++; else stats.recvMms++;
  }

  if (opts && opts.isRcs) stats.rcsCount++;

  // detect RCS reaction (works for both SMS and MMS bodies)
  const reactionEmoji = detectReactionEmoji(text);
  if (reactionEmoji) {
    if (isSent) stats.reactionsSent++; else stats.reactionsRecv++;
    stats.reactionEmojis.set(reactionEmoji, (stats.reactionEmojis.get(reactionEmoji) || 0) + 1);
  }

  const len = text ? text.length : 0;
  if (isSent) stats.charsSent += len; else stats.charsRecv += len;

  if (ts && Number.isFinite(ts)) {
    if (stats.firstTs === null || ts < stats.firstTs) stats.firstTs = ts;
    if (stats.lastTs === null || ts > stats.lastTs) stats.lastTs = ts;

    const d = new Date(ts);
    const h = d.getHours();
    const dow = d.getDay();
    if (isSent) { stats.hourSent[h]++; stats.dowSent[dow]++; }
    else        { stats.hourRecv[h]++; stats.dowRecv[dow]++; }

    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    const ymd = `${y}-${mo}-${da}`;
    const ym = `${y}-${mo}`;
    stats.dayCounts.set(ymd, (stats.dayCounts.get(ymd) || 0) + 1);
    stats.monthCounts.set(ym, (stats.monthCounts.get(ym) || 0) + 1);
  }

  if (isGroup) {
    const groupKey = address || ('group:' + (contactName || 'unknown'));
    let g = stats.groups.get(groupKey);
    if (!g) {
      const participantAddrs = address ? address.split('~').map(a => a.trim()).filter(Boolean) : [];
      const participantPhotos = stats.nameMap
        ? participantAddrs.map(a => lookupContactPhoto(a, stats.nameMap)).filter(Boolean)
        : [];
      const participantNames = stats.nameMap
        ? participantAddrs.map(a => lookupContactName(a, stats.nameMap) || a)
        : participantAddrs.slice();
      g = {
        name: contactName || '(group)',
        count: 0,
        participants: participantAddrs.length,
        participantPhotos,
        participantNames,
      };
      stats.groups.set(groupKey, g);
    }
    g.count++;
  } else {
    const key = contactKey(address, contactName);
    let c = stats.contacts.get(key);
    if (!c) {
      const display = (contactName && contactName !== '(Unknown)') ? contactName : (address || 'unknown');
      const photo = stats.nameMap ? lookupContactPhoto(address, stats.nameMap) : null;
      c = { displayName: display, sent: 0, recv: 0, total: 0, charsSent: 0, charsRecv: 0, photo, address: address || '', curRun: 0, maxRun: 0, curMessages: [], maxMessages: [] };
      stats.contacts.set(key, c);
    } else {
      if ((!c.displayName || c.displayName === '(Unknown)') && contactName && contactName !== '(Unknown)') {
        c.displayName = contactName;
      }
      if (!c.photo && stats.nameMap) {
        const photo = lookupContactPhoto(address, stats.nameMap);
        if (photo) c.photo = photo;
      }
    }
    if (isSent) { c.sent++; c.charsSent += len; } else { c.recv++; c.charsRecv += len; }
    c.total++;
    trackRun(c, isSent, text);
  }

  if (text && !reactionEmoji) {
    // reactions echo back the message they react to — exclude their text from
    // word and emoji counts (would massively double-count quoted content), but
    // still let them shape contact/time stats above.
    const bodyRef = isSent ? stats.longestSentBody : stats.longestRecvBody;
    if (len > bodyRef.len && len < 5000) {
      if (isSent) {
        stats.longestSentBody = {
          len, preview: text.length > 240 ? text.slice(0, 240) + '…' : text,
          contact: contactName || address || '',
          photo: stats.nameMap ? lookupContactPhoto(address, stats.nameMap) : null,
          sent: true, ts,
        };
      } else {
        stats.longestRecvBody = {
          len, preview: text.length > 240 ? text.slice(0, 240) + '…' : text,
          contact: contactName || address || '',
          photo: stats.nameMap ? lookupContactPhoto(address, stats.nameMap) : null,
          sent: false, ts,
        };
      }
    }
    countWords(text, isSent ? stats.wordsSent : stats.wordsRecv);
    countEmojis(text, isSent ? stats.emojisSent : stats.emojisRecv);
  }
}

// ---------- line processing ----------

function processSmsLine(line, stats) {
  const dateStr = getAttr(line, 'date');
  const typeStr = getAttr(line, 'type');
  const address = getAttr(line, 'address');
  const body = decodeEntities(getAttr(line, 'body'));
  const contactName = decodeEntities(getAttr(line, 'contact_name'));
  // RCS-over-SMS marker: Google Messages stuffs protobuf metadata into `subject`
  // ("subject=\"proto:...\""). The body is still plain text, so just flag it.
  const subjectStart = line.indexOf(' subject="');
  const isRcs = subjectStart > 0 && line.substring(subjectStart + 10, subjectStart + 16) === 'proto:';
  if (!dateStr) return;
  const ts = parseInt(dateStr, 10);
  const isSent = typeStr === '2';
  recordMessage(stats, 'sms', isSent, ts, address, contactName, body, false, { isRcs });
}

function startMms(line) {
  // Only parse the head of the line (mms attrs are all near the start)
  const head = line.length > 1500 ? line.substring(0, 1500) : line;
  const dateStr = getAttr(head, 'date');
  const msgBox = getAttr(head, 'msg_box');
  const address = getAttr(head, 'address');
  const contactName = decodeEntities(getAttr(head, 'contact_name'));
  return {
    ts: dateStr ? parseInt(dateStr, 10) : NaN,
    isSent: msgBox === '2',
    address: address || '',
    contactName: contactName || '',
    isGroup: !!(address && address.indexOf('~') >= 0),
    textParts: [],
  };
}

function consumePartLine(line, mms) {
  // bail fast: only inspect the first ~300 chars to detect ct=text/plain
  if (line.length < 30) return;
  const head = line.length > 300 ? line.substring(0, 300) : line;
  const ctI = head.indexOf(' ct="');
  if (ctI < 0) return;
  const ctEnd = head.indexOf('"', ctI + 5);
  const ct = head.substring(ctI + 5, ctEnd);
  if (ct !== 'text/plain') return;
  // text="..." (the only place where the full line scan is needed)
  // For text/plain parts, the line is small (the text body), so this is cheap.
  const text = decodeEntities(getAttr(line, 'text'));
  if (text && text !== 'null') mms.textParts.push(text);
}

function finishMms(mms, stats) {
  if (!mms) return;
  const text = mms.textParts.join(' ');
  if (!text) stats.skippedNoText++;
  recordMessage(stats, 'mms', mms.isSent, mms.ts, mms.address, mms.contactName, text, mms.isGroup);
}

// ---------- main streaming loop ----------

self.onmessage = async (e) => {
  const msg = e.data;
  if (msg && msg.type === 'parse') {
    try {
      // Parse optional contacts file first so the name map is ready.
      let nameMap = null;
      if (msg.contactsFile) {
        self.postMessage({ type: 'progress', pct: 0, bytes: 0, total: msg.file.size, count: 0, msg: 'reading contacts…' });
        nameMap = await parseContactsFile(msg.contactsFile);
        self.postMessage({ type: 'progress', pct: 2, bytes: 0, total: msg.file.size, count: 0, msg: `loaded ${nameMap.size} contact entries` });
      }
      const head = await msg.file.slice(0, 16).arrayBuffer();
      const headBytes = new Uint8Array(head);
      if (isSqliteMagic(headBytes)) {
        await parseSqlite(msg.file, nameMap);
      } else {
        await parseFile(msg.file, nameMap); // SMS&R XML has contact_name; photos come from vCard
      }
    } catch (err) {
      self.postMessage({ type: 'error', error: (err && err.stack) || String(err) });
    }
  }
};

// ---------- contacts (vCard + AddressBook .abcddb) ----------

async function parseContactsFile(file) {
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (isSqliteMagic(head)) {
    return parseAddressBookDb(file);
  }
  const text = await file.text();
  return parseVcard(text);
}

function nameMapAdd(map, key, entry) {
  if (!key || !entry) return;
  const existing = map.get(key);
  if (!existing) {
    map.set(key, entry);
  } else {
    // merge: prefer first name we saw, but fill in photo if missing
    if (!existing.photo && entry.photo) existing.photo = entry.photo;
  }
}

// Build a data: URL from a vCard PHOTO line's header + value. We accept:
//   PHOTO;ENCODING=b;TYPE=JPEG:<base64>                 (vCard 3.0)
//   PHOTO;ENCODING=BASE64;TYPE=JPEG:<base64>            (variant)
//   PHOTO;TYPE=JPEG;ENCODING=BASE64:<base64>            (variant)
//   PHOTO:data:image/jpeg;base64,<base64>               (vCard 4.0)
//   PHOTO;VALUE=URI:data:image/jpeg;base64,<base64>     (vCard 4.0)
// Returns a data URL string, or null if we can't build one.
function buildPhotoDataUrl(paramStr, value) {
  if (!value) return null;
  // Already a data URL
  const trimmed = value.trim();
  if (trimmed.startsWith('data:')) return trimmed;
  // Otherwise assume base64 payload; figure out mime from TYPE= param
  // (PARAM string looks like ";ENCODING=BASE64;TYPE=JPEG")
  const p = (paramStr || '').toUpperCase();
  if (p.indexOf('BASE64') < 0 && p.indexOf('=B') < 0 && p.indexOf(';B') < 0 && p.indexOf(':B') < 0) {
    // No explicit base64 marker — bail (could be URL or unsupported)
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    // Still try base64 as a last resort below
  }
  let mime = 'image/jpeg';
  const typeMatch = p.match(/TYPE=([A-Z0-9+\-]+)/);
  if (typeMatch) {
    const t = typeMatch[1].toLowerCase();
    if (t === 'jpeg' || t === 'jpg') mime = 'image/jpeg';
    else if (t === 'png') mime = 'image/png';
    else if (t === 'gif') mime = 'image/gif';
    else if (t === 'webp') mime = 'image/webp';
    else if (t.startsWith('image/')) mime = t;
    else mime = 'image/' + t;
  }
  // Strip whitespace/newlines that may linger in the base64 payload
  const clean = trimmed.replace(/\s+/g, '');
  if (!clean) return null;
  return 'data:' + mime + ';base64,' + clean;
}

function parseVcard(text) {
  // unfold RFC 6350 line continuations (a leading space/tab continues prev line)
  const unfolded = text.replace(/\r?\n[ \t]/g, '');
  const lines = unfolded.split(/\r?\n/);
  const map = new Map();
  let cur = null;
  for (const raw of lines) {
    const line = raw;
    if (line.startsWith('BEGIN:VCARD')) {
      cur = { fn: null, n: null, phones: [], emails: [], photo: null };
    } else if (line.startsWith('END:VCARD')) {
      if (cur) {
        const name = cur.fn || cur.n;
        if (name || cur.photo) {
          const entry = { name: name || '', photo: cur.photo || null };
          for (const p of cur.phones) nameMapAdd(map, 'p:' + normalizePhone(p), entry);
          for (const e of cur.emails) nameMapAdd(map, 'e:' + e.toLowerCase().trim(), entry);
        }
      }
      cur = null;
    } else if (cur) {
      const colon = line.indexOf(':');
      if (colon < 0) continue;
      const rawKey = line.substring(0, colon);
      const key = rawKey.toUpperCase();
      const val = line.substring(colon + 1);
      if (key === 'FN' || key.startsWith('FN;')) {
        if (!cur.fn) cur.fn = unescapeVcard(val).trim();
      } else if (key === 'N' || key.startsWith('N;')) {
        if (!cur.n) {
          const parts = val.split(';');
          const given = unescapeVcard(parts[1] || '').trim();
          const family = unescapeVcard(parts[0] || '').trim();
          const composed = (given + ' ' + family).trim() || given || family;
          if (composed) cur.n = composed;
        }
      } else if (key === 'TEL' || key.startsWith('TEL;') || key.startsWith('TEL,')) {
        cur.phones.push(val);
      } else if (key === 'EMAIL' || key.startsWith('EMAIL;') || key.startsWith('EMAIL,')) {
        cur.emails.push(val);
      } else if (key === 'PHOTO' || key.startsWith('PHOTO;')) {
        if (!cur.photo) {
          const semi = rawKey.indexOf(';');
          const params = semi >= 0 ? rawKey.substring(semi) : '';
          const photo = buildPhotoDataUrl(params, val);
          if (photo) cur.photo = photo;
        }
      }
    }
  }
  return map;
}

function unescapeVcard(s) {
  return s.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
}

// Convert Uint8Array to base64 string in chunks to avoid stack overflow.
function uint8ToBase64(bytes) {
  const CHUNK = 8192;
  let str = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    str += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(str);
}

// Extract a data: URL from an AddressBook ZTHUMBNAILIMAGEDATA blob.
// Apple prepends a single 0x01 version byte before the raw JPEG/PNG payload.
function abcddPhotoUrl(blob) {
  if (!blob || blob.length < 4) return null;
  const start = blob[0] === 0x01 ? 1 : 0;
  const isJpeg = blob[start] === 0xFF && blob[start + 1] === 0xD8;
  const isPng  = blob[start] === 0x89 && blob[start + 1] === 0x50;
  if (!isJpeg && !isPng) return null;
  return 'data:image/' + (isJpeg ? 'jpeg' : 'png') + ';base64,' + uint8ToBase64(blob.subarray(start));
}

async function parseAddressBookDb(file) {
  if (typeof self.initSqlJs !== 'function') {
    importScripts('vendor/sql-wasm.js');
  }
  const SQL = await self.initSqlJs({ locateFile: f => 'vendor/' + f });
  const db = new SQL.Database(new Uint8Array(await file.arrayBuffer()));
  const map = new Map();
  // Some Macs store contacts only in the per-source .abcddb under
  // ~/Library/Application Support/AddressBook/Sources/<UUID>/. The schema is
  // identical to the top-level DB. We tolerate missing tables.
  let stmt;
  try {
    stmt = db.prepare(`
      SELECT
        COALESCE(NULLIF(TRIM(COALESCE(R.ZFIRSTNAME,'') || ' ' || COALESCE(R.ZLASTNAME,'')), ''), R.ZORGANIZATION) AS name,
        P.ZFULLNUMBER AS phone,
        R.ZTHUMBNAILIMAGEDATA AS photo
      FROM ZABCDRECORD R
      LEFT JOIN ZABCDPHONENUMBER P ON P.ZOWNER = R.Z_PK
      WHERE P.ZFULLNUMBER IS NOT NULL AND P.ZFULLNUMBER != ''
    `);
    while (stmt.step()) {
      const row = stmt.getAsObject();
      if (row.name && row.phone) {
        const photo = row.photo ? abcddPhotoUrl(row.photo) : null;
        nameMapAdd(map, 'p:' + normalizePhone(row.phone), { name: row.name, photo });
      }
    }
    stmt.free();
  } catch (e) { /* table may not exist */ }
  try {
    stmt = db.prepare(`
      SELECT
        COALESCE(NULLIF(TRIM(COALESCE(R.ZFIRSTNAME,'') || ' ' || COALESCE(R.ZLASTNAME,'')), ''), R.ZORGANIZATION) AS name,
        E.ZADDRESS AS email,
        R.ZTHUMBNAILIMAGEDATA AS photo
      FROM ZABCDRECORD R
      LEFT JOIN ZABCDEMAILADDRESS E ON E.ZOWNER = R.Z_PK
      WHERE E.ZADDRESS IS NOT NULL AND E.ZADDRESS != ''
    `);
    while (stmt.step()) {
      const row = stmt.getAsObject();
      if (row.name && row.email) {
        const photo = row.photo ? abcddPhotoUrl(row.photo) : null;
        nameMapAdd(map, 'e:' + row.email.toLowerCase().trim(), { name: row.name, photo });
      }
    }
    stmt.free();
  } catch (e) { /* table may not exist */ }
  db.close();
  return map;
}

function lookupContact(handle, nameMap) {
  if (!handle || !nameMap) return null;
  const isEmail = handle.indexOf('@') > 0;
  const key = isEmail ? 'e:' + handle.toLowerCase() : 'p:' + normalizePhone(handle);
  return nameMap.get(key) || null;
}

function lookupContactName(handle, nameMap) {
  const e = lookupContact(handle, nameMap);
  return e && e.name ? e.name : null;
}

function lookupContactPhoto(handle, nameMap) {
  const e = lookupContact(handle, nameMap);
  return e && e.photo ? e.photo : null;
}

// ---------- file format detection ----------

const SQLITE_MAGIC = [0x53, 0x51, 0x4C, 0x69, 0x74, 0x65, 0x20, 0x66, 0x6F, 0x72, 0x6D, 0x61, 0x74, 0x20, 0x33, 0x00];
function isSqliteMagic(bytes) {
  if (!bytes || bytes.length < 16) return false;
  for (let i = 0; i < 16; i++) if (bytes[i] !== SQLITE_MAGIC[i]) return false;
  return true;
}

// ---------- iMessage / chat.db parser ----------
//
// Apple stores message dates as nanoseconds since 2001-01-01 00:00:00 UTC.
// JS Number can hold these but we lose ms precision converting to Unix ms,
// which is fine for our aggregations.
const APPLE_EPOCH_OFFSET_MS = 978307200000;
function appleDateToMs(d) {
  if (d === null || d === undefined || d === 0) return 0;
  // Modern macOS/iOS: nanoseconds since 2001. Older entries are seconds — detect.
  if (d > 1e15) return Math.floor(d / 1e6) + APPLE_EPOCH_OFFSET_MS;
  return d * 1000 + APPLE_EPOCH_OFFSET_MS;
}

// Reaction type → emoji (Apple uses a fixed set for tapbacks; sticker reactions
// use 2006/4000+ and put the actual emoji in `associated_message_emoji`).
const REACTION_EMOJI_BY_TYPE = {
  2000: '❤️', 2001: '👍', 2002: '👎', 2003: '😂', 2004: '‼️', 2005: '❓',
};

// Extract text from an attributedBody BLOB. Apple typedstream-encodes an
// NSAttributedString here; we don't need the full structure, just the inner
// NSString payload. Strategy: locate the NSString class marker, then scan for
// the next 0x2B byte (typedstream "C string" type code) followed by a length
// byte and that many UTF-8 bytes.
const NSSTRING_MARKER = [0x4E, 0x53, 0x53, 0x74, 0x72, 0x69, 0x6E, 0x67]; // "NSString"
const utf8Decoder = new TextDecoder('utf-8', { fatal: false });

function findBytes(buf, needle, from) {
  outer: for (let i = from; i <= buf.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) if (buf[i + j] !== needle[j]) continue outer;
    return i;
  }
  return -1;
}

function extractAttributedBody(buf) {
  if (!buf || buf.length < 32) return null;
  // Find the LAST occurrence of "NSString" (NSMutableString class defs include
  // an NSString reference earlier; we want the one closest to the payload).
  let nsStringEnd = -1;
  let from = 0;
  while (true) {
    const idx = findBytes(buf, NSSTRING_MARKER, from);
    if (idx < 0) break;
    nsStringEnd = idx + NSSTRING_MARKER.length;
    from = idx + 1;
  }
  if (nsStringEnd < 0) return null;
  // Scan forward for `+` (0x2B) — typedstream "C string" type code. The string
  // length follows. Apple's encoding: byte < 0x81 = literal length; 0x81 = next
  // 2 bytes are little-endian length; 0x82 = next 4 bytes LE.
  const limit = Math.min(buf.length, nsStringEnd + 64);
  for (let j = nsStringEnd; j < limit; j++) {
    if (buf[j] !== 0x2B) continue;
    let len = buf[j + 1];
    let payloadStart = j + 2;
    if (len === 0x81) {
      len = buf[j + 2] | (buf[j + 3] << 8);
      payloadStart = j + 4;
    } else if (len === 0x82) {
      len = buf[j + 2] | (buf[j + 3] << 8) | (buf[j + 4] << 16) | (buf[j + 5] << 24);
      payloadStart = j + 6;
    } else if (len >= 0x80) {
      // unknown extended encoding — bail
      continue;
    }
    if (len <= 0 || len > 200000 || payloadStart + len > buf.length) continue;
    const slice = buf.subarray(payloadStart, payloadStart + len);
    // sanity: messages shouldn't contain NUL bytes
    let hasNul = false;
    for (let k = 0; k < slice.length; k++) if (slice[k] === 0) { hasNul = true; break; }
    if (hasNul) continue;
    return utf8Decoder.decode(slice);
  }
  return null;
}

async function parseSqlite(file, nameMap) {
  const totalSize = file.size;
  self.postMessage({ type: 'progress', pct: 0, bytes: 0, total: totalSize, count: 0, msg: 'loading sqlite engine…' });

  // load sql.js (vendored); workers don't have window/document, so we configure
  // Module shim before importScripts so the auto-init doesn't bind to globals.
  if (typeof self.initSqlJs !== 'function') {
    importScripts('vendor/sql-wasm.js');
  }
  const SQL = await self.initSqlJs({
    locateFile: f => 'vendor/' + f,
  });

  self.postMessage({ type: 'progress', pct: 20, bytes: totalSize / 4, total: totalSize, count: 0, msg: 'reading database…' });

  const buf = new Uint8Array(await file.arrayBuffer());
  const db = new SQL.Database(buf);

  self.postMessage({ type: 'progress', pct: 40, bytes: totalSize / 2, total: totalSize, count: 0, msg: 'querying messages…' });

  const stats = makeStats();
  stats.nameMap = nameMap || null;

  // Pre-query: fetch participants for every group chat so we can derive names
  // and participant counts. chat.display_name is only set when the user gives
  // the group a custom name; otherwise we build it from the member handles.
  const chatInfoMap = new Map(); // chat ROWID → { chatIdentifier, displayName, handles[] }
  try {
    const pstmt = db.prepare(`
      SELECT chj.chat_id AS chat_rowid, c.display_name, c.chat_identifier, h.id AS handle
      FROM chat_handle_join chj
      JOIN handle h ON chj.handle_id = h.ROWID
      JOIN chat c   ON chj.chat_id   = c.ROWID
      WHERE c.style = 43
      ORDER BY chj.chat_id
    `);
    while (pstmt.step()) {
      const r = pstmt.getAsObject();
      const rowid = r.chat_rowid;
      if (!chatInfoMap.has(rowid)) {
        chatInfoMap.set(rowid, { chatIdentifier: r.chat_identifier || '', displayName: r.display_name || '', handles: [] });
      }
      if (r.handle) chatInfoMap.get(rowid).handles.push(r.handle);
    }
    pstmt.free();
  } catch (_) { /* chat_handle_join may not exist in very old exports */ }

  // Resolve each group's display name and pre-populate stats.groups so
  // bucketMessage finds an entry with participant info already set.
  for (const [, info] of chatInfoMap) {
    if (!info.chatIdentifier) continue;
    const participantNames = info.handles.map(h => (nameMap && lookupContactName(h, nameMap)) || h);
    const participantPhotos = info.handles.map(h => nameMap ? lookupContactPhoto(h, nameMap) : null).filter(Boolean);
    if (!info.displayName && info.handles.length > 0) {
      const shown = participantNames.slice(0, 3).join(', ');
      info.displayName = info.handles.length > 3 ? shown + ` +${info.handles.length - 3}` : shown;
    }
    stats.groups.set(info.chatIdentifier, {
      name: info.displayName || '(group)',
      count: 0,
      participants: info.handles.length,
      participantPhotos,
      participantNames,
    });
  }

  const sql = `
    SELECT
      m.ROWID                       AS rowid,
      m.is_from_me                  AS is_from_me,
      m.date                        AS date,
      m.text                        AS text,
      m.attributedBody              AS ab,
      m.service                     AS service,
      m.associated_message_type     AS amt,
      m.associated_message_emoji    AS ame,
      m.cache_has_attachments       AS hasatt,
      m.is_audio_message            AS audio,
      m.date_edited                 AS edited,
      m.date_retracted              AS retracted,
      h.id                          AS handle,
      cmj.chat_id                   AS chat_rowid,
      c.style                       AS chat_style,
      c.display_name                AS chat_name,
      c.chat_identifier             AS chat_id
    FROM message m
    LEFT JOIN handle h               ON m.handle_id = h.ROWID
    LEFT JOIN chat_message_join cmj  ON m.ROWID = cmj.message_id
    LEFT JOIN chat c                 ON cmj.chat_id = c.ROWID
    WHERE m.item_type = 0
    ORDER BY m.date
  `;

  const stmt = db.prepare(sql);
  let processed = 0;
  let lastReport = Date.now();

  // iMessage-specific stat additions
  stats.serviceCounts = new Map();
  stats.attachmentCount = 0;
  stats.editedCount = 0;
  stats.retractedCount = 0;

  while (stmt.step()) {
    const row = stmt.getAsObject();
    processSqliteRow(row, stats, nameMap, chatInfoMap);
    processed++;
    if ((processed & 0x3FF) === 0) {
      const now = Date.now();
      if (now - lastReport > 150) {
        lastReport = now;
        self.postMessage({
          type: 'progress',
          pct: 40 + Math.min(55, (processed / 36000) * 55), // approx; refined at end
          bytes: totalSize, total: totalSize,
          count: stats.totalMessages,
        });
      }
    }
  }
  stmt.free();
  db.close();

  self.postMessage({ type: 'progress', pct: 99.5, bytes: totalSize, total: totalSize, count: stats.totalMessages, msg: 'crunching numbers…' });
  self.postMessage({ type: 'done', stats: serialize(stats) });
}

function processSqliteRow(row, stats, nameMap, chatInfoMap) {
  const ts = appleDateToMs(row.date);
  const isSent = row.is_from_me === 1;
  const handleId = row.handle || '';
  const chatStyle = row.chat_style;        // 43 = group, 45 = 1:1, null if unlinked
  const isGroup = chatStyle === 43;
  const chatName = row.chat_name || '';
  const chatId = row.chat_id || '';

  // service tracking
  const svc = row.service || 'iMessage';
  stats.serviceCounts.set(svc, (stats.serviceCounts.get(svc) || 0) + 1);
  if (row.hasatt) stats.attachmentCount++;
  if (row.edited) stats.editedCount++;
  if (row.retracted) stats.retractedCount++;

  // text source: prefer text column; fall back to attributedBody decode
  let text = row.text;
  if ((text === null || text === undefined || text === '') && row.ab) {
    text = extractAttributedBody(row.ab) || '';
  }

  // reactions: Apple stores them as separate message rows with associated_message_type
  const amt = row.amt || 0;
  let isReaction = false;
  let reactionEmoji = null;
  if (amt >= 2000 && amt <= 2099) {
    isReaction = true;
    reactionEmoji = REACTION_EMOJI_BY_TYPE[amt] || row.ame || '★';
  } else if (amt >= 4000 && amt <= 4099) {
    // sticker reaction — actual emoji in associated_message_emoji
    isReaction = true;
    reactionEmoji = row.ame || '🏷';
  } else if (amt >= 3000 && amt <= 3099) {
    // removed reaction — skip entirely (don't count as message)
    return;
  }

  // build a contact key + display name for 1:1 chats. chat.db has no name
  // resolution; if the user uploaded a contacts file we look it up here.
  let contactName, address;
  if (isGroup) {
    const chatInfo = chatInfoMap && chatInfoMap.get(row.chat_rowid);
    // use chat_identifier as the stable group key; fall back to chat_id from query
    address = (chatInfo && chatInfo.chatIdentifier) || chatId;
    contactName = (chatInfo && chatInfo.displayName) || chatName || '(group)';
  } else {
    address = handleId || chatId;
    contactName = (nameMap && lookupContactName(address, nameMap)) || address;
  }

  // route through the same recording pipeline as the XML path
  // We pass `text` for the body. For reactions, recordMessage's reaction
  // detection will see emoji-leading text like 'Loved "..."', but we instead
  // tag reactions explicitly by manipulating stats here, then pass empty body
  // to skip the XML reaction heuristic.
  if (isReaction) {
    // tally directly; avoid double-counting via the heuristic detector
    stats.totalMessages++;
    if (isSent) stats.reactionsSent++; else stats.reactionsRecv++;
    stats.reactionEmojis.set(reactionEmoji, (stats.reactionEmojis.get(reactionEmoji) || 0) + 1);
    // still count toward sent/recv totals for the contact + time bucketing
    bucketMessage(stats, isSent, ts, address, contactName, isGroup, /*kind*/ 'imsg');
    return;
  }

  recordMessageImsg(stats, isSent, ts, address, contactName, text, isGroup);
}

// A leaner version of recordMessage tailored for iMessage rows (we don't have
// SMS vs MMS; everything counts as a single "imsg" kind; reactions are handled
// upstream and bypass this path).
function recordMessageImsg(stats, isSent, ts, address, contactName, text, isGroup) {
  stats.totalMessages++;
  if (isSent) stats.sentSms++; else stats.recvSms++;  // reuse SMS counters as "single-message" buckets

  const len = text ? text.length : 0;
  if (isSent) stats.charsSent += len; else stats.charsRecv += len;

  bucketMessage(stats, isSent, ts, address, contactName, isGroup, 'imsg');

  if (!isGroup) {
    const c = stats.contacts.get(contactKey(address, contactName));
    if (c) trackRun(c, isSent, text);
  }

  if (text) {
    const bodyRef = isSent ? stats.longestSentBody : stats.longestRecvBody;
    if (len > bodyRef.len && len < 5000) {
      if (isSent) {
        stats.longestSentBody = {
          len, preview: text.length > 240 ? text.slice(0, 240) + '…' : text,
          contact: contactName || address || '',
          photo: stats.nameMap ? lookupContactPhoto(address, stats.nameMap) : null,
          sent: true, ts,
        };
      } else {
        stats.longestRecvBody = {
          len, preview: text.length > 240 ? text.slice(0, 240) + '…' : text,
          contact: contactName || address || '',
          photo: stats.nameMap ? lookupContactPhoto(address, stats.nameMap) : null,
          sent: false, ts,
        };
      }
    }
    countWords(text, isSent ? stats.wordsSent : stats.wordsRecv);
    countEmojis(text, isSent ? stats.emojisSent : stats.emojisRecv);
  }
}

// Shared time/contact/group bucketing — extracted so reaction rows can update
// the time-of-day / day-of-week / contact stats without going through the full
// recordMessage path.
function bucketMessage(stats, isSent, ts, address, contactName, isGroup) {
  if (ts && Number.isFinite(ts)) {
    if (stats.firstTs === null || ts < stats.firstTs) stats.firstTs = ts;
    if (stats.lastTs === null || ts > stats.lastTs) stats.lastTs = ts;

    const d = new Date(ts);
    const h = d.getHours();
    const dow = d.getDay();
    if (isSent) { stats.hourSent[h]++; stats.dowSent[dow]++; }
    else        { stats.hourRecv[h]++; stats.dowRecv[dow]++; }

    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    const ymd = `${y}-${mo}-${da}`;
    const ym = `${y}-${mo}`;
    stats.dayCounts.set(ymd, (stats.dayCounts.get(ymd) || 0) + 1);
    stats.monthCounts.set(ym, (stats.monthCounts.get(ym) || 0) + 1);
  }

  if (isGroup) {
    const groupKey = address || ('group:' + (contactName || 'unknown'));
    let g = stats.groups.get(groupKey);
    if (!g) {
      g = {
        name: contactName || '(group)',
        count: 0,
        participants: 0,
        participantPhotos: [],
        participantNames: [],
      };
      stats.groups.set(groupKey, g);
    }
    g.count++;
  } else {
    const key = contactKey(address, contactName);
    let c = stats.contacts.get(key);
    if (!c) {
      const display = (contactName && contactName !== '(Unknown)') ? contactName : (address || 'unknown');
      const photo = stats.nameMap ? lookupContactPhoto(address, stats.nameMap) : null;
      c = { displayName: display, sent: 0, recv: 0, total: 0, charsSent: 0, charsRecv: 0, photo, address: address || '', curRun: 0, maxRun: 0, curMessages: [], maxMessages: [] };
      stats.contacts.set(key, c);
    } else if (!c.photo && stats.nameMap) {
      const photo = lookupContactPhoto(address, stats.nameMap);
      if (photo) c.photo = photo;
    }
    if (isSent) c.sent++; else c.recv++;
    c.total++;
    // run tracking with text is handled by callers (recordMessage / recordMessageImsg)
    // for reaction-only bucketMessage calls, just reset on recv
    if (!isSent) { c.curRun = 0; c.curMessages = []; }
  }
}

// Cap how much of any single line we capture in memory. This is the key trick
// that lets us process 10GB+ exports: MMS image-data lines are routinely
// hundreds of megabytes (one huge base64 string on a single XML line). We only
// ever need the first few hundred chars of a part line to identify `ct=`, and
// real text bodies fit comfortably under this cap.
const LINE_CAP = 256 * 1024;

function dispatchLine(line, ctx, stats) {
  if (line.length < 7) return;
  // find indent depth (number of leading spaces) without scanning the whole line
  let i = 0;
  while (i < 7 && i < line.length && line.charCodeAt(i) === 32) i++;
  if (line.charCodeAt(i) !== 60 /* '<' */) return; // not a tag at our depth

  const tagChar = line.charCodeAt(i + 1);

  if (i === 2) {
    // top-level under <smses>: <sms ...>, <mms ...>, </mms>, <smses ...>, </smses>
    if (tagChar === 115 /* 's' */ && line.charCodeAt(i + 4) === 32 /* space after "sms" */) {
      processSmsLine(line, stats);
    } else if (tagChar === 109 /* 'm' */ && line.charCodeAt(i + 4) === 32 /* space after "mms" */) {
      ctx.mms = startMms(line);
      // self-closing form: <mms .../> (rare in practice but handle it)
      if (line.charCodeAt(line.length - 2) === 47 /* '/' */ && line.charCodeAt(line.length - 1) === 62 /* '>' */) {
        finishMms(ctx.mms, stats); ctx.mms = null;
      }
    } else if (tagChar === 47 /* '/' */ && line.charCodeAt(i + 2) === 109 /* 'm' */) {
      // </mms>
      if (ctx.mms) { finishMms(ctx.mms, stats); ctx.mms = null; }
    }
  } else if (i === 6 && ctx.mms && tagChar === 112 /* 'p' */) {
    // inside MMS, six-space indent: <part ...> (we ignore <addr>)
    consumePartLine(line, ctx.mms);
  }
}

async function parseFile(file, nameMap) {
  const totalSize = file.size;
  let bytesProcessed = 0;
  let lastReport = 0;

  self.postMessage({ type: 'progress', pct: 0, bytes: 0, total: totalSize, count: 0, msg: 'opening file…' });

  const stats = makeStats();
  stats.nameMap = nameMap || null;
  const ctx = { mms: null };

  // bounded per-line buffer
  let lineBuf = '';
  let lineCapped = false;

  const reader = file.stream().pipeThrough(new TextDecoderStream('utf-8')).getReader();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    bytesProcessed += value.length;

    let pos = 0;
    const vlen = value.length;
    while (pos < vlen) {
      const nl = value.indexOf('\n', pos);
      if (nl < 0) {
        // no newline — append (capped) and break
        if (!lineCapped) {
          const room = LINE_CAP - lineBuf.length;
          if (room > 0) {
            lineBuf += room >= vlen - pos ? value.substring(pos) : value.substring(pos, pos + room);
            if (lineBuf.length >= LINE_CAP) lineCapped = true;
          } else {
            lineCapped = true;
          }
        }
        break;
      }
      // append [pos, nl) to lineBuf (respecting cap), then dispatch
      if (!lineCapped) {
        const segLen = nl - pos;
        const room = LINE_CAP - lineBuf.length;
        if (room > 0) {
          lineBuf += room >= segLen ? value.substring(pos, nl) : value.substring(pos, pos + room);
        }
      }
      // strip trailing \r
      let line = lineBuf;
      if (line.length > 0 && line.charCodeAt(line.length - 1) === 13) line = line.substring(0, line.length - 1);
      dispatchLine(line, ctx, stats);
      lineBuf = '';
      lineCapped = false;
      pos = nl + 1;
    }

    const now = Date.now();
    if (now - lastReport > 150) {
      lastReport = now;
      self.postMessage({
        type: 'progress',
        pct: totalSize ? Math.min(99, (bytesProcessed / totalSize) * 100) : 0,
        bytes: bytesProcessed, total: totalSize,
        count: stats.totalMessages,
      });
    }
  }

  // tail (file without trailing newline)
  if (lineBuf.length) {
    let line = lineBuf;
    if (line.length > 0 && line.charCodeAt(line.length - 1) === 13) line = line.substring(0, line.length - 1);
    dispatchLine(line, ctx, stats);
  }

  // ---------- finalize ----------
  self.postMessage({ type: 'progress', pct: 99.5, bytes: totalSize, total: totalSize, count: stats.totalMessages, msg: 'crunching numbers…' });

  const result = serialize(stats);
  self.postMessage({ type: 'done', stats: result });
}

// ---------- result shaping ----------

function serialize(s) {
  // top contacts (filter out shortcodes / unknown if too generic)
  const contacts = Array.from(s.contacts.values())
    .map(c => ({ ...c }))
    .filter(c => c.displayName && c.total >= 1)
    .sort((a, b) => b.total - a.total);

  // shortcodes (no name + numeric address with <10 digits) get pushed down
  const topContacts = contacts
    .filter(c => !/^\d{1,7}$/.test(c.displayName))
    .slice(0, 25);

  // longest run of consecutive sent messages before any reply, across all 1:1 contacts
  let longestSentRun = null;
  for (const c of topContacts) {
    if (c.maxRun && (!longestSentRun || c.maxRun > longestSentRun.count)) {
      longestSentRun = { count: c.maxRun, displayName: c.displayName, photo: c.photo, messages: (c.maxMessages || []).filter(Boolean) };
    }
  }

  const groups = Array.from(s.groups.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  const topWordsSent = Array.from(s.wordsSent.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([word, count]) => ({ word, count }));

  const topWordsRecv = Array.from(s.wordsRecv.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([word, count]) => ({ word, count }));

  // combined totals for the word cloud (size by total usage)
  const wordTotals = new Map();
  for (const [w, c] of s.wordsSent) wordTotals.set(w, (wordTotals.get(w) || 0) + c);
  for (const [w, c] of s.wordsRecv) wordTotals.set(w, (wordTotals.get(w) || 0) + c);
  const topWords = Array.from(wordTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([word, count]) => ({ word, count }));

  const topEmojisSent = Array.from(s.emojisSent.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([emoji, count]) => ({ emoji, count }));

  const topEmojisRecv = Array.from(s.emojisRecv.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([emoji, count]) => ({ emoji, count }));

  // combined totals (kept for backward compat / condition checks)
  const emojiTotals = new Map();
  for (const [e, c] of s.emojisSent) emojiTotals.set(e, (emojiTotals.get(e) || 0) + c);
  for (const [e, c] of s.emojisRecv) emojiTotals.set(e, (emojiTotals.get(e) || 0) + c);
  const topEmojis = Array.from(emojiTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([emoji, count]) => ({ emoji, count }));

  const topReactions = Array.from(s.reactionEmojis.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([emoji, count]) => ({ emoji, count }));

  // months — fill in any gaps between first and last
  const monthsArr = [];
  if (s.firstTs && s.lastTs) {
    const first = new Date(s.firstTs);
    const last = new Date(s.lastTs);
    let y = first.getFullYear(), mo = first.getMonth();
    while (y < last.getFullYear() || (y === last.getFullYear() && mo <= last.getMonth())) {
      const key = `${y}-${String(mo + 1).padStart(2, '0')}`;
      monthsArr.push({ key, count: s.monthCounts.get(key) || 0 });
      mo++;
      if (mo === 12) { mo = 0; y++; }
    }
  }

  // calendar heatmap — all days from first to last with gap-fill (count=0 for silent days)
  const calDays = [];
  if (s.firstTs && s.lastTs) {
    const cur = new Date(s.firstTs);
    cur.setHours(0, 0, 0, 0);
    const end = new Date(s.lastTs);
    end.setHours(23, 59, 59, 999);
    while (cur <= end) {
      const ymd = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
      calDays.push({ ymd, count: s.dayCounts.get(ymd) || 0 });
      cur.setDate(cur.getDate() + 1);
    }
  }

  // longest streak of days with at least one message
  const days = Array.from(s.dayCounts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  let longestStreak = 0, streakStart = null, streakEnd = null;
  let curStreak = 0, curStart = null, prevDate = null;
  for (const [ymd] of days) {
    if (prevDate) {
      const diff = (Date.parse(ymd) - Date.parse(prevDate)) / 86400000;
      if (Math.abs(diff - 1) < 0.5) {
        curStreak++;
      } else {
        if (curStreak > longestStreak) { longestStreak = curStreak; streakStart = curStart; streakEnd = prevDate; }
        curStreak = 1; curStart = ymd;
      }
    } else {
      curStreak = 1; curStart = ymd;
    }
    prevDate = ymd;
  }
  if (curStreak > longestStreak) { longestStreak = curStreak; streakStart = curStart; streakEnd = prevDate; }

  // busiest day
  let busiest = { ymd: null, count: 0 };
  for (const [ymd, c] of s.dayCounts.entries()) {
    if (c > busiest.count) busiest = { ymd, count: c };
  }

  // late-night / early-bird percentages
  const totalSent = s.sentSms + s.sentMms;
  const totalRecv = s.recvSms + s.recvMms;
  const totalAll = totalSent + totalRecv;

  const lateNightSent = s.hourSent.slice(0, 5).reduce((a, b) => a + b, 0) +
                        s.hourSent.slice(23).reduce((a, b) => a + b, 0);
  const earlyBirdSent = s.hourSent.slice(5, 9).reduce((a, b) => a + b, 0);

  // peak hour
  const hourTotals = s.hourSent.map((v, i) => v + s.hourRecv[i]);
  let peakHour = 0;
  for (let i = 1; i < 24; i++) if (hourTotals[i] > hourTotals[peakHour]) peakHour = i;

  // peak day-of-week
  const dowTotals = s.dowSent.map((v, i) => v + s.dowRecv[i]);
  let peakDow = 0;
  for (let i = 1; i < 7; i++) if (dowTotals[i] > dowTotals[peakDow]) peakDow = i;

  // active days — distinct days with any message
  const activeDays = s.dayCounts.size;
  const totalDays = (s.firstTs && s.lastTs)
    ? Math.max(1, Math.round((s.lastTs - s.firstTs) / 86400000) + 1)
    : 0;

  return {
    summary: {
      totalMessages: s.totalMessages,
      totalSent, totalRecv,
      sentSms: s.sentSms, recvSms: s.recvSms,
      sentMms: s.sentMms, recvMms: s.recvMms,
      charsSent: s.charsSent, charsRecv: s.charsRecv,
      firstTs: s.firstTs, lastTs: s.lastTs,
      activeDays, totalDays,
      uniqueContacts: contacts.length,
      uniqueGroups: s.groups.size,
      rcsCount: s.rcsCount,
      reactionsSent: s.reactionsSent,
      reactionsRecv: s.reactionsRecv,
      attachmentCount: s.attachmentCount || 0,
      editedCount: s.editedCount || 0,
      retractedCount: s.retractedCount || 0,
      serviceCounts: s.serviceCounts ? Object.fromEntries(s.serviceCounts) : null,
      avgPerDay: totalDays ? +(s.totalMessages / totalDays).toFixed(1) : 0,
      lateNightSentPct: totalSent ? +(100 * lateNightSent / totalSent).toFixed(1) : 0,
      earlyBirdSentPct: totalSent ? +(100 * earlyBirdSent / totalSent).toFixed(1) : 0,
      peakHour, peakDow,
      longestStreak,
      streakStart, streakEnd,
      busiest,
      longestBody: s.longestSentBody.len >= s.longestRecvBody.len ? s.longestSentBody : s.longestRecvBody,
      longestSentBody: s.longestSentBody.len > 0 ? s.longestSentBody : null,
      longestRecvBody: s.longestRecvBody.len > 0 ? s.longestRecvBody : null,
      longestSentRun,
    },
    topContacts,
    groups,
    months: monthsArr,
    calDays,
    hourSent: s.hourSent, hourRecv: s.hourRecv,
    dowSent: s.dowSent, dowRecv: s.dowRecv,
    topWords,
    topWordsSent,
    topWordsRecv,
    topEmojis,
    topEmojisSent,
    topEmojisRecv,
    topReactions,
  };
}
