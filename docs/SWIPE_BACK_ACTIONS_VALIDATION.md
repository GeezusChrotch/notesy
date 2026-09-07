# Notesy 1.3.4 swipe Back and Actions alignment

Josh confirmed physical-watch link tapping works in 1.3.3, then requested swipe Back and reported blank space above Actions.

A predominantly rightward swipe of at least 40 pixels inside the reader now follows the physical Back handler: return through linked-note history, then to the folder/vault list. Leftward swipes do nothing. Vertical swipes still scroll, and tap highlighting/opening is preserved. Touch continues to ignore loading or covered reader windows.

Actions now starts with its first item at the top, clamping the positive scroll offset introduced by SDK center-focused menus. The same correction runs after changing to dictation choices or sort choices. Center-focused two-tap behavior remains enabled.

Validation: all 74 automated tests and Basalt/Emery builds pass. Native gesture tests cover rightward Back, ignored leftward swipes, vertical navigation and drag rejection. Real Emery QMP finger events verify link opening, swipe Back, repeated navigation, top-aligned reader/browser Actions and dictation choices, and resumed reader touch after Actions.

This is a watch-only change; the installed Connector with Notesy 1.3.3 gateway remains compatible. No gateway or phone settings changes are required. Physical-watch acceptance of these new changes is pending; 1.3.4 is not installed or published by this work.

Candidate: `dist/Notesy-1.3.4.pbw`.

SHA-256: `e417d865e1d316e93f7cbde1333d49c53c6e3ce5967262968ab80279fd8f432a`.

Reproduce with `npm run package`, then `scripts/test-reader-touch.py` using the Pebble tool's Python. This uses a disposable vault and local emulator only.
