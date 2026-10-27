---
name: PinIt
description: "Offline button-pin artwork and print-sheet workspace — modular maker studio"
colors:
  primary: "#4ba6c2"
  primary-hover: "#3d98b4"
  accent-soft: "#d5edf5"
  accent-ink: "#14586f"
  primary-border: "#237a97"
  ink: "#050809"
  muted: "#4f6470"
  workspace: "#f1f7f9"
  surface: "#ffffff"
  panel: "#e5f2f7"
  paper-well: "#edf3f6"
  line: "#cfdee5"
  control-line: "#79929e"
  focus: "#136d8c"
  disabled-text: "#697c87"
  disabled-surface: "#eaf0f3"
  disabled-border: "#cbd9df"
  primary-disabled-text: "#526c78"
  primary-disabled-surface: "#cfe2e9"
  primary-disabled-border: "#aec8d2"
  text-disabled: "#617b88"
  selected-border: "#80b4c6"
  row-hover: "#e7f1f5"
  scrollbar: "#8baebb"
  tab-tray: "#e0eef4"
  selected-tab-border: "#a2bdca"
  danger: "#a12a29"
  danger-hover: "#84201f"
  danger-soft: "#fff0ec"
  success: "#22613c"
  success-soft: "#e9f4ec"
  quality-warning: "#6b490d"
  quality-warning-soft: "#fff4dc"
  cut-guide: "#28566d"
  face-guide: "#966117"
  alignment-guide: "#0d6f91"
  empty-guide: "#407c94"
  empty-face-guide: "#8c621d"
  empty-circle: "#f3fafc"
  missing-source-preview: "#e8e3da"
  printed-guide: "#333333"
  scrim: "rgb(5 8 9 / 42%)"
  paper-shadow-color: "rgb(33 63 79 / 9%)"
  floating-shadow-color: "rgb(9 45 62 / 18%)"
typography:
  body:
    fontFamily: "'PinIt Sans', 'Segoe UI', sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  headline:
    fontFamily: "'PinIt Sans', 'Segoe UI', sans-serif"
    fontSize: "26px"
    fontWeight: 800
    lineHeight: "34px"
    letterSpacing: "-0.03em"
  headline-compact:
    fontFamily: "'PinIt Sans', 'Segoe UI', sans-serif"
    fontSize: "24px"
    fontWeight: 800
    lineHeight: "31px"
    letterSpacing: "-0.03em"
  brand:
    fontFamily: "'PinIt Sans', 'Segoe UI', sans-serif"
    fontSize: "26px"
    fontWeight: 900
    lineHeight: "28px"
    letterSpacing: "-0.035em"
  section-title:
    fontFamily: "'PinIt Sans', 'Segoe UI', sans-serif"
    fontSize: "15px"
    fontWeight: 800
    lineHeight: "22px"
  subsection-title:
    fontFamily: "'PinIt Sans', 'Segoe UI', sans-serif"
    fontSize: "14px"
    fontWeight: 800
    lineHeight: "20px"
  minor-title:
    fontFamily: "'PinIt Sans', 'Segoe UI', sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: "20px"
  button:
    fontFamily: "'PinIt Sans', 'Segoe UI', sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: "20px"
  primary-button:
    fontFamily: "'PinIt Sans', 'Segoe UI', sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: "20px"
  field:
    fontFamily: "'PinIt Sans', 'Segoe UI', sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "20px"
  field-label:
    fontFamily: "'PinIt Sans', 'Segoe UI', sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: "17px"
  hint:
    fontFamily: "'PinIt Sans', 'Segoe UI', sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "'PinIt Sans', 'Segoe UI', sans-serif"
    fontSize: "11px"
    fontWeight: 400
  artwork-name:
    fontFamily: "'PinIt Sans', 'Segoe UI', sans-serif"
    fontSize: "13px"
    fontWeight: 800
    lineHeight: "18px"
  dialog-title:
    fontFamily: "'PinIt Sans', 'Segoe UI', sans-serif"
    fontSize: "22px"
    fontWeight: 800
    lineHeight: "28px"
    letterSpacing: "-0.025em"
  empty-inspector-title:
    fontFamily: "'PinIt Sans', 'Segoe UI', sans-serif"
    fontSize: "20px"
    fontWeight: 800
    lineHeight: "22px"
  empty-library-title:
    fontFamily: "'PinIt Sans', 'Segoe UI', sans-serif"
    fontSize: "16px"
    fontWeight: 800
    lineHeight: "23px"
  capacity:
    fontFamily: "'PinIt Sans', 'Segoe UI', sans-serif"
    fontSize: "24px"
    fontWeight: 800
    lineHeight: "28px"
    letterSpacing: "-0.025em"
  run-total:
    fontFamily: "'PinIt Sans', 'Segoe UI', sans-serif"
    fontSize: "26px"
    fontWeight: 800
    letterSpacing: "-0.025em"
  pin-summary:
    fontFamily: "'PinIt Sans', 'Segoe UI', sans-serif"
    fontSize: "22px"
    fontWeight: 800
rounded:
  handle: "2px"
  swatch: "4px"
  count: "7px"
  control: "8px"
  paper-well: "10px"
  artwork-row: "12px"
  panel: "16px"
  circle: "50%"
spacing:
  step-1: "1px"
  step-2: "2px"
  step-3: "3px"
  step-4: "4px"
  step-5: "5px"
  step-6: "6px"
  step-7: "7px"
  step-8: "8px"
  step-9: "9px"
  step-10: "10px"
  step-12: "12px"
  step-14: "14px"
  step-16: "16px"
  step-18: "18px"
  step-20: "20px"
  step-24: "24px"
  step-28: "28px"
  step-32: "32px"
components:
  button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  button-hover:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.ink}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.ink}"
    typography: "{typography.primary-button}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.ink}"
  button-primary-disabled:
    backgroundColor: "{colors.primary-disabled-surface}"
    textColor: "{colors.primary-disabled-text}"
  button-disabled:
    backgroundColor: "{colors.disabled-surface}"
    textColor: "{colors.disabled-text}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.control}"
    padding: "2px 4px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  button-danger-hover:
    backgroundColor: "{colors.danger-hover}"
    textColor: "{colors.surface}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.field}"
    rounded: "{rounded.control}"
    padding: "8px 10px"
  count:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.count}"
    padding: "0 6px"
    height: "24px"
  artwork-selected:
    backgroundColor: "{colors.accent-soft}"
    rounded: "{rounded.artwork-row}"
    padding: "10px 8px 10px 10px"
  editor-panel:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.panel}"
    padding: "20px"
  preview-panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
    padding: "20px"
  inspector-tab:
    backgroundColor: "transparent"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.control}"
  inspector-tab-selected:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
  paper-stage:
    backgroundColor: "{colors.paper-well}"
    rounded: "{rounded.paper-well}"
    padding: "16px 12px"
  dialog:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
    padding: "28px"
    width: "min(520px, 100%)"
---

# Design System: PinIt

## Overview

**Creative North Star: "The Modular Maker Studio"**

PinIt is a modular maker studio for preparing original PNG/JPEG artwork and physically sized button-pin sheets in an offline Windows Electron workspace. Cool white and cyan trays surround the actual work: a circular artwork editor beside a live sheet preview. Rounded forms, strong dark labels and a friendly workhorse sans keep dense production settings approachable.

The workflow is import, position and fit, set exact copies and independent face/cut dimensions, inspect packed sheets, then export locally. The visual system follows the shipped React/CSS renderer and the approved loose direction from inspiration/. Those reference JPGs are not product assets. No customer artwork is bundled; the review captures use synthetic QA images.

**Key Characteristics:**

- Cool cyan action and selection feedback with dark text.
- Rounded, flat trays; physical artwork and white paper remain the main material.
- Bundled Nunito Sans, compact labels and tabular numbers.
- Three desktop regions with local scrolling and keyboard-operated inspector tabs.
- Direct manipulation plus numeric alternatives; editing overlays stay outside exported artwork.

## Colors

Cool whites and blue-gray surfaces frame a single cyan accent. Functional amber, red and green remain scoped to guides, quality and status.

### Primary

- **Maker cyan** (`primary`) fills Export sheets, first import and the CSS brand mark; `primary-hover` darkens the same action. The foreground is `ink`, with `primary-border` at rest and `accent-ink` on hover.
- **Pale cyan** (`accent-soft`) identifies selected artwork, the count chip and hovered controls. **Deep cyan** (`accent-ink`) carries text actions, checkboxes, local status and centered-state text. The directional references' extra cyan swatches were not introduced as separate implementation tokens.

### Neutral

- `workspace` is the application ground, `surface` is white for preview and inspector trays, `panel` is the pale-blue artwork tray and `paper-well` sits behind white paper.
- `ink` and `muted` separate working labels from help. `line` divides summaries; the darker `control-line` defines fields and bordered buttons.
- `selected-border`, `row-hover`, `tab-tray` and `selected-tab-border` describe navigation states. Disabled base, primary and text controls retain distinct colors rather than a blanket opacity.
- `missing-source-preview` is a renderer placeholder for an unavailable source on a sheet; it is a retained functional exception, not a general warm surface.

### Functional colors

- Focus uses `focus`. Destruction/validation uses `danger`, `danger-hover` and `danger-soft`; notices use `success` / `success-soft`; below-200-PPI feedback uses `quality-warning` / `quality-warning-soft`.
- In the editor, `cut-guide` outlines cut and safe circles; `face-guide` marks the dashed face circle. Empty-editor CSS uses the separate `empty-guide`, `empty-face-guide` and `empty-circle` values.
- `alignment-guide` is the blue artwork transformer and live center-guide color. White handles and an 85%-opaque white under-stroke protect contrast over artwork.
- `printed-guide` is the shared sheet-renderer gray. Screen visibility toggles do not control printed-guide settings; the sheet preview uses actual output-guide settings.
- Scrim and shadow colors are recorded as literal alpha CSS colors in frontmatter. Their geometry belongs to Elevation & Depth and the sidecar.

### Named Rules

**The Cyan Hierarchy Rule.** Use cyan fill for the primary action and pale cyan for selection; keep dark ink on the filled cyan action. Deep cyan carries secondary actions, checkbox accents and active feedback.

## Typography

**Display/task, body and label font:** `'PinIt Sans', 'Segoe UI', sans-serif`. PinIt Sans is the bundled, unmodified Nunito Sans variable font at `src/ui/fonts/NunitoSans.ttf`, mapped by `type.css` with normal style, weights 200–1000 and `font-display: swap`. `index.html` preloads it. Segoe UI is a fallback, not the alias source. Licensing is in `src/ui/fonts/OFL.txt` and `THIRD_PARTY_NOTICES.md`.

The root is 14px, normal weight; paragraphs use 1.5 line height. Most working labels use weights 600–800. Headings use balanced wrapping, while the desktop artwork title uses one-line ellipsis and preserves its full name in a title attribute. Long names wrap in artwork rows and in the narrow fallback.

### Hierarchy

- **Task headline:** 26px / 34px, 800, −0.03em; 24px / 31px at 1250px and below.
- **Brand:** 26px / 28px, 900, −0.035em; 24px at 650px and below.
- **Dialog heading:** 22px / 28px, 800, −0.025em. Empty-inspector heading is 20px with inherited 22px line height; empty-library heading is 16px / 23px.
- **Panel heading:** 15px / 22px, 800. Subsection headings are 14px / 20px, 800. Settings summaries are 14px / 22px, 800; h4 is 13px / 20px, bold.
- **Controls:** 13px / 20px; button weight 700, primary button 14px, input weight 400. Project name is 14px, 800.
- **Labels and help:** field labels 12px / 17px, 600; help is 12px with 1.5 line height; captions and footer use 11px. Canvas caption is 12px / 18px, becoming 11px / 17px at the compact breakpoint. Units are 11px / 16px.
- **Counts:** run total is 26px, 800; sheet capacity is 24px / 28px, 800; empty pin-size summary is 22px, 800. Totals/capacity use −0.025em tracking. Count chips are 12px, 800.

There is no artificial ratio: the machine-readable roles record the actual numeric type steps. Tabular numerals apply to number inputs, page navigation, paper labels, color values and physical/run summaries.

### Named Rules

**The Working Scale Rule.** Use the observed 11–15px utility scale and 20–26px task/count scale. Numeric controls, page counts, run totals and physical summaries use tabular figures; do not invent a display-face hierarchy.

## Layout

The native Windows window opens at 1500×960 and enforces a 1080×720 minimum. The renderer has a 320px defensive minimum. The desktop app uses `100dvh`, minimum height 600px, and four grid rows: toolbar, bounded status area, remaining workspace and footer. The toolbar occupies its own row; it is not sticky-positioned. It is at least 74px tall with 12px 24px padding and 24px gaps. The status region scrolls beyond 118px.

The workspace has `208px minmax(0, 1fr) 288px` columns, 16px gaps and 4px 16px 12px padding. The center uses a 16px vertical gap and 14px top padding. Its editor/preview split is `minmax(0, 1.4fr) minmax(0, 1fr)` with a 16px gap. The editor and preview have 20px padding. Inspector contents use 20px padding; fields form two equal columns with 12px gaps, 7px label spacing and 24px section separation.

Artwork lists and inspector panels scroll locally. The inspector shell clips its tray, the tab strip stays outside the scrolling panel, and the panel uses `overscroll-behavior: contain`. Flexible cells use zero minimum widths/heights so the center canvases can shrink without pushing controls out of the native minimum window.

| Condition | Implemented change |
| --- | --- |
| At least 1700px | Side columns 228px / 308px; workspace horizontal padding and gaps 24px; canvas gaps and panel padding 24px. |
| At most 1250px | Side columns 172px / 252px; workspace padding/gaps 12px; editor/preview ratio 1.35:1 with 12px gap; panels 14px, inspector 16px; toolbar minimum 68px; headline 24px / 31px; local badge and guide-legend label hide. |
| At most 980px | Defensive document scrolling, two columns (172px + flexible center), inspector below both; artwork list min 600px / max 780px, work area min 650px, canvases min 530px; inspector panel max 680px; toolbar/footer wrap. |
| At most 650px | Defensive single-column flow; two-column toolbar plus full-row file actions; horizontal artwork list with 180px rows; editor and sheet stack; editor min 480px, preview min 560px; paper stage height 380px / min 330px and sheet max 348px; inspector overflow becomes document flow. Dialog padding 20px, scrim 12px. |
| Coarse pointer | Base buttons, inputs, selects, icon buttons and checkbox labels have 44px minimum targets; icon buttons become 44px wide. |
| Reduced motion | Transition and animation durations become 0ms. |

The 1/2/3/4/5/6/7/8/9/10/12/14/16/18/20/24/28/32px spacing entries reflect literal implementation steps, not a newly imposed scale. Use 8–12px within controls, 12–16px between modules and 20–24px for major grouping.

Physical geometry is independent of CSS: face and cut diameters are editable separately, safe inset is measured from the face radius, and the editor scales them to its available space. The initial 44mm / 53mm example has 4.5mm wrap per side. A4/Letter/custom dimensions, exact quantities, grid/staggered packing and mixed/separate designs remain factual controls; no fixed screenshot capacity is a product promise.

## Elevation & Depth

Tonal layering carries the workspace. Editor, preview and inspector trays have no ambient shadow. White print paper is lifted slightly inside its cool well; modal dialogs and export progress float above the work. The scrim is `rgb(5 8 9 / 42%)` at z-index 50; export progress uses z-index 30, and the focused skip link uses 60.

### Shadow Vocabulary

- **Paper:** `0 3px 14px rgb(33 63 79 / 9%)`.
- **Dialog:** `0 18px 56px rgb(9 45 62 / 18%)`.
- **Export progress:** `0 10px 40px rgb(9 45 62 / 18%)`.

Buttons transition background and border over 160ms ease-out and press translation over 120ms ease-out. Active enabled buttons move down 1px; artwork-select buttons suppress that transform. There is no entrance, idle or decorative animation. The reduced-motion rule disables both transition and animation durations.

### Named Rules

**The Material Depth Rule.** Keep workspace trays flat. Reserve shadows for the white print sheet, dialogs and floating export progress.

## Shapes

Panels, inspector shells, dialogs and export progress use 16px corners. Artwork rows, empty-state marks and the brand mark use 12px; the paper well and quality note use 10px. Controls and thumbnails use 8px; count chips 7px; color swatches and project-name field 4px. The transformer's 10px corner handles use 2px rounding. Narrow brand-mark corners become 10px. Borders are generally 1px; the global focus outline is 2px with a 3px offset.

Concentric 50%-radius circles describe actual cut, face and safe geometry. The CSS brand mark echoes circles with two 1.6px deep-cyan rings inside a cyan rounded square. It does not replace or modify the existing native app icon. Outline icons use a 24×24 viewBox, no fill, currentColor, 1.7px strokes and rounded caps/joins; 18px is the default rendered size, with contextual 14–38px uses.

## Components

### Buttons and fields

Base buttons are white with dark ink, a control-line border, 8px corners, minimum 38px height, 8px 12px padding and an 8px icon gap. Hover uses pale cyan and a deep-cyan border; active presses translate 1px. Primary buttons use cyan with dark ink, quiet buttons remove the border/fill, text buttons use deep cyan at 12px with 2px 4px padding and 28px minimum height, and destructive confirmation uses white on danger red. Standard icon buttons are 34×34px; removal/dismiss icons may be 28px. Toolbar primary padding is 16px horizontally, reducing with other file actions to 9px at compact widths.

Fields share 38px minimum height, white fill, 1px control border, 8px corners, 8px 10px padding and 13px / 20px text. Unit fields reserve 34px on the right. Invalid fields use danger borders, `aria-invalid` and associated 12px / 17px explanations. Color fields show the swatch and uppercase value. Checkboxes are 15px squares with deep-cyan accent and a readable text label. Keyboard focus is always the 2px blue outline; color fields expose the same ring through focus-within.

### Artwork library and count chip

A row has a 52px thumbnail, wrapping name and exact copy count, with a separate labeled trash action. Selected rows have pale-cyan fill and the selected-border stroke; hover uses row-hover. The count chip is 24px high, at least 24px wide, with 7px corners. Removal opens a confirmation alert dialog and defaults to Keep editing; missing sources retain edits and expose relink. Empty-library copy and first import remain visible without bundled sample artwork.

### Inspector navigation

Artwork and Sheet form a two-tab strip on a pale-blue tray with 8px padding and 4px gaps. Tabs are 38px minimum height, weight 800, deep-cyan text; selected tabs use white, ink and the selected-tab border. One tab is in the Tab sequence. ArrowLeft/ArrowRight wrap, Home/End select the first/last tab, and activation follows keyboard navigation. The tab panel scrolls independently at desktop sizes. Selecting artwork returns to Artwork; validation's Review settings opens Sheet.

### Editor tray, direct manipulation and alignment

The pale-blue editor tray frames real cut geometry, a persistent alignment-status line, Center artwork, the canvas, screen-guide checkboxes and a gesture caption. The editor measures available space, caps its stage at 560px and scales by `stageSize / (cutDiameter × 1.34)`. Artwork is clipped to the cut circle. Dragging snaps each axis independently within six screen pixels; Alt bypasses snapping. Numeric offsets remain intentional. Center artwork zeroes both offsets while preserving scale and rotation. Corner handles resize proportionally around the current image center; rotation remains a numeric control.

Persistent status is Centered, Centered horizontally, Centered vertically or Off center. Only the fully centered label receives deep-cyan bold styling. Center artwork is disabled when already centered, when the source is unavailable or while picking. During drag/resize, aligned axes draw 1-screen-pixel blue lines over 3-screen-pixel white under-strokes at 85% opacity; full alignment adds a blue center dot with 3-screen-pixel radius. These center lines are transient; the selected artwork's blue transformer and white handles can remain at rest. Cut/face/safe guides have separate visibility toggles and different stroke patterns.

Eyedropper mode changes the canvas to a crosshair, hides the transformer, disables dragging/centering and reports its action in the caption. Loading and missing-source feedback remain explicit. None of the editing transformer, center guides, alignment dot or status appears in exported sheets.

### Sheet preview, settings and feedback

The white preview tray contains paper dimensions, Print at 100%, a cool paper well, white sheet canvas, previous/next page actions and the computed capacity. The preview displays actual printed-guide settings. Printed guides use 0.12mm gray lines; face and safe lines are dashed `0.8mm / 0.6mm`. Editor cut, face and safe strokes are respectively 0.25mm solid, 0.18mm dashed `1 / 0.7` and 0.15mm dotted `0.4 / 0.6`, in their screen colors. Screen guides and export guides are independent controls.

Sheet settings group pin dimensions, paper/margins and arrangement; native details/summary progressively disclose reusable settings. Selecting Custom paper reveals dimensions without changing them. Invalid geometry preserves the last valid editor/sheet preview, adds an alert and marks the relevant field. I/O busy, disabled export and missing CMYK engine states remain explicit. Success is a green notice, errors use pale red, and low source PPI uses a pale-amber note without blocking export.

### Dialogs and export progress

Dialogs are white 16px trays, `min(520px, 100%)` wide with 28px padding, maximum `calc(100dvh - 48px)` height and local overflow. Modal focus is contained, Escape dismisses, and focus returns to the triggering control. The export dialog presents PDF RGB/CMYK or PNG/JPG choices, profile/intent/resolution settings and independent printed-guide checkboxes. Progress floats at right 24px / bottom 46px, width `min(500px, calc(100% - 48px))`, with cancellation. Exports use a new output folder; failed CMYK conversion does not silently become RGB.

## Do's and Don'ts

### Do:

- **Do** use the bundled PinIt Sans/Nunito Sans family, implemented palette and 8px control / 16px panel corners.
- **Do** preserve the independent face, cut and safe-inset dimensions; the default 44mm face / 53mm cut is an editable example, not a fixed proportion.
- **Do** pair invalid color with an associated explanation, retain visible focus and provide numeric alternatives to gestures.
- **Do** preserve the last valid preview when geometry becomes invalid and direct the operator to Sheet settings.
- **Do** distinguish editor cut/face/safe guides, gesture alignment feedback and optional printed guides.
- **Do** use the existing 24×24 outline SVG grammar with currentColor, 1.7px strokes and round caps/joins.

### Don't:

- **Don't** promote inspiration JPGs, synthetic review artwork or customer imagery into required product assets or palette tokens.
- **Don't** use white text on the cyan primary action; the shipped action uses ink.
- **Don't** turn alignment handles, center lines or the center dot into printed output.
- **Don't** couple physical face and cut dimensions, shrink circles to fit a sheet or change dimensions when choosing Custom paper.
- **Don't** turn defensive narrow-browser layouts into a claim of native mobile support; the Windows minimum remains 1080×720.
- **Don't** substitute RGB after failed CMYK conversion, overwrite existing exports or introduce remote font dependencies.

Evidence: `src/ui/styles.css`, `type.css`, `App.tsx`, `Workspace.tsx`, `InspectorTabs.tsx`, `controls.tsx`, `Settings.tsx`, `Editor.tsx`, `SheetPreview.tsx`, `Icon.tsx`, `ExportOptions.tsx`, `src/core/alignment.ts`, `src/render/canvas.ts`, `index.html`, `electron/main.ts`, `PRODUCT.md`, `README.md` and `.impeccable/review/revamp-validation.md`. Direct visual checks: `desktop.png`, `compact-sheet.png`, `alignment-one-axis.png` and `invalid-cut.png` in `.impeccable/review/`. The finish reviewer checked the complete required capture set. This document records the replacement world; the detector's 76 old-system advisories are not current normative tokens.

Not canonized or repaired: no new material UI defect was identified by the finish review. The retained warm missing-source placeholder is documented only for that renderer state; synthetic artwork colors and unchanged native-icon pixels are not future UI palette guidance.
