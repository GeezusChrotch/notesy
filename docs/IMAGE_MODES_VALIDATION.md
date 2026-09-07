# Notesy 1.4.5 local image-mode candidate

Phone settings → Themes → Photos and drawings offers Natural (default), High contrast, and Original. Requests carry the mode to the gateway; normalized modes partition the conversion cache. Photos use the shared palette and Atkinson diffusion, while SVG/Excalidraw use the drawing treatment without diffusion. Original preserves the previous opaque per-channel rounding. Original attachments are never modified.

The shared module is byte-identical to Beepster's v1 quantizer, SHA-256 `3e7eac3e56932bf4bf84df349f4e85e7e5d12a6b97974785d910c0658850315e`. Its MIT palette attribution is embedded and listed in third-party notices. Room-light samples are an approximation; physical display acceptance is still required.

Validation: 88 automated tests pass, including the real Swift image/Excalidraw conversion tests, serialized phone settings save and transport, paired HTTP mode routing, cache separation, unchanged attachments, bounded GColor8 output, uniform drawing background and independent legacy-color comparison. Clean Basalt/Emery builds pass. Existing Swift helper/renderer assets are unchanged.

PBW: `dist/Notesy-1.4.5.pbw` — SHA-256 `ff56f10e5075545907f8142455ba59f353873ead9e70eee6ab03924988322b28`.

Matching local Connector integration and automatic serial watch installation are requested separately. This document does not claim local deployment, physical watch acceptance or public publication. Public release remains 1.4.4.
