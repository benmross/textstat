// Builds synthetic iOS backups for the tests.
//
// Produces the real on-disk shape — Manifest.plist, Manifest.db, and hashed
// files under two-hex-char folders — optionally encrypted with a real keybag.
// Python's plistlib writes the binary plists and Node's OpenSSL does the AES
// key wrapping, so the worker's readers are never checked against their own
// writers.
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const nodeCrypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const initSqlJs = require('sql.js');

const HASHES = {
  sms: '3d0d7e5fb2ce288813306e4d4636395e047a3d28',
  addressBook: '31bb7ba8914766d4ba40d6dfb6113c8b614be442',
};
const KW_IV = Buffer.from('A6A6A6A6A6A6A6A6', 'hex');
const ITER = 1000; // real backups use far more; keep tests fast
const DPIC = 1000;
const CLASS = 4;

const aesWrap = (kek, key) => {
  const c = nodeCrypto.createCipheriv('id-aes256-wrap', kek, KW_IV);
  return Buffer.concat([c.update(key), c.final()]);
};

// Zero IV, zero padding to the block size — exactly how iOS stores payloads.
const aesCbcRaw = (key, plain) => {
  const padded = Buffer.alloc(Math.ceil(plain.length / 16) * 16);
  plain.copy(padded);
  const c = nodeCrypto.createCipheriv('aes-256-cbc', key, Buffer.alloc(16));
  c.setAutoPadding(false);
  return Buffer.concat([c.update(padded), c.final()]);
};

const tlv = (tag, value) => {
  const head = Buffer.alloc(8);
  head.write(tag, 0, 'latin1');
  head.writeUInt32BE(value.length, 4);
  return Buffer.concat([head, value]);
};

const u32 = (n) => {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n);
  return b;
};

const APPLE_EPOCH_MS = 978307200000;
const toAppleNs = (ms) => (ms - APPLE_EPOCH_MS) * 1e6;

// --- realistic message + contact databases -------------------------------

const PEOPLE = [
  { name: 'Ada Lovelace', handle: '+15551234567', weight: 5 },
  { name: 'Grace Hopper', handle: '+15559876543', weight: 3 },
  { name: 'Alan Turing', handle: 'alan@example.com', weight: 2 },
  { name: 'Katherine Johnson', handle: '+15550001111', weight: 1 },
];
const PHRASES = [
  'omg yes', 'be there in ten', 'that is genuinely hilarious', 'sounds good to me',
  'can you send me the thing', 'running a bit late sorry', 'happy birthday!!',
  'did you see the game last night', 'lets get dinner this week', 'thank you so much',
  'no worries at all', 'call me when you get a sec', 'just landed', 'on my way now',
];

function buildSmsDb(SQL) {
  const db = new SQL.Database();
  db.run(`
    CREATE TABLE handle (ROWID INTEGER PRIMARY KEY, id TEXT, service TEXT);
    CREATE TABLE chat (ROWID INTEGER PRIMARY KEY, style INTEGER, display_name TEXT, chat_identifier TEXT);
    CREATE TABLE chat_message_join (chat_id INTEGER, message_id INTEGER);
    CREATE TABLE chat_handle_join (chat_id INTEGER, handle_id INTEGER);
    CREATE TABLE message (
      ROWID INTEGER PRIMARY KEY, text TEXT, attributedBody BLOB, handle_id INTEGER,
      service TEXT, is_from_me INTEGER, date INTEGER, item_type INTEGER,
      associated_message_type INTEGER, associated_message_emoji TEXT,
      cache_has_attachments INTEGER, is_audio_message INTEGER,
      date_edited INTEGER, date_retracted INTEGER
    );
  `);

  PEOPLE.forEach((p, i) => {
    db.run('INSERT INTO handle VALUES (?,?,?)', [i + 1, p.handle, 'iMessage']);
    db.run('INSERT INTO chat VALUES (?,?,?,?)', [i + 1, 45, null, p.handle]);
  });
  // one group chat
  const groupChatId = PEOPLE.length + 1;
  db.run('INSERT INTO chat VALUES (?,?,?,?)', [groupChatId, 43, 'Weekend Plans', 'chat9001']);
  for (let i = 1; i <= 3; i++) {
    db.run('INSERT INTO chat_handle_join VALUES (?,?)', [groupChatId, i]);
  }

  const pool = [];
  PEOPLE.forEach((p, i) => {
    for (let w = 0; w < p.weight; w++) pool.push(i);
  });

  // Deterministic pseudo-random so the fixture is stable across runs.
  let seed = 42;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  const start = Date.UTC(2025, 0, 1);
  const end = Date.UTC(2025, 11, 31);
  const msgStmt = db.prepare('INSERT INTO message VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
  const joinStmt = db.prepare('INSERT INTO chat_message_join VALUES (?,?)');

  let rowid = 0;
  for (let i = 0; i < 2400; i++) {
    rowid++;
    const isGroup = rnd() < 0.12;
    const personIdx = pool[Math.floor(rnd() * pool.length)];
    const ts = start + Math.floor(rnd() * (end - start));
    const isSent = rnd() < 0.48 ? 1 : 0;
    let text = PHRASES[Math.floor(rnd() * PHRASES.length)];
    if (rnd() < 0.18) text += ' 😂';
    if (rnd() < 0.06) text += ' ❤️';
    if (i === 7) text = 'x'.repeat(420); // guarantees the longest-message slide

    msgStmt.run([
      rowid, text, null, personIdx + 1, 'iMessage', isSent, toAppleNs(ts), 0,
      0, null, 0, 0, 0, 0,
    ]);
    joinStmt.run([isGroup ? groupChatId : personIdx + 1, rowid]);
  }
  // a handful of tapbacks
  for (let i = 0; i < 40; i++) {
    rowid++;
    msgStmt.run([
      rowid, null, null, 1, 'iMessage', i % 2, toAppleNs(start + i * 86400000), 0,
      2000 + (i % 6), null, 0, 0, 0, 0,
    ]);
    joinStmt.run([1, rowid]);
  }
  msgStmt.free();
  joinStmt.free();

  const out = Buffer.from(db.export());
  db.close();
  return out;
}

function buildAddressBook(SQL) {
  const db = new SQL.Database();
  db.run(`
    CREATE TABLE ABPerson (ROWID INTEGER PRIMARY KEY, First TEXT, Last TEXT, Organization TEXT);
    CREATE TABLE ABMultiValue (UID INTEGER PRIMARY KEY, record_id INTEGER, property INTEGER, label INTEGER, value TEXT);
  `);
  let uid = 0;
  PEOPLE.forEach((p, i) => {
    const [first, ...rest] = p.name.split(' ');
    db.run('INSERT INTO ABPerson VALUES (?,?,?,?)', [i + 1, first, rest.join(' '), null]);
    db.run('INSERT INTO ABMultiValue VALUES (?,?,?,?,?)', [++uid, i + 1, 3, 1, p.handle]);
  });
  const out = Buffer.from(db.export());
  db.close();
  return out;
}

// --- plist generation (via Python's plistlib) -----------------------------

function runPython(script, specObj, tmpDir) {
  const specPath = path.join(tmpDir, `spec_${nodeCrypto.randomBytes(4).toString('hex')}.json`);
  const scriptPath = path.join(tmpDir, `gen_${nodeCrypto.randomBytes(4).toString('hex')}.py`);
  fs.writeFileSync(specPath, JSON.stringify(specObj));
  fs.writeFileSync(scriptPath, script);
  execFileSync('python3', [scriptPath, specPath], { encoding: 'utf8' });
  fs.rmSync(specPath, { force: true });
  fs.rmSync(scriptPath, { force: true });
}

const META_PY = `
import json, plistlib, sys
spec = json.load(open(sys.argv[1]))
for f in spec['files']:
    obj = {
        '$version': 100000,
        '$archiver': 'NSKeyedArchiver',
        '$top': {'root': plistlib.UID(1)},
        '$objects': [
            '$null',
            {
                'RelativePath': plistlib.UID(2),
                'Domain': plistlib.UID(3),
                'Size': f['size'],
                'ProtectionClass': f['cls'],
                'EncryptionKey': plistlib.UID(4),
                '$class': plistlib.UID(6),
            },
            f['path'],
            'HomeDomain',
            {'NS.data': bytes.fromhex(f['key']), '$class': plistlib.UID(5)},
            {'$classname': 'NSMutableData', '$classes': ['NSMutableData', 'NSData', 'NSObject']},
            {'$classname': 'MBFile', '$classes': ['MBFile', 'NSObject']},
        ],
    }
    with open(f['out'], 'wb') as fh:
        plistlib.dump(obj, fh, fmt=plistlib.FMT_BINARY)
`;

const MANIFEST_PY = `
import json, plistlib, datetime, sys
spec = json.load(open(sys.argv[1]))
obj = {
    'Version': '10.0',
    'Date': datetime.datetime(2026, 3, 14, 9, 26, 53),
    'SystemDomainsVersion': '20.0',
    'IsEncrypted': spec['encrypted'],
    'WasPasscodeSet': True,
    'Lockdown': {
        'DeviceName': spec['deviceName'],
        'ProductVersion': '18.3.1',
        'ProductType': 'iPhone16,2',
    },
}
if spec['encrypted']:
    obj['BackupKeyBag'] = bytes.fromhex(spec['keybag'])
    obj['ManifestKey'] = bytes.fromhex(spec['manifestKey'])
with open(spec['out'], 'wb') as fh:
    plistlib.dump(obj, fh, fmt=plistlib.FMT_BINARY)
`;

/**
 * Write a complete backup folder to disk.
 * Returns { dir, password, encrypted, deviceName, plaintext: { sms, addressBook } }
 */
async function buildBackup({ outDir, encrypted = true, password = 'correct horse battery staple', deviceName = "Ada's iPhone" }) {
  const SQL = await initSqlJs();
  fs.mkdirSync(outDir, { recursive: true });

  const smsPlain = buildSmsDb(SQL);
  const abPlain = buildAddressBook(SQL);

  const writeHashed = (hash, buf) => {
    const sub = path.join(outDir, hash.slice(0, 2));
    fs.mkdirSync(sub, { recursive: true });
    fs.writeFileSync(path.join(sub, hash), buf);
  };

  if (!encrypted) {
    writeHashed(HASHES.sms, smsPlain);
    writeHashed(HASHES.addressBook, abPlain);
    runPython(MANIFEST_PY, {
      out: path.join(outDir, 'Manifest.plist'),
      encrypted: false,
      deviceName,
    }, outDir);
    return { dir: outDir, encrypted: false, password: null, deviceName, plaintext: { sms: smsPlain, addressBook: abPlain } };
  }

  const salt = nodeCrypto.randomBytes(20);
  const dpsl = nodeCrypto.randomBytes(20);
  const kek = nodeCrypto.pbkdf2Sync(
    nodeCrypto.pbkdf2Sync(Buffer.from(password, 'utf8'), dpsl, DPIC, 32, 'sha256'),
    salt, ITER, 32, 'sha1'
  );
  const classKey = nodeCrypto.randomBytes(32);
  const keybag = Buffer.concat([
    tlv('VERS', u32(3)), tlv('TYPE', u32(1)),
    tlv('UUID', nodeCrypto.randomBytes(16)), tlv('HMCK', nodeCrypto.randomBytes(40)),
    tlv('WRAP', u32(0)), tlv('SALT', salt), tlv('ITER', u32(ITER)),
    tlv('DPSL', dpsl), tlv('DPIC', u32(DPIC)),
    tlv('CLAS', u32(CLASS)), tlv('WRAP', u32(3)), tlv('KTYP', u32(0)),
    tlv('WPKY', aesWrap(kek, classKey)),
  ]);

  const encryptFile = (plain) => {
    const fileKey = nodeCrypto.randomBytes(32);
    const prefix = Buffer.alloc(4);
    prefix.writeUInt32LE(CLASS);
    return {
      keyBlob: Buffer.concat([prefix, aesWrap(classKey, fileKey)]),
      cipher: aesCbcRaw(fileKey, plain),
      size: plain.length,
    };
  };

  const smsEnc = encryptFile(smsPlain);
  const abEnc = encryptFile(abPlain);
  writeHashed(HASHES.sms, smsEnc.cipher);
  writeHashed(HASHES.addressBook, abEnc.cipher);

  // Manifest.db indexes every file's wrapped key.
  const metaSpecs = [
    { hash: HASHES.sms, enc: smsEnc, rel: 'Library/SMS/sms.db' },
    { hash: HASHES.addressBook, enc: abEnc, rel: 'Library/AddressBook/AddressBook.sqlitedb' },
  ].map((f) => ({
    hash: f.hash,
    key: f.enc.keyBlob.toString('hex'),
    size: f.enc.size,
    cls: CLASS,
    path: f.rel,
    out: path.join(outDir, `.meta_${f.hash}.plist`),
  }));
  runPython(META_PY, { files: metaSpecs }, outDir);

  const mdb = new SQL.Database();
  mdb.run('CREATE TABLE Files (fileID TEXT PRIMARY KEY, domain TEXT, relativePath TEXT, flags INTEGER, file BLOB);');
  for (const m of metaSpecs) {
    const st = mdb.prepare('INSERT INTO Files VALUES (?,?,?,?,?)');
    st.run([m.hash, 'HomeDomain', m.path, 1, fs.readFileSync(m.out)]);
    st.free();
    fs.rmSync(m.out, { force: true });
  }
  const mdbPlain = Buffer.from(mdb.export());
  mdb.close();
  const mdbEnc = encryptFile(mdbPlain);
  fs.writeFileSync(path.join(outDir, 'Manifest.db'), mdbEnc.cipher);

  runPython(MANIFEST_PY, {
    out: path.join(outDir, 'Manifest.plist'),
    encrypted: true,
    deviceName,
    keybag: keybag.toString('hex'),
    manifestKey: mdbEnc.keyBlob.toString('hex'),
  }, outDir);

  return {
    dir: outDir,
    encrypted: true,
    password,
    deviceName,
    plaintext: { sms: smsPlain, addressBook: abPlain },
  };
}

module.exports = { buildBackup, HASHES, PEOPLE };

if (require.main === module) {
  const out = process.argv[2] || path.join(__dirname, 'backup_fixture');
  const enc = process.argv[3] !== 'plain';
  buildBackup({ outDir: out, encrypted: enc }).then((r) => {
    console.log(`wrote ${r.encrypted ? 'encrypted' : 'unencrypted'} backup to ${r.dir}`);
    if (r.password) console.log(`password: ${r.password}`);
  });
}
