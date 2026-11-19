# dfCuts Audit & Verification Report

What this repo does: dfCuts prepares local PNG, JPEG, and WebP artwork for circular button pins, automates framing, color matching, copy counts, and sheet arrangement, and exports print-ready RGB/CMYK PDFs, raster sheets, individual circular pin PNGs, and 100%-scale calibration sheets. It preserves original artwork and edits in portable folders and runs offline on Windows 11 x64 with zero installation required.

## 1.0.0 Audit, Automation Upgrades & Reorganization (19 November 2026)

### Repository reorganization
- Moved application code, Electron main/preload, resources, tests, and build configuration under `source/`.
- Moved documentation and the final Rail + Shift logo pack under `docs/` (`docs/brand/`).
- Archived prior AI briefs, surface notes, inspiration assets, and 16 early logo concept explorations under `docs/archive/` without deleting project history.
- Updated `source/package.json` to target a zero-install Windows x64 portable executable (`dfCuts.exe`) published locally to the repository root (`source/scripts/publish-local-exe.mjs`) and automatically rebuilt and uploaded to the rolling `latest` GitHub Release on every push to `main` via `.github/workflows/release-exe.yml`.

### Canva-replacement workflow upgrades
- **Full-bleed framing & quick transforms:** Added `Bleed` fit mode (`fitImage(..., 'bleed')` covering `circles.outer`), `±90°` quick rotation buttons, horizontal/vertical flipping (`flipX` / `flipY`) with matching Konva preview, canvas export, and flipped-pixel-accurate eyedropper sampling, mouse-wheel zoom, and arrow-key nudging (`0.25 mm` / `1 mm` with `Shift`).
- **Batch import & clipboard:** Added drag-and-drop import for files and folders (`importPaths`), `Ctrl+V` clipboard image import via Electron's `ClipboardItem` API (`importClipboard`), and WebP support alongside PNG/JPG.
- **Undo / Redo & shortcuts:** Replaced single-step state with a 50-step coalescing `historyReducer` (`Ctrl+Z` / `Ctrl+Y` / `Ctrl+Shift+Z` and header buttons) preserving exact revision monotonicity for dirty-state tracking across divergent edits.
- **Library batch automation:** Added a batch action bar (`Fit all` Safe/Face/Fill/Bleed, `Match edges`, `Use current color`, `Copies all`, `Fill empty slots`), per-card quantity steppers, `< 200 PPI` print-resolution badges, and design duplication (`Duplicate`).
- **Calibration & export options:** Added **Individual pins (PNG)** export (`pin-XXXX-slug.png`), a **100% Scale Calibration Sheet PDF** generator (100 mm horizontal/vertical rulers + exact face/cut/safe target), optional **Cut crosshairs** (with reserved 1.5 mm tick margin in `buildSheetPlan`), optional **bottom-margin job label**, low-PPI preflight warning, interactive click-to-select on `SheetPreview`, 7 starter pin size presets + preset deletion, recent projects persistence, last-folder memory, 1-click **Open folder / Open file** actions on completed export notices, and an in-app **Shortcuts & About** tab in Help.
- **Brand integration:** Updated `CutMark` and `source/resources/icon.*` (`16`–`256` px multi-frame ICO + PNG) to the official dfCuts Rail mark.

### Codebase defects caught and fixed during audit
1. **Electron 45 Clipboard API change:** Replaced deprecated `clipboard.readImage()` with Electron 45's async `clipboard.read()` / `ClipboardItem.getType()` API, normalizing non-PNG/JPG/WebP clipboard images cleanly via `sharp`.
2. **Konva negative-scale Transformer guard:** Instead of mutating `KonvaImage` with negative `scaleX`/`scaleY` (which conflicts with `Transformer` `flipEnabled={false}`), mirrored artwork renders via a memoized offscreen canvas while `Editor.tsx` keeps positive `Transformer` bounds and inverse-maps `flipX`/`flipY` cleanly in eyedropper sampling and `canvas.ts` export.
3. **Narrow-screen icon visibility & Library grid row height:** Fixed `@media (max-width: 600px)` so header Undo/Redo icon buttons stay visible while labeled text buttons hide icons cleanly, kept `44 × 44 px` coarse-pointer targets across all header/toolbar buttons, and updated `.design-list` `grid-auto-rows` to `minmax(252px, auto)` so card steppers and `< 200 PPI` badges never clip.
4. **History revision collision prevention:** `historyReducer` uses a strictly monotonic `nextRevision` counter so undoing and branching forward never collides with a previously saved `savedRevision`.

### Observed Verification Results (19 November 2026)
- `npm run typecheck`: exited 0.
- `npm test` (Vitest): **4 test files, 29 tests passed** (`src/core/alignment.test.ts` 4, `src/state/project.test.ts` 3, `src/core/core.test.ts` 17, `electron/files.test.ts` 5).
- `npm run build` (`electron-vite build`): exited 0.
- `npm run test:dev`: passed (development React refresh + strict production CSP).
- `npm run test:desktop` (`scripts/smoke.mjs`): passed (all 36 checks including tutorial, focus isolation, layouts, zoom, touch targets, portable save/open/relink, RGB PDF, Ghostscript CMYK PDF, PNG/JPG DPI metadata, and cancellation cleanup).
- `npm run test:alignment` (`scripts/alignment-check.mjs`): passed (19 checks).
- `npm run test:eyedropper` (`scripts/eyedropper-check.mjs`): passed (12 checks).
- `npm run test:close` (`scripts/close-check.mjs`): passed (7 scenarios).
- `npm run test:color-picker` (`scripts/color-picker-check.mjs`): passed.
- `npm run test:features` (`scripts/features-check.mjs`): passed (10 checks: About/Shortcuts tab, WebP + folder import, Bleed framing, Flip H + flipped-pixel eyedropper, Ctrl+Z/Y undo/redo, Duplicate + batch Fit/Copies/Fill-sheet, interactive Sheet Preview click-to-select, Individual Pin PNG export, 100% Calibration Sheet PDF, and Recent Projects).
- `npm run dist`: built `dfCuts.exe` (`134.81 MB`, SHA-256 `8e1ef67873232d5c5c77061ea2a0e3915c97fcaa8948fd2f3c27465f340182e9`) at the repository root.
- Packaged binary verification: `scripts/smoke.mjs` and `scripts/features-check.mjs` both passed against `source/release/win-unpacked/dfCuts.exe` with bundled Ghostscript CMYK and native `sharp`.

### Remaining External Checks (Physical & Clean Machine)
Not verified in automated local checks: running `dfCuts.exe` on a clean Windows 11 machine without Visual C++ Runtime preinstalled (if CMYK Ghostscript fails on a bare VM lacking VC++ redistributable, install Microsoft VC++ x64 Redistributable or use `npm run dist:installer`); code signing (current executable is unsigned); physical printer scaling/borderless expansion against a printed calibration sheet; actual button-press die cut diameters other than the confirmed 44 mm face / 53 mm cut pair; and shop-specific printer ICC profile accuracy.
