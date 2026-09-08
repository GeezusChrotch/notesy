# Notesy 1.4.8 — full-width photos, drawings and PDFs

Requires **Organik Apps Pebble Connector 0.8.1 or later**. Existing pairing, settings and vault content are preserved. This update changes the watch reader; the compatible Connector image processing is unchanged.

- Display photos, Excalidraw/SVG drawings and PDF pages across the available reader width while preserving their proportions.
- Give portrait previews taller scrolling rows, with following note text remaining accessible.
- Retain learned media dimensions when loading another preview, and skip drawing offscreen portions.
- Keep bounded bitmap storage and low-memory fallbacks. Enlarging the display does not add source detail; exceptionally tall, narrow previews stay within the watch's layout limits.

Includes the task-text fix from 1.4.7 and the Natural, High contrast and Original image modes. PDFs remain read-only previews with no zoom or text selection. Notesy remains free, MIT open source and a public beta.

## Validation

All 94 automated tests and both platform builds passed. Native pixel tests cover full-width coverage, aspect ratios, clipped scrolling and low-memory bitmap sizes. Isolated Emery screenshots verified full-width portrait/landscape previews and scrolling to the following text. The exact 1.4.8 package installed successfully. User acceptance of full-width media remains pending; earlier task-text acceptance applies to that prior fix. Fresh setup and broader PDF/image testing remain separate checks.
