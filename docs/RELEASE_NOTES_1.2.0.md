# Notesy 1.2.0 candidate

- Continue browsing in both directions with touch and buttons; keep an overlapping boundary entry instead of skipping notes.
- Sort from watch Actions or phone Vault settings by name, modified date, created date, or scoped tag.
- Browse paged inline/frontmatter tags from the current folder; choose a tag to filter notes.
- Assign Return to top and Sort notes to Select or long presses.
- Includes pending touch focus/activation, guaranteed Up/Down navigation and shared settings UI changes.

Requires the matching Notesy gateway in Organik Apps Pebble Connector. New phone code uses authenticated /v3/browse and /v3/tags; existing clients may keep using /v2/browse. Watch message keys SORT=34 and TAG=35, command10 for tag pages; existing IDs, vault state, pins, hidden-folder settings and delivery receipts are preserved. No renderer changes.

Validation details are recorded in SORTING_VALIDATION.md. This candidate is not a public release or proof of physical watch acceptance.
