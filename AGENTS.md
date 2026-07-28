# AGENTS.md

> **⚠️ IMPORTANT:** Whenever you finish working on this codebase, update this file so it reflects the current state of the project. This applies to every agent session — edit AGENTS.md as your final step before reporting done.

## Project Overview

**textstat** is a 100% client-side browser app that produces a cinematic, Apple-inspired slideshow from your SMS/iMessage history. Users import an iPhone backup, a synced macOS `chat.db`, or an Android [SMS Backup & Restore](https://www.smsbackupandrestore.com/) XML export, and the app parses everything locally — no data leaves the device.

- **Repo:** [`https://github.com/benmross/textstat`](https://github.com/benmross/textstat) (private)
- **Frontend:** Next.js 16 (App Router) with TypeScript, Tailwind CSS v4, shadcn/ui v4, Framer Motion, lucide-react (icons), and react-icons (brand logos)
- **Legacy frontend:** `legacy/` directory (vanilla JS, kept for reference)
- **Runtime:** Browser only. `public/vendor/sql-wasm.js` + `public/vendor/sql-wasm.wasm` provide SQLite via WebAssembly (sql.js compiled to WASM).
- **Dependencies:** None at runtime. `sql.js` in `package.json` is dev-only, used by the Node.js test scripts.

---

## File Map

### Next.js Frontend (`src/`)

| File | Role |
|---|---|
| `src/app/page.tsx` | Main page — screen routing (landing → loading → story), worker orchestration, file validation |
| `src/app/layout.tsx` | Root layout — dark theme, Geist fonts, metadata |
| `src/app/globals.css` | Tailwind v4 + shadcn theming (dark theme with textstat colors) |
| `src/components/landing/PlatformPicker.tsx` | Phase 1: iPhone/Android selection cards with Framer Motion hover |
| `src/components/landing/PlatformGuide.tsx` | Phase 2: platform-specific guide + dropzones + start button |
| `src/components/landing/IphoneGuide.tsx` | iPhone step-by-step guide with clipboard copy |
| `src/components/landing/AndroidGuide.tsx` | Android step-by-step guide |
| `src/components/landing/Dropzone.tsx` | Drag-and-drop file upload area with hover animation |
| `src/components/landing/FileChip.tsx` | Selected file indicator chip with remove button |
| `src/components/loading/LoadingScreen.tsx` | Animated spinner + progress bar + rotating tips |
| `src/components/story/Slideshow.tsx` | Main slideshow orchestrator — keyboard nav, slide cycling, palette assignment |
| `src/components/story/SlideShell.tsx` | Slide chrome wrapper (gradient background, tag, dot pattern, body) |
| `src/components/story/StoryControls.tsx` | Navigation bar (prev/next arrows, progress dots, restart) |
| `src/components/story/slides/*.tsx` | 19 individual slide components (see list below) |
| `src/components/shared/Avatar.tsx` | Circular avatar with photo/fallback monogram; `AvatarStack` renders overlapping circles with `+N` chip |
| `src/components/shared/AppleEmoji.tsx` | Renders emoji as Apple CDN images (emoji-datasource-apple via jsDelivr); falls back to system font on error; used for iMessage exports only |
| `src/components/shared/Pill.tsx` | Pill/badge component |
| `src/components/shared/AnimatedBackground.tsx` | Floating blob background (Framer Motion drift animation) |
| `src/components/shared/GlowBorder.tsx` | Glassmorphism glow border wrapper utility |
| `src/components/landing/BackupPicker.tsx` | iPhone backup folder intake — drag-drop, `showDirectoryPicker()`, `webkitdirectory` fallback, device confirmation, password prompt |
| `src/lib/os.ts` | OS detection (`useDesktopOS()` via `useSyncExternalStore`, hydration-safe), `supportsDirectoryPicker()`, per-OS backup paths |
| `src/lib/backup.ts` | Backup file hashes, folder scanning across all three intake routes, single-file classification |
| `src/lib/utils.ts` | shadcn `cn()` utility (clsx + tailwind-merge) |
| `src/lib/formatting.ts` | Date/number formatting, constants (DOW_NAMES, MONTH_NAMES, etc.) |
| `src/lib/avatars.ts` | Avatar gradient palette, initials extraction, string hashing |
| `src/lib/palettes.ts` | Slide color palette definitions + `contrastColor(hex)` helper (returns black/white for readable text on any palette.fg background) |
| `src/types/stats.ts` | TypeScript types for parsed stats data |

#### Slide inventory

| Slide | Condition |
|---|---|
| `HeroSlide` | always |
| `ActiveDaysSlide` | always |
| `TopContactSlide` | topContacts[0] exists |
| `TopContactsListSlide` | >1 top contact |
| `YouTextedMoreSlide` | a contact with total≥15 where you sent more |
| `TheyTextedMoreSlide` | a contact with total≥15 where they sent more |
| `LongestSentRunSlide` | longestSentRun.count≥3 |
| `SentVsReceivedSlide` | always |
| `HourChartSlide` | always |
| `DayOfWeekSlide` | always |
| `MonthlyTimelineSlide` | always |
| `CalendarHeatmapSlide` | calDays.length>0 |
| `TopWordsSlide` | topWords.length>0 |
| `TopEmojisSlide` | topEmojis.length>0 |
| `ReactionsSlide` | reactionsSent+reactionsRecv>0 |
| `GroupChatsSlide` | uniqueGroups>0 |
| `StreakSlide` | longestStreak>1 |
| `LongestMessageSlide` | longestSentBody.len>100 or longestRecvBody.len>100 |
| `WrapSlide` | always |

### Config Files (root)

| File | Role |
|---|---|
| `tsconfig.json` | TypeScript configuration |
| `eslint.config.mjs` | ESLint configuration (excludes vendored files) |
| `next.config.ts` | Next.js configuration |
| `postcss.config.mjs` | PostCSS config (Tailwind v4 plugin) |

### Public Assets (`public/`)

| File | Role |
|---|---|
| `public/worker.js` | Web Worker — streaming XML parser, SQLite iMessage parser, iOS backup decryption (bplist + keybag + AES), vCard/AddressBook contacts parsers, stats aggregation (~1560 lines) |
| `public/vendor/sql-wasm.js` | Vendored sql.js (Emscripten-compiled SQLite → WASM) |
| `public/vendor/sql-wasm.wasm` | WASM binary for sql.js (~645 KB) |

### Legacy (`legacy/`)

| File | Role |
|---|---|
| `legacy/index.html` | Original entry point (vanilla JS) |
| `legacy/app.js` | Main thread (vanilla JS) |
| `legacy/styles.css` | All styling (vanilla CSS) |

### Root-level (tests + worker source)

| File | Role |
|---|---|
| `worker.js` | Worker source (also copied to `public/worker.js` for the Next.js app) |
| `vendor/sql-wasm.js` | Vendored sql.js (also copied to `public/vendor/`) |
| `vendor/sql-wasm.wasm` | WASM binary (also copied to `public/vendor/`) |
| `test_parser.cjs` | Node.js smoke test for XML/SMS path |
| `test_imessage.cjs` | Node.js smoke test for SQLite/iMessage path |
| `test_backup_fixture.cjs` | Builds synthetic iOS backups on disk (also runnable directly: `npm run fixture -- <dir> [plain]`) |
| `test_backup.cjs` | Round-trip test of the encrypted-backup path (no browser needed) |
| `test_e2e.cjs` | Playwright test of the whole iPhone flow against the production build |
| `package.json` | Combined manifest — Next.js deps + test scripts |

---

## Architecture

### Screen Flow

```
Landing (iPhone-first hero; small Android alternate link)
  ↓
PlatformGuide
  ├─ iPhone / Mac
  │    ├─ Messages in iCloud → chat.db + optional contacts database
  │    ├─ existing backup → BackupPicker → probe → password?
  │    └─ new backup → illustrated Finder walkthrough → BackupPicker
  ├─ iPhone / Windows
  │    ├─ existing backup → BackupPicker → probe → password?
  │    └─ new backup → illustrated Apple Devices walkthrough → BackupPicker
  └─ Android → AndroidGuide + two dropzones
  ↓
[Generate My Wrap] → LoadingScreen (progress + tips)
  ↓
Slideshow (14-16 slides with keyboard nav)
  ↓
[↺ start over] → Page reload
```

The iPhone guide is **situation-first**. It asks whether the user has Messages in
iCloud (Mac only), already has a local backup, or needs to create one. Existing
backup users go directly to the picker. New-backup users get OS-specific visual
steps, with explicit screenshot placeholders in `GuideStep` ready for final
assets. Android is deliberately a small alternate link below the hero rather
than an equal-weight first-screen choice.

Screen transitions use Framer Motion `AnimatePresence` with opacity fade.

### Upload → Parse Pipeline

**iPhone — the local backup path (primary, works on macOS + Windows + Linux).**
`sms.db` can only leave an iPhone inside a `mobilebackup2` backup; AFC exposes
only the media sandbox, so there is no shortcut. The flow therefore minimises
everything *around* the backup rather than trying to avoid it:

1. `BackupPicker` takes one folder — the `MobileSync/Backup` root **or** a single
   device folder. Three intake routes, all enumeration-free where possible:
   - **Chromium**: `showDirectoryPicker()` → `getDirectoryHandle('3d')` →
     `getFileHandle(hash)`. Direct lookup, so a 200k-file backup costs nothing.
   - **Drag-and-drop (all browsers)**: `FileSystemDirectoryEntry.getFile()` takes
     a *relative path*, so this is also a direct lookup.
   - **Firefox / Safari fallback**: `<input webkitdirectory>` → `scanFileList()`
     matches on `webkitRelativePath` (the browser bears the enumeration cost).
2. If the picked folder holds several device folders, the one with the newest
   `Manifest.plist` wins.
3. A short-lived worker runs a `probe` message → `Manifest.plist` is read for
   `IsEncrypted`, `Lockdown.DeviceName`, `ProductVersion` and `Date`. The UI
   names the device back to the user and only then asks for a password.
4. `parse` runs the real worker with `{ backup, password }`.
5. On `WRONG_PASSWORD` the UI returns to the form with the field flagged rather
   than dead-ending on the loading screen.

**Android** keeps the original two-dropzone flow (`.xml` + optional `.vcf`).

Anyone who drags a bare `chat.db` / `.xml` / `.vcf` onto the iPhone dropzone is
routed by `classifyFile()` instead — the macOS Messages path still works, it is
just no longer the documented one (it depends on Messages in iCloud having
synced, and carries no contact names).

### Backup file layout

Files inside a backup are named `SHA-1("<domain>-<relative path>")` and live in a
subfolder named after the hash's first two hex chars. **Filenames are identical in
encrypted backups** — only contents are ciphertext — so lookup never needs
`Manifest.db` unless decryption is required. Constants live in `src/lib/backup.ts`
and are duplicated in `worker.js` (`BACKUP_HASH_*`):

| File | Path in backup |
|---|---|
| `sms.db` | `3d/3d0d7e5fb2ce288813306e4d4636395e047a3d28` |
| `AddressBook.sqlitedb` | `31/31bb7ba8914766d4ba40d6dfb6113c8b614be442` |
| `AddressBookImages.sqlitedb` | `cd/cd6702cea29fe89cf280a76794405adb17f9a0ee` |

iOS 9 and earlier stored files flat in the backup root; `hashPaths()` tries both.

### Worker (worker.js)

Format detection by sniffing first 16 bytes:
- **SQLite path** (`parseSqlite()`): loads `public/vendor/sql-wasm.js` via `importScripts()`, runs JOIN queries across `message`/`handle`/`chat` tables
- **XML path** (`parseFile()`): streaming line-by-line with 256KB line buffer cap, `indexOf`-based attribute extraction

**Contacts parsing** — `parseContactsFile(file, imagesFile)` sniffs the format:
- **vCard** (`parseVcard()`): photos from the PHOTO field, vCard 3.0/4.0, emitted as data URLs
- **iOS `AddressBook.sqlitedb`** (`iosAddressBookMap()`): the `ABPerson` / `ABMultiValue` schema from a backup. Values are classified by *content* (contains `@` → email, ≥5 digits → phone) rather than by `ABMultiValue.property`, whose ids have shifted across iOS versions. Photos come from `ABThumbnailImage` in `AddressBookImages.sqlitedb`.
- **macOS `.abcddb`** (`abcddbMap()`): Core Data `ZABCDRECORD`; photos from `ZTHUMBNAILIMAGEDATA` (Apple prepends a `0x01` version byte before the raw JPEG/PNG; `abcddPhotoUrl()` strips it). Kept for backward compatibility.

Dispatch is by `sqlite_master` table check (`ABPerson` present → iOS). Contacts are
always optional — a failure to parse them is swallowed and the wrap falls back to
phone numbers rather than blocking.

### Encrypted backup decryption (worker.js)

All WebCrypto, no extra WASM. `openBackup(bundle, password)`:

1. `bplistParse()` — a minimal `bplist00` reader (dict/array/string/data/int/real/date/UID). Used for `Manifest.plist` and for the per-file blobs in `Manifest.db`.
2. `unarchive()` — flattens an NSKeyedArchiver plist (`$objects` + UID refs) into plain data. Skips `$class` (cyclic) and maps `'$null'` → `null`.
3. `parseKeybag()` — the keybag is a flat TLV stream (4-char ASCII tag, big-endian `uint32` length, value). Everything before the first `CLAS` is header metadata; each `CLAS` opens a protection-class block holding a wrapped key (`WPKY`).
4. `backupKekFromPassword()` — iOS 10.2+ double-derives: `PBKDF2-SHA256(password, DPSL, DPIC)` then `PBKDF2-SHA1(…, SALT, ITER)`. Older backups use only the second step (detected by `DPSL`/`DPIC` being absent).
5. `unwrapClassKeys()` — RFC 3394 via WebCrypto `AES-KW`. The `A6A6…` integrity check means a wrong password throws instead of yielding garbage; **zero successful unwraps is how a wrong password is detected**.
6. `decryptBackupBlob()` — `Manifest.db` is decrypted with `ManifestKey`, then each file's wrapped key is read from its `Files.file` blob.

**`aesCbcDecryptNoPad()` is the subtle part.** WebCrypto's AES-CBC always applies
PKCS#7, but iOS payloads are raw block-aligned ciphertext with no padding.
Appending one synthetic block — `AES-CBC-encrypt(padBlock, iv=lastCiphertextBlock)`,
where `padBlock` is 16 bytes of `0x10` — gives WebCrypto exactly one block of valid
padding to strip, leaving the true plaintext intact. Do not "simplify" this away.

`unwrapFileKey()` tries the metadata `ProtectionClass`, then the 4-byte class
prefix as little-**and** big-endian, then brute-forces every class key. The prefix
endianness has been observed both ways across iOS versions, and unwrap is
self-verifying so guessing is safe and cheap.

**Group chat name resolution (iMessage)**: Before the main message loop, `parseSqlite()` runs a pre-query joining `chat_handle_join → handle → chat` to fetch all participants per group. Group names default to `display_name`; when that's empty (unnamed groups), a name is derived from the first 3 participant handles/names. `stats.groups` is pre-populated with participant counts and photos before messages are processed.

**Consecutive sent-run tracking**: Each 1:1 contact entry carries `curRun`, `maxRun`, `curMessages[]`, and `maxMessages[]`. The `trackRun(contact, isSent, text)` helper is called from both the XML path (`recordMessage`) and the iMessage path (`recordMessageImsg`) after the contact entry is resolved. `serialize()` surfaces the global max as `summary.longestSentRun`.

**Calendar heatmap**: `calDays` array exported from `serialize()` — all days from `firstTs` to `lastTs` gap-filled with `count=0` for silent days. Layout adapts to dataset length: square size ranges from 5px (many years) to 13px (≤3 months), columns auto-calculated so the full range fits in ≤5 rows. Month grids use Sunday-first week columns; year label shown only on year-change boundaries.

**Split attribution stats**: Words and emojis are tracked in separate sent/received maps (`wordsSent`, `wordsRecv`, `emojisSent`, `emojisRecv`). Serialization emits `topWordsSent`, `topWordsRecv`, `topEmojisSent`, `topEmojisRecv` (each 50/30 entries), plus a combined `topWords`/`topEmojis` (summed totals, for word-cloud sizing). Longest message bodies are tracked separately as `longestSentBody` and `longestRecvBody`; `longestBody` in the summary is the longer of the two (used as the slide condition threshold).

### Slideshow

`Slideshow.tsx` builds an array of slide configs with conditional rendering (some slides only show based on available data). Each slide gets a rotating palette from `PALETTES[]`. Navigation: arrow keys, prev/next buttons, progress-bar dots. Framer Motion handles slide transitions.

The story uses restrained Apple-like mesh gradients and a persistent
backdrop-blurred glass dock. Every slide, including the final wrap, has a Share
action. It uses the native Web Share sheet when available and copies a
slide-specific summary plus the site URL to the clipboard otherwise.

### Avatars

`Avatar` component renders circular avatars from `{ displayName?, name?, contact?, photo? }` objects:
- If `photo` is a data URL → background-image
- Otherwise → deterministic gradient monogram (hash name → 12-gradient palette, initials displayed)
- Sizes: `sm` (32px), `md` (52px), `lg` (96px), `xl` (clamp 120-180px)
- `AvatarStack` renders overlapping circles with `+N` overflow chip (group participants)

---

## Key Design Decisions

- **Next.js App Router** with `"use client"` on all interactive components
- **Tailwind CSS v4** — all styling as utility classes; no CSS-in-JS, no separate CSS files
- **shadcn/ui v4** — button, card, badge, progress primitives from base-ui/react
- **Framer Motion** — screen transitions (`AnimatePresence`), blob animations, hover effects, slide transitions
- **Guided wizard UX** — 2-phase flow (pick platform → guided upload)
- **iPhone-first import UX** — assumes iPhone, branches by the user’s actual
  situation, and keeps Android available as a secondary link
- **Liquid-glass visual system** — reusable `.glass-*` material classes combine
  translucent gradients, fine borders, inner highlights, saturation, and blur;
  reduced-motion preferences are respected globally
- **Share from every story page** — native Web Share with clipboard fallback,
  using human-readable slide labels from `Slideshow.tsx`
- **Backup-first for iPhone** — a local backup is the only way `sms.db` leaves the device, so the UI optimises around it instead of pretending otherwise. It also sidesteps the biggest silent failure of the old `chat.db` flow: partial history when Messages in iCloud was never enabled.
- **OS auto-detected, never asked** — `useDesktopOS()` picks the Apple Devices app + `%USERPROFILE%` paths on Windows, Finder + `~/Library` on macOS. Windows gets a direct Microsoft Store link (product `9NP83LWLPZ9K`) rather than prose describing how to find it.
- **Encrypted backups are decrypted in-browser, never refused** — telling people to disable encryption would force a *fresh full backup* and silently drop their Health data. Supporting the password is what makes an already-existing backup usable.
- **Contacts are never blocking** — parse failures degrade to phone numbers.
- **No emoji characters in UI** — all decorative icons use `lucide-react` components; proprietary brand logos (Apple, Android) use `react-icons/fa`
- **Apple emoji on iMessage exports** — `AppleEmoji` component loads 64×64 PNGs from `emoji-datasource-apple` via jsDelivr CDN; falls back to text with system emoji font; only activated when `stats.summary.serviceCounts` is set (iMessage)
- **Contrast-safe palette colors** — `contrastColor(hex)` in `palettes.ts` computes luminance and returns `#000000cc` or `#ffffffee`; used wherever `palette.fg` is a background color to avoid invisible text (several palettes have identical `fg` and `accent`)
- **No regex/DOMParser for XML** — `indexOf` scans + bounded 256KB line buffers in worker
- **Streaming parsing** — `ReadableStream` API so parsing begins before file fully loaded
- **One worker, one-shot** — worker is `terminate()`d after `done`
- **Shortcodes filtered** — top contacts excludes common shortcode numbers

---

## Development

### Prerequisites

- Node.js 18+
- `npm install`

### Running Dev Server

```bash
npm run dev
```

### Building

```bash
npm run build     # Verify TypeScript + production build
npm run lint      # ESLint
```

### Running Tests

```bash
npm test              # encrypted-backup round trip (fast, no browser)
npm run test:e2e      # builds, then drives real Chromium through the iPhone flow
npm run fixture -- /tmp/Backup/UDID          # write an encrypted backup to disk
npm run fixture -- /tmp/Backup/UDID plain    # ...an unencrypted one

# legacy smoke tests, need your own export files
node test_parser.cjs [path/to/sms-export.xml]
node test_imessage.cjs [path/to/chat.db]
```

`test_backup.cjs` and `test_backup_fixture.cjs` deliberately build their plists
with **Python's `plistlib`** and wrap keys with **Node's OpenSSL bindings**, so the
worker's readers are never validated against their own writers. `python3` is
required for these two (stdlib only).

`test_e2e.cjs` needs `npx playwright install chromium` once. It stubs
`navigator.userAgentData.platform` to assert the Windows and macOS guide variants,
then runs a full encrypted import through to the slideshow. The test follows the
situation-first choices (Messages in iCloud / existing backup / new backup),
asserts the per-slide Share control, and uses a process-specific port by default
so it can run alongside a developer preview.

**No real backup is needed for any of this** — the fixtures are synthesised.

### Baseline lint state

`npm run lint` is clean. `AppleEmoji` intentionally uses a native `<img>` for its
dynamic third-party CDN URL and runtime `onError` fallback; the relevant Next.js
lint rule is disabled only on that element with an explanatory comment.

### Code Conventions

- **`"use client"`** on all components (app is fully client-side)
- **`cn()`** from `@/lib/utils` for className merging
- **Tailwind-only** — no separate CSS files beyond `globals.css` (which handles theme variables)
- **TypeScript** throughout — `@/types/stats.ts` for data shapes
- **Component organization**: `components/landing/`, `components/loading/`, `components/story/`, `components/shared/`

### Before Committing

1. **If `worker.js` or `vendor/` changed, sync first** — `cp worker.js public/worker.js`, `cp vendor/* public/vendor/`. The app only ever loads the `public/` copies, so an unsynced edit silently does nothing.
2. Run `npm run build` to check TypeScript + build
3. Run `npm run lint` — expect the 3-error baseline above, no more
4. Run `npm test` (encrypted-backup round trip)
5. Run `npm run test:e2e` if you touched the landing flow, the worker, or `src/lib/backup.ts`
6. Verify all three screens work (landing → loading → story) and both wizard paths

### Slide Entrance Animations

Every slide uses Framer Motion entrance animations keyed to `isCurrent`. The pattern:

- **Text lines**: `motion.div` with `initial={{ opacity: 0, y: 18 }}` → `animate={isCurrent ? { opacity: 1, y: 0 } : hidden}`, staggered delays
- **Big numbers / hero text**: fade + slight scale (`scale: 0.85 → 1`) or spring pop (`scale: 0.75 → 1`)
- **Pills / badges**: spring pop-in (`scale: 0 → 1`) with stagger (`type: "spring", stiffness: 400, damping: 20`)
- **Chart bars (DayOfWeekSlide, HourChartSlide, MonthlyTimelineSlide)**: `scaleY: 0 → 1` with `transformOrigin: "bottom"`, staggered by column index
- **Progress bars (TopContactsListSlide)**: `scaleX: 0 → 1` with `transformOrigin: "left"`
- **Split bar (SentVsReceivedSlide)**: `scaleX: 0 → 1` with `transformOrigin: "left"` on the whole bar container
- **Avatars / emoji bubbles**: spring pop-in (`scale: 0 → 1`), bouncier spring for large emojis
- **Word cloud (TopWordsSlide)**: opacity-only stagger (no translate, keeps layout stable)
- **Byline cards / blockquotes (LongestMessageSlide)**: `x: -24 → 0` slide-in for byline, `y: 24 → 0` for quote
- All animations respect `isCurrent` for reset on navigate-away, so re-visiting a slide replays its entrance

### Adding a New Slide

1. Create a new component in `src/components/story/slides/`
2. Accept `stats`, `palette`, `isCurrent` props
3. Register in the `slidesConfig` array in `Slideshow.tsx`
4. Optionally add a `condition` function if the slide is conditional
5. Navigation dots auto-update based on filtered array length
6. Add entrance animations following the patterns above (use `isCurrent` to gate `animate` targets)

### Split Bars (Sent vs Received)

Slides with a proportional split bar (`SentVsReceivedSlide`, `YouTextedMoreSlide`, `TheyTextedMoreSlide`) follow this pattern:
- **Left/dominant side**: `backgroundColor: palette.fg`, `color: contrastColor(palette.fg)` — never use `palette.accent` directly as text on `palette.fg` (several palettes have identical values)
- **Right/recessive side**: `backgroundColor: "rgba(0,0,0,.25)"`, `color: "rgba(255,255,255,0.9)"` — white is always readable on this dark overlay

### Scrollable Slide Content

`LongestSentRunSlide` has a scrollable message list. Pattern for auto-scroll with user-override:
- Use an effect-local `setTimeout` after the entrance animation to trigger the
  RAF scroll loop; do not add render state solely to mark the timer ready
- Use `onWheel` + `onTouchStart` (not `onScroll`) on the container to set a `userScrolled` ref — `onScroll` fires on programmatic changes too and would kill the animation immediately
