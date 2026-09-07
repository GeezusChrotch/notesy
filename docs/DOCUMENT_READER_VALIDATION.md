# Notesy 1.4.0 document reader candidate

The old reader used menu selection to move between every paragraph and preview. This candidate keeps bounded block layout internally but scrolls by document pixels instead. Ordinary text, images and Excalidraw previews never get focus or a selection background. Tapping them does nothing. Up/Down moves a small reading step; vertical swipes move by their travel distance. Rightward swipe and Back retain linked-note history and the document scroll position.

Only linked-note controls and task checkboxes receive focus. Button scrolling focuses the nearest fully visible control, so Normal navigation Select opens/toggles it. Touch focuses a different control without recentering the document; tapping it again activates it. Text and previews remain stationary while focus changes. With no focused control, physical Normal navigation Select still opens Actions; Double Back always opens Actions.

Previews load automatically when visible, keeping a stable layout during loading. To fit smaller watches, one decoded preview is retained at a time. Adjacent pictures can briefly reload as visibility changes. A failed preview can be retried by scrolling it completely out of view and back. Notes still load 15 blocks per batch, advancing at the document edge and restoring the preceding batch's bottom when scrolling upward. Loading is bounded rather than silently truncating a note.

Validation:

- All 75 automated tests pass; Basalt and Emery build/package checks pass.
- Host-compiled native tests cover fixed-distance scrolling, clamped document offsets, control-only focus, automatic visible-image requests, both batch boundaries, inert text/image taps, tap activation and swipe Back.
- Actual Emery QMP touch tests pass inert paragraph taps, link focus/open, physical Select, return to the same document position, vertical swipes, Actions and Back.
- Large-font emulator regression passes the entire long paragraph, automatic wide/tall previews, checkbox after the pictures and reverse scrolling to the beginning. Screenshots are under `docs/validation/1.4.0/`.
- Automatic embedded image and Excalidraw loading also pass a dedicated emulator run; the drawing preview is visually verified.
- The emulator installer began rejecting repeated installs against its persistent flash. The test runner now uses a fresh local flash image; this does not wipe SDK credentials or touch the physical watch.

This is a watch-only candidate compatible with the installed Notesy 1.3.3 gateway. Neither the physical watch nor the Connector was updated by this work. Physical reading/scrolling acceptance remains pending; no publication occurred.

PBW: `dist/Notesy-1.4.0.pbw`.

SHA-256: `1358082190d4443533a09e84eed7524aba08274b5a5a89836624c09b994c236e`.

Reproduce with `npm run package`, then run `scripts/test-reader-touch.py` using the Pebble tool's Python. Set `WATCH_TEST_DOCUMENT_MEDIA=1` for long-text/photos, or `WATCH_TEST_DOCUMENT_DRAWING=1` for automatic embedded drawing loading. All fixtures use a disposable vault and emulator only.
