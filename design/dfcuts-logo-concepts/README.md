# DFCuts — original SVG logo explorations

Sixteen original concept directions for **DFCuts**, each with a symbol and custom outlined wordmark. The references informed the bold monochrome weight, motion and contrast. The actual forms were redrawn around cutting, folding, offcuts and interlocking initials.

**Selected combination:** [06 Rail icon + 16 Shift wordmark](../dfcuts-logo/README.md). The combined asset pack preserves the chosen shapes and includes horizontal, stacked and reversed lockups.

## View the set

- Open [gallery.html](gallery.html) for individual concepts, dark-background previews, small-size samples and downloads.
- [All 16 concepts](all-concepts.png) — [editable comparison sheet](all-concepts.svg).
- [Four starting directions](shortlist.png) — [editable comparison sheet](shortlist.svg).
- [Small-size proof](small-size-proof.png) — every symbol at 64, 32, 24 and 16 pixels.

## Directions

| No. | Concept | Main idea |
| --- | --- | --- |
| 01 | Kerf | An offcut and an offset internal cutting channel |
| 02 | Foldline | A folded strip with a continuous letter junction |
| 03 | Offcut | A detached corner beside an open circular counter |
| 04 | Press | A die-cut block with a stepped interior |
| 05 | Splice | Offset loops sharing a cutting gap |
| 06 | Rail | An F spine joined to a curved return |
| 07 | Ribbon | A rising strip folded into a compact signature |
| 08 | Lift | A lifted corner opening the letter junction |
| 09 | Index | A compact, offset F counter in a rounded shell |
| 10 | Cipher | Squared counters and a chamfered outline |
| 11 | Relay | Two curved returns interlocking around a short bar |
| 12 | Hatch | A hinged opening through an angular shell |
| 13 | Gauge | A circular body with an offset gauge cut |
| 14 | Roundel | A curved strip turning inward into an F |
| 15 | Pocket | A pocket-shaped counter cut through a disc |
| 16 | Shift | A cutting channel separating two visual segments |

Start with **01** for the cut/offcut idea, **07** for motion, **11** for an abstract interlock, or **16** for a circular app mark. These are design judgments to help compare the set; a final mark has not been selected.

## Each concept folder

| File | Use |
| --- | --- |
| `mark.svg` | Dark symbol on a transparent canvas |
| `wordmark.svg` | Dark DFCuts wordmark on a transparent canvas |
| `mark-reversed.svg` | White symbol for dark backgrounds |
| `wordmark-reversed.svg` | White wordmark for dark backgrounds |
| `mark.png`, `mark-reversed.png` | 1024 × 1024 transparent raster exports |
| `wordmark.png`, `wordmark-reversed.png` | 2600 px wide transparent raster exports |

All logo lettering is outlined geometry. The masters contain vector paths, shapes and transparency masks, with no font or embedded-image dependency. They can be imported into Figma, Illustrator, Inkscape or another SVG editor. Keep transparency masks when editing or exporting the SVGs. Only the comparison-sheet labels use system text.

## Rendering and checks

Generated with the source in `build-logos.mjs`, using the repository's existing sharp dependency. From the repository root:

```powershell
node design/dfcuts-logo-concepts/build-logos.mjs
```

The builder rasterizes the actual SVG files, checks visible artwork and transparent margins, detects clipped edges, confirms all sixteen symbol and wordmark silhouettes differ, and verifies that reversed versions preserve the same transparency silhouettes. The manifest records export dimensions and alpha hashes.

Small-size samples are included for visual comparison. Fine cuts vary in clarity at 16 px; choose a direction before preparing final installer, taskbar and favicon assets.

This folder is a design exploration pack. It does not replace the application's current artwork.
