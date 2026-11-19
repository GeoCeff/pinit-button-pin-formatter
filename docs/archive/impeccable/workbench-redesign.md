# dfCuts workbench review

2 November 2026. Scope: renderer, app/window identity, SVG icon resources and the acceptance checks affected by navigation. Branch: feat/dfcuts-workbench. No new runtime dependencies.

Direction: Achromatic ledger, seed 350303977; no redraw. User-requested minimalist app treatment takes precedence over marketing hero, photography and scroll-pinning patterns. Existing Geist stays local. The UI/UX search's unrelated violet marketing direction was rejected; controlled-input guidance was applied to the existing forms.

Figma MCP was opened and used to create editable Artwork desktop, Sheet setup, Library, Compact desktop and Export designs: https://www.figma.com/design/Fqz8RTVxXUga49GEgC92R1. Geometry and text are editable, rather than screenshots pasted as controls. The Figma screens are design studies, not an exact source synchronization.

## Resolved polish and typography findings

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| MEDIUM | src/ui/styles.css:52; src/ui/App.tsx:135 | Separate rounded panes, blue accents and magnifying dock competed with the artwork. | Continuous workbench with flat panes, stable labeled navigation and charcoal actions. | Surface hierarchy: selection, editing and print output become distinct, steady work areas. |
| MEDIUM | src/ui/WorkbenchNavigation.tsx:9 | Pointer magnification and variable visual button size. | Short underline feedback; keyboard/reduced-motion updates immediate; Arrow/Home/End navigation retained. | Stable targets make frequent navigation predictable. |
| MEDIUM | src/ui/styles.css:474; src/ui/Settings.tsx:19 | Two-column setup with less direct explanation of face/cut geometry. | Three functional columns on wide windows, responsive reflow and an actual-ratio SVG diagram. | Proximity and meaning: dimensions, paper and arrangement have clear groups. |
| MEDIUM | src/ui/App.tsx:168; src/ui/styles.css:193 | Summary values preceded their labels. | Labels sit above large tabular totals; current/total sheet navigation remains readable. | Numeric hierarchy reduces interpretation before printing. |
| HIGH (resolved) | src/ui/styles.css:470 | Phone tray exposed half of the second artwork name against the viewport edge. | One complete full-width card per scroll position with scroll snapping; full-name tooltip retained. | Wrapping/truncation: readable names at 320/390px. |
| LOW | src/ui/CutGeometry.tsx:3; resources/icon.svg:1 | Brand and empty-state shapes used separate visual treatments. | Shared SVG cut/face/crop geometry, with regenerated PNG/ICO app resources. | Consistency comes from the physical print workflow. |

No unresolved high-severity findings in the inspected UI scope.

## Render critique

ROUND 1
Seen in one second: the circular artwork, followed by the printed sheet.
Idea (one sentence): a quiet print workbench organized around the artwork's physical cut boundary.
Live thing: actual drag/resize positioning and a computed sheet preview.
Layout words by section: document=toolbar / navigation=line / artwork=list / editor=canvas / output=paper.
Scores: design 6.5 · usability 7 · creativity 7 · content 8 → overall 6.9.
Caps applied: design 6.5 under the supplied rubric's four-photograph criterion; this offline editor intentionally has source artwork, not promotional photography.
Top three problems (most visible first), each with the screenshot it shows in and the fix:
1. Desktop top-right copy count sat too close to the edge (desktop-fold.jpg): increase navigation inset to 24px.
2. Phone outer text margin was too tight (mobile-fold.jpg): increase outer padding to 16px.
3. Wide setup grouping was compressed (sheet-settings.png): use pin/paper/arrangement columns and keep reusable presets beneath dimensions.

ROUND 2
Seen in one second: the selected artwork in its cut circle.
Idea (one sentence): same continuous workbench, with quieter framing.
Live thing: stable document navigation and physical preview.
Layout words by section: document=toolbar / navigation=line / artwork=tray / editor=canvas / output=paper.
Scores: design 6.5 · usability 7.5 · creativity 7 · content 8 → overall 7.1.
Caps applied: same design cap; no marketing imagery added.
Top three problems (most visible first), each with the screenshot it shows in and the fix:
1. The second phone artwork name was partly exposed at the tray edge (mobile-fold.jpg): use full-width scroll-snapped cards.
2. No second independent visible defect identified after the margin fixes.
3. No third independent visible defect identified.

ROUND 3 — final
Seen in one second: the circular artwork on desktop; import and the selected artwork card on phone.
Idea (one sentence): a restrained work surface for turning original artwork into measured print sheets.
Live thing: direct editing, tab underline, numeric controls and computed sheet pagination.
Layout words by section: document=toolbar / navigation=line / artwork=list-or-tray / editor=canvas / settings=columns / library=gallery / export=form / output=paper.
Scores: design 6.5 · usability 8 · creativity 7 · content 8 → overall 7.2.
Caps applied: same photograph-based design cap. Structural pane separators and selection affordances belong to the functional app. No decorative hairlines or resting panel shadows. Under 7.5 overall by this rubric; not rounded up.
Top three problems (most visible first), each with the screenshot it shows in and the fix:
1. The phone fallback has a tall header before its canvas (mobile-fold.jpg); this preserves labeled file controls, title editing and 44px touch targets. Desktop is the supported native target; no further compression made.
2. The transient import notice temporarily covers the lower-right preview (desktop-fold.jpg/mobile-page-01.jpg); it is dismissible, pauses on interaction and expires after six seconds. Export destinations and errors deliberately persist.
3. No third actionable visible defect identified. The photo criterion remains unsuitable for this functional editor; customer artwork remains unmodified.

## Verification and limits

- Production build and TypeScript check passed. Unit/file suite: 23 tests across three files passed. Deleted the unused dock implementation, layout helper and its two obsolete tests.
- Full Electron acceptance passed with the actual preload/native bridge: import, quantities, invalid dimensions, custom paper/orientation, portable save/open, legacy folder name, missing source/relink, confirmed removal, RGB and CMYK PDF, PNG/JPG dimensions/density, cancellation and cleanup. Native modal isolation/focus restoration, keyboard and reduced motion also passed. Preset controls were inspected visually; a complete preset save/reapply interaction was not rerun.
- Real pointer alignment suite passed: independent-axis snap, Alt bypass, rotated proportional resize, centering preserves size/rotation, eyedropper, saved geometry, minimum window and no editing overlays in exports.
- Native minimum 1080 x 720: cut circle 318.0784 CSS pixels. Coarse-pointer navigation targets >=44px, 320px complete artwork card and 200% zoom assertions passed.
- Final browser inspector: 0 FAIL, 1 WARN at 1440/768/390. All six final fold/page screenshots opened. The temporary browser bridge injects synthetic Garden club/Slow mornings fixtures; actual Electron checks cover native behavior. Temporary harness, screenshots and generated reports are ignored.
- Palette-cream allowance is explicit: warm paper is the chosen minimalist direction. Remaining colour-sprawl warning (13%) is source artwork in the canvas/preview, not colored interface chrome. Do not desaturate user artwork to satisfy a heuristic.
- Source lint: 0 FAIL, 5 WARN. Editor.tsx:46 pads RGB hex bytes, not numbered labels. Shadows are native dialogs/notices/progress overlays and the selected fit segment, not resting panels.
- SVG brand, empty geometry, ratio diagram, all five Figma frames, desktop/compact/320px/zoomed views, settings, artwork adjustments, Library, tutorial and export dialogs inspected.
- Synthetic sample artwork is local test data, not shipped customer content. No stock photographs, clips, remote fonts or generated bitmap UI were added.
- Not verified: physical touch hardware, manual screen-reader pass, animation playback at 10% speed, physical printer calibration, fresh-machine installer acceptance.

Approve — limited to the inspected implementation and automated workflow coverage above.
