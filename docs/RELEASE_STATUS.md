# Coordinated release status

Prepared locally for Notesy 1.0.0 and Organik Apps Pebble Connector 0.2.0. Publication is pending.

| Item | Status |
| --- | --- |
| Notesy MIT license and third-party notices | Included |
| Original store icon and 25px watch launcher glyph | Included |
| Setup, user guide, troubleshooting and privacy | Included |
| Store listing and release notes | Drafted |
| Notesy build | 49 tests pass; Basalt and Emery compile |
| Stitch dictation | Compiled Emery fixture verifies create-once/append sections, Quick Dictate, Back cancellation, stale and delayed confirmations, and append shortcut; physical microphone/phone validation remains |
| Existing functionality | Prior physical watch install and connector rendering confirmed; emulator regression covers scrolling, tasks, previews and paging |
| New release candidate | 1.0.0 compiled emulator passes tasks, image/drawing previews and paging; public icons/screenshots, PBW and source/archive checks pass |
| Cross-app migration docs | Prepared in Beepster, Reminderz and Pome; PebClaw/Tesla status clarified |
| Connector 0.2.0 | Connector task owns signed installer/feed and live installation. Its earlier bundle predates Stitch; the updated Notesy PBW must be included in the next Connector package |
| Public GitHub repos / releases / Pages / Notesy listing | Not published; planned URLs must be verified after publication |
| Fresh user setup | Final clean-account/fresh-phone validation remains required before launch |

No source host, store or social announcement has been published by this preparation task.
Existing installations and pairing are preserved. Other app binaries need no protocol change
solely to migrate; their older settings may still call their component a “Beepster Connector”
or “Reminderz Connector.” The migration guides point users to the corresponding unified page.

See [RELEASING](../RELEASING.md) for publication order and rollback. Do not advertise the source
repositories or installer links as live until those resources actually exist.

Release PBW SHA-256: `05792b06560037db15dc34bd6339692080b849f0a88f54289232ca250194f295`.
The source and artwork archives have their own hashes in `dist/SHA256SUMS`. The release page was
visually checked at a narrow browser width; local documentation links and native screenshot/icon
sizes were verified. Notesy’s store description is 1,253 characters. No new live vault edits or
watch installs were performed during release preparation; compiled emulator tests used fixtures.
