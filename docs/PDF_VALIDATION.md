# Notesy 1.4.6 PDF preview candidate

PDF attachments appear in vault browsing/search, support pinning and note links, and open as read-only inline page previews. Markdown PDF embeds expand to numbered pages; Obsidian `#page=N` embeds retain their selected page. The existing continuous reader loads raster previews only when visible and pages content in both directions. No watch memory allocation or navigation changes were needed.

The Swift helper uses Apple's [Core Graphics PDF page transform](https://developer.apple.com/documentation/CoreGraphics/CGPDFPage) to fit cropped/rotated pages into existing preview bounds. Metadata is cached by PDF content hash; rendered pages are cached by content, page, dimensions and image mode. PDFs use the clean-line image treatment. Only vault-local regular files are accepted. Original bytes are unchanged; append, task mutation and removal reject PDFs. Limits: 20 MB and 1,000 pages, with explicit unavailable-preview text for invalid, locked or oversized PDFs. No zoom, text extraction or selection is included; fine print may be too small at whole-page scale.

Validation: 91 automated tests pass; clean Basalt and Emery builds pass. PDF tests exercise a 17-page synthetic file, page navigation in both directions, separate page pixels in all image modes, portrait orientation, rotated page dimensions, surrounding text/task offsets, selected-page embeds, pinning, internal links, invalid files and symlink rejection. Existing Swift image/Excalidraw and document navigation tests remain green.

Exact watch package: `dist/Notesy-1.4.6.pbw`, SHA-256 `f16357d690ca1c6bad33d98d5a9d482d5ef4438e7dcfedf8c2858ed9fa16f225`.
Local rebuilt helper SHA-256: `d335a01dfa1d9c3259dc415bf1536616a8dec2e457ef864893e58a0c917b0aec` (Connector signing changes binary hash).

Matching Connector deployment and serial watch installation are requested separately. Physical PDF acceptance is pending. This candidate is not publicly published.
