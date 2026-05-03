# AGENTS.md

> **⚠️ IMPORTANT:** Whenever you finish working on this codebase, update this file so it reflects the current state of the project. This applies to every agent session — edit AGENTS.md as your final step before reporting done.

## Project Overview

**textstat** is a 100% client-side browser app that produces a Spotify-Wrapped-style slideshow from your SMS/iMessage history. Users drop in either a [SMS Backup & Restore](https://www.smsbackupandrestore.com/) XML export or a macOS `chat.db` (the Messages SQLite database), and the app parses everything locally — no data leaves the device.

- **Repo:** [`https://github.com/benmross/textstat`](https://github.com/benmross/textstat) (private)
- **Frontend:** Next.js 16 (App Router) with TypeScript, Tailwind CSS v4, shadcn/ui v4, and Framer Motion
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
| `src/components/story/slides/*.tsx` | 16 individual slide components |
| `src/components/shared/Avatar.tsx` | Circular avatar with photo/fallback monogram (deterministic gradient based on name hash) |
| `src/components/shared/Pill.tsx` | Pill/badge component |
| `src/components/shared/AnimatedBackground.tsx` | Floating blob background (Framer Motion drift animation) |
| `src/components/shared/GlowBorder.tsx` | Glassmorphism glow border wrapper utility |
| `src/lib/utils.ts` | shadcn `cn()` utility (clsx + tailwind-merge) |
| `src/lib/formatting.ts` | Date/number formatting, constants (DOW_NAMES, MONTH_NAMES, etc.) |
| `src/lib/avatars.ts` | Avatar gradient palette, initials extraction, string hashing |
| `src/lib/palettes.ts` | Slide color palette definitions |
| `src/types/stats.ts` | TypeScript types for parsed stats data |

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
| `public/worker.js` | Web Worker — streaming XML parser, SQLite iMessage parser, vCard/AddressBook contacts parser, stats aggregation (~1090 lines) |
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
| `package.json` | Combined manifest — Next.js deps + test scripts |

---

## Architecture

### Screen Flow

```
Landing → PlatformPicker (iPhone/Android cards)
  ↓
PlatformGuide (steps + dropzones)
  ↓
[Generate My Wrap] → LoadingScreen (progress + tips)
  ↓
Slideshow (14-16 slides with keyboard nav)
  ↓
[↺ start over] → Page reload
```

Screen transitions use Framer Motion `AnimatePresence` with opacity fade.

### Upload → Parse Pipeline

1. **Two separate dropzones** on the platform guide:
   - **Message data** (required): accepts `.xml`, `.db` — click or drag-and-drop
   - **Contacts** (optional): accepts `.vcf`, `.abcddb` — separate dropzone
2. Files validated by extension + content-sniffing (magic bytes)
3. Selected files shown as dismissible chips below dropzones
4. "Generate My Wrap" button only enables when message file is selected
5. On click, `new Worker('/worker.js')` spins up, switches to loading screen
6. Worker parses everything, posts `progress` and `done`/`error` messages
7. On `done`, renders Slideshow with stats, switches to story screen

### Worker (worker.js)

Format detection by sniffing first 16 bytes:
- **SQLite path** (`parseSqlite()`): loads `public/vendor/sql-wasm.js` via `importScripts()`, runs JOIN queries across `message`/`handle`/`chat` tables
- **XML path** (`parseFile()`): streaming line-by-line with 256KB line buffer cap, `indexOf`-based attribute extraction

Contacts parsing: vCard (`parseVcard()`) or AddressBook `.abcddb` (`parseAddressBookDb()`). Photo extraction from vCard PHOTO field with vCard 3.0/4.0 support, emitting data URLs.

### Slideshow

`Slideshow.tsx` builds an array of slide configs with conditional rendering (some slides only show based on available data). Each slide gets a rotating palette from `PALETTES[]`. Navigation: arrow keys, prev/next buttons, progress-bar dots. Framer Motion handles slide transitions.

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

### Running Tests (legacy)

```bash
node test_parser.cjs [path/to/sms-export.xml]
node test_imessage.cjs [path/to/chat.db]
```

### Code Conventions

- **`"use client"`** on all components (app is fully client-side)
- **`cn()`** from `@/lib/utils` for className merging
- **Tailwind-only** — no separate CSS files beyond `globals.css` (which handles theme variables)
- **TypeScript** throughout — `@/types/stats.ts` for data shapes
- **Component organization**: `components/landing/`, `components/loading/`, `components/story/`, `components/shared/`

### Before Committing

1. Run `npm run build` to check TypeScript + build
2. Run `npm run lint` to check ESLint
3. Verify all three screens work (landing → loading → story)
4. Verify both iPhone and Android wizard paths
5. Verify dropzones accept correct file types
6. If `worker.js` or `vendor/` change, sync `vendor/` → `public/vendor/` and `worker.js` → `public/worker.js`

### Adding a New Slide

1. Create a new component in `src/components/story/slides/`
2. Accept `stats`, `palette`, `isCurrent` props
3. Register in the `slidesConfig` array in `Slideshow.tsx`
4. Optionally add a `condition` function if the slide is conditional
5. Navigation dots auto-update based on filtered array length
