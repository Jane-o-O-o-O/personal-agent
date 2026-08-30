//! Building blocks for implementing custom [`TransportBackend`](crate::TransportBackend)s.
//!
//! The crate root exposes the **consumer** API — [`Transport`](crate::Transport),
//! [`Endpoint`](crate::Endpoint), [`TransportRequest`](crate::TransportRequest),
//! [`HttpTransportBackend`](crate::HttpTransportBackend), etc. — used to *send*
//! requests.
//!
//! This module gathers the **implementer** API: the response protocol types,
//! the long-task polling framework, the resumable-download state machine, and
//! the request-envelope helpers that a custom backend reuses inside its
//! [`TransportBackend::execute`](crate::TransportBackend::execute). The built-in
//! `HttpTransportBackend` is assembled from these pieces.

/// WeCom API response protocol: response shape plus business error-code validation.
///
/// [`validate_api_response`](protocol::validate_api_response) turns an
/// `error.code != 0` body into [`Error::Api`](crate::Error::Api);
/// deserialization itself is done by the caller via
/// `HttpResponse::json::<ApiResponse>()`.
pub mod protocol {
    pub use crate::http::protocol::{ApiErrorInfo, ApiResponse, validate_api_response};
}

/// Generic long-task polling framework shared by the HTTP backend and custom backends.
///
/// A backend injects a per-round `fetch` closure into
/// [`poll_long_task`](polling::poll_long_task); the framework owns retry /
/// backoff / timeout / `done` detection.
/// [`LongTaskPollData`](polling::LongTaskPollData) adapts a backend's response
/// type into the framework, and [`PollMode`](polling::PollMode) selects the
/// wire mode.
pub mod polling {
    pub use crate::polling::{LongTaskPollData, LongTaskPollInfo, PollMode, poll_long_task};
}

/// HTTP Range resumable-download assembly.
///
/// [`into_resumable`](resumable::into_resumable) wraps a partial
/// (`206` / `Content-Range`) first response into an auto-resuming stream; the
/// caller's resume closure builds the `Range` header itself (via
/// [`range_header_value`](resumable::range_header_value)) and owns per-request
/// signing / routing.
pub mod resumable {
    pub use crate::http::resumable::{into_resumable, range_header_value};
}

/// WeCom HTTP gateway request-envelope helpers.
///
/// [`with_request_envelope`](envelope::with_request_envelope) composes the
/// endpoint's request-side envelope wrapping (e.g. `{"payload":
/// "<json-string>"}`) into a [`HttpRequestPayload`](crate::HttpRequestPayload)
/// at the pipeline entry (the single composition point);
/// [`apply_request_envelope`](envelope::apply_request_envelope) is the one-shot
/// wrapping it builds on. [`compute_ranged`](envelope::compute_ranged) computes
/// the clamped chunk size for an eligible ranged download from the endpoint's
/// `range_size` and the payload kind (no materialization).
pub mod envelope {
    pub use crate::http::{apply_request_envelope, compute_ranged, with_request_envelope};
}

/// The single HTTP protocol pipeline.
///
/// [`pipeline_execute`](pipeline::pipeline_execute) covers: composing the
/// request-envelope wrap at the entry (closure stacking over the factory, lazy
/// materialization) → deriving the first-segment `Range` header from the
/// endpoint's `range_size` (JSON payloads only) → building the `HttpRequest` →
/// binary/resumable download (segments re-materialized via the composed factory,
/// each declaring its own `Range` header) → response envelope parse (strategy
/// read from the endpoint) → long-task polling → result extraction. Shared by
/// `HttpTransportBackend` and custom backends.
pub mod pipeline {
    pub use crate::http::request::{PollDefaults, pipeline_execute};
}

/// Fill an endpoint's `None` `base_url` with the
/// backend's transport-level defaults, so downstream code sees concrete
/// values. Used by custom backends that embed an
/// [`HttpTransportBackend`](crate::HttpTransportBackend).
pub use crate::http::request::resolve_endpoint_defaults;
