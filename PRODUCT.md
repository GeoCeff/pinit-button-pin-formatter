# PinIt product

<!-- impeccable:product-schema 1 -->

## Platform
web

Electron desktop application for Windows 11, running offline.

## Stack
The supplied plan selects TypeScript, Electron, electron-vite, React, Konva, pdf-lib, Vitest and electron-builder. Ghostscript handles ICC-based CMYK conversion.

## Users and purpose
Button-pin makers and small print shops prepare customer PNG/JPEG artwork, set physical circle dimensions, arrange exact quantities and export printable sheets. The operator performs color correction and printing in other software.

## Confirmed workflow
The user selected an artwork editor with sheet preview beside it. Multiple designs share one editable inner/outer diameter pair. Preserve original artwork, edits and quantities in portable project folders. The initial example is 44 mm face / 53 mm cut; other outer diameters are not known.

## Constraints
Keep artwork local. Do not silently change physical dimensions, alter the other circle diameter, substitute RGB for failed CMYK, or overwrite exports on failure. No accounts, direct printing, order management or artwork creation. Provide numeric alternatives to gestures and keyboard focus.

## Evidence and open checks
README.md and plan.md are the product brief. No customer artwork or measured A4 template is available. Physical print calibration, the operator's ICC profile and clean-machine installer acceptance remain external checks. Example capacities must be computed, never asserted from reported counts.
