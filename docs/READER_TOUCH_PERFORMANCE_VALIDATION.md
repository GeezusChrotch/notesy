# Notesy 1.3.3 reader touch and scrolling candidate

This candidate addresses physical-watch feedback on 1.3.2: Select opened linked notes, taps did not, and link-heavy notes scrolled slowly. It is not a publication or physical-watch acceptance record.

The original problem was reproduced with QEMU absolute finger events, rather than calling the C tap callback directly. The firmware highlighted a row without reaching either app activation callback. The reader now owns its raw touch stream while visible and restores the normal app touch bridge when covered or closed. Tapping another row highlights it; tapping the selected link row opens it. Physical Select retains its existing behavior. Vertical swipes navigate; a drag that returns to its starting point cannot become a tap. A stationary hold also activates on release because the raw events lack timestamps and callback wall time includes rendering delays.

The watch caches row heights and ASCII glyph measurements, clearing them when fonts/themes or note content change. Ordinary paragraphs use a single SDK text draw instead of one draw per character. Styled text retains the existing layout and emphasis renderer. The gateway reuses parsing and basename lookup while paging an unchanged note, formats only the visible 15 blocks, and avoids rewriting an unchanged index. This cache is limited to four notes and 30 seconds, reopens refresh it, content revisions invalidate it, hidden-folder changes clear it, and resolved targets still pass filesystem checks.

Validation:

- 74 automated tests pass, including native touch dispatch, movement/loading/covered-window guards, cached glyph metrics, one-call plain paragraph drawing, and multi-page link lookup/index reuse with reopen and hidden-folder invalidation.
- Basalt and Emery compile successfully. Basalt retains over 13 KB free heap at build time; this is not a runtime heap measurement.
- Real Emery QMP finger events pass first-tap focus, second-tap link opening, repeated opening, Back restoration, swipes in both directions, and touch resumption after Actions. See `docs/validation/1.3.3/`.
- Emery large-font reader regression passes oversized paragraphs, wide/tall photos, task activation after images, and reverse scrolling without skipped content.
- Physical-watch touch acceptance and perceived scrolling speed remain pending. Connector bundling/deployment is tracked separately.

Reproduction: build with `npm run package`, then run `scripts/test-reader-touch.py` using the Pebble tool's Python environment. The script stops local SDK emulators, installs an emulator-only fixture with the production C binary, and drives QMP finger events against a disposable gateway/vault. It never connects to a physical watch. Phone JS is covered by the separate automated tests.

Candidate: `dist/Notesy-1.3.3.pbw`.

SHA-256: `22eabcd37b3d077d95be47733a615b7acf4632cbbdccf2a905cd5c210409cb20`.
