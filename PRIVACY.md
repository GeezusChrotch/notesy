# StoneNotes privacy

StoneNotes creates and reads Markdown files only in the selected vault's immediate `Pebble`
folder. It does not modify or delete existing notes, index the rest of the vault, collect
analytics, or send note contents to Organik Apps.

Pebble dictation transmits audio through the paired phone's dictation service for transcription.
That service's own terms and privacy practices apply. StoneNotes receives the transcribed text;
it does not store audio.

Confirmed text travels from the watch to PebbleKit JS on the phone, then through private HTTPS
over Tailscale to the Mac connector. The Mac stores a dedicated random credential in Keychain.
Pairing gives the phone this narrow StoneNotes credential. It does not grant Beeper, Reminders,
OpenClaw, or other connector access.

Unacknowledged draft text is persisted on the watch. Pending text is stored in the Pebble app's
local storage on the phone until the Mac confirms it. After confirmation, the phone keeps a
bounded list of delivery IDs without their text. The Mac retains delivery receipts with hashes,
filenames, and timestamps in Application Support to prevent duplicates after a retry or restart.
Deleting or moving a saved note does not cause it to be recreated by a delayed retry.

The selected vault bookmark and service settings remain on the Mac. The service listens only on
loopback. The connector can configure a Tailscale Serve route; it never enables public Funnel
access. Closing the Mac window keeps the service available. Quitting the app stops StoneNotes.

StoneNotes is an independent project and is not affiliated with Obsidian, Pebble, or Tailscale.
