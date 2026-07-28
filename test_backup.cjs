// Round-trip test for the encrypted iOS backup path.
//
// Builds a synthetic encrypted backup from scratch — keybag, wrapped class
// keys, AES-CBC file payloads, a Manifest.db index and a Manifest.plist — then
// feeds it to worker.js's openBackup() and checks the plaintext comes back.
//
// Deliberately uses independent implementations for the pieces the worker
// parses: Python's plistlib writes the binary plists, and Node's OpenSSL
// bindings do the AES key wrapping. If our bplist reader or unwrap logic is
// wrong, this fails.
'use strict';

const fs = require('node:fs');
const vm = require('node:vm');
const os = require('node:os');
const path = require('node:path');
const nodeCrypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const initSqlJs = require('sql.js');

const webcrypto = nodeCrypto.webcrypto;
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'textstat-backup-'));

const SMS_HASH = '3d0d7e5fb2ce288813306e4d4636395e047a3d28';
const AB_HASH = '31bb7ba8914766d4ba40d6dfb6113c8b614be442';
const KW_IV = Buffer.from('A6A6A6A6A6A6A6A6', 'hex');
const ITER = 1000; // real backups use far more; keep the test fast
const DPIC = 1000;
const CLASS = 4;

let failures = 0;
function check(label, cond, detail) {
  console.log(`${cond ? '  ok  ' : ' FAIL '} ${label}${detail ? ' — ' + detail : ''}`);
  if (!cond) failures++;
}

// ---------------------------------------------------------------------------
// crypto helpers (test side)
// ---------------------------------------------------------------------------

function aesWrap(kek, plainKey) {
  const c = nodeCrypto.createCipheriv('id-aes256-wrap', kek, KW_IV);
  return Buffer.concat([c.update(plainKey), c.final()]);
}

function aesCbcRaw(key, plain) {
  // Zero IV, zero padding to the block size — exactly how iOS stores payloads.
  const padded = Buffer.alloc(Math.ceil(plain.length / 16) * 16);
  plain.copy(padded);
  const c = nodeCrypto.createCipheriv('aes-256-cbc', key, Buffer.alloc(16));
  c.setAutoPadding(false);
  return Buffer.concat([c.update(padded), c.final()]);
}

function pbkdf2(pw, salt, iters, digest, len) {
  return nodeCrypto.pbkdf2Sync(pw, salt, iters, len, digest);
}

function tlv(tag, value) {
  const head = Buffer.alloc(8);
  head.write(tag, 0, 'latin1');
  head.writeUInt32BE(value.length, 4);
  return Buffer.concat([head, value]);
}

function u32(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n);
  return b;
}

// ---------------------------------------------------------------------------
// build the backup
// ---------------------------------------------------------------------------

const PASSWORD = 'correct horse battery staple';
const salt = nodeCrypto.randomBytes(20);
const dpsl = nodeCrypto.randomBytes(20);

const kek = pbkdf2(
  pbkdf2(Buffer.from(PASSWORD, 'utf8'), dpsl, DPIC, 'sha256', 32),
  salt, ITER, 'sha1', 32
);

const classKey = nodeCrypto.randomBytes(32);
const keybag = Buffer.concat([
  tlv('VERS', u32(3)),
  tlv('TYPE', u32(1)),
  tlv('UUID', nodeCrypto.randomBytes(16)),
  tlv('HMCK', nodeCrypto.randomBytes(40)),
  tlv('WRAP', u32(0)),
  tlv('SALT', salt),
  tlv('ITER', u32(ITER)),
  tlv('DPSL', dpsl),
  tlv('DPIC', u32(DPIC)),
  // one protection class, wrapped with the passcode-derived KEK (WRAP bit 2)
  tlv('CLAS', u32(CLASS)),
  tlv('WRAP', u32(3)),
  tlv('KTYP', u32(0)),
  tlv('WPKY', aesWrap(kek, classKey)),
]);

// A file key, wrapped with the class key, prefixed by the 4-byte class (LE).
function makeEncryptedFile(plain) {
  const fileKey = nodeCrypto.randomBytes(32);
  const clsPrefix = Buffer.alloc(4);
  clsPrefix.writeUInt32LE(CLASS);
  return {
    keyBlob: Buffer.concat([clsPrefix, aesWrap(classKey, fileKey)]),
    cipher: aesCbcRaw(fileKey, plain),
    size: plain.length,
  };
}

(async () => {
  const SQL = await initSqlJs();

  // --- plaintext sms.db, with just enough schema for the parser to be happy
  const sms = new SQL.Database();
  sms.run(`
    CREATE TABLE handle (ROWID INTEGER PRIMARY KEY, id TEXT);
    CREATE TABLE message (ROWID INTEGER PRIMARY KEY, text TEXT, handle_id INTEGER,
      is_from_me INTEGER, date INTEGER, service TEXT);
    INSERT INTO handle VALUES (1, '+15551234567');
    INSERT INTO message VALUES (1, 'hello from a synthetic backup', 1, 0, 700000000000000000, 'iMessage');
  `);
  const smsPlain = Buffer.from(sms.export());
  sms.close();

  // --- plaintext AddressBook.sqlitedb in the real iOS schema
  const ab = new SQL.Database();
  ab.run(`
    CREATE TABLE ABPerson (ROWID INTEGER PRIMARY KEY, First TEXT, Last TEXT, Organization TEXT);
    CREATE TABLE ABMultiValue (UID INTEGER PRIMARY KEY, record_id INTEGER, property INTEGER, label INTEGER, value TEXT);
    INSERT INTO ABPerson VALUES (1, 'Ada', 'Lovelace', NULL);
    INSERT INTO ABMultiValue VALUES (1, 1, 3, 1, '+1 (555) 123-4567');
    INSERT INTO ABMultiValue VALUES (2, 1, 4, 1, 'ada@example.com');
  `);
  const abPlain = Buffer.from(ab.export());
  ab.close();

  const smsEnc = makeEncryptedFile(smsPlain);
  const abEnc = makeEncryptedFile(abPlain);

  // --- Manifest.db: the index mapping fileID → encrypted metadata
  const mdb = new SQL.Database();
  mdb.run('CREATE TABLE Files (fileID TEXT PRIMARY KEY, domain TEXT, relativePath TEXT, flags INTEGER, file BLOB);');

  // Ask Python to emit the binary plists we need, so the reader under test is
  // never validated against its own writer.
  const spec = {
    tmp: TMP,
    keybag: keybag.toString('hex'),
    manifestKeyPlaceholder: true,
    files: [
      { hash: SMS_HASH, key: smsEnc.keyBlob.toString('hex'), size: smsEnc.size, path: 'Library/SMS/sms.db' },
      { hash: AB_HASH, key: abEnc.keyBlob.toString('hex'), size: abEnc.size, path: 'Library/AddressBook/AddressBook.sqlitedb' },
    ],
  };

  const pyScript = `
import json, plistlib, datetime, sys
spec = json.load(open(sys.argv[1]))
tmp = spec['tmp']
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
                'ProtectionClass': ${CLASS},
                'EncryptionKey': plistlib.UID(4),
                '\$class': plistlib.UID(6),
            },
            f['path'],
            'HomeDomain',
            {'NS.data': plistlib.Data(bytes.fromhex(f['key'])) if hasattr(plistlib,'Data') else bytes.fromhex(f['key']), '\$class': plistlib.UID(5)},
            {'\$classname': 'NSMutableData', '\$classes': ['NSMutableData', 'NSData', 'NSObject']},
            {'\$classname': 'MBFile', '\$classes': ['MBFile', 'NSObject']},
        ],
    }
    with open(tmp + '/meta_' + f['hash'] + '.plist', 'wb') as fh:
        plistlib.dump(obj, fh, fmt=plistlib.FMT_BINARY)
print('ok')
`;
  fs.writeFileSync(path.join(TMP, 'spec.json'), JSON.stringify(spec));
  fs.writeFileSync(path.join(TMP, 'gen.py'), pyScript);
  execFileSync('python3', [path.join(TMP, 'gen.py'), path.join(TMP, 'spec.json')], { encoding: 'utf8' });

  for (const f of spec.files) {
    const meta = fs.readFileSync(path.join(TMP, `meta_${f.hash}.plist`));
    const stmt = mdb.prepare('INSERT INTO Files VALUES (?,?,?,?,?)');
    stmt.run([f.hash, 'HomeDomain', f.path, 1, meta]);
    stmt.free();
  }
  const mdbPlain = Buffer.from(mdb.export());
  mdb.close();
  const mdbEnc = makeEncryptedFile(mdbPlain);

  // --- Manifest.plist
  const manifestSpec = {
    tmp: TMP,
    keybag: keybag.toString('hex'),
    manifestKey: mdbEnc.keyBlob.toString('hex'),
  };
  const pyManifest = `
import json, plistlib, datetime, sys
spec = json.load(open(sys.argv[1]))
obj = {
    'Version': '10.0',
    'Date': datetime.datetime(2026, 3, 14, 9, 26, 53),
    'SystemDomainsVersion': '20.0',
    'IsEncrypted': True,
    'WasPasscodeSet': True,
    'Lockdown': {'DeviceName': "Ada's iPhone", 'ProductVersion': '18.3.1', 'ProductType': 'iPhone16,2'},
    'BackupKeyBag': bytes.fromhex(spec['keybag']),
    'ManifestKey': bytes.fromhex(spec['manifestKey']),
}
with open(spec['tmp'] + '/Manifest.plist', 'wb') as fh:
    plistlib.dump(obj, fh, fmt=plistlib.FMT_BINARY)
print('ok')
`;
  fs.writeFileSync(path.join(TMP, 'mspec.json'), JSON.stringify(manifestSpec));
  fs.writeFileSync(path.join(TMP, 'genm.py'), pyManifest);
  execFileSync('python3', [path.join(TMP, 'genm.py'), path.join(TMP, 'mspec.json')], { encoding: 'utf8' });
  const manifestPlist = fs.readFileSync(path.join(TMP, 'Manifest.plist'));

  // -------------------------------------------------------------------------
  // load worker.js and run openBackup against the synthetic backup
  // -------------------------------------------------------------------------

  class FakeFile {
    constructor(buf, name) {
      this._buf = buf;
      this.name = name;
      this.size = buf.length;
      this.lastModified = 1770000000000;
    }
    async arrayBuffer() {
      return this._buf.buffer.slice(this._buf.byteOffset, this._buf.byteOffset + this._buf.length);
    }
    slice(a, b) { return new FakeFile(this._buf.subarray(a, b), this.name); }
  }

  const code = fs.readFileSync(path.join(__dirname, 'worker.js'), 'utf8');
  const ctx = {
    console, Date, Map, Set, Number, String, Math, Array, RegExp, JSON, Object,
    Boolean, Promise, Error, setTimeout, clearTimeout, parseInt, parseFloat,
    Intl, Uint8Array, ArrayBuffer, DataView, TextDecoder, TextEncoder, Blob,
    BigInt, crypto: webcrypto, isNaN,
    performance: require('node:perf_hooks').performance,
  };
  ctx.self = ctx;
  ctx.globalThis = ctx;
  ctx.importScripts = () => { throw new Error('should not need importScripts'); };
  ctx.postMessage = () => {};
  // sql.js is provided directly so getSqlJs() never reaches for the vendored copy.
  ctx.initSqlJs = () => initSqlJs();
  vm.createContext(ctx);
  vm.runInContext(code, ctx);

  const bundle = {
    sms: new FakeFile(smsEnc.cipher, SMS_HASH),
    addressBook: new FakeFile(abEnc.cipher, AB_HASH),
    addressBookImages: null,
    manifestDb: new FakeFile(mdbEnc.cipher, 'Manifest.db'),
    manifestPlist: new FakeFile(manifestPlist, 'Manifest.plist'),
  };

  console.log('\n--- probeBackup ---');
  const info = await ctx.probeBackup(bundle);
  check('reports encrypted', info.encrypted === true);
  check('reads device name', info.deviceName === "Ada's iPhone", JSON.stringify(info.deviceName));
  check('reads iOS version', info.productVersion === '18.3.1', info.productVersion);
  check('reads backup date', new Date(info.date).getUTCFullYear() === 2026, new Date(info.date).toISOString());

  console.log('\n--- openBackup (wrong password) ---');
  let rejected = false;
  try {
    await ctx.openBackup(bundle, 'hunter2');
  } catch (e) {
    rejected = e.message === 'WRONG_PASSWORD';
    if (!rejected) console.log('   unexpected error:', e.message);
  }
  check('rejects a wrong password', rejected);

  console.log('\n--- openBackup (correct password) ---');
  const opened = await ctx.openBackup(bundle, PASSWORD);
  const gotSms = Buffer.from(await opened.sms.arrayBuffer());
  check('sms.db decrypts byte-identical', gotSms.equals(smsPlain),
    `${gotSms.length} vs ${smsPlain.length} bytes`);
  const gotAb = Buffer.from(await opened.addressBook.arrayBuffer());
  check('AddressBook decrypts byte-identical', gotAb.equals(abPlain),
    `${gotAb.length} vs ${abPlain.length} bytes`);

  console.log('\n--- iOS contacts parsing ---');
  const nameMap = await ctx.parseContactsFile(opened.addressBook, null);
  check('picked up the ABPerson row', nameMap.size >= 2, `${nameMap.size} entries`);
  const byPhone = ctx.lookupContactName('+15551234567', nameMap);
  check('phone → name', byPhone === 'Ada Lovelace', String(byPhone));
  const byEmail = ctx.lookupContactName('ada@example.com', nameMap);
  check('email → name', byEmail === 'Ada Lovelace', String(byEmail));

  console.log('\n--- unencrypted backup passthrough ---');
  const plainBundle = { sms: new FakeFile(smsPlain, SMS_HASH), addressBook: null, addressBookImages: null, manifestDb: null, manifestPlist: null };
  const plainOpened = await ctx.openBackup(plainBundle, null);
  check('passes through untouched', plainOpened.sms === plainBundle.sms);

  fs.rmSync(TMP, { recursive: true, force: true });
  console.log(failures ? `\n${failures} FAILURE(S)` : '\nall checks passed');
  process.exit(failures ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
