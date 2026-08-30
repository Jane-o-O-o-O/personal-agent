//! Outbound request observability helpers.
//!
//! Provides wire contracts (span names, field names, event targets),
//! a generic capture mechanism, and public re-exports.
//!

//! # Module layout
//!
//! - [`contract`] — Stable wire contract constants (span names, field names,
//!   event targets) in the [`http_request`] sub-module.
//! - [`capture`]  — `TraceLayer` / `CaptureScope` / `HttpFieldsBuilder` /
//!   field recorders
//! - [`records`]  — `HttpRequestRecord` / `CapturedBody` / `CaptureSpanId`
//!   (pure data types)
//! - `request_span` — `RequestSpan` (crate-internal, not re-exported)
//!
//! The HTTP-specific `instrument_body` helper lives in the crate-internal
//! `http_client::body_guard` module, alongside the backends that use it.
//!
//! [`http_request`]: contract::http_request

pub mod capture;
pub mod contract;
pub mod records;
pub(crate) mod request_span;

// Re-exports: make types directly accessible from `telemetry`
pub use capture::{CaptureScope, TraceLayer};
pub use records::{CaptureSpanId, CapturedBody, HttpRequestRecord};
pub(crate) use request_span::RequestSpan;
