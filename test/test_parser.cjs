// Smoke-test the worker parser against the real backup using a vm + a
// File-like wrapper around fs.createReadStream. Validates that counts match
// the file's claim and that the stats are sane.
'use strict';

const fs = require('node:fs');
const vm = require('node:vm');
const { Readable } = require('node:stream');
const { ReadableStream, TextDecoderStream } = require('node:stream/web');

const FILE = process.argv[2] || './sms-export.xml'   // pass a path as argv[2];
const stat = fs.statSync(FILE);
console.log(`file: ${FILE}`);
console.log(`size: ${(stat.size / 1024 / 1024 / 1024).toFixed(2)} GB`);

const code = fs.readFileSync(__dirname + '/worker.js', 'utf8');

const ctx = {
  console, Date, Map, Set, Number, String, Math, Array, RegExp, JSON,
  Object, Boolean, Promise, setTimeout, clearTimeout, parseInt, parseFloat,
  performance: require('node:perf_hooks').performance,
  Intl,
  TextDecoderStream,
  ReadableStream,
};
ctx.self = ctx;
ctx.globalThis = ctx;

let lastLog = 0;
let lastBytes = 0;
let lastT = Date.now();
let finishResolve;
const finished = new Promise(res => finishResolve = res);

ctx.postMessage = (m) => {
  if (m.type === 'progress') {
    const now = Date.now();
    if (now - lastLog > 1500) {
      const dtSec = (now - lastT) / 1000;
      const dBytes = m.bytes - lastBytes;
      const mbps = dtSec > 0 ? (dBytes / 1024 / 1024 / dtSec).toFixed(1) : '–';
      console.log(`  ${(m.pct || 0).toFixed(1).padStart(5)}%  ${(m.bytes / 1024 / 1024).toFixed(0).padStart(6)} MB  ${(m.count).toLocaleString().padStart(10)} msgs  ${mbps.padStart(5)} MB/s ${m.msg ? '— ' + m.msg : ''}`);
      lastLog = now; lastBytes = m.bytes; lastT = now;
    }
  } else if (m.type === 'done') {
    console.log('\n=== DONE ===\n');
    const s = m.stats.summary;
    console.log('summary:', JSON.stringify({
      totalMessages: s.totalMessages,
      totalSent: s.totalSent, totalRecv: s.totalRecv,
      sentSms: s.sentSms, recvSms: s.recvSms,
      sentMms: s.sentMms, recvMms: s.recvMms,
      rcsCount: s.rcsCount,
      reactionsSent: s.reactionsSent, reactionsRecv: s.reactionsRecv,
      uniqueContacts: s.uniqueContacts, uniqueGroups: s.uniqueGroups,
      activeDays: s.activeDays, totalDays: s.totalDays,
      avgPerDay: s.avgPerDay,
      peakHour: s.peakHour, peakDow: s.peakDow,
      lateNightSentPct: s.lateNightSentPct, earlyBirdSentPct: s.earlyBirdSentPct,
      longestStreak: s.longestStreak,
      streakStart: s.streakStart, streakEnd: s.streakEnd,
      busiest: s.busiest,
      firstTs: new Date(s.firstTs).toISOString(),
      lastTs: new Date(s.lastTs).toISOString(),
      charsSent: s.charsSent, charsRecv: s.charsRecv,
    }, null, 2));
    console.log('\nlongest body preview:', JSON.stringify(s.longestBody, null, 2).slice(0, 400));
    console.log('\ntop 10 contacts:');
    for (const c of m.stats.topContacts.slice(0, 10)) {
      console.log(`  ${c.total.toString().padStart(6)}  ${c.displayName}  (sent ${c.sent}, recv ${c.recv})`);
    }
    console.log('\ntop 5 groups:');
    for (const g of m.stats.groups.slice(0, 5)) {
      console.log(`  ${g.count.toString().padStart(5)}  ${g.participants}p  ${g.name || '(unnamed)'}`);
    }
    console.log('\ntop 20 words:');
    for (const w of m.stats.topWords.slice(0, 20)) {
      console.log(`  ${w.count.toString().padStart(6)}  ${w.word}`);
    }
    console.log('\ntop 15 emojis:');
    for (const e of m.stats.topEmojis.slice(0, 15)) {
      console.log(`  ${e.count.toString().padStart(6)}  ${e.emoji}`);
    }
    console.log('\ntop reactions:');
    for (const e of m.stats.topReactions) {
      console.log(`  ${e.count.toString().padStart(6)}  ${e.emoji}`);
    }
    console.log('\nmonths:');
    for (const mn of m.stats.months) {
      console.log(`  ${mn.key}  ${mn.count.toString().padStart(6)}`);
    }
    console.log('\nhour distribution (sent + recv):');
    const tot = m.stats.hourSent.map((v, i) => v + m.stats.hourRecv[i]);
    const max = Math.max(...tot);
    for (let h = 0; h < 24; h++) {
      const len = Math.round(tot[h] / max * 50);
      console.log(`  ${h.toString().padStart(2)}: ${'█'.repeat(len).padEnd(50)} ${tot[h]}`);
    }
    finishResolve();
  } else if (m.type === 'error') {
    console.error('ERROR:', m.error);
    process.exit(1);
  }
};

vm.createContext(ctx);
vm.runInContext(code, ctx);

const file = {
  size: stat.size,
  stream() {
    const nodeStream = fs.createReadStream(FILE, { highWaterMark: 1024 * 1024 });
    return Readable.toWeb(nodeStream);
  },
};

const t0 = Date.now();
ctx.onmessage({ data: { type: 'parse', file } });

finished.then(() => {
  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\ntotal time: ${dt}s`);
  process.exit(0);
});
