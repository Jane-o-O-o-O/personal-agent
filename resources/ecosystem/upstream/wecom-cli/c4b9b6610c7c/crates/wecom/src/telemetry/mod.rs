//! Stable telemetry event contracts consumed by external stats reporters.
//!
//! All business events are emitted through [`emit`] on a single unified target
//! and consumed through [`EventExt::on_event`].

mod combined_layer;
pub mod contract;
mod event_capture;
mod layer;
mod marker;
mod serde_fallback;

pub use combined_layer::TelemetryLayer;
pub use event_capture::{ClientEvent, EventExt, emit};
pub(crate) use serde_fallback::{
    EmitDefaultOnError, EmitMapSkipError, EmitVecSkipError, FieldLabel, schema_field_labels,
};
pub use wecom_transport::telemetry::{
    CaptureScope, CaptureSpanId, CapturedBody, HttpRequestRecord,
};
