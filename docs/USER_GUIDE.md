# Using Notesy

## Browse and capture

The home page shows pinned items first, then folders and root notes. Up/Down moves through the
list; Select opens an item; Back returns to the previous location. Lists load more automatically
in both directions as you scroll. **Actions → Refresh** picks up changes made in Obsidian.

**New note** creates a file in the folder you are viewing. **Append** adds dictation to the
selected or open note. New note, when assigned in note view, creates a separate note alongside
it. Drawing source cannot be appended to; create a note alongside a drawing instead.

By default, long-press Select opens Actions in the browser and appends while reading. Double-press
Back always opens Actions. The watch OS reserves long-press Back to exit the app.

New files lead with the local date and readable time, followed by the first sentence. Existing
filenames are preserved. Retry receipts prevent a delayed connection from saving the same capture twice.

## Read, check and view

Plain notes scroll as text. Notes with Markdown tasks or pictures use a content menu. Long text
blocks scroll fully before the selection advances to the next item.

With Select set to **Normal navigation**, selecting a task checkbox checks or unchecks it in
Obsidian. The watch shows the change after the Mac confirms it. If the note changed in Obsidian
since you opened it, reopen it before toggling. Custom plugin task statuses and generated queries
are not interactive.

A selected image row loads a preview automatically; Select retries an unsuccessful preview.
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

Assign short and long presses for Up, Select and Down separately in browser and note views.
Options include navigation, actions, create, append, delete, pin, refresh and dictated search.
If you reassign navigation, double Back opens Actions with movement controls.

## When the Mac is unavailable

Reading, task changes and pictures require a live connection. Dictated notes remain queued on the
phone until the Mac confirms them. Queued captures keep their original vault and destination even
if you navigate elsewhere. Reopen Notesy to retry after reconnecting. Phone settings lets you copy
pending text for recovery after a vault change. Do not erase Pebble data while captures are pending.

For precise storage, size and paging limits, see [README](../README.md#limits).
