# Notesy 1.2.0 — public beta

- Continue browsing in both directions with touch and buttons; keep an overlapping boundary entry instead of skipping notes.
- Sort from watch Actions or phone Vault settings by name, modified date, created date, or scoped tag.
- Browse paged inline/frontmatter tags from the current folder; choose a tag to filter notes.
- Assign Return to top and Sort notes to Select or long presses.
- Tap a different item to highlight it and read its scrolling title; tap the highlighted item to activate. Up/Down always navigate. Phone settings use the consistent Organik Apps layout.

Requires Organik Apps Pebble Connector 0.5.0 or later. New phone code uses authenticated /v3/browse and /v3/tags; existing clients may keep using /v2/browse. Watch message keys SORT=34 and TAG=35, command10 for tag pages; existing IDs, vault state, pins, hidden-folder settings and delivery receipts are preserved. No renderer changes.

Validation details are recorded in SORTING_VALIDATION.md. All 58 tests and both watch builds pass. The exact installed package received positive user feedback; fresh Mac/phone setup testing remains pending.
