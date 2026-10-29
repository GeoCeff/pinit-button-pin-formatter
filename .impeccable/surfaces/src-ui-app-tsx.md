---
version: 1
slug: "src-ui-app-tsx"
primary_target: "src/ui/App.tsx"
related_targets: ["src/ui/Workspace.tsx","src/ui/Editor.tsx","src/ui/QuickStart.tsx","src/ui/controls.tsx","src/ui/styles.css","src/ui/quick-start.css","src/components/ui/mac-style-floating-dock.tsx"]
---

# PinIt editor usability refinement

Mode: Operate. Latest user critique specifies obvious centering, round corner handles, two default circle guides, removal of arbitrary blocks/tiny app footer, stronger Import/artwork tray, a first-run/replayable tutorial, accessibility and immersive blur/fade feedback. These concrete changes supersede the earlier decorative details. Direct to code, no Figma. Product truth, original images, independent physical dimensions, portable projects and exports remain.

THESIS: Make alignment and the next action unambiguous. Keep the artwork and physical sheet visible together.

OWN-WORLD: Preserve locally bundled Geist, cool white #f1f7f9, cyan/sky reference surfaces, professional neutral canvas, white panels and navy actions. A purposeful cut/face pin mark replaces the stud logo; stray canvas blocks are removed. Selection uses a dark border/checkmark and readable artwork thumbnails/copy counts.

STORY: Optional first-use tutorial → import → select artwork → fit/drag or exact adjustments → obvious centered confirmation/one-click correction → copies/sheet verification → export. Help reopens the three-step tutorial. Skip, close and completion are remembered locally. Removal lives in the full Library with confirmation, away from the selection tray.

FIRST VIEWPORT: 60–64px project bar; flexible editor and300–332px preview; shared96px artwork tray/dock row and no app footer. The56px artwork header retains thumbnail/name/geometry/fit/adjustment controls. A prominent centered check sits above the artwork. Round handles have larger invisible hit regions and a fine dashed selection edge. Cut and Face are the two default guides; optional Safe is off. Target cut-circle≥300px at native minimum1080×720. Toast success does not consume working height; errors stay in flow.

FORM: Retained historical surface provenance seed:7e89320490c7d9c4; no new direction roll or concept/comp approval claimed. Existing-world code-led refinement. Pointer-only tutorial/modal blur is bounded to220ms and3–4px; drawer feedback180ms. Keyboard actions are immediate and reduced motion removes movement/blur. Native dialogs isolate the background and restore focus. Numeric fields describe units. Export destinations persist; other success notices pause on hover/focus. Dock base40/gap12 retains Gaussian max1.35/spread54/160ms motion with Help before Export.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Verify first-use/skip/replay/completion/import, reload persistence, native modal isolation/Escape/focus restoration, keyboard/reduced-motion, two-guide default, gallery-only deletion, desktop1500×960, minimum1080×720, defensive390px and all long/error/Sheet/adjustment/export/hover/alignment states. Preserve source bytes, numeric gesture alternatives, physical dimensions, failed/canceled export cleanup and editing-overlay exclusion. No new shipping raster is introduced. See .impeccable/editor-usability-brief.md for the current complete scope.
