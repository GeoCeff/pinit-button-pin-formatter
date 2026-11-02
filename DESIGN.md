# dfCuts print workbench

Updated 2 November 2026. The UI source defines exact states. Older briefs and generated snapshots record previous iterations.

## Direction

Achromatic ledger, direction seed 350303977: a continuous, warm-neutral workspace for preparing real print jobs. Artwork selection, positioning and printed output each have a clear place. Customer artwork provides expressive color. Keep decoration tied to the work: SVG cut boundaries, face circles, crop marks and measurement diagrams.

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

Wide panes share straight edges and hairline separators. No resting panel or paper shadows. Operational overlays retain depth. Controls use 4-5px radii, artwork rows 8px; stacked narrow panes use 8px. Use currentColor SVG icons, with accessible names on icon-only controls. CutMark, CutGeometry and PinDimensions share the physical cut/face motif.

## Composition

- Wide desktop: 64px document bar, 48px document navigation, 232px artwork rail, flexible editor and 300px preview; no outer gutters. At 1281-1450px the rail/preview reduce to 216/280px.
- At 851-1280px: 56px document bar, 38px navigation, artwork tray below the editor and 284px preview spanning both rows. Coarse pointers receive a 44px navigation row and 104px tray.
- At 1080 x 720 the closed-adjustments cut circle measures 318 CSS pixels, exceeding the 300px requirement.
- At 850px and below: header, navigation, artwork tray, editor and preview stack with normal page scrolling. Inputs use 16px. Below 600px use 16px outer margins and one complete, horizontally scrollable artwork card at a time.
- Sheet setup uses three columns on wide screens: pin dimensions/presets, paper, arrangement. Compact and narrow forms reflow. The dimension SVG reflects the configured inner/outer ratio; invalid input stays in field validation.

The project title is an editable field with pencil cue and full-value tooltip. File actions and plain-text save feedback remain together. Copies is always beside the selected artwork title. Adjustment fields stay in an optional drawer; Library owns confirmed removal. Sheet Setup is directly reachable from the preview. Help explains gestures.

## Typography

Locally bundled variable Geist through dfCuts Sans, with Segoe UI fallback. Root 16px; body and ordinary fields 14px, navigation 14px, support text 12-13px, artwork title 20px, section titles 18px. Narrow fields use 16px. Use weights 400 or higher, rem sizes, unitless leading and tabular numerals for quantities and dimensions.

Print-summary labels use 14px above 28-32px totals. Page navigation has an accessible current/total announcement. Names truncate with full-value tooltips; errors wrap. Preserve text selection outside gesture surfaces and retain stored measurement precision.

## Interaction and motion

Artwork drag/resize remains direct. Hold Alt to bypass snapping; numeric controls provide alternatives. Keep alignment feedback height stable. Editing overlays never enter exported sheets.

The resize box starts hidden. Click or tap the artwork to select it; click elsewhere, press Escape or move keyboard focus away to deselect. Enter/Space selects a focused canvas. Center artwork also clears selection after aligning. Selection is temporary editor state, separate from saved artwork transforms.

The eyedropper uses a white-outlined SVG pipette cursor with its tip as the hotspot. A floating 11 × 11 source-pixel window displays each pixel at 10× with a contrasting center outline, color swatch and hex value. The preview follows the pointer without animation, flips around it and stays inside the canvas. Hover is read-only; click or touch release applies the sampled color. Arrow keys step by one original pixel, Enter/Space confirms, Escape cancels. Transparent pixels and points outside the visible cut cannot change the fill. The magnifier is a DOM overlay and never enters print output.

Document navigation uses stable labeled buttons and a GSAP underline, 150ms power3.out for pointer selection, immediate for keyboard/reduced motion. Arrow keys, Home and End move focus; Enter/Space activate. No hover magnification. ResizeObserver updates underline geometry and effects clean up.

Hover feedback is 120ms. Existing pointer press and native dialog transitions remain interruptible; keyboard actions disable animation, and reduced motion uses opacity only. Native dialogs preserve Escape, focus restoration and background isolation. Touch targets expand to at least 44px. Hover styles require fine pointers.

## Acceptance

Preserve original image bytes, independent physical dimensions, packing, quantities, portable project folders, presets, missing-source recovery, RGB/CMYK PDF, PNG/JPG density metadata, export cancellation and staged file safety.

Verified: production build, 23 unit/file tests, Electron acceptance suite, real pointer alignment/resize checks, 1440/768/390 browser renders, 1080 x 720, 320px fallback and 200% zoom. Browser review uses a temporary bridge with synthetic artwork; Electron acceptance uses the actual native bridge. See .impeccable/workbench-redesign.md for the scoped review.

Not verified: physical touch hardware, manual screen-reader pass, physical print calibration and fresh-machine installer acceptance.
