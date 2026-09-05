# StoneNotes

Browse an Obsidian vault, read notes and capture dictation on Pebble Time and Time 2. Version 0.1.0.
Choose the vault in **Organik Apps Pebble Connector**. No Obsidian plugin or dedicated notes folder
is required. Ordinary Markdown notes created in Obsidian appear alongside watch-created notes.
No personal vault, account, network address or credential is embedded in the shared app.

## Watch controls

| Gesture | Main / folder view | Open note |
| --- | --- | --- |
| Up / Down press | Move through entries | Scroll text |
| Select press | Open folder or note; select New note to dictate | Actions menu |
| Up long press | Pin / unpin selected item | Pin / unpin note |
| Select long press | Actions menu | Append dictation |
| Down long press | New note in current folder | No action |
| Back press | Previous location; exit at root | Return to browser |
| Back double press | Actions menu | Actions menu |
| Back long press | Exit app (watch OS) | Exit app (watch OS) |

Phone Settings → Button shortcuts lets users assign **all six press/long-press gestures separately
for each view**: normal navigation, new note, append, delete, pin/unpin, actions, no action or refresh.
Double-pressing Back always opens Actions, including movement controls if normal buttons were reassigned.
There are no Back or Next/Previous page menu entries.

The main page shows pins first, then folders, then root notes, alphabetically within each group.
Nested folders open with Select. Lists keep 15 entries on the watch; moving beyond either edge
loads the adjacent batch automatically. Folder listings are stable while paging, even if files
change in Obsidian. Use Refresh in Actions to see changes; listings expire after 30 minutes.
Notes scroll normally and fetch more text at the edge of the loaded chunk.

**New note** saves in the folder being viewed. When assigned in note view, it saves alongside the
open note. **Append** targets the selected or open note. **Delete note** immediately moves that
note into `.trash` inside its containing folder, without a second confirmation. Folders cannot
be deleted from the watch. Finder’s Command-Shift-Period reveals `.trash` for recovery.

Pins are stored by the Mac connector per vault and survive restarts. A pinned root item appears
only once. Nested pins open directly from the main page. A renamed or moved item needs to be
pinned again at its new location; missing pins are hidden.

## Setup and upgrades

Choose your vault in the Mac connector, start StoneNotes, start its private connection, and select
Connect phone. Scan the one-time QR code. On the phone, copy the pairing details into
Pebble → StoneNotes → Settings, test, and save. Install `dist/StoneNotes-0.1.0.pbw` on the watch.
The connector requires macOS 14+ and bundles its runtime. Keep Tailscale connected on both devices.

For an existing StoneNotes installation, update both the connector and watch app, then reopen
StoneNotes. The phone learns vault browsing support using its existing pairing. Old queued
captures retain their original dedicated folder through the legacy API; existing files are not
moved. New captures record their folder and vault when dictated, so navigating elsewhere cannot
redirect pending text. A watch draft remains until the phone stores it; the phone retains up to
20 pending captures across restarts. Only a confirmed Mac receipt produces **Saved to vault**.
Phone Settings exposes pending text for recovery after an intentional destination change.

## Appearance and filenames

Appearance uses Pome’s five presets and custom background, text and selection colors. Time 2
includes Inter, Roboto, Open Sans, Montserrat and Poppins at 14, 18, 22, 26 and 30 pixels.
Pebble Time uses Pome’s system-font options and supported sizes. The chosen font applies to
browser entries, actions and reading; hints remain small. See `resources/fonts/licenses`.

New files use the Mac’s local date, readable time and first sentence:
`2026-09-09 - 5.32pm - This is the dictated note.md`. The watch displays `5:32pm`.
Collisions get `(2)`, `(3)`, etc. Existing filenames are preserved. Delivery IDs stay in metadata
and receipts; invisible append markers prevent duplicate retries.

## Limits

- Dictation needs a microphone-equipped Pebble and the paired phone’s working transcription
  service. Captures are limited to 767 UTF-8 bytes; longer text is rejected, never truncated.
- The Mac must be awake for reading and delivery. Pending captures retry while the phone runs
  StoneNotes, including when reopened; this is not continuous iPhone background execution.
- Regular Markdown notes up to 1 MB are supported. Simple Markdown renders as text; images,
  attachments, embeds and plugin-generated views are not rendered. Font glyph coverage varies.
- Hidden paths and symbolic links are excluded. Browsing does not recursively scan the vault:
  only visited folders are indexed. A folder can contain up to 60,000 visible entries; navigation
  history supports 24 opened folders. Both directions of paging use bounded watch memory.
- A missing append target leaves the captured text queued for recovery; it never creates a
  replacement note. Pins refer to file paths, not Obsidian rename tracking.

## Development

```sh
npm test
npm run check
npm run package
```

Native C handles the watch UI, buttons and draft persistence. PebbleKit JS handles settings,
transport and durable delivery. `gateway/server.js` hosts the loopback API;
`gateway/browser.js` implements vault navigation, pins and explicit destinations while the v1
API remains compatible with old queued notes. The Mac build bundles both server modules.

Use `build/StoneNotes.pbw` for debugging and `dist/StoneNotes-0.1.0.pbw` for distribution; the latter
omits SDK source maps. `tests/watch-emulator.py` exercises the compiled C app against the disposable
vault in `tests/emulator-fixture.js`; it requires a fixture PBW with inert phone JS, never a physical
watch. Phone transport and settings have separate automated tests. See `PRIVACY.md` for data handling.

To run the emulator checks with the Python environment that contains `pebble_tool`:

```sh
python3 scripts/emulator-fixture.py
pebble install --emulator emery build/StoneNotes-fixture.pbw
python tests/watch-emulator.py
WATCH_TEST_DICTATION_ONLY=1 python tests/watch-emulator.py
```

Use only the emulator fixture for those commands. The dictation check supplies simulated
transcripts through the SDK voice protocol; it does not verify a real microphone or phone speech
service. Normal watch installations must use `dist/StoneNotes-0.1.0.pbw`.
