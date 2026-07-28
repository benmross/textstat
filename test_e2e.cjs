// End-to-end browser test of the iPhone import flow.
//
// Serves the production build, then drives a real Chromium through the whole
// path: OS detection → guide copy → folder pick → backup probe → password →
// decrypt → parse → slideshow.
//
// Run: node test_e2e.cjs   (expects `npm run build` to have been run first)
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');
const { buildBackup } = require('./test_backup_fixture.cjs');

const PORT = 3111;
const BASE = `http://127.0.0.1:${PORT}`;

let failures = 0;
function check(label, cond, detail) {
  console.log(`${cond ? '  ok  ' : ' FAIL '} ${label}${detail ? ' — ' + detail : ''}`);
  if (!cond) failures++;
}

function waitForServer(proc) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('server did not start in time')), 60000);
    const onData = (d) => {
      if (/Ready in|started server|Local:/i.test(String(d))) {
        clearTimeout(timer);
        setTimeout(resolve, 500);
      }
    };
    proc.stdout.on('data', onData);
    proc.stderr.on('data', onData);
    proc.on('exit', (c) => reject(new Error('server exited: ' + c)));
  });
}

// Open the landing page in a context that reports the given OS.
async function newPage(browser, platform) {
  const ctx = await browser.newContext();
  await ctx.addInitScript((p) => {
    Object.defineProperty(navigator, 'userAgentData', { get: () => ({ platform: p }) });
  }, platform);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => {
    console.log('   [page error]', e.message);
    failures++;
  });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.getByText('iPhone', { exact: false }).first().click();
  await page.waitForSelector('text=Point us at your iPhone backup');
  return { ctx, page };
}

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'textstat-e2e-'));
  const backupRoot = path.join(tmp, 'Backup');
  const fixture = await buildBackup({
    outDir: path.join(backupRoot, '00008130-001A2D3E1234567A'),
  });
  console.log(`fixture: ${fixture.dir}\n`);

  const server = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    cwd: __dirname,
    env: { ...process.env },
  });
  await waitForServer(server);

  const browser = await chromium.launch();

  try {
    // --- OS detection: Windows -------------------------------------------
    console.log('--- Windows guide ---');
    {
      const { ctx, page } = await newPage(browser, 'Windows');
      const storeLink = page.locator('a[href*="apps.microsoft.com"]');
      check('offers the Apple Devices Store link', (await storeLink.count()) === 1);
      check(
        'links the right Store product',
        (await storeLink.getAttribute('href')) === 'https://apps.microsoft.com/detail/9NP83LWLPZ9K'
      );
      const body = await page.textContent('body');
      check('names the Apple Devices app', body.includes('the Apple Devices app'));
      check('shows the Apple Devices backup path', body.includes('%USERPROFILE%\\Apple\\MobileSync\\Backup'));
      check('shows the legacy iTunes path', body.includes('%APPDATA%\\Apple Computer\\MobileSync\\Backup'));
      check('does not mention Finder', !body.includes('Finder'));
      await ctx.close();
    }

    // --- OS detection: macOS ---------------------------------------------
    console.log('\n--- macOS guide ---');
    {
      const { ctx, page } = await newPage(browser, 'macOS');
      const body = await page.textContent('body');
      check('names Finder', body.includes('Finder'));
      check('shows the mac backup path', body.includes('~/Library/Application Support/MobileSync/Backup'));
      check('hides the Windows Store step', (await page.locator('a[href*="apps.microsoft.com"]').count()) === 0);
      check('offers the chat.db shortcut', body.includes('~/Library/Messages/chat.db'));
      await ctx.close();
    }

    // --- full import ------------------------------------------------------
    console.log('\n--- full encrypted import ---');
    {
      const { ctx, page } = await newPage(browser, 'Windows');

      // Point the directory input at the Backup root, so the test also covers
      // finding the device folder underneath it.
      await page.setInputFiles('input[type=file]', backupRoot);

      await page.waitForSelector(`text=${fixture.deviceName}`, { timeout: 30000 });
      check('identifies the device from Manifest.plist', true, fixture.deviceName);
      const body = await page.textContent('body');
      check('reports iOS version', body.includes('iOS 18.3.1'));
      check('notices the contacts db', body.includes('contacts found'));
      check('collapses the setup steps once ready', body.includes('Backup ready'));

      const pwField = page.locator('input[type=password]');
      check('asks for the backup password', (await pwField.count()) === 1);

      // Wrong password should come back to the form, not dead-end.
      await pwField.fill('wrong-password');
      await page.getByRole('button', { name: /Generate My Wrap/i }).click();
      await page.waitForSelector("text=That password didn't work", { timeout: 60000 });
      check('recovers from a wrong password', true);

      // Correct password → full parse → slideshow.
      await page.locator('input[type=password]').fill(fixture.password);
      await page.getByRole('button', { name: /Generate My Wrap/i }).click();
      await page.waitForSelector('text=/messages/i', { timeout: 90000 });
      await page.waitForTimeout(2500);

      const storyText = await page.textContent('body');
      check('reached the slideshow', !storyText.includes('Point us at your iPhone backup'));

      // Walk the slides and collect the text, to prove decrypt+parse produced
      // real aggregates and that contacts resolved to names.
      let seen = '';
      for (let i = 0; i < 20; i++) {
        seen += ' ' + (await page.textContent('body'));
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(220);
      }
      check('resolved contact names from AddressBook', /Ada Lovelace/.test(seen));
      check('found the group chat', /Weekend Plans/.test(seen));
      check('counted tapbacks', /tapback/i.test(seen));
      check('built the word cloud', /hilarious|dinner|birthday/i.test(seen));

      await page.screenshot({ path: path.join(tmp, 'slide.png') });
      console.log(`   screenshot: ${path.join(tmp, 'slide.png')}`);
      await ctx.close();
    }

    // --- unencrypted backup ----------------------------------------------
    console.log('\n--- unencrypted import ---');
    {
      const plainRoot = path.join(tmp, 'PlainBackup');
      await buildBackup({
        outDir: path.join(plainRoot, '00008130-DEADBEEF'),
        encrypted: false,
        deviceName: "Grace's iPhone",
      });
      const { ctx, page } = await newPage(browser, 'macOS');
      await page.setInputFiles('input[type=file]', plainRoot);
      await page.waitForSelector("text=Grace's iPhone", { timeout: 30000 });
      check('reads an unencrypted backup', true);
      check('skips the password prompt', (await page.locator('input[type=password]').count()) === 0);
      await page.getByRole('button', { name: /Generate My Wrap/i }).click();
      await page.waitForTimeout(6000);
      const t = await page.textContent('body');
      check('parses without a password', !t.includes('Point us at your iPhone backup'));
      await ctx.close();
    }

    // --- a folder that is not a backup -----------------------------------
    console.log('\n--- error handling ---');
    {
      const junk = path.join(tmp, 'junk');
      fs.mkdirSync(junk, { recursive: true });
      fs.writeFileSync(path.join(junk, 'notes.txt'), 'hello');
      const { ctx, page } = await newPage(browser, 'Windows');
      await page.setInputFiles('input[type=file]', junk);
      await page.waitForSelector('text=No iPhone backup in that folder', { timeout: 15000 });
      check('explains a folder with no backup in it', true);
      await ctx.close();
    }
  } finally {
    await browser.close();
    server.kill();
  }

  console.log(failures ? `\n${failures} FAILURE(S)` : '\nall checks passed');
  process.exit(failures ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
