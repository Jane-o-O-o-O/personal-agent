# Browser service

The application uses `createBrowserService()` with one persistent Chromium
profile and one owner. Pi planning remains in the application process. The
browser worker is a deterministic V8/CDP executor built from the fixed upstream
modules in `vendor/browser-use`; it has no model loop and an empty environment.
Chromium receives a minimal display/locale/path environment.

## Production isolation

Run `tsx src/server/browser/sidecar.ts` in a separate non-root container. Keep
Chromium's sandbox enabled and CDP on loopback. The browser container receives
only its persistent browser volume and the shared task workspace volume. Do
not mount the application's database, encryption key or credential files.
The V8 context itself is not an operating system sandbox.

Sidecar configuration:

| Variable | Purpose |
| --- | --- |
| BROWSER_SERVICE_TOKEN | Private service authentication, at least 24 characters |
| BROWSER_SERVICE_HOST | Internal bind address; Docker uses 0.0.0.0 |
| BROWSER_SERVICE_PORT | Internal HTTP/WebSocket port, default 3101 |
| BROWSER_DATA_DIR | Persistent browser profile/runtime directory |
| BROWSER_WORKSPACE_DIR | Shared task workspace root |
| BROWSER_EXECUTABLE_PATH | Chromium executable, e.g. /usr/bin/chromium |
| BROWSER_HEADLESS | Headless by default; false requires a display |

Application configuration sets `BROWSER_SERVICE_URL` to the sidecar's private
HTTP URL and `BROWSER_SERVICE_TOKEN` to the same service token. No browser port
should be published publicly. Local development can omit the URL and use a
separate Chrome profile under DATA_DIR/browser/profile.

## Control and recovery

The service checks generation for manual input and permits free input only
after takeover. Takeover first stops active code and invokes the host's pause
callback. Releasing rereads the page and discards JavaScript bindings; the host
decides when to resume the task. JavaScript dialogs are never accepted
automatically and require an explicit authenticated decision.

The workbench coalesces adjacent scroll and pointer samples while preserving
discrete input order. Physical keyboard input includes key codes and modifiers;
manual mouse down/up, drag and double-click events reach Chromium through CDP.
Pointer moves carry both the held button and the buttons bitmask so Chromium
retains webpage pointer capture throughout a drag.
Pressed pointers are cleared when control or the document changes. An explicit
worker focus message follows tab selection during a running cell, independently
of recording. A task blocked by human ownership waits for browser control rather
than completing; the user explicitly returns control and continues its Pi session.

Cancellation and deadlines kill the worker. Browser actions may already have
happened, so callers must inspect results before retrying. Downloads go to
the current task workspace. Normal restart preserves profile storage. A live
profile lock is never removed automatically.

Owned Chromium closes with CDP `Browser.close`, with bounded TERM/KILL fallback
for its own child only. SDK locks record process start identity, host and Linux
boot/PID namespace. Recovery requires proof that both recorded owners exited
in the same process domain. Native-only, foreign and unverifiable locks block
startup; a new container cannot prove an old container exited from its own
process list. Production fixes the browser hostname and allows 30 seconds for
shutdown. Profile contents and cookies are preserved.

Frames use native CDP screencast with acknowledgment and screenshot fallback,
with a 1440x900 CSS viewport and device scale factor 1. Frame transport does not
send screenshots to the model. Same-process iframe AX actions are supported;
cross-process frames require explicit CDP handling or user takeover.

The workbench connects to `/api/browser/stream?ack=1`. This client acknowledgment
is separate from CDP's native screencast acknowledgment. Each delivered frame
has a connection-local `sequence`; the client responds with
`{type:"frame_ack",sequence}` even when it discards an old-generation frame.
The application keeps one frame in flight and only the newest pending frame,
advancing after the exact in-flight sequence is acknowledged. Incorrect or old
acknowledgments do not advance the queue. No acknowledgment within 15 seconds
closes the connection with code 1013; the workbench reconnects. Clients that
omit `ack=1` retain the previous protocol without sequence or acknowledgment.

The screenshot watchdog and the first selected-page capture run independently
of pending native stream stop/start commands. Captures are shared only for the
same target, control generation and top-level document loader. Late old-target
frames are filtered, and captures from a replaced document are rejected. The
live viewport includes scrollbar pixels so manual input uses the same 1440x900
coordinate space at every scroll position.

Tab metadata refreshes use a revision check so an older response cannot replace
a newer tab list. The workbench also ignores older control state responses and
retains a new frame if it arrives before a navigation or tab-selection HTTP
response.

## Verification

`npx vitest run tests/app/browser.test.ts tests/app/browser-lock.test.ts tests/app/browser-sidecar.test.ts tests/app/browser-navigation.test.ts tests/app/browser-frame-generation.test.ts tests/app/browser-frame-stream.test.ts`
uses a real isolated Chrome profile and local fixture server. It covers Chinese
input, trusted events, AX/DOM, JS state, native pixels and frames, cancellation,
deadlines, detached nodes, iframe input, downloads, dialogs, ownership, tab
switching, private HTTP/WebSocket transport, normal profile restart, native lock
cleanup and conservative recovery after the fixture owners exit.
Additional capture tests delay real screenshot and native lifecycle responses,
assert old frame isolation, and check fixed-width current-scroll pixels while
the native stream is stopped. Real WebSocket tests cover delayed client
acknowledgment, replacement of queued frames, exact-sequence validation and
compatibility without acknowledgment.

The 2026-10-03 VPS workbench run passed 17/17 checks, including Chinese input,
confirm/prompt decisions, live pixels at 1440x900, 390x844 and 360x800 workbench
sizes, desktop scroll/keyboard input, tab switching, mobile touch input, fresh
DOM after handoff and Chromium namespace/seccomp sandbox checks. This uses a
controlled local fixture in the deployed browser, not a third-party service
account. Evidence is in `.runtime/full-verification/browser.json`; live relay
and VPS results are recorded separately in `docs/full-functional-test-report.md`.
