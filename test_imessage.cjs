// Smoke-test the iMessage path. Loads worker.js into a vm, then opens chat.db
// via the npm sql.js (so we don't have to shim importScripts/wasm fetch in Node)
// and feeds rows into processSqliteRow.
'use strict';

const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const initSqlJs = require('sql.js');

const DBPATH = process.argv[2] || path.join(__dirname, 'imessage_sample/chat.db');
console.log(`db: ${DBPATH}`);

const code = fs.readFileSync(__dirname + '/worker.js', 'utf8');
const ctx = {
  console, Date, Map, Set, Number, String, Math, Array, RegExp, JSON, Object,
  Boolean, Promise, setTimeout, clearTimeout, parseInt, parseFloat,
  performance: require('node:perf_hooks').performance,
  Intl, Uint8Array, ArrayBuffer, TextDecoder,
};
ctx.self = ctx;
ctx.globalThis = ctx;
ctx.importScripts = () => { /* not used in this codepath */ };
ctx.postMessage = () => {};
vm.createContext(ctx);
vm.runInContext(code, ctx);

(async () => {
  const SQL = await initSqlJs();
  const buf = fs.readFileSync(DBPATH);
  const db = new SQL.Database(buf);

  const stats = ctx.makeStats();
  stats.serviceCounts = new Map();
  stats.attachmentCount = 0;
  stats.editedCount = 0;
  stats.retractedCount = 0;

  const t0 = Date.now();
  const stmt = db.prepare(`
    SELECT
      m.ROWID AS rowid, m.is_from_me, m.date, m.text, m.attributedBody AS ab,
      m.service, m.associated_message_type AS amt, m.associated_message_emoji AS ame,
      m.cache_has_attachments AS hasatt, m.is_audio_message AS audio,
      m.date_edited AS edited, m.date_retracted AS retracted,
      h.id AS handle,
      c.style AS chat_style, c.display_name AS chat_name, c.chat_identifier AS chat_id
    FROM message m
    LEFT JOIN handle h ON m.handle_id = h.ROWID
    LEFT JOIN chat_message_join cmj ON m.ROWID = cmj.message_id
    LEFT JOIN chat c ON cmj.chat_id = c.ROWID
    WHERE m.item_type = 0
    ORDER BY m.date
  `);
  let n = 0;
  while (stmt.step()) {
    ctx.processSqliteRow(stmt.getAsObject(), stats);
    n++;
  }
  stmt.free();
  db.close();
  const dt = ((Date.now() - t0) / 1000).toFixed(2);

  const result = ctx.serialize(stats);
  const s = result.summary;

  console.log(`processed ${n} rows in ${dt}s\n`);
  console.log('summary:', JSON.stringify({
    totalMessages: s.totalMessages,
    totalSent: s.totalSent, totalRecv: s.totalRecv,
    reactionsSent: s.reactionsSent, reactionsRecv: s.reactionsRecv,
    attachmentCount: s.attachmentCount, editedCount: s.editedCount, retractedCount: s.retractedCount,
    serviceCounts: s.serviceCounts,
    uniqueContacts: s.uniqueContacts, uniqueGroups: s.uniqueGroups,
    activeDays: s.activeDays, totalDays: s.totalDays, avgPerDay: s.avgPerDay,
    peakHour: s.peakHour, peakDow: s.peakDow,
    longestStreak: s.longestStreak,
    busiest: s.busiest,
    firstTs: new Date(s.firstTs).toISOString(),
    lastTs: new Date(s.lastTs).toISOString(),
    charsSent: s.charsSent, charsRecv: s.charsRecv,
  }, null, 2));
  console.log('\nlongest body:', JSON.stringify(s.longestBody, null, 2));

  console.log('\ntop 10 contacts (note: phones/emails — no contact-name resolution yet):');
  for (const c of result.topContacts.slice(0, 10)) {
    console.log(`  ${c.total.toString().padStart(6)}  ${c.displayName.padEnd(25)} (sent ${c.sent}, recv ${c.recv})`);
  }
  console.log('\ntop 5 groups:');
  for (const g of result.groups.slice(0, 5)) {
    console.log(`  ${g.count.toString().padStart(5)}  ${g.name || '(unnamed)'}`);
  }
  console.log('\ntop 15 words:');
  for (const w of result.topWords.slice(0, 15)) console.log(`  ${w.count.toString().padStart(5)}  ${w.word}`);
  console.log('\ntop 10 emojis:');
  for (const e of result.topEmojis.slice(0, 10)) console.log(`  ${e.count.toString().padStart(5)}  ${e.emoji}`);
  console.log('\ntop reactions:');
  for (const r of result.topReactions) console.log(`  ${r.count.toString().padStart(5)}  ${r.emoji}`);
  console.log('\nmonths:');
  for (const m of result.months) console.log(`  ${m.key}  ${m.count.toString().padStart(5)}`);
})().catch(err => { console.error(err); process.exit(1); });
