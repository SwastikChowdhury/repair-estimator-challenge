# Spark Homes — Repair Estimator

A mobile-first, **offline** repair-cost estimator for a house-flipping acquisition team.

Walk a property room by room, tap the repairs it needs, watch the total update live, snap condition photos, and export a styled Excel workbook + photos as a single ZIP — all from a phone, with no connection required.

Built as a single self-contained `index.html`.

> **Live demo:** https://swastikchowdhury.github.io/repair-estimator-challenge/

---

## Quick start

```bash
python3 -m http.server 8000   # from the repo root
# open http://localhost:8000/
```

Any static server works (`npx serve`, `php -S localhost:8000`, …). Opening `index.html` over `file://` runs the app but skips the service worker — use a local server or HTTPS to test offline install.

Deploys to **GitHub Pages** as-is: every path is relative, so it works from a project subpath (`https://user.github.io/repo/`) with no configuration.

---

## Highlights

| Area | What you get |
| --- | --- |
| **Projects** | Create / rename / delete / switch. Each is fully isolated and autosaves; the app reopens to your last one. |
| **Walkthrough** | Rooms → collapsible groups → line items with check, quantity, and live totals. "No action needed" per group. |
| **Pricing** | All 108 catalog items by id. Per-item overrides, editable global defaults, CSV re-upload, custom items, hide/restore. |
| **Photos** | Project-level and per-equipment. Auto-compressed on capture, thumbnail grid with delete, storage meter + quota warnings. |
| **Export** | Styled `.xlsx` + a `/photos` folder, bundled as one `.zip`. Fully offline. |
| **PWA** | Installable, cache-first service worker, works in airplane mode. |

### Walkthrough Intelligence (the creative addition)

- **Quantity pre-fill** — suggests starting quantities from square footage (flooring, paint, trim, roof, attic), shown as editable *suggested* badges. Never auto-checks anything.
- **Equipment age flags** — install-year fields on furnace, condenser, water heater, and roof flag anything near end of life, with a one-tap "Add to estimate".
- **Deal Guard** — enter an ARV to see max offer (70% rule), projected margin, and a confidence range that tightens as you review the house. Warns before export if big-ticket systems are still unreviewed.

> **First launch** seeds a populated demo, *"742 Maple St — Demo"*, so the first screen shows every feature at once.

---

## Testing offline (device checklist)

1. Load the app once so the service worker precaches everything.
2. iOS Safari → Share → **Add to Home Screen**.
3. **Airplane mode** → run a full walkthrough → **export a ZIP**.
4. Kill and reopen — data persists.

> **iOS note (not a bug):** an installed PWA has a *separate* `localStorage` from Safari, and iOS caps it at ~5 MB — hence photo compression and visible quota handling.

---

## Architecture

The entire runtime lives in `index.html`, split into labelled sections:

| Section | Responsibility |
| --- | --- |
| `DATA` | 108-item catalog (verbatim), room/group config, lifespan tables |
| `STATE` / `STORAGE` | App state + debounced localStorage (saves on `visibilitychange`/`pagehide`) |
| `MATH` | Pure functions for every calculation — no math in templates |
| `MODEL` | Project + room CRUD on the unified room-instance model |
| `RENDER` / `EVENTS` | Template rendering + one delegated `data-action` listener |
| `PHOTOS` · `DEAL GUARD` · `EXPORT` · `PWA` | Feature modules |

**Three decisions worth knowing:**

- **Unified room-instance model.** A room is just `{ id, type, label }`; selections are keyed `roomId:itemId`, so the same item can appear in many rooms without colliding. No room type is special-cased.
- **One price function.** `unitCostOverride ?? globalPriceOverride ?? catalog default` — global edits apply live; exports snapshot prices at export time.
- **Protected hot path.** Typing a quantity never triggers a full re-render (which would blur the input on mobile); only the affected totals update via targeted DOM writes.

### Files

```
index.html            the entire app (HTML + CSS + JS inline)
sw.js                 cache-first, versioned service worker
manifest.json         PWA manifest (relative start_url / scope)
icons/                app icons (180, 192, 512) + Spark brand marks
fonts/                GFS Neohellenic (vendored .woff2)
vendor/               ExcelJS + JSZip (loaded via relative <script>)
vendor-ocr/           Tesseract.js engine + eng data (lazy, not precached)
data/repair-items.js  source of record for the 108-item catalog
```

---

## Libraries

All libraries are **vendored locally** and loaded with relative `<script>` tags — never a CDN — so the app works offline and the service worker can cache them.

- **ExcelJS 4.4.0** — builds the styled workbook
- **JSZip 3.10.1** — bundles the workbook + photos
- **Tesseract.js** — on-device OCR for serial-number scanning (see below)

The **GFS Neohellenic** font is vendored in `fonts/` (two `.woff2` weights, `font-display: swap`) and precached.

### Serial-number OCR (offline, lazy)

Equipment and kitchen appliances have a **Serial #** field. From an item's Photos sheet you can tap **Scan serial #** on any photo to read the number with on-device OCR.

The Tesseract engine and language data live in `vendor-ocr/` (~30 MB) and are **not** precached, so installs stay fast — nothing loads until the first scan. After that first scan the service worker's runtime cache stores those files, so scanning works offline thereafter. Results are accuracy-gated and always shown for you to verify, never inserted silently.

---

## Where each rubric criterion lives

A reviewer's map. It's one file (`index.html`), so **Jump to** gives the exact string to `Cmd+F` — every banner comment (`/* MATH … */`) and function name below is real. **Prove it in ~15s** is a live check, no code-reading required.

| Criterion | What it means here | Jump to (`Cmd+F`) | Prove it in ~15s |
| --- | --- | --- | --- |
| **Mobile UX** (30%) | Safe-area insets on fixed header/footer, ≥44px targets, 16px+ no-zoom number inputs, always-visible sticky total, bottom-sheet modals | `viewport-fit=cover`, `env(safe-area-inset`, `DESIGN TOKENS` | In an iPhone device frame: total stays pinned while scrolling, tapping a qty field doesn't zoom, everything is thumb-reachable |
| **Feature Completeness** (25%) | Projects (isolated + autosaving), room instances → groups → all 108 items, per-item + global price overrides, custom items, photos, settings, ZIP export | `PROJECT + ROOM MODEL`, `RENDER —`, `EXPORT —` | Add a "Bathroom 2", check a few items, tap a unit cost to override it, then export — you get a `.zip` with a styled `.xlsx` |
| **Code Quality** (20%) | Labelled section banners, all math in pure functions (none in templates), one delegated click handler via `data-action`, all user text escaped | `MATH —`, `EVENTS —`, `function esc(` | Skim the banner comments top-to-bottom — the file reads as a table of contents; every button routes through the single `document.body` click listener |
| **PWA & Offline** (15%) | Versioned cache-first service worker, fully relative manifest/scope (works from a Pages subpath), iOS meta tags, export runs client-side | `sw.js`, `manifest.json`, `PWA —` | Load once, switch to airplane mode, run a walkthrough and export a ZIP — no network needed |
| **Creative Addition** (10%) | *Walkthrough Intelligence*: sqft-based quantity pre-fill, equipment age flags, Deal Guard (70% rule + margin) with a pre-export warning on unreviewed big-ticket systems | `suggestedQty`, `ageFlag`, `dealGuard` | New project with sqft → *suggested* qty badges; set an old furnace year → end-of-life flag; set an ARV → live Deal Guard panel |

