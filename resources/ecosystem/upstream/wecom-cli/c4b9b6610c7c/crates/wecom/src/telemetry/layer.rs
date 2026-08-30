//! Wecom business-event tracing [`Layer`] — dispatches unified telemetry
//! **events** to typed subscribers registered on a [`CaptureScope`].
//!
//! `EventLayer` is **internal** (`pub(crate)`). Users mount
//! [`TelemetryLayer`] instead, which composes `EventLayer` with
//! [`TraceLayer`] into a single layer.
//!
//! [`TelemetryLayer`]: super::combined_layer::TelemetryLayer
//! [`TraceLayer`]: wecom_transport::telemetry::TraceLayer
//! [`CaptureScope`]: wecom_transport::telemetry::CaptureScope

use tracing::Subscriber;
use tracing_subscriber::Layer;
use tracing_subscriber::layer::Context;
use tracing_subscriber::registry::LookupSpan;

use super::contract;
use super::marker::EventMarker;

/// Tracing [`Layer`] that dispatches wecom business events to subscribers
/// registered on the surrounding [`CaptureScope`].
///
/// [`CaptureScope`]: wecom_transport::telemetry::CaptureScope
#[derive(Debug, Clone, Default)]
pub(crate) struct EventLayer;

impl<S> Layer<S> for EventLayer
where
    S: Subscriber + for<'l> LookupSpan<'l>,
{
    fn on_event(&self, event: &tracing::Event<'_>, ctx: Context<'_, S>) {
        if event.metadata().target() != contract::event::TARGET {
            return;
        }
        let Some(parent) = ctx.event_span(event) else {
            return;
        };
        EventMarker::with_nearest(Some(parent), |marker| {
            if let Some(hook) = marker.on_event.lock().ok().and_then(|g| g.clone()) {
                hook(event);
            }
        });
    }
}
