# Reporting security issues

Do not put credentials or private notes in a public issue. Once the repository is published,
use GitHub's private vulnerability reporting if enabled. Otherwise open a minimal issue asking
for a private reporting channel, without exploit details or sensitive data.

Supported release line: Notesy 1.x. The Mac connector has a separate version and release process.

Notesy serves only the selected vault through an authenticated loopback service exposed privately
with Tailscale Serve. Folder hiding is a display preference, not an authorization boundary.
Do not expose the service through public Funnel or router port forwarding.
