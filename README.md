# Spark Homes — Repair Estimator

Mobile-first, **offline** repair-cost estimator for acquisition walkthroughs: tap repairs room by room, watch the total live, snap photos, export a styled Excel + photos as one ZIP — all from a phone, no connection required.

**Live app:** https://swastikchowdhury.github.io/repair-estimator-challenge/

---

## Run it locally

**No server or dependencies required** — open `index.html` directly in a browser and the full app runs. (Over `file://` the service worker is skipped — browsers require a secure context — so offline install can't be tested that way.)

To test **PWA / offline** behavior, use any static server:

```bash
python3 -m http.server 8000   # from repo root → http://localhost:8000/
```

Deploys to GitHub Pages as-is: every path is relative, so it works from a project subpath with no configuration.

## Approach

Everything runs in a single `index.html` (vanilla JS/CSS, no build step), organized into labelled sections — DATA / MATH / MODEL / RENDER / EVENTS / PHOTOS / DEAL GUARD / EXPORT. The decisions that shaped it:

- **Unified room-instance model.** A room is just `{ id, type, label }`; selections are keyed `roomId:itemId`. Every room type — Kitchen, Bathroom 2, Bedroom 3 — flows through one code path, so adding/removing rooms is trivial and nothing is special-cased.
- **One price function.** Per-project override → global override → catalog default. Global edits roll out live across projects; exports snapshot prices at export time.
- **Protected hot path.** Typing a quantity never triggers a re-render (which would blur the input mid-walkthrough); only the affected totals update via targeted DOM writes.
- **Offline-first by construction.** All assets vendored and precached by a versioned cache-first service worker; the ~30 MB OCR engine is deliberately *not* precached — it lazy-loads on the first "Scan serial #" tap (network needed once), then works offline via the runtime cache.
- **Creative addition — Walkthrough Intelligence:** sqft-based quantity suggestions for unit-conversion items (roof, attic, trim — badged, editable, never auto-checked), equipment age flags with one-tap add, and Deal Guard (ARV → max offer via the 70% rule, an estimate range that narrows as groups get reviewed, and a pre-export warning if big-ticket systems are unreviewed). Details in the PDF writeup.

First launch seeds a populated demo project (*742 Maple St — Demo*) so the first screen shows every feature.

## Libraries (all vendored locally — no CDN)

- **ExcelJS 4.4.0** — styled workbook export
- **JSZip 3.10.1** — ZIP bundling (workbook + photos)
- **Tesseract.js 7.0.0** — on-device serial-number OCR (lazy-loaded)
- **GFS Neohellenic** — UI font, vendored `.woff2`, precached

## Notes for testing

### Testing offline

**iOS (Safari):**
1. Open the app in Safari → Share → **Add to Home Screen**.
2. Launch the installed app once **while online** — iOS gives installed PWAs separate storage from Safari, so this first launch registers its own service worker and caches everything (~10s).
3. Enable **airplane mode** → walkthrough → **export ZIP**.
4. Kill and reopen — data persists.

**Android (Chrome):**
1. Open the app in Chrome → menu → **Install app** (or "Add to Home screen").
2. Launch the installed app once **while online** (same reason as iOS).
3. Enable **airplane mode** → walkthrough → **export ZIP**.
4. Kill and reopen — data persists.

- iOS: an installed PWA has *separate* localStorage from Safari (not a bug), capped ~5 MB — hence photo compression and the storage meter in Settings.
- Serial OCR: results are confidence-gated and always shown for you to verify — the app refuses to guess rather than insert a wrong serial silently.

## Reviewer shortcuts

One file — `Cmd+F` these to jump straight to the implementation: `DESIGN TOKENS` (mobile UX), `PROJECT + ROOM MODEL` (rooms), `MATH —` (pure calculation functions), `suggestedQty` / `ageFlag` / `dealGuard` (creative addition), `EXPORT —` (Excel/ZIP), and `sw.js` for the offline story. Fast proof: add a Bathroom 2, override a unit cost, set a 2005 furnace year (age flag fires), then export in airplane mode.