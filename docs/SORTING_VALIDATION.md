# Sorting and browsing candidate validation

## Scope

Notesy source/gateway only. Do not replace the running Connector service independently. Bundle this immutable source's gateway/renderer and watch PBW together. Renderer unchanged. Existing bookmark, token, port and private route remain owned by the unified Connector.

## Checks

- All 58 Node tests pass, including name/modified/created sorting, overlapping bidirectional snapshots, scoped/paged tags, hidden folders, authenticated v3 routes, legacy v2 compatibility and phone sort persistence.
- Host-compiled actual C browser selection/boundary callbacks: forward, backward, overlap, restoration guard and first/last page stops.
- Basalt and Emery SDK builds, generated SORT/TAG message keys, matching 1.2.0 embedded package version.
- Real browser: Vault sorting has all four modes; Tag reveals a root-tag selector; Shortcuts exposes Return to top and Sort notes while Up/Down stay fixed.

No live vault edits, service restart, watch install or public publication performed for this candidate. Physical touch-edge paging, watch sort picker, tag filter and Return to top remain acceptance checks after the matching Connector is installed.
