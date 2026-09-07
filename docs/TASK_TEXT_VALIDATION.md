# Notesy 1.4.7 task-text candidate

Task text had two independent limits: a fixed-height checkbox row (`theme size + 40`) and a 220-character transport summary. The row now measures wrapped text with the actual selected font and checkbox inset. Theme changes invalidate measurements and relayout the open document. Long tasks use UTF-8-safe blocks within the existing watch buffer, keeping one checkbox with its original byte offset and ordinary scrolling text for the remainder.

The reported note was inspected read-only. No vault content was changed. Synthetic regression tests preserve a task across more than 15 content blocks, retain every UTF-8 character, verify one checkbox, and check that a toggle changes exactly its marker byte. Native row tests exercise both watch widths, varying font metrics, padding, cache reuse and theme invalidation. All 93 tests pass; clean Basalt/Emery builds pass.

Package: `dist/Notesy-1.4.7.pbw`, SHA-256 `4de0c32cc86e851fc75bb9c390d3d941976c61ae92162192430e20257b13db03`.

Requires matching local Connector gateway/content.js update to preserve text beyond the first block. Renderer/helper unchanged. Connector 0.8.1 build 20 was deployed and verified. The exact watch package installed successfully; Josh reported “Working great” for the task-text fix and authorized publication. Public publication is recorded separately in RELEASE_STATUS.md.
