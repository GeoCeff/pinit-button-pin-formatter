# PinIt - button pin formatter

A desktop app for automatically arranging button-pin designs on printable sheets.

PinIt starts with a real workflow: a friend runs a button-pin business and spends too much time preparing customer artwork and laying out different designs in Canva. The goal is to automate bleed preparation, circular positioning, duplication, and sheet layout, then save a PDF for the operator's existing color-correction and printing workflow.

**Status:** A working offline Electron/React desktop implementation is available. It supports the workflow below, portable project folders, RGB/ICC-converted CMYK PDF, and PNG/JPG sheets. Automated geometry, file-safety and desktop workflow checks are included. Physical printer calibration and clean-machine installer acceptance are still required before production use.

## Current workflow

Windows 11 x64 is the desktop target. The operator can:

1. Import customer artwork, initially PNG or JPEG, including existing Canva exports.
2. Fit the whole image inside the safe/face circle, fill the face, or move, scale and rotate it manually with drag and numeric controls.
3. Fill the surrounding margin with a solid color sampled from the artwork's edge, with manual color adjustment.
4. Preview the artwork inside a circular cut boundary and inner face/fold guide, then adjust its position and scale so important content stays on the front face.
5. Set independent face/cut diameters, A4/Letter/custom paper, margins, orientation, gaps, mixed/separate designs, exact quantities and an optional sheet limit. Auto compares grid and staggered arrangements without shrinking circles.
6. Export a physically sized PDF in RGB or ICC-converted CMYK, or one PNG/JPG per sheet with resolution metadata. Screen guides and printed guides have separate controls. Verify the operator's profile and print result before production use.
7. Save/open a project folder containing `project.json` and original image bytes in `assets/`. Move the entire folder to another location; missing images retain edits and can be relinked. Named presets copy settings without changing existing projects.

The initial layout will use one pin template per job and support multiple designs. Mixed pin sizes on one sheet can be considered after the basic workflow is proven.

The workspace is a compact professional editor using the cool palette from `inspiration/`. A quiet canvas and persistent paper preview sit side by side. A prominent upload button and selection tray share the bottom row with the floating dock. The tray has larger thumbnails, readable copy counts and a checkmark for the selected artwork. **Manage artwork** opens the full **Library**, where removal asks for confirmation. **Safe**, **Face** and **Fill** provide quick fit choices on roomy desktops; **Adjust artwork** opens exact copies, fit, position, size, rotation and background controls. Cut and Face are the two default circle guides; Safe is optional and does not change physical geometry or export-guide settings.

The dock switches between **Artwork**, **Sheet** setup and **Library**, replays the **Help** tutorial, or opens **Export**. The three-step tutorial appears on first use; completing or skipping it is remembered on this computer. Arrow keys, Home and End move dock focus; Enter or Space activates a tool. Native dialogs isolate background controls and restore focus. Numeric fields describe their units. Pointer magnification stops for keyboard focus and reduced motion. Dialogs and tutorial steps use short, bounded blur/fade transitions; keyboard and reduced-motion paths suppress them. Ordinary success notices dismiss after six seconds and pause while hovered or focused; export destinations and errors stay visible until dismissed. Geist is bundled locally for offline use.

Artwork alignment works directly in the editor. Drag near the middle to snap either axis into place; blue guides appear for the aligned axes while moving or resizing. A centered confirmation with a checkmark sits above the artwork, and an off-center action makes correction available in one click. Pull a round corner handle to resize proportionally around the photo's center. **Center artwork** resets the position while preserving size and rotation. Hold **Alt** during a drag to place artwork freely inside the snap zone. These editing overlays are excluded from exported sheets.

## Run and build

Development needs Windows 11 x64, Node.js 24 LTS and npm. The installed application runs offline without Node.js.

```powershell
npm ci
powershell -ExecutionPolicy Bypass -File scripts/prepare-resources.ps1
npm run dev
```

The resource script downloads a pinned, SHA-512-checked official Ghostscript 10.08.0 archive and extracts it locally. It does not run an installer or modify the system. The generic CMYK profile, engine and license notices are packaged with PinIt. The Windows installer requests administrator access and installs the included Microsoft Visual C++ redistributable offline; no separate download is needed. Imported ICC profiles must be CMYK output profiles. Source artwork is normalized to oriented sRGB for editing; original bytes are preserved.

```powershell
npm test              # numeric geometry, validation, orientation, files and output metadata
npm run build         # TypeScript checks and production bundles
npm run test:desktop  # real Electron import/edit/save/reopen/relink and all four export paths
npm run test:dev      # development renderer and production security-policy check
npm run test:alignment # actual drag, resize, center feedback and export-overlay checks
npm run dist          # complete offline Windows NSIS installer under release/
npm start             # run the production build
```

The desktop check creates clearly synthetic artwork and output in ignored `local-data/`. It uses native-dialog test responses and a separate test profile. It does not operate on customer files. Rebuild before running it after source changes.

Export captures the current project revision, works in a separate renderer worker, shows progress and supports cancellation. Files are checked and staged in a temporary folder, then published by renaming the complete folder. Every export gets a new destination folder, preserving existing output. A failed CMYK conversion never falls back to RGB.

Safety bounds: at most 500 designs/assets, 100,000 copies, 1,000 sheets, 10,000 circles per sheet, 40 megapixels per source, 50 MB per imported source, a 256 MB source/session and raster/tile budget, 16 custom profiles / 64 MB per session, and 1 GB per export. Raster DPI is a whole number from 1–2400 so JPEG density metadata remains accurate. Start a new project to clear the source session budget. Settings that exceed a bound show an error before allocation. These are deliberate small-shop limits, not production throughput claims.

PDF memory checks count artwork tiles. PNG/JPG memory checks count the full sheet plus artwork tiles. Layout reserves space for the stroke of every printed guide that extends beyond the artwork.

## Implementation map

- `src/core/`: physical units, fitting, validation, arrangement and pagination; no Electron or drawing imports.
- `src/state/`: project reducer; computed sheets are not persisted.
- `src/render/`: render specification, shared Canvas drawing, worker exports and DPI metadata.
- `src/ui/`: artwork workspace/tray, first-run tutorial, Konva editor, sheet settings, preview and native dialogs.
- `src/components/ui/`: the supplied floating dock, adapted to real project tools and accessible motion.
- `electron/`: isolated named bridge, native dialogs, authorized source registry, portable project storage, staged exports and separate Ghostscript process.
- `scripts/`: runtime preparation, packaging preflight and real desktop acceptance checks.

See [plan.md](plan.md) for the full design and [AUDIT.md](AUDIT.md) for the implementation audit and remaining release checks.

## Component and styling setup

The project already uses TypeScript. Tailwind CSS is integrated into the Electron renderer through `@tailwindcss/vite`; `src/ui/styles.css` is the stylesheet entry. The `@/` alias maps to `src/` in both TypeScript and the renderer configuration. `components.json` records the shadcn component paths, including `@/components/ui`. The dock uses a plain conditional class string.

The component from the pasted instructions lives at `src/components/ui/mac-style-floating-dock.tsx`, imported as `@/components/ui/mac-style-floating-dock`. Keeping reusable controls in that directory makes the supplied import and shadcn's component path agree. Its stable-slot magnification math is retained, with controlled view selection, real actions, GSAP transform setters, keyboard navigation, visible labels, reduced-motion support and effect cleanup. No sample Home, Mail or Profile destinations are added to the app.

`npm ci` installs this setup; `npm run dev` starts the desktop app. To add another shadcn component later, use the npm runner, for example `npx shadcn@latest add button`. The configuration follows the official [Tailwind Vite setup](https://tailwindcss.com/docs/installation/using-vite) and [shadcn Vite setup](https://ui.shadcn.com/docs/installation/vite).

## Reported production settings

These settings were supplied from the operator's workflow. They have not been independently measured in a generated or printed PinIt file.

| Pin / inner face diameter | Outer cut diameter | Reported circles per A4 sheet |
| --- | --- | --- |
| 58 mm | Not supplied | 12 |
| 44 mm | 53 mm | 18 |
| 32 mm | Not supplied | 28 |
| 25 mm | Not supplied | 48 |

For the 44 mm pin, the inner circle is the 44 mm front face/fold boundary. The 53 mm outer circle is the cut boundary including the wrap area; the operator confirmed it matches the machine opening. This gives `(53 - 44) / 2 = 4.5 mm` of allowance per side. Other sizes need their own measured outer diameters.

The current Canva intermediate is a 1254 x 1254 px PNG, high quality, transparency off, exporting the current page only. This is an observed workflow setting; PinIt should retain source detail and use millimeters for print geometry rather than require this intermediate export.

The operator currently uses borderless A4 and manually corrects color before printing. PinIt should save the PDF locally; direct printer control is outside the first version.

## Inputs still needed

- Existing A4 template or PDF showing the actual circle arrangement, gaps, and margins. Reported counts are target capacities, not row/column specifications. At 53 mm cut diameter, a simple rectangular grid on 210 x 297 mm A4 holds only `floor(210 / 53) * floor(297 / 53) = 15` circles. The reported 18 needs a different arrangement, such as staggering, to be checked against the real template.
- Outer cut diameters for the 58, 32, and 25 mm pins; do not extrapolate the 44 mm allowance or diameter ratio.
- Whether cut and face/fold guide lines belong in the exported PDF or only in the editor.
- The color-correction application and required CMYK/ICC profile. Validate actual exported color spaces; a PDF label alone does not establish CMYK output.
- Current Windows version, printer model, borderless expansion/scaling settings, representative order quantities, and whether mixed pin sizes are required initially.

Print a calibration sheet at actual size (100%), verify any printer-driver scaling, and measure it before treating output as ready for production. PDF generation alone does not establish print accuracy.

## Scope

The intended workflow is local and offline. PinIt handles preparation and layout; creating or redesigning artwork can stay in Canva or the operator's chosen editor. Manual color correction stays in the existing downstream workflow. Direct Canva integration, direct printing, user accounts, order management, and cloud storage are outside the first version.

The implementation uses Electron, TypeScript, electron-vite, React, Konva, pdf-lib, sharp, Vitest and electron-builder, with a committed npm lockfile. The default is the confirmed 44 mm face / 53 mm cut example. Other inner/outer pairs are editable; no unmeasured outer diameters are invented.

## Artwork and contributions

Keep customer artwork, job data, and generated exports in `local-data/`, which is ignored by Git. Only include synthetic or explicitly licensed sample artwork in the public repository. Other locations are not automatically protected from commits.

Contributions are welcome. While the workflow is being defined, open an issue before starting a large feature and describe the real layout problem it solves.

## License

PinIt source is MIT licensed. See [LICENSE](LICENSE). Bundled dependencies retain their licenses, including the AGPL Ghostscript runtime; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Customer artwork retains its own ownership and licensing.
