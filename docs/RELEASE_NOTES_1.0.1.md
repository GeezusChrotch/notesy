# Notesy 1.0.1 — public beta

Fixes delayed watch refreshes after Quick Dictate and Stitch saves. When a save is confirmed
while a list, note page or image is still loading, Notesy now refreshes after that request
finishes instead of missing the update. Delayed append confirmations also refresh the open note.

Update Notesy from the Pebble Appstore or open the attached PBW with Pebble on your phone.
Existing pairing, settings and pending captures are preserved. No Mac service change is needed.

49 automated tests pass; Basalt and Emery builds succeed. Compiled Emery regression checks
reproduce and verify saves during list loading and appends during reader loading. This update
has not yet been tested on a physical watch. The release remains a public beta.

[Setup guide](https://github.com/GeezusChrotch/notesy/blob/v1.0.1/docs/INSTALL.md) ·
[Pebble Appstore](https://apps.repebble.com/a9d4515681c34b5088993dc6)
