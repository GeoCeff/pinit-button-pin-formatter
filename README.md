# PinIt - button pin formatter

A desktop app for automatically arranging button-pin designs on printable sheets.

PinIt starts with a real workflow: a friend runs a button-pin business and spends too much time manually laying out different designs in Canva. The goal is to keep artwork creation in Canva and automate the repetitive print-layout work in PinIt.

**Status:** Project initialized. The application has not been implemented yet; there is no runnable app or installer.

## Planned first version

Windows is the initial desktop target. The first version should let the operator:

1. Import artwork exported from Canva, initially PNG or JPEG.
2. Choose a pin template and paper size, and enter quantities per design.
3. Adjust artwork position and crop within the template.
4. Automatically arrange the requested copies across printable sheets.
5. Preview the sheets and export a PDF with explicit physical dimensions.

The initial layout will use one pin template per job and support multiple designs. Mixed pin sizes on one sheet can be considered after the basic workflow is proven.

## Before implementation

Confirm these with the business owner using a sample job:

- Pin sizes and manufacturer templates, including face, wrap/bleed, and cut diameters. These are different measurements and must not be guessed.
- Paper sizes, printer margins, spacing, and cutting method.
- Typical design counts, quantities, Canva export formats, and image resolution.
- Current Windows version and printer workflow.
- Whether mixed pin sizes on a single sheet are needed for the first version.

Print a calibration sheet at actual size (100%) and measure it before treating any output as ready for production. PDF generation alone does not establish print accuracy.

## Scope

The intended workflow is local and offline. Artwork editing stays in Canva. Direct Canva integration, user accounts, order management, and cloud storage are outside the first version.

No application framework or dependencies have been selected yet. Choose the smallest desktop stack that supports local image import, preview, and dimensionally accurate PDF export once the workflow is confirmed.

## Artwork and contributions

Keep customer artwork, job data, and generated exports in `local-data/`, which is ignored by Git. Only include synthetic or explicitly licensed sample artwork in the public repository. Other locations are not automatically protected from commits.

Contributions are welcome. While the workflow is being defined, open an issue before starting a large feature and describe the real layout problem it solves.

## License

MIT. See [LICENSE](LICENSE). Customer artwork retains its own ownership and licensing.
