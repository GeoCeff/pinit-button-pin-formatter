---
version: 1
slug: "src-ui-app-tsx"
primary_target: "src/ui/App.tsx"
related_targets: ["src/ui/Workspace.tsx","src/ui/Settings.tsx","src/ui/styles.css","src/components/ui/mac-style-floating-dock.tsx"]
---

# PinIt block workbench

Mode: Operate. Offline Windows Electron/React editor. This replacement is explicitly requested by the user: change layout/structure and follow the inspiration's actual blocks, palette and style; integrate the pasted dock directly in code. This replaces the earlier loose-reference interpretation. No Figma work.

## Direction contract

THESIS: A pin-making workbench assembled from interlocking colored blocks. Remove the old library/editor/inspector three-column dashboard.

OWN-WORLD: Reference cyan #4ba6c2, sky #93d0e3, accent #69c5e2, cool white #f1f7f9 and near-black #050809. Geist, substantial typography, joined rectangular modules, rounded outer corners, and precise embossed circular studs. Material geometry is explicitly pinned by the user.

STORY: Import artwork, select it from a horizontal shelf, position it in the large editor, disclose exact adjustments when needed, set up sheets in a dedicated view, inspect the persistent paper preview, then export.

FIRST VIEWPORT: Joined project blocks across the top. A dominant editing stage at left; tall white print preview at right. The artwork shelf runs below the editor. The supplied floating dock sits in its own reserved bottom bay and switches Artwork, Sheet and Library views or opens export. The empty editor pairs a two-line heading with the actual pin geometry. Sheet setup replaces the editing region with a modular form workspace.

FORM: Reference-led block workbench. Surface seed:7e89320490c7d9c4; Python variation seed291 chose editorial split / Geist. User instructions supersede the earlier visual world and generic restrained-app decoration rules. The supplied component is adapted to real editor actions, keyboard operation, reduced motion and transient-ref pointer updates. Code-led; no comp or Figma approval is claimed. Marketing marquees, scroll pinning and scrubbing are adapted to task feedback, because the working editor keeps a fixed viewport.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Keep actual source images, print dimensions, portable storage, export failure handling, quantities, drag/resize/center behavior, keyboard alternatives and validation. Verify desktop1500x960, native minimum1080x720, and defensive390px fallback. All QA artwork is synthetic. Git branch codex/block-studio-revamp; finish with a local commit.
