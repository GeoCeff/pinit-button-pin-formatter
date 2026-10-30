# Print studio refresh - 29 October 2026

Scope: Implement the requested frontend revamp using UI/UX Pro Max, Emil Design Engineering, Better UI, Better Typography and Find Skills. The latest refinement removes the hard-to-read footer instructions and simplifies the print summary. Work is on `feat/print-studio-redesign`.

Source authority: `src/ui/styles.css`, `src/ui/quick-start.css`, `src/ui/App.tsx`, `src/ui/Workspace.tsx`, `src/ui/Editor.tsx` and `DESIGN.md`.

## Resolved review

| Principle / severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| Readability / Medium | src/ui/App.tsx; src/ui/styles.css | Tiny sheet captions and compressed layout prose | 14px summary labels, 28-32px values, a readable page counter and two short detail rows | The operator can scan totals without reading a dense footnote. |
| Focus / Medium | src/ui/App.tsx; src/ui/QuickStart.tsx | Persistent drag/resize/Alt instructions across the canvas footer | Guide toggles remain; gestures are explained in Help and accessible editor instructions | Remove repeated visual noise while keeping guidance available. |
| Composition / Medium | src/ui/Workspace.tsx; src/ui/styles.css | Artwork tray competes with navigation at the bottom | Artwork rail on wide desktops, a compact tray below the canvas, toolbar above the editor | Separate artwork selection, editing and output while preserving canvas space. |
| Responsive text / High, resolved | src/ui/styles.css | Small inputs at narrow/zoomed layouts and partial cards at 320px | 16px narrow inputs, wider adjustments and a two-row narrow artwork tray | Keep normal values and a complete artwork card readable. |
| Stable interaction / High, resolved | src/ui/styles.css | Feedback height changes could shift the canvas during snapping | Alignment toolbar reserves its height for centered, partial and off-center states | Pointer coordinates stay consistent during drag and resize. |
| Motion / Medium | src/ui/styles.css; src/ui/quick-start.css | State entrances use keyframes and generic transition suppression | Interruptible transitions, 0.96 pointer press, instant keyboard actions and opacity-only reduced motion | Keep repeated actions immediate and optional motion controlled. |
| Correct counts / Medium | src/ui/App.tsx | Per-sheet summary displays capacity even when a cap is set | Summary displays the effective per-sheet count | The preview describes the selected print job. |

## Verification

- All 25 unit/file tests pass.
- TypeScript checking and production build pass.
- Desktop acceptance covers import, edits, copies, capped counts, portable save/open, missing-image recovery, RGB/CMYK PDF, PNG/JPG metadata, cancellation and failure cleanup.
- Responsive acceptance covers the wide rail, compact tray, 200% application zoom and a full artwork card at a 320px viewport. The native minimum cut circle measured 304.92 CSS pixels.
- Pointer acceptance covers independent axes, Alt bypass, rotated proportional resize, center action and saved geometry. Editing overlays remain absent from exported output.
- Keyboard and reduced-motion paths are checked in the app. Summary labels and the page counter have measured text floors.
- Text and control contrast were calculated from the shipped colors; ratios are recorded in DESIGN.md.

One desktop run hit a temporary image-decoder allocation failure. A subsequent complete run succeeded without changing import or image-processing code.

Not verified: physical touch hardware, 10% DevTools animation playback, printer/color calibration or a fresh-machine installer run. The target remains an offline Windows desktop app with a defensive narrow layout.

## Header refinement

| Principle / severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| Hierarchy / Medium | src/ui/styles.css | Small inline brand descriptor and 16px project title | Stacked brand lockup, separator, 18px desktop title and 13px status badge | Separate product identity from the active document. |
| Focus visibility / High, resolved | src/ui/styles.css; scripts/smoke.mjs | The taller title/status stack leaves insufficient compact focus clearance | Compact title/status spacing reserves the full outline and offset within the existing header height | Keep keyboard editing visible at the native minimum window. |

Header verification includes the production build, desktop workflow, long titles, compact focus-ring clearance, 200% zoom and 320px fallback. Status contrast is 6.01:1 for unsaved, 5.91:1 for saved and 4.62:1 for local/working. The screenshot is captured directly from the application in `.impeccable/review/header-refined.png`.

Approve - no open high-severity findings in the inspected scope.

## Document toolbar redesign - 30 October 2026

The user requested a structural redesign of the brand, document title and save feedback. This supersedes the stacked header refinement above.

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| Medium | src/ui/App.tsx:122; src/ui/styles.css:54 | Large stacked lockup, descriptor and tall separator occupy a sidebar-width column | Natural-width brand with a 28px mark and 18px wordmark, in a 64px desktop toolbar | Give the current document more space and remove redundant ornament. |
| Medium | src/ui/App.tsx:123; src/ui/styles.css:60 | Project title sits over an amber status badge | 16px editable title with a pencil cue; plain 13px status lives with file actions | Separate document identity from persistence feedback and keep one desktop reading line. |
| High, resolved | src/ui/styles.css:357; scripts/smoke.mjs:97 | Compact stacks risk crowding the title and its focus ring | A single row at native desktop sizes; full-width title and deliberate action rows below 850px | Preserve readable titles, editing and full keyboard focus at compact sizes and zoom. |

Verified: TypeScript and production build, full Electron desktop acceptance, title editing, long-title tooltip, compact focus clearance, title/status baseline alignment, natural-width brand, 320px fallback, 200% application zoom, emulated coarse-pointer header targets of at least 44px, keyboard and reduced-motion paths, save/open/relink and all export formats. The native minimum cut circle remains 304.92 CSS pixels. Captured and inspected `header-document-toolbar.png` and `narrow-320.png` directly from the app. No animation or dependency was added.

Calculated contrast on the header background: title 12.82:1, ordinary save feedback 4.97:1, saved feedback 5.97:1. The narrow title field boundary is 3.28:1 against white. Font sizes use rem, line heights are unitless, all small text weights are at least 400, and title truncation retains the full-value tooltip and native editable value.

Not verified: physical touch hardware, screen-reader speech output or 10% DevTools animation playback. This change adds no motion; the app supports a light theme only.

Approve - no open high-severity findings in the inspected header scope.

## Workspace polish - 30 October 2026

Scope: make frequent editing controls easier to reach and reduce visual clutter while preserving the current print-studio design, dock behavior and physical geometry.

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| Medium | src/ui/App.tsx:145; src/ui/Workspace.tsx:48 | Quantities are hidden inside Adjust artwork | Copies uses the shared numeric field beside the artwork title | Change the main order value without opening another panel; fractional input still shows an inline error and blocks export. |
| Low | src/ui/Workspace.tsx:18; src/ui/styles.css:91 | Extra collection eyebrow, cropped thumbnails and boxed rows compete for attention | Simple heading, contained square thumbnails and restrained selection | Keep the source recognizable and make the active design easy to scan. |
| Low | src/ui/Workspace.tsx:26; src/ui/styles.css:99 | An inline selection check consumes artwork-name width | Check shares the quantity row; truncated quantities retain a full tooltip | Selecting artwork does not shorten its title. |
| Medium | src/ui/App.tsx:163; src/ui/styles.css:191 | Preview header contains a decorative icon | Setup opens sheet settings directly; the paper well gives the sheet more room | Make paper settings discoverable where the operator checks output. |
| Low | src/ui/styles.css:232 | All paired drawer labels reserve 36px even when they fit one line | Natural label heights with aligned input bottoms | Width, rotation, offsets, background and source quality fit without the former dead space. |

Verification: production build and TypeScript; Electron import/edit/save/open/relink and RGB/CMYK/PDF/PNG/JPG export workflow; inline fractional-copy error recovery; editing Copies with adjustments closed; preview Setup action; wide, compact, 200% zoom and 320px layouts; emulated 44px quick-control targets; keyboard and reduced motion. The compact cut circle remains 304.92 CSS pixels. Real drag/resize/center/Alt checks pass and editing overlays stay absent from exported artwork. Desktop, compact, adjustments, gallery and narrow captures were visually inspected.

The mechanical scan returned advisory design-token/documentation mismatches only, including existing 13px/16px text roles, black image outlines and existing color variants. Current DESIGN.md and source remain the authority; the older generated design sidecar was not refreshed as an unrelated repair.

Not verified: physical touch hardware, screen-reader speech, real print calibration or a fresh-machine installer. No new dependency, font or animation was introduced.

Approve - no open high-severity findings in the inspected workspace scope.
