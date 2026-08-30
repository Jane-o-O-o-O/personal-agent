//! Drop-guarded byte counter for HTTP response body streams.
//!
//! Wraps a [`ByteStream`](crate::ByteStream) so that `res.body_len` and
//! `duration.total_ms`
//! are recorded on the attached `http.request` span exactly once when the
//! stream is dropped (EOF, cancel, or error).

use bytes::Bytes;
use futures_util::StreamExt;

use crate::Result;
use crate::telemetry::contract::http_request as ctr;

/// Guard that records `res.body_len` and `duration.total_ms` on the
/// attached span when dropped.
///
/// Drop is guaranteed exactly once, covering normal stream exhaustion,
/// early cancellation, and error termination equally.
/// `duration.total_ms` is measured from `started` (the request start) to
/// the moment the body stream is dropped, i.e. fully consumed by the
/// upper layer.
struct BodyLenGuard {
    span: tracing::Span,
    started: std::time::Instant,
    len: u64,
}

impl Drop for BodyLenGuard {
    fn drop(&mut self) {
        let total_ms = self.started.elapsed().as_millis() as u64;

        // `span.record` is safe after exit; no-op when subscriber is absent.
        self.span.record(ctr::FIELD_RES_BODY_LEN, self.len);
        self.span.record(ctr::FIELD_DURATION_TOTAL_MS, total_ms);

        // Emit an info event within the request span context so parallel
        // requests are distinguishable by their span ID.
        let _enter = self.span.enter();
        tracing::info!(
            body_len = self.len,
            duration_total_ms = total_ms,
            "response body received"
        );
    }
}

/// Wrap `inner` stream so that the total byte count (`res.body_len`) and
/// the elapsed-since-`started` time (`duration.total_ms`) are recorded on
/// `span` when the stream is dropped (EOF, cancel, or error).
pub(crate) fn instrument_body(
    inner: super::ByteStream,
    span: tracing::Span,
    started: std::time::Instant,
) -> super::ByteStream {
    let guard = BodyLenGuard {
        span,
        started,
        len: 0,
    };
    Box::pin(
        futures_util::stream::unfold((inner, guard), |(mut inner, mut guard)| async move {
            let item: Option<Result<Bytes>> = inner.next().await;
            match item {
                Some(Ok(chunk)) => {
                    guard.len += chunk.len() as u64;
                    Some((Ok(chunk), (inner, guard)))
                }
                Some(Err(e)) => Some((Err(e), (inner, guard))),
                None => None,
            }
        })
        .fuse(),
    )
}
