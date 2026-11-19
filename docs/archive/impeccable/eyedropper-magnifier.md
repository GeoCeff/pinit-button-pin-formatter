# Eyedropper refinement

Scope: source-pixel sampling and its temporary editor overlay. Existing workbench identity and the artwork selection fix are preserved. No dependencies added.

| Before | After | Why |
| --- | --- | --- |
| Eyedropper mode retained the ordinary cursor. | SVG pipette cursor with white contrast outline and tip hotspot. | Shows that the next artwork click samples color. |
| Color was applied without a pixel preview. | 11 × 11 original pixels at 10×, with an outlined center, swatch and hex value. | Makes adjacent colors distinguishable before committing. |
| Sampling could reach hidden source pixels beyond the cut. | Reject positions outside the visible cut, source bounds and fully transparent pixels. | The chosen color belongs to visible artwork. |
| Cancellation required the toolbar button. | Escape cancels; arrows step through pixels; Enter/Space confirms. | Keeps precise picking usable from the keyboard. |
| Touch had no inspect-before-commit phase. | Press/drag previews; release applies. | Provides a usable touch equivalent to hovering. |

The preview reads a reused 11px canvas directly from the original decoded image. It reverses the artwork's rotation, scale and offsets. Nearest-neighbor display preserves individual pixels. The overlay uses transform positioning, flips away from edges and stays within the editor. No animation is added to repeated pointer movement.

Verification: production build and 23 baseline unit/file tests passed. The dedicated Electron check passed for exact center/neighbor pixels on a rotated, scaled and offset synthetic image, hover-only preview, click confirmation, Escape cancellation, transparency/outside-cut rejection, keyboard pixel steps, compact bounds and emulated touch. Desktop and compact screenshots visually inspected. Alignment/selection and the complete desktop import/save/open/relink/RGB PDF/CMYK PDF/PNG/JPG workflow also passed. Keyboard pixel changes use a polite color announcement; pointer movement keeps it silent.

Not verified: physical touch hardware and manual screen-reader use. The installer is not rebuilt for this change.
