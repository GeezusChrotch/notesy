# Notesy 1.4.2 inline HTML and formatting correction

Josh confirmed that 1.4.1 fixed blank screens and improved scrolling, then reported literal HTML spans/styles and unintended strikethrough.

The old inline protocol used bytes 1–16 for all style combinations. These overlapped tab (9), line feed (10) and carriage return (13). A newline in a formatted paragraph could therefore enable bold/strikethrough, and chunking could carry that accidental style onward. Style encoding now uses non-whitespace bytes (1–8 and 24–31); line breaks remain line breaks. The watch also excludes whitespace when decoding legacy markers. Pair the new watch package with the matching gateway to render intentional strikethrough combinations correctly.

HTML is processed as text, without a browser or executing CSS, scripts or plugins. Supported inline tags include spans, bold/strong, italic/emphasis, underline, strike/delete and code. Supported CSS hints are font weight, italic/oblique font style and explicit text decoration. HTML line breaks and common block boundaries become line breaks; named/numeric entities decode into text. Unsupported colors, font families, sizes and layout attributes are omitted in favor of the selected watch theme. Nested styles restore the enclosing style when they close. Hidden inline comments/scripts/styles are omitted. Literal HTML inside Markdown code or escaped HTML remains visible as code/text.

This pass does not implement full HTML/CSS layout or Obsidian plugin rendering. Tables still use compact text. It does not edit the original Markdown; task offsets still refer to the original source bytes.

Validation:

- All 80 automated tests pass, including nested HTML/CSS styles, entities, code preservation, task offsets and internal links.
- Regression tests preserve line breaks across chunks, ensure plain multiline content draws no strikethrough, and confirm explicit/combined strikethrough resets afterward.
- Both Basalt and Emery builds/package validation pass.
- Emulator screenshots show supported HTML emphasis without leaked attributes, normal multiline text, intentional strike followed by normal text, and literal code. Existing linked-note navigation is exercised with the formatting fixture.
- Scrolling architecture from 1.4.1 remains unchanged.

Requires the matching Connector gateway (including new `gateway/html.js`) and Notesy 1.4.2 watch package. Physical-watch acceptance and deployment are separate; this candidate is not published.

PBW: `dist/Notesy-1.4.2.pbw`.

SHA-256: `593993781526774e575221e98a2e2ae71bb84bb7cbdc5b0d6e6288d6c396d336`.

Reproduce with `npm run package` and `WATCH_TEST_FORMATTING=1` when running `scripts/test-reader-touch.py` through the Pebble tool's Python. The fixture uses disposable notes only.
