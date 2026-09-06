# Release Notesy

## Current state

Notesy 1.2.0 is the public beta. See docs/RELEASE_STATUS.md for verified publication
and validation state. This checklist does not itself establish that any release step is complete.
Canonical repositories: `GeezusChrotch/notesy` and `GeezusChrotch/organik-pebble-connector`.

The separate connector task owns its 0.3.0 implementation, signing, notarization, Sparkle feed
and final installer. Do not rebuild or replace its working files from this repository.

## Build and review

1. Follow renderer setup in README, then run `npm run package` and `npm run release:kit`.
2. Verify `dist/Notesy-1.2.0.pbw`, source archive, store assets and `SHA256SUMS`.
3. For stable promotion, install the release PBW into the emulator and physical watch. Verify pairing, a new note,
   append, check/uncheck, immediate delete/recovery, hidden folders, pins, dictated search,
   long-text/photo scrolling and drawing previews using disposable content.
4. For stable promotion, test a fresh Mac/phone setup and an upgrade from the previous paired setup with the final
   connector. No undocumented Terminal step should be required for users.
5. Confirm public artifacts contain no personal configuration and all third-party notices.
6. Verify the listing's platform support and icon/screenshot dimensions against the submission
   form. The store description must remain within 1,600 characters.

## Publication order — only after release approval

1. Create the public MIT source repositories at the agreed names and push reviewed source.
2. Enable GitHub private vulnerability reporting and Pages for Notesy from the repository root.
3. Publish the connector's signed/notarized DMG and signed Sparkle appcast using its own release
   instructions. Verify the feed and installer links from outside the developer Mac.
4. Publish Notesy's `v1.2.0` release with PBW, source archive, store asset archive, checksums and
   the text from `docs/RELEASE_NOTES_1.2.0.md`.
5. Publish the prepared Beepster, Reminderz and Pome migration/documentation updates only after
   the unified connector download resolves. Historical release notes remain historical.
6. Submit Notesy to the Pebble store with `APPSTORE_LISTING.md` and the prepared artwork.
   Use `python scripts/publish-store.py` in the Pebble SDK Python environment with the usual
   `pebble publish` flags. This keeps the official authentication/build flow but uploads the
   exact checksum-verified dist PBW rather than its local debug-map build.
7. Click every download, source, support and setup link as a new user. Install from those exact
   public assets and check their hashes against the local release manifest.

Do not publish old `Notesy-0.1.0.pbw` files that may remain in local dist. Watch app versions and
connector versions are separate; existing Beepster/Reminderz/Pome binaries do not need a version
bump solely to use the unified connector. Preserve their existing UUIDs and pairing.

## Rollback

Keep the previous known-good PBW and Mac app. Restore those artifacts if needed; do not clear
phone storage, rotate credentials, reset Tailscale globally, or rewrite vault notes as part of a
rollback. Revalidate queued capture delivery after reconnecting.
