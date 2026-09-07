# Notesy 1.3.2 candidate

PBW SHA-256: `0c5f255a22e16b225f72ad764388665a01ff249c1e9bbccb76f73fa5e665682d`.
Not installed on the physical watch or published.

- 71 automated tests pass, including a host-compiled test of the actual reader tap
  callback: a different row highlights, a subsequent tap activates, taps outside
  the content or during loading are ignored, and ordinary text still opens Actions.
- Basalt/Emery builds and companion syntax check pass.
- Parser tests cover named Markdown links, HTML anchors, bare URLs, autolinks,
  supplied titles, code literals, internal note links and emphasis continuation.
- Fetch tests cover pinned public DNS, redirects to private hosts, credentials,
  ports, cached titles, HTML entities, deadlines, body limits and fallback text.
- Phone transport test confirms web titles become ordinary reader text, with no
  raw URL or linked-note action in the watch message.
- A real request to example.com returned Example Domain. A separate disposable
  vault and authenticated /v3/notes/:id request displayed the named link and fetched
  title with no web-link action. No live-vault fixture or edit was used.
- Image indices remain stable: title enrichment replaces a web block's text only.
- Touch callback logic is host-tested; new physical-watch tap acceptance is pending.

Connector integration must include gateway/web-titles.js and all changed gateway
modules. /v3/notes/:id now awaits title enrichment of visible web blocks. New kind
web degrades to text in existing companions; task/image routes and pairing are
unchanged. Named links do not trigger page requests. Bare URL requests are public
HTTP(S) only, with no credentials, cookies, referrer or JavaScript; see PRIVACY.md.
The installed Connector 0.6.0 needs this gateway update for web titles. The watch
reader tap fix is independent of that update.
