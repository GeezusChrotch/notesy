# Notesy 1.1.0 — public beta

Published on 2026-09-05 with the confirmed-save refresh fix for Quick Dictate and Stitch.

| Item | Status |
| --- | --- |
| Source | https://github.com/GeezusChrotch/notesy |
| GitHub beta download | https://github.com/GeezusChrotch/notesy/releases/tag/v1.1.0 |
| Website | https://geezuschrotch.github.io/notesy/ |
| Pebble Appstore | https://apps.repebble.com/a9d4515681c34b5088993dc6 — public, version 1.1.0, Time/Time Steel and Time 2 |
| License and credits | MIT, original icon, full acknowledgments and third-party notices included |
| Build | 49 automated tests pass; Basalt and Emery compile |
| Refresh regression | Compiled Emery checks pass save-during-list-load and append-during-reader-load cases |
| Stitch | Compiled Emery simulated-voice checks pass create/append sections, Quick Dictate, Back cancellation, stale/delayed receipts and append shortcut |
| Reader | Earlier compiled emulator regression covers long-text/photo scrolling, tasks, drawings and paging |
| Physical watch | Earlier development version was installed; final physical-watch Stitch and fresh Mac/phone setup checks remain pending |
| Connector | The companion 0.3.0 release is coordinated separately at https://github.com/GeezusChrotch/organik-pebble-connector/releases/latest |

PBW SHA-256: `405ac8a653353812a2b8fa0c2f37df49d96f144ae38e6945c8add74fa091667e`.
The store publisher selects the exact reviewed dist PBW; it does not upload the local SDK
source-map build. Source and artwork archives have separate hashes in `dist/SHA256SUMS`.

Pairing, settings and pending captures remain compatible. This publication did not install a
new app on a physical watch or edit live vault notes. The initial release is marked beta until
remaining hardware/fresh-setup checks are complete. See [RELEASING](../RELEASING.md).
