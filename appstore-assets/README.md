# Notesy artwork

- `notesy-icon-master.png`: original generated release artwork, retained at full resolution.
- `notesy-icon-1024.png`: large press/repository artwork.
- `notesy-icon-large.png`: 144 × 144 store icon.
- `notesy-icon-small.png`: 80 × 80 store icon.
- `../resources/images/notesy-menu-icon.png`: pixel-aligned 25 × 25 watch launcher glyph;
  regenerate with `python3 scripts/make-menu-icon.py`.

The violet, ivory and mint note-and-wave design is original Notesy artwork. The store artwork
was generated with OpenAI image generation; the small launcher adaptation is drawn in code.
Organik Apps releases its code, documentation and artwork under the repository's MIT terms
(to the extent copyright applies). Third-party brands and dependency artwork retain their own rights.

Screenshots in this directory use disposable fictional notes, never a user's vault. Store asset
sizes should be checked against the submission form when publishing; these match the existing
Organik Apps Pebble store asset convention.

## Current screenshots — Notesy 1.4.8

The three Emery screenshots were refreshed from the exact public 1.4.8 watch package
(SHA-256 `fd1ee0e465453ebb8e1538caf6277ab1ee16a92cdcf99e6a34c242bb1b4691d1`).
They show fictional Weekend plans, folders, checkboxes, a linked note and a Sketchbook drawing.
The drawing was rendered by Notesy's Excalidraw helper and shared Natural image processor,
then delivered to the unchanged watch app. No private vault or phone connection was used.

Capture uses Pebble's native screenshot API with color correction disabled, at the original
200 × 228 resolution. QEMU display screendumps introduce a gray cast and are not used here.
Screenshots demonstrate app rendering; they do not replace physical-watch acceptance.
