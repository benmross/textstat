# textstat

A Spotify-Wrapped-style story of your texting history — top contacts, busiest
hours, longest streaks, most-used words and emoji, and a year-at-a-glance
calendar heatmap.

**Everything runs in your browser.** Your messages are parsed on your own machine
by a Web Worker. Nothing is uploaded, there is no backend, and no request carries
your data anywhere. You can check: open DevTools → Network, and watch it stay
empty while your wrap generates.

---

## Using it

### iPhone

You need your phone, a cable, and a Mac or Windows PC. A local backup is the only
way message history can leave an iPhone — Apple gives apps no other access — so
the flow is built around making that as painless as possible.

**Already back up your iPhone to this computer?** Drop the `Backup` folder on the
page. That's the whole thing.

**Otherwise**, textstat detects your OS and walks you through it:

| | macOS | Windows |
|---|---|---|
| Back up with | Finder | [Apple Devices](https://apps.microsoft.com/detail/9NP83LWLPZ9K) (free, Microsoft Store) |
| Backups live in | `~/Library/Application Support/MobileSync/Backup` | `%USERPROFILE%\Apple\MobileSync\Backup` |
| | | or `%APPDATA%\Apple Computer\MobileSync\Backup` on older iTunes |

Unlock your iPhone, plug it in, tap **Trust**, hit **Back Up Now**, then drop the
folder on the page. Leave the encryption checkbox however it is — encrypted
backups are handled, you'll just be asked for the password. (That password never
leaves the page either; it's used with the Web Crypto API to unwrap the backup's
keybag locally.)

Two notes worth knowing:

- **Windows genuinely needs the Apple Devices app.** Without it, Windows sees an
  iPhone as a camera and can only read `DCIM` — the backup capability and the
  "Trust This Computer" handshake both come from the driver it installs.
- **If your backup is huge**, turning on iCloud Photos usually shrinks it a lot;
  photos already in iCloud are excluded from local backups.

### Android

Export your history with [SMS Backup & Restore](https://www.smsbackupandrestore.com/),
then drop the `.xml` on the page. Optionally add a `.vcf` contacts export for
names and photos. No computer required — this works in a phone browser.

---

## Development

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # TypeScript + production build
npm run lint
```

Next.js 16 (App Router) · TypeScript · Tailwind v4 · shadcn/ui · Framer Motion.
SQLite is read via [sql.js](https://sql.js.org/) compiled to WebAssembly, vendored
under `public/vendor/`. There are no runtime dependencies beyond the bundle.

> **`worker.js` lives in two places.** The root copy is the source; `public/worker.js`
> is what the app actually loads. After editing, run `cp worker.js public/worker.js`.

### Tests

```bash
npm test             # encrypted-backup round trip (fast, no browser)
npm run test:e2e     # builds, then drives real Chromium through the iPhone flow
```

Neither needs a real iPhone backup — `test_backup_fixture.cjs` synthesises one,
including a valid keybag, wrapped class keys and AES-CBC payloads. The binary
plists are written by Python's `plistlib` and the keys wrapped by Node's OpenSSL
bindings, so the parsers under test are never validated against their own writers.

The end-to-end test stubs `navigator.userAgentData` to assert both the Windows and
macOS guide variants, then runs a full encrypted import through to the slideshow.
It needs `npx playwright install chromium` once.

### Architecture

See [`AGENTS.md`](./AGENTS.md) for the full map — file layout, the backup
decryption pipeline, the stats aggregation, and the conventions for adding slides.

The short version:

```
src/app/page.tsx            screen routing + worker orchestration
src/components/landing/     platform picker, OS-aware guide, backup picker
src/components/story/       slideshow + 19 slide components
src/lib/backup.ts           backup discovery (3 browser intake routes)
src/lib/os.ts               OS detection, per-OS backup paths
public/worker.js            all parsing: XML, SQLite, backup decryption, stats
```

---

## Privacy

No analytics on your message content, no uploads, no server-side processing. The
only network requests the app makes are for its own static assets, plus Apple
emoji images from a CDN when rendering an iMessage wrap. Deployment uses Vercel
Analytics for page views only.
