# Note links and Markdown — 1.4.4

Notesy 1.4.4 requires Organik Apps Pebble Connector 0.7.0 or later for matching note parsing and style markers. Earlier candidate validation sections below record the development history.

## Open linked notes

Notesy keeps a link's label in its paragraph and adds an **Open linked note** row
after that paragraph. Highlight the row and press Select. On touch watches, tap a
different row to highlight it, then tap the highlighted row to open it. Keep the
note-view Select assignment on Normal navigation to activate links and tasks.

Back (or a rightward swipe) returns to the previous note and restores the selected row and scroll position.
Up to twelve linked-note steps are retained; Back through that history to open more.
Append, pin and delete act on the note currently open, including linked notes.

Supported links include `[[Note]]`, `[[Folder/Note|Custom label]]`,
`[Custom label](../Folder/Note%20Name.md)`, vault paths and unique short filenames.
Links with `#Heading` or `#^block-id` open the target note **at its beginning**;
precise heading/block jumps are not implemented. Same-note links open that note at
the beginning too. Short filenames shared by several folders are rejected as
ambiguous unless an exact current-folder or vault-root path resolves them.

Missing, hidden, ambiguous and unsupported destinations show an explanation and
never create a note. Hidden-folder rules also apply to note links. Web addresses,
Obsidian commands, external files, symlinks and plugin actions are not opened.
This is ordinary vault-note navigation, not execution of Obsidian plugins.

## Formatting on the small screen

- ATX headings (`#` through `######`) and underlined Setext headings use bold type
  with three size levels.
- Inline `**bold**`, `*italic*`, `_italic_`, combined emphasis and `~~strikethrough~~`
  are drawn within the paragraph. Bold follows the selected reading font; italic
  uses the bundled Open Sans Italic face. Available watch glyphs limit scripts.
- Lists preserve bullets or numbers. Quotes and fenced code use an inset vertical
  rule. Inline code is underlined and retains literal content.
- Tasks remain interactive checkboxes. Pictures and Excalidraw retain their existing
  preview behavior. Text and previews scroll continuously; only links and task checkboxes can receive focus.

Inline HTML spans and common emphasis tags retain readable text and supported bold, italic, underline or strikethrough styling. Line breaks and common HTML entities are supported. Font/color/layout attributes use the selected watch theme instead. See [formatting correction](HTML_FORMATTING_VALIDATION.md) for the matching watch and Connector requirement.

This is a compact Markdown subset. Tables remain text; full HTML/CSS layout, mathematical
notation, reference-style links, transcluded notes, callout styling and plugin
rendering are not implemented. Code is displayed without syntax highlighting.
Formatting and navigation never rewrite Markdown on disk; checking a task still
changes only its checkbox marker after the Connector acknowledges the save.

Reference: [Obsidian internal links](https://obsidian.md/help/links).

## Reader touch and web titles — 1.3.2 candidate

Tap an **Open linked note** row to highlight it, then tap the highlighted row to
open it. This also works through the reader's explicit touch handler, independently
of custom button assignments. The link label in the paragraph remains text; the
separate link row is the touch target. Back (or a rightward swipe) returns to the previous note.

Web links no longer create an unavailable-link action. Named Markdown links and
HTML anchors display their existing label, and URL labels can use a supplied
Markdown title. Bare URLs and autolinks show the page title fetched by the matching
Connector, with the site hostname as fallback. These are text rows, not web-browser
actions. The Connector requests public page metadata directly; see [privacy](../PRIVACY.md).
This requires the new matching gateway; installed Connector 0.6.0 does not include
the web-title change yet. Reader tapping is a watch-only change.
