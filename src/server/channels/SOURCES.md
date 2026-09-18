# Weixin Channel Source

Protocol reference: Tencent's [openclaw-weixin](https://github.com/Tencent/openclaw-weixin/tree/24de5c9eb0dd5e595d7e2d090ed8a3f82870d42c), version 2.4.9, MIT. The adapter implements its public HTTPS protocol without importing the OpenClaw host.

- [Protocol documentation](https://github.com/Tencent/openclaw-weixin/blob/24de5c9eb0dd5e595d7e2d090ed8a3f82870d42c/docs/protocol_zh_CN.md)
- [Login state machine](https://github.com/Tencent/openclaw-weixin/blob/24de5c9eb0dd5e595d7e2d090ed8a3f82870d42c/src/auth/login-qr.ts)
- [Headers, request bodies and message-ID handling](https://github.com/Tencent/openclaw-weixin/blob/24de5c9eb0dd5e595d7e2d090ed8a3f82870d42c/src/api/api.ts)
- [Message construction](https://github.com/Tencent/openclaw-weixin/blob/24de5c9eb0dd5e595d7e2d090ed8a3f82870d42c/src/messaging/send.ts)
- [Polling and stale-token guard](https://github.com/Tencent/openclaw-weixin/blob/24de5c9eb0dd5e595d7e2d090ed8a3f82870d42c/src/monitor/monitor.ts)

The Node 24 structured JSON reviver reads uint64 identifier tokens without numeric rounding. This replaces the upstream source scanner while preserving its purpose.

Local behavior: scanner identity binding, authenticated direct messages, encrypted Bot credentials/cursor/context, atomic inbox/task/cursor updates, persistent command processing, cancellation, bound approval/rejection, and a separate result outbox. A sending record interrupted by restart becomes `unknown`; it is not automatically replayed. Outbound success requires an explicit `ret: 0` receipt. Sender errors never rerun business tasks.

An approval command only addresses an unexpired pending request belonging to a task created by this bound account/user. Its hash and version come from persistent records. Approval requires all parts of the matching full action/parameter notice to have confirmed delivery; uncertain delivery leaves the workbench decision available. Explicit approval queries can request the complete current notice again. Rejection does not execute the action.

Text tasks, text status/cancellation commands and text results are implemented. The protocol tests use controlled server responses. Real QR confirmation, delayed/restart reply validity, media transport, and arbitrary-time proactive notifications require account verification and are not claimed as tested capabilities.
