# dfCuts print workbench

Updated for dfCuts 1.0.0. The UI source under `source/src/ui/` defines exact states. Archived briefs and earlier snapshots live in `docs/archive/`.

## Direction

Achromatic ledger, direction seed 350303977: a continuous, warm-neutral workspace for preparing real print jobs. Artwork selection, positioning and printed output each have a clear place. Customer artwork provides expressive color. Keep decoration tied to the work: the official Rail (`F+C`) cut mark, circular face/cut/safe boundaries, registration crosshairs and measurement diagrams.

Editable [Figma designs](https://www.figma.com/design/Fqz8RTVxXUga49GEgC92R1): Artwork desktop, Sheet setup, Library, Compact desktop and Export. These are editable design studies; the app renders actual artwork and computed layouts.

## Color and surfaces

| Role | Value |
| --- | --- |
| Ink / supporting ink | #262721 / #65665d |
| Workspace / surface | #f7f6f2 / #ffffff |
| Canvas / paper well | #f0efea / #eeede7 |
| Selected surface / selection text | #e8e8df / #292b25 |
| Divider / input boundary | #e1e0d8 / #898b80 |
| Primary action | #292b25 |
| Focus / alignment | #49624f |
| Success / danger | #3c6047 / #a12a29 |

Wide panes share straight edges and hairline separators. No resting panel or paper shadows. Operational overlays retain depth. Controls use 4-5px radii, artwork rows 8px; stacked narrow panes use 8px. Use currentColor SVG icons, with accessible names on icon-only controls. `CutMark` uses the Rail mark; `CutGeometry` and `PinDimensions` share the physical cut/face motif.

## Composition

- Wide desktop: 64px document bar, 48px document navigation, 232px artwork rail, flexible editor and 300px preview; no outer gutters. At 1281-1450px the rail/preview reduce to 216/280px.
- At 851-1280px: 56px document bar, 38px navigation, artwork tray below the editor and 284px preview spanning both rows. Coarse pointers receive a 44px navigation row and 104px tray.
- At 1080 x 720 the closed-adjustments cut circle measures over 300 CSS pixels.
- At 850px and below: header, navigation, artwork tray, editor and preview stack with normal page scrolling. Inputs use 16px. Below 600px use 16px outer margins and one complete, horizontally scrollable artwork card at a time; Undo/Redo icon buttons stay visible while labeled text buttons hide icons cleanly.
- Sheet setup uses three columns on wide screens: pin dimensions/presets (plus 100% calibration sheet export), paper, arrangement. Compact and narrow forms reflow.

The project title is an editable field with pencil cue and full-value tooltip. Undo, Redo, file actions, and plain-text save feedback remain together. Copies is always beside the selected artwork title. Adjustment fields stay in an optional drawer; Library owns confirmed removal, duplicate, quantity steppers, `< 200 PPI` badges, and the batch automation bar (`Fit all`, `Fill all`, `Copies all`, `Fill empty slots`). Sheet Setup is directly reachable from the preview. Clicking a pin in Sheet Preview opens it in the editor. Help provides both the interactive Quick tour and the Shortcuts & About tab.

## Typography

Locally bundled variable Geist through `dfCuts Sans`, with Segoe UI fallback. Root 16px; body and ordinary fields 14px, navigation 14px, support text 12-13px, artwork title 20px, section titles 18px. Narrow fields use 16px. Use weights 400 or higher, rem sizes, unitless leading and tabular numerals for quantities and dimensions.

## Interaction and motion

Artwork drag/resize remains direct. Hold Alt to bypass snapping; scroll the mouse wheel to zoom proportionally; press arrow keys (`Shift` for 1 mm) to nudge selected artwork; use Adjust artwork for numeric values, `±90°` rotation, and horizontal/vertical flips. Keep alignment feedback height stable. Editing overlays never enter exported sheets.

The resize box starts hidden. Click or tap the artwork to select it; click elsewhere, press Escape or move keyboard focus away to deselect. Enter/Space selects a focused canvas. Center artwork also clears selection after aligning. Selection is temporary editor state, separate from saved artwork transforms.

The eyedropper uses a white-outlined SVG pipette cursor with its tip as the hotspot. A floating 11 × 11 source-pixel window displays each pixel at 10× with a contrasting center outline, color swatch and hex value, accounting for artwork rotation, scale, offsets, and horizontal/vertical flips. Hover is read-only; click or touch release applies the sampled color. Arrow keys step by one original pixel, Enter/Space confirms, Escape cancels.

Background fill opens the Colors dialog in `source/src/components/ui/apple-color-picker.tsx`. Grid, Spectrum and RGB sliders share a validated hex value, up to 12 locally saved colors, and pipette handoff. Backgrounds remain solid print colors.

Document navigation uses stable labeled buttons and a GSAP underline, 150ms power3.out for pointer selection, immediate for keyboard/reduced motion. Hover feedback is 120ms. Keyboard actions disable animation, and reduced motion uses opacity only. Touch targets expand to at least 44px under coarse pointers.
