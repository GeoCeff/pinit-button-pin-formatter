---
version: 1
slug: "src-ui-app-tsx"
primary_target: "src/ui/App.tsx"
related_targets: ["src/ui/Workspace.tsx","src/ui/InspectorTabs.tsx","src/ui/styles.css","src/ui/Settings.tsx","src/ui/Editor.tsx"]
---

# PinIt workspace revamp

Mode: Operate. Windows 11, offline Electron/React 19. User asked for a UI revamp using inspiration/ as a loose direction. Preserve artwork, quantities, independent physical dimensions, portable project files, exports, CMYK failure behavior, direct manipulation and numeric alternatives.

Visual authority: the four images in inspiration/ and palette.zip. The images are references, not shipping assets. Palette: ink #050809, ground #f1f7f9, primary #4ba6c2, secondary #93d0e3, accent #69c5e2. Dark text is used on the cyan action because white does not meet text contrast. Nunito Sans is self-hosted with its OFL notice.

## Direction contract

THESIS: A modular maker studio. The actual circular pin and live sheet are the working material; surrounding controls form compact, clearly separated trays.

OWN-WORLD: Cool white and cyan surfaces, rounded rectangular trays, a friendly workhorse sans, strong dark labels, blue selection feedback and one consistent outline-icon grammar. The block references contribute material rhythm and color, not a tiled wallpaper.

STORY: Import original artwork, position it inside the pin face, set exact quantities and geometry, inspect real packed sheets, then export. Empty, loading, missing-source, invalid, focused and exporting states remain explicit.

FIRST VIEWPORT: A compact project toolbar over a three-region workspace: artwork library at left, large artwork editor and sheet preview side by side in the center, tabbed Artwork/Sheet inspector at right. Import and export remain visible; size, rotation and offsets move into the Artwork inspector. At 1080×720 the three regions reduce and scroll locally.

FORM: Grounded direction 6, assembly tray; seed:bfbe2c3c291ae649. Code-led. User references constrain the material and palette. Other grounded sources considered: block portfolios, print color labels, paper sample books, maker instruction sheets, display-case modules and playful color charts. Borrowed discipline: specimen clarity for the live canvas, atlas distinction between reference and active layers, manual progressive disclosure, gate-board persistence, signage control hierarchy. No literal costumes or alternate navigations.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

No customer artwork is bundled. QA images are synthetic. The app keeps the 1080×720 desktop minimum; narrow browser layout is checked defensively. No new runtime library is needed.
