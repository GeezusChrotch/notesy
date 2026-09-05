# Notesy troubleshooting

Start in **Organik Apps Pebble Connector → Notesy → Requirements**. Use **Connect** to finish
setup or **Troubleshooting** to address a failed requirement. An overview light reflects that
requirement, not a guarantee that dictation or every watch action has been tested.

| Symptom | What to do |
| --- | --- |
| Phone cannot open the QR page | Connect Tailscale on both devices, use the same private network, and request a fresh QR code. |
| Test connection fails | Paste the complete pairing details from the private page. Check that the Mac is awake and Notesy is running. |
| Watch says no reply | Open Pebble on the phone, check Bluetooth/watch connection and Tailscale, then reopen Notesy. |
| Note says waiting for Mac | Keep the pending capture. Reconnect the Mac and reopen Notesy; do not erase phone storage. |
| Folder or note is missing | Refresh the list, check Hidden folders in phone settings, and confirm the selected vault on the Mac. Dot paths and symlinks are excluded. |
| Task changed in Obsidian | Reopen the note before toggling. Notesy refuses to change a stale checkbox offset. |
| Image missing | Select its row to retry. The attachment must be local, within the vault, and use an unambiguous link. Remote URLs and PDFs are unsupported. |
| Drawing is blank | Open it in Obsidian and confirm it has visible elements. Very large drawings may time out; previews are scaled to the watch. |
| Text or photos skip while scrolling | Update both Notesy and the connector to the release versions, reopen the note, and report the font, watch model and a sanitized example if it persists. |
| Cannot append to a drawing | Create a separate note alongside it. Drawing source is kept intact. |
| Two connectors compete for a port | Stop the old app's service before enabling that same service in the unified connector. Keep existing pairing and private routes. |

Bug reports should include the watch model, phone OS, Notesy and connector versions, the exact
error, and steps to reproduce. A small fictional Markdown example is useful. Do not include
pairing codes, bearer tokens, private URLs, full logs with credentials, or your whole vault.
