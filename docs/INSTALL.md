# Install Notesy

You need a Pebble Time or Pebble Time 2, the paired phone's Pebble app with working dictation,
a Mac running macOS 14 or newer, and an Obsidian vault stored on that Mac. iPhone is the tested
phone setup. Android has not yet been validated. Obsidian Sync is not required, and Obsidian
itself does not need to stay open.

Notesy is free and MIT open source. There is no Notesy account, subscription or hosted notes
service. Your phone's dictation provider and any optional third-party services have their own terms.

## Connect the Mac

1. Install **Organik Apps Pebble Connector** from its
   [release page](https://github.com/GeezusChrotch/organik-pebble-connector/releases/latest).
   Drag the app into Applications and open it.
2. Install [Tailscale](https://tailscale.com/download) on the Mac and phone. Sign both into the
   same private network and leave Tailscale connected.
3. Select **Notesy** in the connector sidebar. Follow **Connect** to choose your Obsidian vault,
   start the service and start its private connection. Check **Requirements** for any unmet step.
4. Choose **Connect phone**. Scan the one-time QR code on your phone and copy the pairing details
   from the private page. If the page expires, request a new code on the Mac.

A closed connector window is fine. Keep the app running and the Mac awake. **Settings → Start at
login** makes reopening the connector after a Mac restart easier. Each app keeps separate pairing;
your Notesy credential does not grant access to the other connectors.

## Install and pair the watch

1. Open `Notesy-1.0.0.pbw` from the [Notesy release](https://github.com/GeezusChrotch/notesy/releases/latest)
   on your phone and open it with Pebble. Once the store listing is live, you can also install
   Notesy from the Pebble app's store.
2. In the phone's Pebble app, open **Notesy → Settings**.
3. Paste the pairing details, choose **Test connection**, then **Save settings**.
4. Open Notesy on the watch. You should see folders and notes at the vault root.

## First note

Select a folder, or stay at the vault root. Choose **New note**, dictate and confirm the text.
**Saved to vault** means the Mac confirmed the Markdown file. Open the note in Obsidian to see it.

Long-press Select while reading a note to append dictation to that same note. The default long
press on Down creates a new note from the browser. Use the phone's **Button shortcuts** to change
these controls. See the [user guide](USER_GUIDE.md) for reading, tasks, pictures and search.

## Updating an existing installation

Update the connector and Notesy watch app, then reopen Notesy. The UUID, pairing, settings,
pins and pending-note queues are retained, including upgrades from StoneNotes. Do not uninstall
Pebble or clear its data while notes are queued. Existing Markdown files are not moved or renamed.

You can hide folders in phone settings without moving files. No dedicated Pebble or Notesy folder
is required. Notes you create directly in Obsidian appear on the watch after refreshing the list.
