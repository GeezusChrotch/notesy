# Notesy 1.4.1 long-note rendering and smoother scrolling

Josh reported blank screens in the Seamus note and jumpy scrolling after testing 1.4.0. Its structure was inspected read-only. The committed regression fixture uses generic log entries, tables, headings and separators; it contains no personal note content.

The regression reproduced 19 blank positions out of 85 checked scroll positions with the menu-backed document renderer. Replacing MenuLayer with ordinary clipped document layers eliminated all 19: the same 85-position traversal passed without a blank screen, including multiple 15-block batches. See `docs/validation/1.4.1/before-blank.png` and the post-fix long-log captures. This fixes rendering; it does not remove content or skip table/log blocks.

Button presses now move a smaller reading step (half the configured text size plus five pixels) with SDK scroll animation. Vertical touch movement updates the document while the finger is down; liftoff does not repeat the movement. Tap focus/open and rightward swipe Back remain separate. Text and previews remain non-selectable.

The additional document layers exposed the 64 KB Basalt image-memory limit during visual testing. Basalt now downsamples the incoming RLE preview into a smaller bitmap, reducing it further if allocation fails. The original image size remains the protocol input, so the existing Connector stays compatible. Emery retains its current preview resolution. Decoding tests check all output pixels and row padding/canaries for full-size and reduced-size images.

Validation:

- All 76 automated tests pass; clean Basalt/Emery builds and release packaging pass.
- Native checks cover smaller animated button steps, direct drag updates before liftoff, no duplicated movement at release, both batch boundaries and image downsampling bounds.
- The 85-position long-log regression passes with ordinary document layers; the earlier version fails at 19 positions.
- Real Emery touch checks pass document taps, focused link opening, button Select, drag scrolling, Actions and Back. A held-drag screenshot confirms that content moves before release.
- Emery image/drawing regression verifies actual colored preview pixels in addition to requests. Basalt photo and Excalidraw previews were visually verified after the memory adjustment. `basalt-final.png` shows the decoded drawing.
- Physical-watch smoothness and the user's Seamus-note acceptance remain pending. The live vault was not modified. No physical installation, Connector update or publication was performed by this change.

PBW: `dist/Notesy-1.4.1.pbw`.

SHA-256: `49b956ec49d0a235411d89e91c9955404ea0ed6268e61d6db6e6f30e0d8b3a0d`.

Reproduce using the Pebble tool's Python with `scripts/test-reader-touch.py`. Set `WATCH_TEST_LONG_LOG=1` for the 85-position regression; set `WATCH_TEST_DOCUMENT_DRAWING=1` for preview rendering (which now verifies colored pixels, not just image requests). `WATCH_TEST_PLATFORM=basalt` selects the smaller emulator. Fixtures and flash images are disposable and never connect to a physical watch.
