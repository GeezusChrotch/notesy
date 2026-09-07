# Notesy 1.4.6 — PDFs and improved image previews

Requires **Organik Apps Pebble Connector 0.8.0 or later**. Update the Connector before the watch app. Existing pairing, vault choices, pins, hidden folders and pending captures are preserved.

- Open and pin PDF files from vault folders, or follow a note link to a PDF.
- Scroll embedded PDFs as numbered pages within a note. Pages load as they come into view, including beyond the first group of 15 items. Obsidian `#page=3` embeds show the selected page.
- Choose **Natural**, **High contrast** or **Original** under phone settings → Themes → Photos and drawings. Natural balances previews for Pebble's limited colors; High contrast strengthens faint details; Original retains the previous conversion.
- Apply the new processing to photos, Excalidraw/SVG drawings and PDF pages. Drawings and PDFs use a clean-line treatment without photo dithering. Original attachments remain unchanged.

Save the image setting and reopen a note to reload its previews. PDFs are read-only whole-page previews with no zoom or text selection; small print may be difficult to read. Limits are 20 MB and 1,000 pages per PDF. Locked, damaged or oversized files show an explanation. Dictate into a separate note and manage PDF attachment deletion in Obsidian.

Thanks to czmanix for the MIT-licensed Pebble color-optimizer palette samples. Full attribution is included in the shared converter and third-party notices. Notesy remains free and MIT open source.

## Validation and beta status

All 91 automated tests and clean Basalt/Emery builds pass. Tests cover multi-page and rotated PDFs, page-specific embeds, image modes, cache separation and preserved attachment bytes. The packaged Connector renderer also passed the PDF fixtures, and the exact 1.4.6 watch package was installed successfully. Physical visual acceptance of the new PDF/image previews and fresh Mac/phone setup remain pending. This is a public beta; installation success is not a claim that every feature has been watch-tested.
