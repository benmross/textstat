# AGENTS.md

## Project Overview

**textstat** is a 100% client-side browser app that produces a Spotify-Wrapped-style slideshow from your SMS/iMessage history. Users drop in either a [SMS Backup & Restore](https://www.smsbackupandrestore.com/) XML export or a macOS `chat.db` (the Messages SQLite database), and the app parses everything locally — no data leaves the device.

- **Repo:** [`https://github.com/benmross/textstat`](https://github.com/benmross/textstat) (private)
- **Paradigm:** Zero-framework vanilla JS, single-directory flat layout. No bundler, no build step.
- **Runtime:** Browser only. `vendor/sql-wasm.js` + `vendor/sql-wasm.wasm` provide SQLite via WebAssembly (sql.js compiled to WASM).
- **Dependencies:** None at runtime. `sql.js` in `package.json` is dev-only, used by the Node.js test scripts.

---

## File Map

| File | Role |
|---|---|
| `index.html` | Entry point. Three `<section>` screens: `#landing` (upload), `#loading` (progress), `#story` (slideshow) |
| `app.js` | Main thread: file handling, Web Worker orchestration, avatar component, 14+ slide builders, keyboard nav (~750 lines) |
| `worker.js` | Web Worker: streaming XML parser, SQLite iMessage parser, vCard / AddressBook contacts parser (names + photos), stats aggregation (~1090 lines) |
| `styles.css` | All styling. CSS custom properties for theming, no framework. Responsive breakpoint at 720px. |
| `vendor/sql-wasm.js` | Vendored sql.js (Emscripten-compiled SQLite → WASM), loaded by `worker.js` via `importScripts()` |
| `vendor/sql-wasm.wasm` | WASM binary for sql.js (~645 KB) |
| `test_parser.cjs` | Node.js smoke test for the XML/SMS path. Creates a vm sandbox and feeds a File-like stream |
| `test_imessage.cjs` | Node.js smoke test for the SQLite/iMessage path. Uses npm `sql.js` directly |
| `package.json` | Minimal manifest. `"type": "commonjs"` for the `.cjs` test scripts. No runtime deps |
| `.gitignore` | Ignores user PII (message exports, contacts exports), `node_modules/`, editor/OS cruft |

---

## Architecture

### Screen Flow

```
#landing ──(start btn)──→ #loading ──(worker done)──→ #story
                                                         │
  ↺ restart button ──────────────────────────────────────┘
```

`showScreen(id)` in `app.js:24` toggles the `.visible` CSS class which controls `opacity`/`pointer-events`.

### Upload → Parse Pipeline

1. **Two separate dropzones** on the landing page:
   - **Message data** (required): accepts `.xml`, `.db` — drag-and-drop or click to browse
   - **Contacts** (optional): accepts `.vcf`, `.abcddb` — separate dropzone with its own icon
2. Each dropzone validates files by extension + content-sniffing (magic bytes / text preamble)
3. Selected files are displayed as dismissible chips below the dropzones
4. The **"Generate My Wrap"** button only enables when a message data file is selected
5. On click, `startProcessing(mainFile, contactsFile)` fires:
   - Switches to `#loading` screen with progress bar + rotating tips
   - Creates `new Worker('worker.js')`
   - Posts `{ type: 'parse', file, contactsFile }` to the worker
   - Listens for `progress` and `done`/`error` messages
   - On `done`, calls `buildStory(stats)` to render slides, switches to `#story`

### Worker (worker.js)

The worker receives `{ type: 'parse', file, contactsFile }` via `self.onmessage` (`worker.js:298`). It detects format by sniffing the first 16 bytes:

- **SQLite path** (`parseSqlite()`): Loads `vendor/sql-wasm.js`, runs a JOIN query across `message`/`handle`/`chat_message_join`/`chat` tables. Iterates with `stmt.step()`, decodes `attributedBody` blobs (typedstream NSAttributedString), resolves Apple's nanosecond-since-2001 epoch.
- **XML path** (`parseFile()`): Uses `file.stream().pipeThrough(new TextDecoderStream())` for streaming line-by-line parsing. Bounded 256KB line buffer to survive multi-hundred-MB MMS base64 lines. Dispatches `<sms>` and `<mms>` elements via `indexOf`-based attribute extraction (no regex/DOMParser to avoid OOM).

If a contacts file is provided, it's parsed first via `parseVcard()` (vCard) or `parseAddressBookDb()` (Apple AddressBook SQLite tables). Each entry in the resulting `nameMap` is a `{name, photo}` object keyed by `p:<normalized-phone>` or `e:<lowercased-email>`. `lookupContactName()` / `lookupContactPhoto()` resolve either field during message processing.

`parseVcard()` extracts the `PHOTO` field in both vCard 3.0 form (`PHOTO;ENCODING=b;TYPE=JPEG:<base64>`, supporting folded multi-line payloads) and vCard 4.0 form (`PHOTO:data:image/...;base64,<base64>`), emitting a ready-to-use `data:` URL. `.abcddb` contacts currently carry names only (no photo blob extraction).

Stats output via `serialize()` includes: totals, sent/recv split, SMS/MMS/RC/iMessage breakdowns, hour histogram, day-of-week histogram, monthly chart, contact rankings (each with `photo`), group chat stats (with `participantPhotos[]` + `participantNames[]`), word/emoji frequencies, reactions, streaks, busiest day, longest message (with sender `photo`).

### Slideshow (app.js)

`makeSlides(stats)` (`app.js:415`) produces 11-14 slides. Each slide is a positioned `<div>` with `.slide-bg` decorations and gradient-background themes rotating through `PALETTES`. Navigation: arrow keys, prev/next buttons, or progress-bar dots. Animations use CSS transitions + keyframes triggered by `.slide.current`.

### Avatars (app.js)

The `avatar(entry, size)` helper (`app.js:386`) renders a circular avatar for any `{displayName|name|contact, photo}`-shaped object. If `photo` is a data URL it becomes the `background-image`; otherwise it falls back to a deterministic colorful-gradient monogram (hash-of-name → one of 12 palette gradients, initials-of-name in the middle). Sizes: `sm` / `md` / `lg` / `xl`. `avatarStack(entries, limit, size)` renders overlapping circles with a `+N` overflow chip (used for group participants).

Avatars are threaded through the slides that feature specific people: the `#1` contact hero, the top-contacts bar list, the group-chat slide, the "magnum opus" longest-message byline, and the final collage on the wrap card.

---

## Key Design Decisions

- **No regex/DOMParser for XML**: The parser avoids memory blowup on 10GB+ files by using `indexOf` scans and bounded buffers. Line length is capped at 256KB (MMS base64 images).
- **Streaming, not loading**: The worker uses the Streams API so parsing begins before the file is fully read. Progress updates report bytes processed / total size.
- **One worker, one-shot**: The worker is `terminate()`d after `done`. No reuse.
- **Apple AddressBook databases** (`.abcddb`) use per-contact `ZABCDRECORD` → `ZABCDPHONENUMBER`/`ZABCDEMAILADDRESS` join queries for contact resolution.
- **iMessage attributed bodies**: Typedstream decoding in `worker.js`; handles the bytecode-serialized `NSAttributedString` format stored in the `attributedBody` blob column.
- **Shortcodes filtered**: `topContacts` filtering in `serialize()` excludes common shortcode numbers.

---

## Development

### Prerequisites

- Node.js (for test scripts only; the app itself needs no Node)
- `npm install` (only installs `sql.js` for the test scripts)

### Running Tests

```bash
# XML/SMS path (needs a real sms-*.xml file):
node test_parser.cjs [path/to/sms-export.xml]

# iMessage/SQLite path (needs a real chat.db):
node test_imessage.cjs [path/to/chat.db]
```

Both tests run `worker.js` in a Node.js `vm` sandbox, mocking the browser APIs (`self`, `TextDecoderStream`, `ReadableStream`, `postMessage`, `importScripts`) so the production worker code can be tested without a browser.

### Testing in Browser

Open `index.html` locally. No server required — file:// works fine since everything is client-side and `worker.js` is a plain script loaded from the same directory.

### Code Conventions

- **Vanilla JS**: No frameworks, TypeScript, or bundlers. Use `document.createElement`, `classList`, etc.
- **`$` / `$$` helpers** for DOM queries: `$('#id')` = `querySelector`; `$$` = `querySelectorAll`
- **`el(tag, props, ...children)`** for programmatic DOM construction. `props` can include `class`, `style`, `onclick` (auto-bound), `html`.
- **CSS**: Custom properties in `:root` for theming. Class-based styling. No CSS-in-JS. Responsive at 720px breakpoint.
- **File naming**: Test scripts are `.cjs` (CommonJS). Everything else is plain `.js`.
- **No comments** in production code unless explaining a non-obvious optimization or format quirk.

### Before Committing

There is no linting or typechecking. Manually verify:
- All three screens work (landing → loading → story)
- Both dropzones accept the right file types
- Contact names resolve when a contacts file is provided
- Slides render correctly with sample data
- Test scripts pass: `node test_parser.cjs && node test_imessage.cjs`

### Adding a New Slide

1. Add a slide builder call in `makeSlides()` (`app.js:240`)
2. Use `slideShell(i++, 'label', ...children)` for the chrome; pick palette via the index
3. Add any new CSS classes to `styles.css` under `/* slide typography */`
4. Test that `slides.length` growth is accounted for (nav dots, goto bounds)
5. If the slide features a specific person, use `avatar(entry, size)` for the face so it gracefully falls back to a monogram when no vCard photo is available
