# Changelog

## 1.3.2 — unreleased candidate

- Handle reader taps explicitly: highlight a linked-note row, then tap again to open.
- Display web-link labels or fetched page titles as text; fall back to site names.
- Bound page-title requests and keep private/local destinations out of title fetching.

## 1.3.1 — unreleased candidate

- Start loaded lists at the top instead of centering New note in empty space; preserve two-tap selection.

## 1.3.0 — unreleased candidate

- Select Obsidian wiki and inline Markdown note links; Back restores the previous note.
- Render headings, bold, italic, strikethrough, lists, quotes and code on the watch.
- Preserve task byte offsets, image positions, long-text scrolling and hidden-folder rules.
- Requires a matching future Connector bundle; see docs/MARKDOWN_AND_LINKS.md.

## 1.2.0 — public beta

- Touch and button paging in both directions, retaining the boundary entry.
- Watch/settings sorting by name, modified date, created date or scoped tag.
- Programmable Return to top and Sort notes actions.

- Touch menus highlight a different item first; tap the highlighted item again to activate it.

- Wire menu taps to open folders/notes and activate task rows; tap plain note text for Actions.

- Up and Down single presses always navigate, including with older saved shortcuts.
- Remove Move up / Move down from Actions; customize Select press and long presses only.

## 1.1.0 — public beta

- Clean build with a matching embedded version; release packaging now rejects stale SDK metadata.
- Supersedes 1.0.1, which contained the refresh fix but retained the old package version label.

## 1.0.1 — superseded

- Refresh after a confirmed save even if the watch was already loading a list, note page or image.
- Refresh the open note for delayed append confirmations, including earlier queued captures.

## 1.0.0 — initial public beta

Published on 2026-09-05.

- Browse the entire Obsidian vault, including root notes, with automatic list paging.
- Dictate new notes, append to open notes, and dictate fuzzy searches.
- Pin folders and notes, hide selected folder trees, and delete Markdown notes with local recovery.
- Check and uncheck Markdown tasks directly from the watch.
- View local pictures and Excalidraw previews, including compressed drawings and ordinary `.md` names.
- Customize all side-button short/long presses, Pome themes, fonts, colors and marquee speed.
- Stable photo layout and full scrolling through oversized paragraphs.
- A new violet note-and-wave icon and complete setup, usage and troubleshooting guides.
- Free MIT open-source release with the unified Organik Apps Pebble Connector for macOS.

Existing development installations keep their watch UUID, pairing, settings and queued captures.
