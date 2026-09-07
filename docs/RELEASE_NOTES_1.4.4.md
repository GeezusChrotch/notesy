# Notesy 1.4.4 — a more natural note reader

Requires **Organik Apps Pebble Connector 0.7.0 or later**. Update the connector before the watch app; existing pairing, vault choices, pins, hidden folders and pending captures are preserved.

- Scroll notes as continuous documents. Ordinary text, photos and drawings no longer behave like selectable menu rows; only links and task checkboxes are interactive.
- Fix blank stretches and skipped text in long notes, and use smaller animated button-scroll steps.
- Open linked Obsidian notes with Select or touch, then return with Back or a rightward swipe. Show web-link labels or page titles instead of long URLs.
- Render more Markdown and inline HTML, including headings, bold and italic. Hide unsupported HTML tags and styles, and fix accidental strikethrough caused by line breaks.
- Use the full reader height. Save/error feedback appears briefly instead of reserving a permanent gesture footer.
- Configure Double Back separately for folder and note views in phone settings; both default to Actions. Up/Down always navigate. Sort and note operations remain available on the watch.
- Start menus at the first row without blank space above them, while preserving two-tap activation and scrolled positions.

Free, MIT open source. Pebble Time and Time 2 supported. Pictures/drawings are scaled local previews; full Obsidian plugin layouts, remote images and browser navigation are not supported.

## Validation and beta status

Automated tests and both watch builds pass. Native tests cover scrolling, task/link interaction, formatting, settings migration, Double Back and startup positioning; earlier emulator runs verified the reader and top-aligned menus. The exact 1.4.4 release artifact has not been installed on a physical watch or accepted by the user. Earlier 1.4.1 scrolling improvements received positive feedback; 1.4.3 was subsequently installed, while the shared startup correction remained pending. Fresh Mac/phone setup and final end-to-end hardware acceptance remain pending. This release remains a public beta.
