//! Stable telemetry wire contract.
//!
//! The constants in this module define the **wire contract** between
//! `wecom-transport` and any downstream `tracing` [`Layer`] performing
//! statistics / reporting. This includes:
//!
//! - span names and structured field names (in the [`http_request`]
//!   sub-module);
//! - event targets for body-level debug events (module-level constants).
//!
//! A reporter attaches a [`Layer`] and:
//! 1. filters by `metadata().name()` (for spans) or `metadata().target()`
//!    (for events) — match on the **constant**, never on the string literal;
//! 2. reads structured fields via a field visitor.
//!
//! # Stability
//!
//! Renaming or reinterpreting any constant here is a breaking change.
//! Adding new constants in append-only fashion is a minor compatible
//! change.
//!
//! [`Layer`]: https://docs.rs/tracing-subscriber/latest/tracing_subscriber/layer/trait.Layer.html
//!
//! # Companion types
//!
//! [`CaptureSpanId`](super::records::CaptureSpanId) lives in
//! [`super::records`] — it is not a string constant but part of the
//! capture mechanism's public API.

// ── Span / field name contracts ──────────────────────────────────

pub mod http_request {
    // ── Span name ──

    /// `info_span!` name of a single physical HTTP request, opened by the
    /// reqwest backend.
    ///
    /// The constant value is `"http.request"`.
    pub const SPAN_NAME: &str = "http.request";

    // ── Field names ──

    /// Backend identifier: `"reqwest"`.
    pub const FIELD_BACKEND: &str = "backend";
    /// Request URL (display).
    pub const FIELD_ENDPOINT: &str = "endpoint";
    /// Action name (display). Empty for generic HTTP requests.
    pub const FIELD_ACTION: &str = "action";
    /// Masked request headers (Debug, via `MaskedHeaders`).
    pub const FIELD_REQ_HEADERS: &str = "req.headers";
    /// HTTP response status code (u64).
    pub const FIELD_RES_STATUS: &str = "res.status";
    /// Masked response headers (Debug, via `MaskedHeaders`).
    pub const FIELD_RES_HEADERS: &str = "res.headers";
    /// Total bytes consumed from the response body (u64), recorded when the
    /// body stream is dropped.
    pub const FIELD_RES_BODY_LEN: &str = "res.body_len";
    /// Time-to-headers in milliseconds (u64).
    pub const FIELD_DURATION_HEADERS_MS: &str = "duration.headers_ms";
    /// Time-to-body-end in milliseconds (u64), recorded when the body
    /// stream is dropped.
    pub const FIELD_DURATION_TOTAL_MS: &str = "duration.total_ms";
    /// Error message at the failure return site (display, empty on success).
    pub const FIELD_ERROR: &str = "error";
}
