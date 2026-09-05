# Notesy privacy

Notesy can browse regular folders and Markdown files throughout the selected Obsidian vault.
It creates notes in the chosen location, appends to the selected note on request, and moves a
deleted note into `.trash` inside its containing folder. Hidden paths and symbolic links are
excluded. It indexes paths only in folders the user visits; it does not recursively read the
vault’s contents. No analytics or note contents are sent to Organik Apps.

Pebble dictation transmits audio through the paired phone's dictation service for transcription.
That service's own terms and privacy practices apply. Notesy receives the transcribed text;
it does not store audio.

Confirmed text travels from the watch to PebbleKit JS on the phone, then through private HTTPS
over Tailscale to the Mac connector. The Mac stores a dedicated random credential in Keychain.
Pairing gives the phone this narrow Notesy credential. It does not grant Beeper, Reminders,
OpenClaw, or other connector access.

Unacknowledged draft text is persisted on the watch. Pending text is stored in the Pebble app's
local storage on the phone until the Mac confirms it. After confirmation, the phone keeps a
bounded list of delivery IDs without their text. The Mac retains delivery receipts with hashes,
filenames, and timestamps in Application Support to prevent duplicates after a retry or restart.
Deleting or moving a saved note does not cause it to be recreated by a delayed retry.

The selected vault bookmark, service settings, visited entry paths and pinned item IDs remain on the Mac. Browser snapshots hold titles in memory for up to 30 minutes. Pins are specific to the selected vault. The service listens only on
loopback. The connector can configure a Tailscale Serve route; it never enables public Funnel
access. Closing the Mac window keeps the service available. Quitting the app stops Notesy.

Notesy is an independent project and is not affiliated with Obsidian, Pebble, or Tailscale.
