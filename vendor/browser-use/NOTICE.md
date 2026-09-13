# Browser Use Pi execution modules

Source: https://github.com/browser-use/browser-use-pi
Commit: f1f763667303f08e9a2532c89304522da67996e5
License: MIT, preserved in LICENSE.

Only the deterministic browser, CDP, AX, page, worker and supporting modules
are included. The upstream Agent, model loop, public SDK and cloud server are
not used. Application planning stays in the host Pi 1.0.0 session.

Local changes:
- BrowserRuntime accepts a compiled worker path. The host bundles TypeScript
  into a standalone worker and starts it without provider credentials or loaders.
- AX dialogs are reported without automatically accepting confirm or prompt.
  The authenticated workbench owns the explicit decision.
- Worker IPC callbacks use the explicit Node 24 overload.
- Chromium receives only display, locale and path environment variables,
  rather than inheriting application credentials.
- The cell deadline includes automatic AX observation; no additional ten-second
  grace period extends the host's execution budget.
- Page.screenshot accepts an optional viewport size for the host's fixed live
  screen. It preserves the current scroll origin and pixel scale; the upstream
  default clipping behavior is unchanged for other callers.
- Owned Chromium closes through CDP before bounded signal fallback. Profile
  locks record process identities and are released only after confirming the
  owned process exited; unknown native locks preserve the existing profile.
- The CDP client uses the project's existing ws transport with compression
  disabled. A real VPS reproduction closed the Node native WebSocket at
  Runtime.enable with code 1006; the identical ws sequence retained the page
  and completed navigation, screenshots and 128 streamed frames. This is an
  observed transport difference, not a claim about the underlying TCP cause.

The host provides persistent profiles, ownership, input, streaming and recovery.
Host captures are isolated by target, control generation and document loader.
Streaming uses an independent screenshot watchdog and an opt-in workbench frame acknowledgment
protocol that keeps one frame in flight and only the newest pending frame. These
are application adaptations, not changes to the upstream Agent or model loop;
the protocol and verification scope are documented in the
[browser service README](../../src/server/browser/README.md).
The V8 context is not an operating system sandbox; deployment isolation is
separate from these modules.
