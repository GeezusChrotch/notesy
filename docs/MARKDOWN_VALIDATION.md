# Notesy 1.3.0 candidate validation

Not published or installed on a physical watch. The published 1.2.0 / Connector
0.5.0 release remains unchanged.

Candidate PBW SHA-256:
`3131d98c9605e791d185f90e1759a875852fa434e4ff3f8f84ebb4e8914ae7ec`.

- Clean `npm run package`: 64 tests pass, companion syntax passes, Basalt and
  Emery compile, packaged version is 1.3.0, public PBW contains no debug maps.
- Disposable-vault tests cover wiki/Markdown links, encoded and relative paths,
  same-note references, unique filenames, missing/ambiguous/hidden/external links,
  symlinks, Connector restart persistence, UTF-8 chunks, style continuation,
  task byte offsets and image block positions.
- Phone tests verify full 64-character linked-note IDs, style control bytes,
  heading format and unavailable-link responses.
- Native emulator integration passes on Basalt and Emery: open a linked note,
  Back restores its selection, reopen it, and toggle a subsequent task. Emery
  additionally verifies failed forward and failed Back requests preserve navigation.
- Screenshots in `validation/markdown-emery/` were visually inspected for actual
  heading, bold/italic, linked-note and Back presentation.
- Styled long-text, wide/tall image and task-after-images checks pass on Basalt and Emery.
  Basalt used the same renderer code before the version-label-only final clean build; Emery used the final candidate.
- Two reused Emery emulator sessions lost screenshot transport (one on initial
  reading, one during reverse scrolling). Fresh emulator starts passed both complete
  suites, including reverse scrolling. Physical-watch verification is still needed.

Reproduction: build/package, run `python3 scripts/emulator-fixture.py`, install
`build/Notesy-fixture.pbw` with `pebble install --emulator emery`, then run
`WATCH_TEST_LINKS_ONLY=1 python tests/watch-emulator.py` using the Pebble tool's
Python environment. Set `WATCH_TEST_PLATFORM=basalt` for Basalt. Use
`WATCH_TEST_SCROLL_ONLY=1` for long-text/photo regression. The fixture PBW has inert
phone JavaScript and is emulator-only. Phone JavaScript is tested separately.

Connector handoff: include all gateway modules (including `links.js` and
`markdown.js`) and this PBW with the existing renderer/helper. The `/v3/notes/:id`
route is unchanged; rich blocks add `markup`, `format`, and `kind: link` with a
resolved opaque `target` or explanatory `error`. Existing companion builds safely
show these rows as text. New watch/phone builds accept older plain-rich responses,
but the new features require the matching gateway. Task/image APIs are unchanged.
Message key 36 is FORMAT. No pairing, vault-bookmark or delivery-queue migration.
