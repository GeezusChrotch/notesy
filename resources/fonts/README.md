# Time 2 fonts

Pome bundles five fonts from the Google Fonts repository for the Pebble Time 2 build
only. Each family is compiled at 14, 18, 22, 26, and 30 points using the printable
ASCII character set. Pebble Time continues to use system fonts and does not carry
these resources.

Downloaded from `google/fonts` commit
`45b0855d499c093e4d1bd08926fec4e1a582e225` on 2026-09-01:

- Inter: `ofl/inter/Inter[opsz,wght].ttf`
- Roboto: `ofl/roboto/Roboto[wdth,wght].ttf`
- Open Sans: `ofl/opensans/OpenSans[wdth,wght].ttf`
- Montserrat: `ofl/montserrat/Montserrat[wght].ttf`
- Poppins: `ofl/poppins/Poppins-Regular.ttf`

The variable sources for Inter, Roboto, Open Sans, and Montserrat were converted to
static Regular-weight 400 instances with FontTools before being committed, ensuring
Pebble's rasterizer does not select the thinnest variation-axis value. Poppins was
already supplied as a static Regular file.

All five are distributed under the SIL Open Font License. The corresponding license
texts are preserved in `resources/fonts/licenses/`.
