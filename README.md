# StoneNotes

Dictate and read Obsidian notes on Pebble Time and Pebble Time 2. Version 0.1.0.

StoneNotes uses the `Pebble` folder in a vault selected in **Organik Apps Pebble Connector**.
It reads ordinary `.md` files created by the watch, Obsidian, or another editor. Nothing about
the author's vault, account, network, or credentials is embedded in the shared app.

## Watch controls

- **Select New note:** dictate and confirm. Hold Select in the menu to capture from any row.
- **Up / Down:** browse notes or scroll the open note.
- **Select a note:** read it. Hold Select appends dictation to that note. Select opens actions: append, next/previous page, or delete. Deletion requires confirmation and moves the note to `Pebble/.trash`.
- **Back:** return to the list. **More notes** advances the list in batches of 15.
- **Refresh**, or hold Down in the menu: return to the newest notes.

The phone settings page contains Paper, Forest, and Midnight themes; optional dictation on launch;
pairing; and a view of pending text. A watch draft remains until the phone stores it. A phone
queue of up to 20 notes survives app restarts. Delivery retries do not create duplicate files.
Only a confirmed Mac response produces **Saved to vault**.

## Setup

Use the StoneNotes page in Organik Apps Pebble Connector to choose the vault, start the service,
start the private connection, and pair the phone by QR code. Paste the one-time pairing details
into Pebble → StoneNotes → Settings, test, and save. The Mac and phone use Tailscale on the same
private network. The connector requires macOS 14+ and bundles its runtime.

## Limits

- Dictation requires a supported microphone-equipped Pebble and the phone's working dictation
  service. Transcription uses the Pebble phone service; this is not offline audio recording.
- Watch dictations are limited to 767 UTF-8 bytes per note. Larger captures are rejected rather
  than silently cut off. Up to 20 notes may wait on the phone.
- The Mac must be awake and connected for new reads and delivery. The phone retries while the
  watch app is active or when it reopens; this is not an always-running iPhone background service.
- This release reads immediate `.md` children of `Pebble`, up to 1 MB each. It renders simple
  Markdown as text, with placeholders for images and embeds. Plugin-generated views, attachments,
  and nested folders are not supported. Displayed characters depend on the watch's system fonts.
- Existing notes can be read, appended to by dictation, and moved to trash after confirmation. New-note creation is available only from the main page.
- A pending note remains bound to its original Mac and vault. Phone settings exposes the text
  for recovery if you intentionally change that destination.

## Development

```sh
npm test
npm run check
npm run package
```

The local debug package is `build/StoneNotes.pbw`; share `dist/StoneNotes-0.1.0.pbw`, which omits
SDK source maps containing developer build information. Native C handles the watch UI and draft persistence;
PebbleKit JS handles settings, transport, and a durable delivery queue. `gateway/server.js`
provides the loopback-only filesystem API bundled by the Mac connector.

The watch UUID is stable. Public packaging includes no personal build or preconfigured token.
See `PRIVACY.md` for storage and transcription details.

New dictated files use the Mac’s local date and readable time followed by the first sentence, such as `2026-09-09 - 5.32pm - This is the dictated note.md`. Duplicate titles within the same minute receive `(2)`, `(3)`, and so on. Delivery identifiers stay in metadata and local receipts for retry protection. Existing notes retain their filenames.

Appearance settings use Pome’s five presets and custom background, text, and selection colors. Time 2 bundles Inter, Roboto, Open Sans, Montserrat, and Poppins in 14, 18, 22, 26, and 30 pixel sizes. Pebble Time uses Pome’s system-font choices and their supported sizes. The selected font applies to menu titles and note reading; hints remain small. Font licenses are in `resources/fonts/licenses`.

Queued appends remain bound to the original note and vault, including after restart. If a target is moved or removed, the text stays on the phone for recovery instead of creating a new note. Append markers are hidden in rendered Markdown and prevent duplicate retries. Deleted notes remain in `Pebble/.trash`; restore them using Finder (Command-Shift-Period shows hidden folders).
