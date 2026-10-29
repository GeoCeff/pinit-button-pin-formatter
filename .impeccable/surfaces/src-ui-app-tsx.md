---
version: 1
slug: "src-ui-app-tsx"
primary_target: "src/ui/App.tsx"
related_targets: ["src/ui/Workspace.tsx","src/ui/Editor.tsx","src/ui/QuickStart.tsx","src/ui/controls.tsx","src/ui/styles.css","src/ui/quick-start.css","src/components/ui/mac-style-floating-dock.tsx"]
---

# PinIt print studio refresh

Mode: Operate. The current request is a complete frontend revamp using UI/UX Pro Max, Emil Design Engineering, Better UI, Better Typography and Find Skills. The follow-up explicitly removes hard-to-read print/footer copy and requires a conventional feature branch and a completed commit.

THESIS: Separate artwork selection, positioning and printed output. Keep the canvas stable and the print summary easy to scan.

OWN-WORLD: Locally bundled Geist, cool neutral workspace, white surfaces, restrained blue identity and dark blue actions. Customer artwork supplies the expressive color. DESIGN.md and the implemented UI define the current values; older generated snapshots record prior iterations.

STORY: Import in the artwork rail, select a design, position or adjust it, check the paper preview and export. Compact desktops move the rail below the canvas. The toolbar sits above the editor. Removal remains in the Library with confirmation. Help retains the optional three-step tutorial and explains gestures.

FIRST VIEWPORT: 72px project bar, 218px artwork rail, flexible studio and 292px paper preview. At compact desktop widths use a 56px bar and 84px artwork tray; the preview spans the studio and tray. At narrow widths stack the areas and show a complete artwork card below Import. Preserve a cut circle of at least 300px at 1080 x 720.

READABILITY: Root 16px; dense tool body and normal inputs 14px; narrow inputs 16px. Print labels and rows are 14px, counts 28-32px. Page navigation is current/total with a complete accessible label. Remove persistent drag/resize/Alt prose and duplicate sheet/print reminders. Layout and Wrap use short rows. Copies / sheet follows the selected cap.

INTERACTION: Reserve alignment-feedback height so badge text/buttons never move the canvas during dragging. Keep numeric gesture alternatives. Buttons press to 0.96 only for pointer actions with normal motion. Use interruptible transitions; keyboard actions are immediate and reduced motion keeps opacity only. Retain native modal isolation, Escape and focus restoration.

VERIFICATION: Unit and file tests, production build, wide/compact/narrow screenshots, 200% zoom, full artwork cards at 320px, readable print labels, caps, keyboard/reduced-motion paths, portable persistence, all export formats, cancellation and real drag/resize/center/Alt behavior.

Review and verification record: .impeccable/print-studio-refresh.md. Git branch: feat/print-studio-redesign.
