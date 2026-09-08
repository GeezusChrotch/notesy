# Using Notesy

## Browse and capture

The home page shows pinned items first, then folders and root notes. Up/Down moves through the
list; Select opens an item; Back returns to the previous location. Lists load more automatically
in both directions as you scroll. **Actions → Refresh** picks up changes made in Obsidian.

**New note** opens a choice of **Quick Dictate** or **Stitch** in the folder you are viewing.
**Append: Quick Dictate** and **Append: Stitch** add dictation to the
selected or open note. New note, when assigned in note view, creates a separate note alongside
it. Drawing source cannot be appended to; create a note alongside a drawing instead.

By default, long-press Select opens Actions in the browser and appends while reading. Double-press
Back opens Actions by default. Customize Double Back separately for main/folder and note views in settings. The watch OS reserves long-press Back to exit the app.

New files lead with the local date and readable time, followed by the first sentence. Existing
filenames are preserved. Retry receipts prevent a delayed connection from saving the same capture twice.

## Quick Dictate and Stitch

Pebble limits each recording to **15 seconds**, and Notesy cannot extend that system limit.
That is why there are two choices:

- **Quick Dictate** is for one short thought, such as a reminder or shopping item. Record once, up to 15 seconds.
- **Stitch** is for a longer thought, such as a journal entry or meeting follow-up. It joins multiple recordings, each up to 15 seconds, into the same note.

Both work for new notes and appending. Stitch does not make one continuous recording.
Accept each transcription with Select; Stitch saves
that section, gives a short vibration, then starts listening for the next one. There is a brief
saving/transcription gap between sections. Sections are appended in order as separate paragraphs.

Press Back to leave dictation and finish. On the transcription review screen, Pebble may first
return to listening; press Back again to exit. Back also stops Stitch while a section is saving.
Accepted sections stay saved; cancelling the current recording does not remove earlier sections.
If the connection fails, Stitch stops and keeps the last accepted section for delivery. Reopen
the note and choose **Append: Stitch** to continue once the connection is restored. Reopening
the app retries a pending draft but never resumes the microphone automatically for Stitch.

Both modes are available in Actions and as button shortcuts for creating or appending. Existing
new-note and append shortcuts remain Quick Dictate; automatic dictation on launch is also Quick
Dictate. The New note row shows the two choices before recording.

## Read, check and view

Notes scroll as documents. Text, images and drawings move together without becoming selected. Up/Down moves a small animated reading step; vertical dragging moves the text with your finger. Only visible links and task checkboxes receive focus for activation with Select.

With Select set to **Normal navigation**, selecting a task checkbox checks or unchecks it in
Obsidian. The watch shows the change after the Mac confirms it. If the note changed in Obsidian
since you opened it, reopen it before toggling. Custom plugin task statuses and generated queries
are not interactive.

Images and drawings load automatically as they enter view. They do not need to be selected. If a preview fails, scroll it out of view and back to retry. Smaller watches may reduce preview resolution to fit available memory. The watch keeps one decoded preview at a time; adjacent previews may briefly reload as you scroll.
Images must be stored inside the vault. PNG, JPEG, GIF's first frame, WebP, HEIC, TIFF, BMP and
SVG are supported. Pictures fit the watch's 64-color display; they do not support zoom or pan.
Fine text or details in a large picture can be small.

Excalidraw files, compressed Obsidian drawings, and ordinary Markdown filenames marked by the
Excalidraw plugin render locally on the Mac. Drawings are previews; there is no drawing editor.
Web images and plugin-generated views are not fetched. Ordinary note embeds and PDFs are not rendered.

## Find and organize

- **Dictate to search:** Speak a term from Actions or an assigned shortcut. Fuzzy title and folder
  matches rank above incidental body matches. Select a result to open it. Search does not save a note.
- **Pin/unpin:** Long-press Up on a selected folder or note. Pins appear on the home page.
- **Hide folders:** In phone settings, expand Hidden folders, load the folder tree, select folders,
  and Apply hidden folders. Descendants also disappear from browsing, pins and search. Refresh the
  watch list afterward. Attachments in hidden folders still work inside visible notes.
- **Delete:** Select Delete note to immediately move a Markdown note to `.trash` inside its containing
  folder. There is no second confirmation. Folders cannot be deleted. To recover a file, show hidden
  files in Finder with Command-Shift-Period and move it out of `.trash`. Native `.excalidraw` deletion
  is not supported in this release; manage those files in Obsidian.

Pins refer to paths. After renaming or moving an item, pin it again at its new location.

## Make it yours

Phone settings offer Pome's theme presets, custom colors, font sizes and fonts supported by your
watch. **Long menu titles** controls marquee speed from Off through Very fast.

Single presses on Up and Down always navigate lists or scroll notes. Customize Select press and
long presses for Up, Select and Down separately in browser and note views.
Options include navigation, actions, Quick Dictate or Stitch for create/append, delete, pin, refresh and dictated search.
Double-press Back to open Actions by default, even if Select has a custom shortcut. You can assign a different Double Back action in settings.

## When the Mac is unavailable

Reading, task changes and pictures require a live connection. Dictated notes remain queued on the
phone until the Mac confirms them. Queued captures keep their original vault and destination even
if you navigate elsewhere. Reopen Notesy to retry after reconnecting. Phone settings lets you copy
pending text for recovery after a vault change. Do not erase Pebble data while captures are pending.

For precise storage, size and paging limits, see [README](../README.md#limits).

## Touch controls

On a touch-capable watch with touch enabled, tap a different folder, note, task or action row to highlight it first. Its title can scroll while you read. Tap the highlighted row again to open or activate it (including toggling a task checkbox); no quick double-tap is required. Tapping note text or an image does nothing. Double-press Back for Actions by default (configurable in settings). Swipe right in a note to return, and swipe vertically to scroll; physical buttons continue to work. Taps use these standard actions regardless of custom Select shortcuts.

## Browsing, sorting and returning to the top (1.2.0)

Notesy holds 15 entries on the watch at a time. Reaching an edge by touch or button navigation loads the adjacent page, with one overlapping entry so a boundary note is not skipped. Scroll up to return through earlier pages. This applies to folders, the vault root, search results and tag lists. It is not a 15-note limit.

Open **Actions → Sort notes** for **Name (A–Z)**, **Date modified (newest first)**, **Date created (newest first)** or **Tag**. Phone settings offer the same choices under **Vault → Sorting**. Successful watch sorting choices are saved to phone settings. Folder rows remain alphabetized before notes, and pinned items remain at the top of the vault.

**Tag** opens a paged list of tags from notes directly in the current folder. At the vault root it lists tags from root notes, not all nested folders. Selecting a tag shows matching notes in name order. Back returns from the matching notes to the tag list; Back again leaves tag mode. Tags include inline hashtags and common Obsidian `tags` property forms (a string, inline list or YAML list); code blocks and inline code are ignored. Nested tags are exact matches. Notes with no tags do not appear in filtered results.

**Actions → Return to top** goes to the first entry in the current folder or vault using the current sort. From an open note it returns to that browsing location; from search it returns to the folder. Assign **Return to top** or **Sort notes** to Select or any long press under **Shortcuts**. Up/Down single presses always navigate.

Creation dates use the filesystem creation time supplied by macOS, which can change when files are copied or restored. If a creation time is unavailable, modified time is used. Hidden folders remain hidden. New browsing requires the matching 1.2.0 Notesy service in Organik Apps Pebble Connector; update the Connector before installing this watch build.

## Note links and Markdown (1.4.4)

See [note links and Markdown](MARKDOWN_AND_LINKS.md) for selectable linked notes,
Back navigation, formatting support and the matching-Connector requirement.

## Photo and drawing display modes (1.4.6)

In phone settings, open **Themes → Photos and drawings**:

- **Natural** (default) balances photos for Pebble's limited colors and uses a clean-line treatment for Excalidraw and SVG drawings.
- **High contrast** strengthens faint details.
- **Original** uses the previous color conversion.

Save and reopen a note to reload its previews with the selected mode. The conversion affects watch previews only; original vault attachments are unchanged. Connector 0.8.0 or later is required for the new treatments.

## PDFs (1.4.6)

PDF files appear alongside notes in the vault browser and can be pinned or opened from a note link. Embedded PDFs such as `![[Guide.pdf]]` display their pages inline; `![[Guide.pdf#page=3]]` displays that page only. Each preview is labeled with its page number and total. Scroll normally in either direction: Notesy loads previews as pages come into view, including beyond the first set of 15 content items.

These are whole-page previews, with no zoom or text selection. Fine print may be too small to read on the watch. Natural, High contrast and Original also apply to PDFs, using the clean-line drawing treatment. PDFs are read-only: dictate into a separate note, and remove PDF attachments in Obsidian. Limits are 20 MB and 1,000 pages per PDF; locked or damaged PDFs show an explanation. Connector 0.8.0 or later is required.

## Full-width media (1.4.8)

Photos, drawings and PDF pages use the available reader width while retaining their proportions. Portrait previews become taller and scroll with the note. Source resolution remains bounded for watch memory; enlarging a preview does not add detail. Extremely tall, narrow previews retain their proportions within the watch layout limit.
