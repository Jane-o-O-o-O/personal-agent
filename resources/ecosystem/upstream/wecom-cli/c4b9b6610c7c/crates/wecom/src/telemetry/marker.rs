//! Shared dispatch primitives for wecom business records.
//!
//! [`EventMarker`] lives in the span that a [`CaptureScope`] opened and
//! holds the unified event hook slot. [`EventLayer`] routes incoming
//! events to the nearest ancestor marker.
//!
//! [`EventLayer`]: super::layer::EventLayer
//! [`CaptureScope`]: wecom_transport::telemetry::CaptureScope

use std::sync::{Arc, Mutex};

use tracing::Subscriber;
use tracing_subscriber::registry::{LookupSpan, SpanRef};

/// Per-event hook stored in [`EventMarker`] for the unified event target.
pub(crate) type EventHook = dyn Fn(&tracing::Event<'_>) + Send + Sync;

/// Span-extensions marker holding the unified event hook.
///
/// Lives in the same span that `CaptureScope` already opened.
#[derive(Default)]
pub(crate) struct EventMarker {
    /// Unified event slot — all events on the `wecom::telemetry::event`
    /// target are routed here.
    pub(crate) on_event: Mutex<Option<Arc<EventHook>>>,
}

impl EventMarker {
    /// Idempotently install an `EventMarker` into the span's extensions.
    fn install_on(span: &tracing::Span) {
        span.with_subscriber(|(id, sub)| {
            if let Some(span_ref) = sub
                .downcast_ref::<tracing_subscriber::Registry>()
                .and_then(|reg| reg.span(id))
                && span_ref.extensions().get::<EventMarker>().is_none()
            {
                span_ref.extensions_mut().insert(EventMarker::default());
            }
        });
    }

    /// Idempotently install the marker on `span`, then write a hook into
    /// a slot via `set`. No-op when the subscriber is not a Registry or
    /// the span is not registered.
    pub(crate) fn register_on(span: &tracing::Span, set: impl FnOnce(&EventMarker)) {
        Self::install_on(span);
        span.with_subscriber(|(id, sub)| {
            if let Some(span_ref) = sub
                .downcast_ref::<tracing_subscriber::Registry>()
                .and_then(|reg| reg.span(id))
                && let Some(marker) = span_ref.extensions().get::<EventMarker>()
            {
                set(marker);
            }
        });
    }

    /// Walk the ancestor chain from `start` to the nearest span carrying
    /// an `EventMarker` and invoke `f` with it. Returns `f`'s result, or
    /// `None` when no marker ancestor exists.
    pub(crate) fn with_nearest<S, R>(
        start: Option<SpanRef<'_, S>>,
        f: impl FnOnce(&EventMarker) -> R,
    ) -> Option<R>
    where
        S: Subscriber + for<'l> LookupSpan<'l>,
    {
        let mut current = start;
        while let Some(ancestor) = current {
            if let Some(marker) = ancestor.extensions().get::<EventMarker>() {
                return Some(f(marker));
            }
            current = ancestor.parent();
        }
        None
    }
}
