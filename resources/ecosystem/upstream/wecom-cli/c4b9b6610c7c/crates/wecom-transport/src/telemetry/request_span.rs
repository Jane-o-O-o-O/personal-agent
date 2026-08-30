//! Injectable `http.request` span with a shared constructor.
//!
//! Provides [`RequestSpan`] — a wire-contract-compliant span that backends
//! can receive via `Option<RequestSpan>` instead of creating their own.
//! The single source of truth is [`RequestSpan::new`].

use super::contract::http_request as ctr;

// ════════════════════════════════════════════════════════════════
// RequestSpan — injectable http.request span
// ════════════════════════════════════════════════════════════════

/// A wire-contract-compliant `http.request` span, created via
/// [`RequestSpan::new`].
///
/// The inner span has all contract fields pre-declared as
/// [`tracing::field::Empty`]. Backends fill them via `span.record(...)`
/// as the request lifecycle progresses.
///
/// Only [`RequestSpan::new`] can produce a valid `RequestSpan` — the inner
/// field is `pub(crate)` to guarantee provenance. Any injected span
/// matches the wire contract and the [`TraceLayer`](super::capture::TraceLayer)
/// name filter by construction.
#[derive(Clone, Debug)]
pub(crate) struct RequestSpan(pub(crate) tracing::Span);

impl RequestSpan {
    /// Create an `http.request` span with all wire-contract fields
    /// pre-declared as [`tracing::field::Empty`].
    ///
    /// This is the single source of truth for the span field set. Backends
    /// use it both in the default (self-created) and injected paths.
    ///
    /// # Stability
    ///
    /// Adding a new field here (to keep parity with a new backend) is a
    /// minor compatible change. Removing or renaming a field is breaking.
    pub(crate) fn new() -> Self {
        use tracing::field::Empty;
        Self(tracing::info_span!(
            ctr::SPAN_NAME,
            { ctr::FIELD_BACKEND } = Empty,
            { ctr::FIELD_ENDPOINT } = Empty,
            { ctr::FIELD_ACTION } = Empty,
            { ctr::FIELD_REQ_HEADERS } = Empty,
            { ctr::FIELD_RES_STATUS } = Empty,
            { ctr::FIELD_RES_HEADERS } = Empty,
            { ctr::FIELD_RES_BODY_LEN } = Empty,
            { ctr::FIELD_DURATION_HEADERS_MS } = Empty,
            { ctr::FIELD_DURATION_TOTAL_MS } = Empty,
            { ctr::FIELD_ERROR } = Empty,
        ))
    }
}

impl Default for RequestSpan {
    fn default() -> Self {
        Self::new()
    }
}
