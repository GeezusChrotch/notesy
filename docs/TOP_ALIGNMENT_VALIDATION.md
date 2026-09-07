# Notesy 1.3.1 candidate: initial list position

The first physical-watch test of 1.3.0 showed New note centered with empty space
above it. Center-focused MenuLayer mode overrides MenuRowAlignTop. After restoring
the selected row in a loaded browser list, Notesy now clamps a positive scroll
offset to zero. Center-focused mode remains enabled for two-tap activation.
Existing negative offsets for later entries remain intact.

- 64 automated tests pass; clean Basalt and Emery builds pass.
- Emery native fixture `WATCH_TEST_TOP_ONLY=1` verifies the selected New note row
  occupies the top of the screen and ordinary note navigation still works.
- Screenshot: `validation/markdown-emery/browse-start-top.png`, visually checked.
- Emulator used the same C change before the version-only clean rebuild.
- PBW SHA-256: `b497028c421cce153bf76527dd89336754f1ad08ff1be29033f4aa55d5db9bce`.
- Not installed on a physical watch or published. Compatible with the already
  installed Connector 0.6.0; gateway and phone protocol are unchanged.
