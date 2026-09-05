# Contributing

Small, focused fixes and reproducible bug reports are welcome. Notesy is free MIT open-source
software. Contributions are accepted under the same license.

Read [README](README.md#development), then run `npm test` and `npm run package`. Renderer tests
need the local renderer built as described there. Use disposable vault fixtures for tests.
Never commit personal notes, credentials, private addresses, local state or generated pairing codes.

Preserve watch UUIDs, existing phone storage keys and queued-capture semantics during upgrades.
Keep lists and image memory bounded. Verify that a build installs separately from checking it on
a physical watch. Document unsupported formats and connection requirements honestly.

For UI changes, include screenshots from fictional notes and say which watch/font settings you
checked. For note writes, demonstrate that unrelated bytes survive and retries do not duplicate work.
