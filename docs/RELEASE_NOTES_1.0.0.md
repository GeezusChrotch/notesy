# Notesy 1.0.0

Your Obsidian vault, on your wrist. Notesy is a free MIT open-source app from Organik Apps for
Pebble Time and Pebble Time 2.

Dictate a note, append to the one you are reading, or dictate a fuzzy search. Browse your vault's
folders and root notes, pin favorites, hide folders, check Markdown tasks, and view local pictures
and Excalidraw previews. Customize Pome themes, fonts, colors, button shortcuts and marquee speed.

## Install

Download `Notesy-1.0.0.pbw` on your phone and open it with Pebble. Install the companion
**Organik Apps Pebble Connector 0.2.0 or newer** on your Mac, select Notesy, and follow its
connection steps. See the [installation guide](INSTALL.md).

The Mac must run macOS 14 or later and remain awake. Tailscale must connect the Mac and paired
phone. iPhone is the tested setup; dictation uses the phone's configured transcription provider.
No Obsidian plugin is required. Local previews are scaled for the watch; remote images, PDF
previews and plugin-generated views are not supported.

## Existing development users

Update both apps and reopen Notesy. Pairing, settings and pending captures are preserved,
including earlier StoneNotes installations. Existing notes are not renamed or moved.

This release also repairs photo layout shifts, skipped text in long paragraphs, ordinary `.md`
Excalidraw detection, and conversion failures for mostly white drawings.

Free software under MIT, with third-party notices included. No Notesy account, analytics or
subscription. Independent of Obsidian, Pebble and Tailscale.
