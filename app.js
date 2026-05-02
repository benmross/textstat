// textstat — main thread: upload, worker orchestration, story rendering.
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const el = (tag, props, ...kids) => {
  const e = document.createElement(tag);
  if (props) for (const k in props) {
    if (k === 'class') e.className = props[k];
    else if (k === 'style') e.setAttribute('style', props[k]);
    else if (k.startsWith('on') && typeof props[k] === 'function') e.addEventListener(k.slice(2), props[k]);
    else if (k === 'html') e.innerHTML = props[k];
    else e.setAttribute(k, props[k]);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    e.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
  }
  return e;
};

// ---------- screen control ----------

function showScreen(id) {
  for (const s of $$('.screen')) s.classList.remove('visible');
  $('#' + id).classList.add('visible');
}

// ---------- file handling ----------

const dbFileInput = $('#dbFileInput');
const contactsFileInput = $('#contactsFileInput');
const dbDropzone = $('#dbDropzone');
const contactsDropzone = $('#contactsDropzone');
const startBtn = $('#startBtn');

let dbFile = null;
let contactsFile = null;

function setupDropzone(dropzone, input) {
  dropzone.addEventListener('click', () => input.click());
  input.addEventListener('change', e => {
    const files = Array.from(e.target.files || []);
    if (files.length) handleFilePick(input === dbFileInput ? 'db' : 'contacts', files[0]);
  });
  ['dragenter', 'dragover'].forEach(ev =>
    dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.add('drag'); })
  );
  ['dragleave', 'drop'].forEach(ev =>
    dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.remove('drag'); })
  );
  dropzone.addEventListener('drop', e => {
    const files = Array.from((e.dataTransfer && e.dataTransfer.files) || []);
    if (files.length) handleFilePick(input === dbFileInput ? 'db' : 'contacts', files[0]);
  });
  // Click-drag to clear: drag file out of dropzone resets input
  input.addEventListener('cancel', () => { input.value = ''; });
}

setupDropzone(dbDropzone, dbFileInput);
setupDropzone(contactsDropzone, contactsFileInput);

async function classifyDB(file) {
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.xml')) return true;
  if (name.endsWith('.db') || name === 'chat.db') return true;
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (head[0] === 0x53 && head[1] === 0x51 && head[2] === 0x4C) return true;
  if (head[0] === 0x3C && head[1] === 0x3F && head[2] === 0x78) return true;
  return false;
}

async function classifyContacts(file) {
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.vcf') || file.type === 'text/vcard') return true;
  if (name.endsWith('.abcddb')) return true;
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const txt = new TextDecoder().decode(head);
  if (txt.startsWith('BEGIN:VCARD')) return true;
  return false;
}

function fmtFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
}

async function handleFilePick(kind, file) {
  if (kind === 'db') {
    const ok = await classifyDB(file);
    if (!ok) {
      alert('Hmm — that doesn’t look like an SMS backup XML or chat.db. Try another file?');
      dbFileInput.value = '';
      return;
    }
    dbFile = file;
    updateDbChip();
  } else {
    const ok = await classifyContacts(file);
    if (!ok) {
      alert('That doesn’t look like a contacts file (.vcf or .abcddb). Try another?');
      contactsFileInput.value = '';
      return;
    }
    contactsFile = file;
    updateContactsChip();
  }
  updateStartBtn();
}

function updateDbChip() {
  const chip = $('#dbChip');
  const text = $('#dbChipText');
  if (dbFile) {
    chip.classList.remove('hidden');
    text.textContent = dbFile.name + ' · ' + fmtFileSize(dbFile.size);
    dbDropzone.classList.add('has-file');
  } else {
    chip.classList.add('hidden');
    text.textContent = '';
    dbFileInput.value = '';
    dbDropzone.classList.remove('has-file');
  }
}

function updateContactsChip() {
  const chip = $('#contactsChip');
  const text = $('#contactsChipText');
  if (contactsFile) {
    chip.classList.remove('hidden');
    text.textContent = contactsFile.name + ' · ' + fmtFileSize(contactsFile.size);
    contactsDropzone.classList.add('has-file');
  } else {
    chip.classList.add('hidden');
    text.textContent = '';
    contactsFileInput.value = '';
    contactsDropzone.classList.remove('has-file');
  }
}

function updateStartBtn() {
  if (dbFile) {
    startBtn.disabled = false;
    startBtn.classList.add('ready');
    $('#startBtnReady').classList.remove('hidden');
    $('#startBtnWait').classList.add('hidden');
  } else {
    startBtn.disabled = true;
    startBtn.classList.remove('ready');
    $('#startBtnReady').classList.add('hidden');
    $('#startBtnWait').classList.remove('hidden');
  }
}

$('#dbChipX').addEventListener('click', e => {
  e.stopPropagation();
  dbFile = null;
  dbFileInput.value = '';
  updateDbChip();
  updateStartBtn();
});

$('#contactsChipX').addEventListener('click', e => {
  e.stopPropagation();
  contactsFile = null;
  contactsFileInput.value = '';
  updateContactsChip();
});

startBtn.addEventListener('click', () => {
  if (!dbFile) return;
  startProcessing(dbFile, contactsFile);
});

const TIPS = [
  'reading XML at near disk speed…',
  'only your browser sees this — nothing uploaded.',
  'counting every "lol" you ever typed…',
  'building your monthly chart…',
  'the more texts, the better the wrap.',
  'sniffing out RCS reactions…',
  'tallying late-night double-texts…',
];

let tipIdx = 0;
let tipTimer = null;

function rotateTips() {
  const ul = $('#loadingTips');
  ul.innerHTML = '';
  ul.appendChild(el('li', null, TIPS[tipIdx % TIPS.length]));
  tipIdx++;
}

function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + ' MB';
  return (n / 1024 / 1024 / 1024).toFixed(2) + ' GB';
}

function fmtNum(n) {
  return Number(n).toLocaleString();
}

function startProcessing(file, contactsFile) {
  showScreen('loading');
  rotateTips();
  tipTimer = setInterval(rotateTips, 3500);

  const worker = new Worker('worker.js');
  const t0 = performance.now();

  worker.onmessage = (e) => {
    const m = e.data;
    if (m.type === 'progress') {
      const pct = Math.max(0, Math.min(100, m.pct || 0));
      $('#progressFill').style.width = pct.toFixed(1) + '%';
      $('#progressPct').textContent = pct.toFixed(1) + '%';
      $('#progressMsg').textContent = m.msg
        ? m.msg
        : `${fmtBytes(m.bytes)} / ${fmtBytes(m.total)} · ${fmtNum(m.count)} messages so far`;
    } else if (m.type === 'done') {
      clearInterval(tipTimer);
      const dt = ((performance.now() - t0) / 1000).toFixed(1);
      console.log(`[textstat] parsed in ${dt}s`, m.stats);
      buildStory(m.stats);
      showScreen('story');
      worker.terminate();
    } else if (m.type === 'error') {
      clearInterval(tipTimer);
      $('#progressMsg').textContent = 'something broke 😭 — ' + m.error.split('\n')[0];
      console.error('[textstat worker]', m.error);
    }
  };

  worker.postMessage({ type: 'parse', file, contactsFile: contactsFile || null });
}

// ---------- story / slides ----------

const stage = $('#storyStage');
const ctlBars = $('#ctlBars');
let slides = [];
let cur = 0;

$('#prevSlide').addEventListener('click', () => goto(cur - 1));
$('#nextSlide').addEventListener('click', () => goto(cur + 1));
$('#restartBtn').addEventListener('click', () => location.reload());
document.addEventListener('keydown', e => {
  if (!$('#story').classList.contains('visible')) return;
  if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goto(cur + 1); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); goto(cur - 1); }
});

function goto(i) {
  if (i < 0 || i >= slides.length) return;
  const old = stage.querySelector('.slide.current');
  if (old) old.classList.remove('current');
  cur = i;
  const node = slides[cur];
  if (!node.isConnected) stage.appendChild(node);
  // force reflow then add current to trigger transition
  void node.offsetWidth;
  node.classList.add('current');
  $$('.ctl-bar', ctlBars).forEach((b, idx) => b.classList.toggle('done', idx <= cur));
}

function buildStory(stats) {
  stage.innerHTML = '';
  ctlBars.innerHTML = '';
  slides = makeSlides(stats);
  for (let i = 0; i < slides.length; i++) {
    ctlBars.appendChild(el('div', { class: 'ctl-bar', onclick: () => goto(i) }));
  }
  cur = -1;
  goto(0);
}

// ---------- slide builders ----------

const PALETTES = [
  { bg: 'linear-gradient(135deg,#ff5ea0 0%,#ff9a3c 60%,#ffd34e 100%)', fg: '#1a0d2e', accent: '#1a0d2e' },
  { bg: 'linear-gradient(135deg,#0f1f4a 0%,#3a1f7a 50%,#ff4d8d 100%)', fg: '#f8e8ff', accent: '#ffd34e' },
  { bg: 'linear-gradient(135deg,#00f5d4 0%,#00bbf9 60%,#9b5de5 100%)', fg: '#0d0033', accent: '#0d0033' },
  { bg: 'linear-gradient(135deg,#ffd166 0%,#ef476f 60%,#9b5de5 100%)', fg: '#1d0033', accent: '#1d0033' },
  { bg: 'linear-gradient(135deg,#06d6a0 0%,#118ab2 60%,#073b4c 100%)', fg: '#f0fff8', accent: '#ffd166' },
  { bg: 'linear-gradient(135deg,#fb5607 0%,#ff006e 50%,#8338ec 100%)', fg: '#fff5e1', accent: '#ffd60a' },
  { bg: 'linear-gradient(135deg,#240046 0%,#5a189a 50%,#ff5400 100%)', fg: '#fff0e0', accent: '#ffd60a' },
  { bg: 'linear-gradient(135deg,#cdb4db 0%,#ffc8dd 50%,#ffafcc 100%)', fg: '#3a015c', accent: '#3a015c' },
  { bg: 'linear-gradient(135deg,#7400b8 0%,#5390d9 60%,#80ffdb 100%)', fg: '#ffffff', accent: '#ffd60a' },
];

function slideShell(idx, label, ...children) {
  const p = PALETTES[idx % PALETTES.length];
  const slide = el('div', { class: 'slide', style: `--bg:${p.bg};--fg:${p.fg};--accent:${p.accent}` },
    el('div', { class: 'slide-bg' }),
    el('div', { class: 'slide-tag' }, label),
    el('div', { class: 'slide-body' }, ...children),
  );
  return slide;
}

function fmtDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function fmtDateShort(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtYmd(ymd) {
  if (!ymd) return '';
  // ymd in local-time format already
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

const DOW_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DOW_NAMES_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmtHour(h) {
  if (h === 0) return '12 AM';
  if (h === 12) return '12 PM';
  if (h < 12) return h + ' AM';
  return (h - 12) + ' PM';
}

function makeSlides(stats) {
  const s = stats.summary;
  const slides = [];
  let i = 0;
  // iMessage exports surface attachment/edited/service-mix counters; SMS&R XML
  // surfaces RCS/MMS counters. We use the presence of serviceCounts to decide.
  const isImsg = !!s.serviceCounts;

  // 0 — hero
  slides.push(slideShell(i++, 'your year in messages',
    el('div', { class: 'kicker' }, 'a tiny wrap of every text in'),
    el('div', { class: 'subhero' }, `${fmtDateShort(s.firstTs)} → ${fmtDateShort(s.lastTs)}`),
    el('div', { class: 'megaCount' }, fmtNum(s.totalMessages)),
    el('div', { class: 'megaSub' }, 'messages on your phone.'),
    el('div', { class: 'pillRow' },
      el('div', { class: 'pill' }, `${fmtNum(s.totalSent)} sent`),
      el('div', { class: 'pill' }, `${fmtNum(s.totalRecv)} received`),
      el('div', { class: 'pill alt' }, `${s.avgPerDay}/day average`),
    ),
    el('div', { class: 'cta' }, '→ tap or arrow keys'),
  ));

  // 1 — the active days story
  const activePct = s.totalDays ? Math.round(100 * s.activeDays / s.totalDays) : 0;
  slides.push(slideShell(i++, 'always on',
    el('div', { class: 'kicker' }, 'over those'),
    el('div', { class: 'megaCount xs' }, fmtNum(s.totalDays) + ' days'),
    el('div', { class: 'kicker' }, 'you sent or received a message on'),
    el('div', { class: 'megaCount' }, fmtNum(s.activeDays)),
    el('div', { class: 'megaSub' }, `of them — that’s ${activePct}% of your days.`),
    s.busiest && s.busiest.ymd ? el('div', { class: 'pillRow' },
      el('div', { class: 'pill' }, `busiest day: ${fmtYmd(s.busiest.ymd)}`),
      el('div', { class: 'pill alt' }, `${fmtNum(s.busiest.count)} messages that day`),
    ) : null,
  ));

  // 2 — top contact reveal
  const top1 = stats.topContacts[0];
  if (top1) {
    slides.push(slideShell(i++, 'your #1',
      el('div', { class: 'kicker' }, 'no one else came close.'),
      el('div', { class: 'kicker tiny' }, 'most messaged contact'),
      el('div', { class: 'topName' }, top1.displayName),
      el('div', { class: 'megaCount xs' }, fmtNum(top1.total) + ' messages'),
      el('div', { class: 'pillRow' },
        el('div', { class: 'pill' }, `${fmtNum(top1.sent)} sent → them`),
        el('div', { class: 'pill' }, `${fmtNum(top1.recv)} from them →`),
      ),
    ));
  }

  // 3 — top contacts list
  if (stats.topContacts.length > 1) {
    const top = stats.topContacts.slice(0, 8);
    const max = top[0].total;
    slides.push(slideShell(i++, 'your top contacts',
      el('div', { class: 'kicker' }, 'the people in your inbox'),
      el('div', { class: 'h2' }, 'top 8'),
      el('div', { class: 'barList' },
        ...top.map((c, idx) => el('div', { class: 'barRow' },
          el('div', { class: 'barRank' }, '#' + (idx + 1)),
          el('div', { class: 'barName' }, c.displayName),
          el('div', { class: 'barTrack' },
            el('div', { class: 'barFill', style: `width:${(c.total / max * 100).toFixed(2)}%` }),
          ),
          el('div', { class: 'barNum' }, fmtNum(c.total)),
        )),
      ),
    ));
  }

  // 4 — sent vs received split
  {
    const ratio = s.totalRecv ? (s.totalSent / s.totalRecv) : 0;
    const sentPct = s.totalMessages ? (100 * s.totalSent / s.totalMessages) : 0;
    let vibe = 'a balanced texter.';
    if (sentPct > 55) vibe = 'a double-texter, no shame.';
    else if (sentPct < 45) vibe = 'mostly listening — the receiver.';
    slides.push(slideShell(i++, 'sent vs received',
      el('div', { class: 'kicker' }, 'you are'),
      el('div', { class: 'megaCount xs' }, vibe),
      el('div', { class: 'splitWrap' },
        el('div', { class: 'splitBar' },
          el('div', { class: 'splitSent', style: `flex:${s.totalSent}` },
            el('div', { class: 'splitLabel' }, 'sent'),
            el('div', { class: 'splitVal' }, fmtNum(s.totalSent)),
          ),
          el('div', { class: 'splitRecv', style: `flex:${s.totalRecv}` },
            el('div', { class: 'splitLabel' }, 'received'),
            el('div', { class: 'splitVal' }, fmtNum(s.totalRecv)),
          ),
        ),
        el('div', { class: 'pillRow' },
          el('div', { class: 'pill' }, `${fmtNum(s.charsSent)} characters sent`),
          el('div', { class: 'pill alt' }, `${fmtNum(s.charsRecv)} characters received`),
        ),
      ),
    ));
  }

  // 5 — hour of day
  {
    const sent = stats.hourSent, recv = stats.hourRecv;
    const totals = sent.map((v, idx) => v + recv[idx]);
    const max = Math.max(...totals, 1);
    slides.push(slideShell(i++, 'when you text',
      el('div', { class: 'kicker' }, 'your peak hour is'),
      el('div', { class: 'megaCount xs' }, fmtHour(s.peakHour)),
      el('div', { class: 'megaSub' },
        `${s.lateNightSentPct}% of your sent messages happen after 11 PM or before 5 AM.`),
      el('div', { class: 'hourChart' },
        ...totals.map((v, h) => el('div', { class: 'hourBar', title: `${fmtHour(h)} — ${fmtNum(v)} messages` },
          el('div', { class: 'hourFill', style: `height:${(v / max * 100).toFixed(2)}%` }),
          el('div', { class: 'hourTick' }, h % 3 === 0 ? (h === 0 ? '12a' : h === 12 ? '12p' : (h % 12) + (h < 12 ? 'a' : 'p')) : ''),
        )),
      ),
    ));
  }

  // 6 — day of week
  {
    const dowSent = stats.dowSent, dowRecv = stats.dowRecv;
    const totals = dowSent.map((v, idx) => v + dowRecv[idx]);
    const max = Math.max(...totals, 1);
    slides.push(slideShell(i++, 'day by day',
      el('div', { class: 'kicker' }, 'your loudest day of the week is'),
      el('div', { class: 'megaCount xs' }, DOW_NAMES_LONG[s.peakDow]),
      el('div', { class: 'dowChart' },
        ...totals.map((v, d) => el('div', { class: 'dowCell' },
          el('div', { class: 'dowBar' },
            el('div', { class: 'dowFill', style: `height:${(v / max * 100).toFixed(2)}%` }),
          ),
          el('div', { class: 'dowLabel' }, DOW_NAMES[d]),
          el('div', { class: 'dowVal' }, fmtNum(v)),
        )),
      ),
    ));
  }

  // 7 — monthly timeline
  {
    const months = stats.months;
    const max = months.reduce((a, m) => Math.max(a, m.count), 1);
    slides.push(slideShell(i++, 'your year in texts',
      el('div', { class: 'kicker' }, 'monthly volume'),
      el('div', { class: 'h2' }, `${fmtDateShort(s.firstTs)} → ${fmtDateShort(s.lastTs)}`),
      el('div', { class: 'monthChart' },
        ...months.map(m => {
          const [y, mo] = m.key.split('-').map(Number);
          return el('div', { class: 'monthCol', title: `${MONTH_NAMES[mo - 1]} ${y} — ${fmtNum(m.count)}` },
            el('div', { class: 'monthBar' },
              el('div', { class: 'monthFill', style: `height:${(m.count / max * 100).toFixed(2)}%` }),
            ),
            el('div', { class: 'monthLabel' }, MONTH_NAMES[mo - 1]),
            el('div', { class: 'monthYr' }, mo === 1 || months.indexOf(m) === 0 ? "'" + String(y).slice(2) : ''),
          );
        }),
      ),
    ));
  }

  // 8 — top words
  if (stats.topWords.length) {
    const tw = stats.topWords.slice(0, 24);
    const max = tw[0].count;
    slides.push(slideShell(i++, 'words you wore out',
      el('div', { class: 'kicker' }, 'your most-used word was'),
      el('div', { class: 'topName' }, tw[0].word),
      el('div', { class: 'megaSub' }, `you used it ${fmtNum(tw[0].count)} times.`),
      el('div', { class: 'wordCloud' },
        ...tw.map(w => el('span', {
          class: 'wordChip',
          style: `font-size:${(0.8 + 1.6 * (w.count / max)).toFixed(2)}rem`,
          title: `${fmtNum(w.count)}`,
        }, w.word)),
      ),
    ));
  }

  // 9 — top emojis
  if (stats.topEmojis.length) {
    const te = stats.topEmojis.slice(0, 12);
    const max = te[0].count;
    slides.push(slideShell(i++, 'the emojis',
      el('div', { class: 'kicker' }, 'your signature emoji'),
      el('div', { class: 'megaEmoji' }, te[0].emoji),
      el('div', { class: 'megaSub' }, `appearing ${fmtNum(te[0].count)} times.`),
      el('div', { class: 'emojiGrid' },
        ...te.map(e => el('div', { class: 'emojiCard' },
          el('div', { class: 'emojiBig' }, e.emoji),
          el('div', { class: 'emojiCt' }, fmtNum(e.count)),
        )),
      ),
    ));
  }

  // 10 — RCS reactions
  if (s.reactionsSent + s.reactionsRecv > 0) {
    const top = stats.topReactions[0];
    slides.push(slideShell(i++, 'tapbacks',
      el('div', { class: 'kicker' }, 'on RCS, you collected'),
      el('div', { class: 'megaCount xs' }, fmtNum(s.reactionsSent + s.reactionsRecv)),
      el('div', { class: 'megaSub' }, 'reactions on each others’ messages.'),
      el('div', { class: 'pillRow' },
        el('div', { class: 'pill' }, `${fmtNum(s.reactionsSent)} sent`),
        el('div', { class: 'pill' }, `${fmtNum(s.reactionsRecv)} received`),
      ),
      top ? el('div', { class: 'reactionTop' },
        el('div', { class: 'megaEmoji' }, top.emoji),
        el('div', { class: 'megaSub' }, `your favorite reaction · used ${fmtNum(top.count)} times`),
      ) : null,
      stats.topReactions.length > 1 ? el('div', { class: 'emojiGrid', style: 'margin-top:1rem' },
        ...stats.topReactions.slice(1, 7).map(e => el('div', { class: 'emojiCard small' },
          el('div', { class: 'emojiBig' }, e.emoji),
          el('div', { class: 'emojiCt' }, fmtNum(e.count)),
        )),
      ) : null,
    ));
  }

  // 11 — group chats
  if (s.uniqueGroups > 0) {
    const groupTotal = stats.groups.reduce((a, g) => a + g.count, 0);
    const top = stats.groups[0];
    slides.push(slideShell(i++, 'group chats',
      el('div', { class: 'kicker' }, 'you were in'),
      el('div', { class: 'megaCount' }, fmtNum(s.uniqueGroups)),
      el('div', { class: 'megaSub' }, `group chats — ${fmtNum(groupTotal)} messages between them.`),
      top ? el('div', { class: 'groupTop' },
        el('div', { class: 'kicker tiny' }, 'busiest group'),
        el('div', { class: 'groupName' }, top.name || '(unnamed group)'),
        el('div', { class: 'pill' }, `${fmtNum(top.count)} messages · ${top.participants} people`),
      ) : null,
    ));
  }

  // 12 — streak
  if (s.longestStreak > 1) {
    slides.push(slideShell(i++, 'your texting streak',
      el('div', { class: 'kicker' }, 'you sent messages every day for'),
      el('div', { class: 'megaCount' }, fmtNum(s.longestStreak)),
      el('div', { class: 'megaSub' }, 'days straight.'),
      el('div', { class: 'pillRow' },
        el('div', { class: 'pill' }, `${fmtDateShort(Date.parse(s.streakStart))} → ${fmtDateShort(Date.parse(s.streakEnd))}`),
      ),
    ));
  }

  // 13 — longest message
  if (s.longestBody && s.longestBody.len > 100) {
    slides.push(slideShell(i++, 'your magnum opus',
      el('div', { class: 'kicker' }, `your longest single message — ${fmtNum(s.longestBody.len)} characters`),
      el('div', { class: 'megaSub' }, s.longestBody.sent ? `you sent it to ${s.longestBody.contact}` : `from ${s.longestBody.contact}`),
      el('blockquote', { class: 'opus' }, '“' + s.longestBody.preview + '”'),
    ));
  }

  // 13b — iMessage service mix (iMessage / SMS / RCS)
  if (isImsg && s.serviceCounts) {
    const entries = Object.entries(s.serviceCounts).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((a, [, v]) => a + v, 0);
    const top = entries[0];
    slides.push(slideShell(i++, 'service mix',
      el('div', { class: 'kicker' }, 'most of your messages went over'),
      el('div', { class: 'topName' }, top[0]),
      el('div', { class: 'megaSub' }, `${fmtNum(top[1])} of ${fmtNum(total)} (${(100 * top[1] / total).toFixed(1)}%)`),
      entries.length > 1
        ? el('div', { class: 'pillRow', style: 'margin-top:1.2rem' },
            ...entries.map(([svc, n]) => el('div', { class: 'pill' }, `${svc} · ${fmtNum(n)}`)))
        : null,
      (s.attachmentCount || s.editedCount)
        ? el('div', { class: 'pillRow', style: 'margin-top:.8rem' },
            s.attachmentCount ? el('div', { class: 'pill alt' }, `${fmtNum(s.attachmentCount)} attachments`) : null,
            s.editedCount ? el('div', { class: 'pill alt' }, `${fmtNum(s.editedCount)} edits`) : null,
          )
        : null,
    ));
  }

  // 14 — final card
  slides.push(slideShell(i++, 'that’s a wrap',
    el('div', { class: 'kicker' }, 'you texted'),
    el('div', { class: 'megaCount' }, fmtNum(s.totalMessages)),
    el('div', { class: 'megaSub' }, `times across ${s.uniqueContacts} contacts.`),
    el('div', { class: 'finalRow' },
      el('div', { class: 'finalCard' },
        el('div', { class: 'finalLabel' }, 'sent'),
        el('div', { class: 'finalVal' }, fmtNum(s.totalSent)),
      ),
      el('div', { class: 'finalCard' },
        el('div', { class: 'finalLabel' }, 'received'),
        el('div', { class: 'finalVal' }, fmtNum(s.totalRecv)),
      ),
      isImsg
        ? el('div', { class: 'finalCard' },
            el('div', { class: 'finalLabel' }, 'attachments'),
            el('div', { class: 'finalVal' }, fmtNum(s.attachmentCount || 0)))
        : el('div', { class: 'finalCard' },
            el('div', { class: 'finalLabel' }, 'rcs'),
            el('div', { class: 'finalVal' }, fmtNum(s.rcsCount))),
      el('div', { class: 'finalCard' },
        el('div', { class: 'finalLabel' }, 'groups'),
        el('div', { class: 'finalVal' }, fmtNum(s.uniqueGroups)),
      ),
    ),
    el('div', { class: 'cta', style: 'margin-top:2rem' }, '↺ start over to load another export'),
  ));

  return slides;
}
