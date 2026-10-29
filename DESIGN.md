---
name: "PinIt"
description: "A focused print studio for button-pin artwork and physically sized sheets."
colors:
  ink: "#172b3a"
  muted: "#596979"
  workspace: "#edf1f5"
  surface: "#ffffff"
  canvas: "#f4f6f9"
  rail: "#f8fafc"
  panel: "#e9f4f8"
  paper-well: "#e8edf3"
  line: "#dde4ec"
  control-line: "#80909f"
  accent: "#4ba6c2"
  secondary: "#93d0e3"
  action: "#075672"
  focus: "#075672"
  success: "#246653"
  danger: "#a12a29"
  danger-hover: "#852221"
  danger-soft: "#fff0ec"
typography:
  body:
    fontFamily: "'PinIt Sans', 'Segoe UI', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  heading:
    fontSize: "1.5rem"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  artwork-title:
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
  section-title:
    fontSize: "1.125rem"
    fontWeight: 650
    lineHeight: 1.3
  field:
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4
  summary-label:
    fontSize: "0.875rem"
    fontWeight: 450
    lineHeight: 1.5
  summary-value:
    fontSize: "2rem"
    fontWeight: 550
    lineHeight: 1.15
  caption:
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
---

# Design system: PinIt print studio

Updated 29 October 2026. This document describes the current implementation. The UI source is the authority for exact component states. Older briefs and generated snapshots in `.impeccable/` record earlier iterations.

## Direction

Give the operator three clear places: artwork, positioning and printed output. Use cool neutral surfaces, dark blue actions, locally bundled Geist, clear numeric hierarchy and restrained depth. Customer artwork supplies the expressive color.

The latest user refinement prioritizes readability: remove the persistent drag/resize/snap sentence, enlarge sheet navigation and print-summary labels, and replace compressed layout prose with short rows.

## Composition

- Wide desktop: 218px artwork rail; flexible editor; 292px sheet preview; 16px gutters. The project bar is 72px high.
- At 1281-1450px: 196px artwork rail and 272px preview, with 12px gutters.
- At 851-1280px: the artwork rail becomes an 84px tray below the editor. The preview spans both rows. The project bar is 56px high and the preview is 284px wide.
- At 850px and below: the project bar, artwork tray, editor and sheet preview stack. Content scrolls normally.
- At 600px and below: adjustments sit above the canvas. Numeric values remain accessible at a 320px viewport.
- The native minimum remains 1080 x 720. Keep the cut circle at least 300 CSS pixels across there with adjustments closed.

The toolbar belongs to the editor panel. Artwork selection remains separate from destructive removal. The Library owns removal and its confirmation dialog.

## Typography

Use the bundled Geist variable face through PinIt Sans, with Segoe UI as fallback. Root size is 16px; the dense professional tool uses 14px body/input text. Captions rarely go below 12px. Narrow inputs use 16px at 850px and below.

Use rem sizes, unitless line heights and CSS font-weight. Keep changing counts and measurements tabular. Text remains selectable outside the draggable canvas.

Project names are editable and retain their full value. Artwork names truncate with a full title available. Errors and notices wrap. The field/unit layout preserves the existing five-decimal display without rounding stored geometry.

Print-summary labels and layout rows use 14px. Counts use 32px, or 28px on compact desktops. Page navigation uses a readable current/total counter with an accessible sheet announcement.

## Surfaces and controls

Panel radii are 14px. Controls use 7-9px radii. The fit control has concentric 9px and 5px corners around a 3px inset and 1px border.

Borders define controls, dividers and selection. Soft layered shadows separate panels, paper and operational overlays. Shadow surfaces retain borders for forced-colors mode. Thumbnails use an inset pure-black outline at 10% opacity.

Use one currentColor outline icon set. Keep functional icon controls named. The brand is the concentric cut/face mark on a blue square.

The artwork rail shows thumbnails, names, quantities and a selected check. Import is the primary action in the rail. The centered badge uses a check, text and green; off-center artwork retains a Center artwork action.

The sheet preview shows physical paper size, one actual-size reminder, page navigation, Total copies and Copies / sheet. Copies / sheet follows the optional cap. Layout and Wrap are short rows. Gesture instructions belong in Help, with a contextual color-picker prompt shown only while sampling.

## Motion

Routine navigation, typing and artwork edits stay immediate. Hover feedback changes color within 120ms. Pointer button presses use scale(0.96) over 150ms ease-out; selection and toolbar buttons opt out.

Pointer-opened dialogs use opacity/filter transitions up to 180ms and transform up to 220ms with cubic-bezier(.23,1,.32,1). Drawers use 160-180ms. Use transitions and @starting-style, allowing state to retarget.

Keyboard actions disable transitions and animations. Reduced motion uses a 120ms opacity fade without movement, scale or blur. Mouse-only toolbar magnification retains its existing ref-based GSAP implementation and resets immediately on focus or reduced motion. No permanent will-change hint is needed.

## Accessibility and correctness

Use native dialogs for background isolation, Escape and focus restoration. Keep the skip link, visible focus rings, labeled numeric alternatives, units and field errors. Touch controls expand to at least 44px. Gate hover behavior to hover-capable fine pointers.

Measured contrast: normal ink on white 14.55:1; supporting ink on white 5.64:1; supporting ink on canvas 5.21:1; white on action blue 8.13:1; centered text 6.35:1; input boundaries on white 3.28:1.

Original artwork, independent millimeter dimensions, packing, portable projects, RGB/CMYK/raster output, cancellation and missing-source recovery remain part of the acceptance contract.

## Review and verification

The desktop checks cover the wide rail, compact tray, 300px minimum cut circle, print caps, readable labels, 200% zoom, 320px fallback, keyboard/reduced-motion behavior and complete export workflow. Pointer checks cover drag, resize, Alt bypass, centering and exclusion of editing overlays from output.

Actual printer calibration, a fresh Windows installation and physical touch hardware remain external checks. No marketing patterns, remote fonts or new runtime packages are required by this redesign.
