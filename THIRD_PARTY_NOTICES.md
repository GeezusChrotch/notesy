# Third-party notices

Notesy's original code, documentation and artwork are released under the [MIT License](LICENSE).
Dependencies retain their own licenses; this file does not relicense them.

| Component | Use | License / notice |
| --- | --- | --- |
| Excalidraw 0.18.1 | Local drawing preview export | MIT; `renderer/Excalidraw-LICENSE.txt` |
| React / React DOM 18.3.1 | Excalidraw renderer dependency | MIT; bundled `renderer.js.LEGAL.txt` after build |
| LZ-String 1.5.0 | Obsidian compressed drawing decoding | MIT; built renderer `LZString-LICENSE.txt` |
| Excalidraw fonts | Local drawing text | Multiple notices retained in `renderer/Font-Notices.txt` and the bundled fonts directory |
| Inter, Roboto, Open Sans, Montserrat, Poppins | Watch reading and menu fonts | See `resources/fonts/licenses/` and `resources/fonts/README.md` |
| esbuild and renderer dependencies | Build tooling and runtime transitive dependencies | Pinned by `renderer/package-lock.json`; runtime notices emitted into `renderer.js.LEGAL.txt` |

The connector also bundles Node.js, other apps' components and its updater. Its own distribution
must include their notices. Notesy's source archive includes the renderer lockfile and original
notices; `npm ci --prefix renderer` retrieves dependencies rather than shipping `node_modules`.

Apple frameworks, the Pebble SDK, Obsidian and Tailscale are separately supplied products.
Their names are used only to describe compatibility. No endorsement or affiliation is implied.
