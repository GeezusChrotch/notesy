# Notesy 1.2.0 — public beta

Release date: 2026-09-06.

- Source: https://github.com/GeezusChrotch/notesy
- Release: https://github.com/GeezusChrotch/notesy/releases/tag/v1.2.0
- Website: https://geezuschrotch.github.io/notesy/
- Store: https://apps.repebble.com/a9d4515681c34b5088993dc6
- Requires Organik Apps Pebble Connector 0.5.0 or later.
- 58 automated tests pass; Basalt and Emery builds pass. Host-compiled native callbacks cover bidirectional page boundaries and Return to top. Real-browser settings checks cover sorting and shortcuts.
- Connector integration passed all 58 Notesy tests with its built renderer helper, 27 Connector checks and signature verification.
- The exact package below was installed and Josh reported that everything looks great. This is user acceptance feedback, not a claim of exhaustive physical testing. Fresh Mac/phone setup remains pending.

PBW SHA-256: `fc4cd4f2cf70599095437e76083b33ac49c049ab61ae0f6dc27569e28cb3dee8`.

The publisher uploads this exact reviewed package. Documentation-only release updates do not rebuild it. Public source/artwork archives have their own checksums. Pairing, vault state and delivery queues are preserved. See RELEASE_NOTES_1.2.0.md and SORTING_VALIDATION.md.

## Unpublished 1.3.3 candidate

Reader tap activation and link-heavy scrolling improvements are built and emulator-tested. Physical-watch acceptance and Connector deployment are pending. See [validation and exact package hash](READER_TOUCH_PERFORMANCE_VALIDATION.md). The public beta record above remains unchanged.

## Unpublished 1.3.4 candidate

Rightward swipe Back in the note reader and top-aligned Actions/dictation/sort menus are built and emulator-tested. This watch-only candidate works with the installed 1.3.3 gateway. See [validation and package hash](SWIPE_BACK_ACTIONS_VALIDATION.md). Physical installation and acceptance are pending.

## Unpublished 1.4.0 candidate

The reader now scrolls as a document: ordinary text and previews are not selectable, images load automatically, and links/tasks retain controls. Built and emulator-tested; current installed gateway is compatible. See [document reader validation and exact package hash](DOCUMENT_READER_VALIDATION.md). Physical installation and reading acceptance remain pending.

## Unpublished 1.4.1 candidate

Fixes blank long-note screens by replacing menu rendering with ordinary document layers; adds smaller animated button steps and finger-tracked scrolling. Includes adaptive preview memory use on Basalt. Current Connector remains compatible. See [validation and exact package hash](LONG_NOTE_SCROLL_VALIDATION.md). Physical-watch acceptance remains pending.
