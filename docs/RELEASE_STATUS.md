# Notesy 1.4.8 — public beta release preparation

Publication authorized by Josh through the coordinator on 2026-09-08. Public minimum Connector 0.8.1; the coordinator exclusively owns the Pebble dashboard.

- Runtime source `ac26636ffafeba7ffb47bbda246ba0912d338fbf`; no newer runtime changes.
- Exact installed PBW SHA-256 `fd1ee0e465453ebb8e1538caf6277ab1ee16a92cdcf99e6a34c242bb1b4691d1`.
- 94 tests, both builds and isolated Emery media/scrolling checks passed. No rebuild during release preparation.
- Exact package installed successfully; physical full-width media acceptance remains pending.
- Publication and public download verification are pending; older entries are historical.

See [release notes](RELEASE_NOTES_1.4.8.md) and [media validation](MEDIA_WIDTH_VALIDATION.md).

---

# Notesy 1.4.7 — published public beta

Publication authorized after Josh reported “Working great” for the installed task-text fix. Requires matching public Organik Apps Pebble Connector 0.8.1 or later. The coordinator exclusively owns the Pebble dashboard.

- Frozen runtime source: `6820b8c802303d188ea914f5176d27c30f5f5490`.
- Exact installed PBW SHA-256: `4de0c32cc86e851fc75bb9c390d3d941976c61ae92162192430e20257b13db03`.
- 93 automated tests and clean Basalt/Emery builds passed; packaged Connector task-text checks passed.
- Physical task-text acceptance confirmed. Fresh setup and broader PDF/image visual acceptance remain separate.
- Published on GitHub after Connector 0.8.1 public verification; release target `4622e2df4b5693057143442481bfc8fbd7b294b2`. All five anonymous public downloads match the prepared hashes. The accepted PBW was not rebuilt.
- Live website returned HTTP 200 with version 1.4.7 and minimum Connector 0.8.1. See [publication verification](PUBLICATION_VERIFICATION_1.4.7.json).
- The coordinator owns store publication; this thread did not change the dashboard.

See [release notes](RELEASE_NOTES_1.4.7.md) and [task-text validation](TASK_TEXT_VALIDATION.md). Older entries below are historical.

---

# Notesy 1.4.6 — published public beta

Publication authorized through the release coordinator on 2026-09-07. Requires public Organik Apps Pebble Connector 0.8.0 or later. This task owns GitHub and Pages; the coordinator exclusively owns the Pebble dashboard.

- Frozen runtime source: `31ac94a43a9380754a91dc9f115d5dc09f88e5ed`; release documentation changes do not rebuild the installed PBW.
- 91 automated tests and clean Basalt/Emery builds pass. Packaged Connector PDF fixtures also passed.
- Exact 1.4.6 PBW installed successfully via the coordinated serial phone installer. Physical PDF/image visual acceptance and fresh setup remain pending.
- Local Connector 0.7.3 build 18 was verified with the PDF runtime; public supported minimum is 0.8.0.
- Published on GitHub after Connector 0.8.0 public verification. Release target: `194611e868ee13ffc613b48b3ea51a12f4f0cfdd`. All five anonymous public downloads match the prepared SHA-256 hashes.
- Live website returned HTTP 200 with 1.4.6 and minimum Connector 0.8.0. See [publication verification](PUBLICATION_VERIFICATION_1.4.6.json).
- Store publication is tracked by the coordinator; this thread did not change the dashboard.

PBW SHA-256: `f16357d690ca1c6bad33d98d5a9d482d5ef4438e7dcfedf8c2858ed9fa16f225`.

See [release notes](RELEASE_NOTES_1.4.6.md), [PDF validation](PDF_VALIDATION.md) and [image-mode validation](IMAGE_MODES_VALIDATION.md). Older entries below are historical snapshots.

---

# Notesy 1.4.4 — published public beta

Requires Organik Apps Pebble Connector 0.7.0 or later. Release approval was supplied through the release coordinator on 2026-09-07. GitHub and Pages publication completed on 2026-09-07. The coordinator owns the Pebble store dashboard; this record does not claim a store update.

- [GitHub release](https://github.com/GeezusChrotch/notesy/releases/tag/v1.4.4) is public as a prerelease, targeting commit `5ab771a1cebe910da7d67418832f4864e7da7f65`.
- All five public assets were anonymously downloaded and verified against their prepared SHA-256 checksums. [Website](https://geezuschrotch.github.io/notesy/) returned HTTP 200 with version 1.4.4. See [publication verification](PUBLICATION_VERIFICATION_1.4.4.json).
- Connector 0.7.0 was publicly available before Notesy publication.
- 84 automated tests pass, including the portable shared startup-clamp regression in touch and non-touch modes.
- Clean Basalt and Emery builds pass; embedded versionLabel is 1.4.4. PBW excludes SDK source maps and developer paths.
- Reader/formatting/Double Back implementation was verified in earlier candidate emulator/native checks; the shared startup fix was visually checked in the emulator by its owner.
- Exact 1.4.4 PBW has not been installed or accepted on a physical watch. Earlier 1.4.1 scrolling feedback was positive; 1.4.3 was installed; the later startup-fixed installation attempt could not connect to the phone.
- Fresh Mac/phone setup and final hardware acceptance remain pending. Public-beta publication does not imply those checks passed.

PBW SHA-256: `2f1fd4dc46779bd73e4d9d81f3bf2f60fa6c8906593d6b6544cde6633d1ca91c`.

See [1.4.4 release notes](RELEASE_NOTES_1.4.4.md). Older entries below are historical snapshots, not current installation status.

---

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

## Unpublished 1.4.2 candidate

Fixes unintended strikethrough caused by line-break/style collisions and adds text-only inline HTML formatting. Requires matching watch and Connector gateway updates. See [validation and exact package hash](HTML_FORMATTING_VALIDATION.md). Physical deployment and acceptance remain pending.

## 1.4.3 candidate — configurable Double Back

Removes the persistent reader gesture hint and restores the full note viewport. Save/error feedback is a four-second overlay. Settings document Double Back and expose separate main/folder and note shortcuts, both defaulting to Actions. Existing twelve-button settings migrate without changing their shortcuts; single Back and fixed Up/Down navigation remain available.

Validation: 82 tests passed during packaging, plus the added native status-overlay lifecycle test passed separately (83 total cases). Basalt and Emery builds passed. The native shortcut test covers both view bindings, all action mappings, and stopping an active Stitch. Settings tests cover migration, independent shortcuts, and the serialized settings page save. This candidate has not been installed, physically watch-tested, or published.

Artifact: `dist/Notesy-1.4.3.pbw`, SHA-256 `0ab05cafb8f3333dc9727094ee61e60c4702ed583717064d43cc99d86061f32f`. Includes the prior 1.4.2 formatting fixes, which still require the matching Connector gateway candidate.
