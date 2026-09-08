# Notesy 1.4.8 full-width media candidate

Photos, Excalidraw/SVG drawings and PDF pages share a reader path that now fills the available width while retaining the source aspect ratio. Portrait media gets a taller scrolling row. Source geometry remains cached with each row when its bitmap is evicted. Bounded bitmap storage and existing low-memory downsampling remain; the preview expands at draw time without allocating a large portrait bitmap. Only visible source rows are drawn. Extremely narrow/tall media is height-bounded to keep all 15 rows within Pebble's signed coordinate range, preserving proportions with a narrower display in that exceptional case.

94 tests pass and both platform builds pass. Native pixel tests cover full-width coverage, row stride, nearest-neighbor pixel mapping, landscape/portrait geometry, clipped scrolling, low-memory bitmap sizes and extreme aspect ratios. Isolated Emery screenshots show 200-pixel-wide portrait and landscape previews with the correct proportions and text following the media. The QA script starts/stops only its owned emulator and never touches a phone or live vault.

Package: `dist/Notesy-1.4.8.pbw`, SHA-256 `fd1ee0e465453ebb8e1538caf6277ab1ee16a92cdcf99e6a34c242bb1b4691d1`.

Watch-only change; installed Connector 0.8.1 is compatible. Source bitmap detail is still limited by the bounded conversion/storage resolution. The exact package installed successfully over LAN after Beepster in the coordinated serial handoff (installer exit 0, “App install succeeded”). Physical user acceptance remains pending. No publication authorized.
