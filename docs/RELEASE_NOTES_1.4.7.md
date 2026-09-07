# Notesy 1.4.7 — complete task text in every theme

Requires **Organik Apps Pebble Connector 0.8.1 or later**. Update the Connector before the watch app. Existing pairing, vault choices, pins, hidden folders and notes are preserved.

- Size checkbox rows using the selected theme's actual font and available text width, so wrapped task text no longer clips at a fixed row height.
- Preserve task text beyond the previous 220-character summary. Long tasks continue as scrolling text while retaining one checkbox and the original task's check/uncheck behavior.
- Recalculate the open note's layout when the theme changes.

The original vault note is unchanged. PDF previews and Natural/High contrast/Original image processing from 1.4.6 remain included.

All 93 automated tests and clean Basalt/Emery builds pass. The packaged Connector's task-text checks passed, and the exact watch package was installed. Josh tested the task-text fix and reported “Working great.” This is acceptance of the reported task-text problem, not exhaustive testing of every feature. Fresh setup and broader PDF/image visual acceptance remain separate checks. Notesy remains a free, MIT-open-source public beta.
