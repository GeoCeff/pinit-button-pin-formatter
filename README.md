# PinIt - button pin formatter

A desktop app for automatically arranging button-pin designs on printable sheets.

PinIt starts with a real workflow: a friend runs a button-pin business and spends too much time preparing customer artwork and laying out different designs in Canva. The goal is to automate bleed preparation, circular positioning, duplication, and sheet layout, then save a PDF for the operator's existing color-correction and printing workflow.

**Status:** Project initialized. The application has not been implemented yet; there is no runnable app or installer.

## Planned first version

Windows is the initial desktop target. The first version should let the operator:

1. Import customer artwork, initially PNG or JPEG, including existing Canva exports.
2. Center and scale it on a square working area, leaving a margin around the design.
3. Fill the surrounding margin with a solid color sampled from the artwork's edge, with manual color adjustment.
4. Preview the artwork inside a circular cut boundary and inner face/fold guide, then adjust its position and scale so important content stays on the front face.
5. Select a pin template, A4 paper, and quantities per design; automatically duplicate and arrange copies across sheets.
6. Save an A4 PDF with explicit physical dimensions for manual color correction and printing outside PinIt. The current preferred handoff is CMYK, matching the operator's Canva PDF Print workflow; the color profile and conversion path still need validation.

The initial layout will use one pin template per job and support multiple designs. Mixed pin sizes on one sheet can be considered after the basic workflow is proven.

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

No application framework or dependencies have been selected yet. Start with the confirmed 44 mm face / 53 mm cut template. Choose the smallest desktop stack that supports local image preparation, physical-unit layout, preview, and a validated PDF color-export path.

## Artwork and contributions

Keep customer artwork, job data, and generated exports in `local-data/`, which is ignored by Git. Only include synthetic or explicitly licensed sample artwork in the public repository. Other locations are not automatically protected from commits.

Contributions are welcome. While the workflow is being defined, open an issue before starting a large feature and describe the real layout problem it solves.

## License

MIT. See [LICENSE](LICENSE). Customer artwork retains its own ownership and licensing.
