---
version: 1
slug: "src-ui-app-tsx"
primary_target: "src/ui/App.tsx"
related_targets: ["src/ui/Workspace.tsx","src/ui/Editor.tsx","src/ui/Settings.tsx","src/ui/WorkbenchNavigation.tsx","src/ui/CutGeometry.tsx","src/ui/styles.css"]
---

# dfCuts workbench redesign

Mode: Operate. Complete UI revamp using the user-invoked Figma, taste, UI and typography skills. Conventional branch: feat/dfcuts-workbench.

THESIS: A continuous print workbench. Import and select on the left, position in the middle, verify output on the right. Keep customer artwork visually dominant.

OWN-WORLD: Achromatic ledger, seed 350303977. Warm paper, charcoal actions, locally bundled Geist, hairline separators, bespoke SVG cut/face geometry. DESIGN.md and source define current tokens. No marketing hero or scroll-pinned sections in this editor.

STORY: Import, select, set Copies beside the artwork name, position/adjust, inspect the sheet and export. Stable document navigation reaches Artwork, Sheet, Library, Help and Export. Setup stays directly available in the preview. Library owns confirmed removal. Native dialogs retain focus restoration and Escape.

FIRST VIEWPORT: 64px header and 48px navigation; 232px artwork rail, flexible canvas, 300px preview. At medium widths reduce rail/preview to 216/280px. Compact desktops move artwork below the canvas; the minimum-window cut circle is 318px. Narrow layouts stack, with 16px phone margins and full-width artwork cards in a horizontal tray.

READABILITY: Root 16px, body 14px, supporting text 12-13px, phone inputs 16px, print totals 28-32px with labels above. Unit fields retain stored precision. Names have full-value tooltips, errors wrap, changing numbers use tabular figures.

INTERACTION: Direct drag/resize/rotate, snap/Alt bypass and numeric alternatives. Stable alignment feedback. GSAP navigation underline updates in 150ms for pointers and immediately for keyboard/reduced motion. Coarse pointer controls are at least 44px.

VERIFICATION: Production build, 23 unit/file tests, full desktop acceptance, real pointer alignment checks, responsive browser review, 320px and 200% zoom. Review: .impeccable/workbench-redesign.md. Editable Figma: https://www.figma.com/design/Fqz8RTVxXUga49GEgC92R1.
