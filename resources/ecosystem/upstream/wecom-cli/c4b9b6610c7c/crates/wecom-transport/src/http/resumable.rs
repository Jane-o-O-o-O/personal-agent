//! Resumable binary download via HTTP Range.
//!
//! When a method opts into `range_size`, the first binary response's
//! body stream is replaced with an auto-resuming stream that transparently
//! fetches subsequent Range segments until the complete resource is obtained.
//!
//! ## Precondition
//!
//! [`into_resumable`] is called **only** for a partial first response
//! (`206 Partial Content` or a response carrying a `Content-Range` header).
//! The "resume vs. pass-through" decision lives at the call site
//! (`HttpTransportBackend::execute`); a plain `200` without `Content-Range`
//! (server ignored our Range) never reaches this module.
//!
//! ## Termination (does NOT depend on `total`)
//!
//! The stream ends when **any** of these signals fires:
//! 1. `total` is known and `next >= total` (exact termination).
//! 2. A segment returns 0 bytes body (`next > 0`).
//! 3. The next segment request returns `416 Range Not Satisfiable` (`next > 0`).
//!
//! Short reads (`seg_len < size`) do **not** terminate the stream — an extra
//! probe request is sent to confirm the end (416 / 0 bytes).

use std::future::Future;

use bytes::Bytes;
use tracing::Instrument;

use crate::http_client::{ByteStream, HttpResponse};
use crate::{Error, Result};

/// Maximum number of Range segments before aborting (prevents infinite loops).
pub(crate) const MAX_RANGE_SEGMENTS: usize = 4096;

/// Upper bound for a single Range chunk size declared by schema.
const MAX_RANGE_SIZE: u64 = 64 * 1024 * 1024;

/// Clamp the schema-declared chunk size to a safe range.
///
/// Guarantees the result is `>= 1`, so the closed-interval end computation
/// (`start + size - 1`) never underflows.
pub(crate) fn clamp_size(size: u64) -> u64 {
    size.clamp(1, MAX_RANGE_SIZE)
}

/// Build a closed-interval `Range: bytes={start}-{start+size-1}` header value.
///
/// `size` must be `>= 1` (use `clamp_size` first); the byte range is pure
/// ASCII digits so the resulting value is always header-safe.
///
/// Callers (e.g. the `pipeline_binary` resume closure) build the header
/// directly and attach it via `wire.headers`.
pub fn range_header_value(start: u64, size: u64) -> Result<reqwest::header::HeaderValue> {
    let end = start + size - 1;
    reqwest::header::HeaderValue::from_str(&format!("bytes={start}-{end}"))
        .map_err(|e| Error::other(format!("Invalid Range header value: {e}").into()))
}

/// Wrap the first-segment [`HttpResponse`] body with an auto-resuming stream.
///
/// **Precondition:** `first` is a partial response (see the module docs) — the
/// call site only invokes this when `first` is `206` or carries a
/// `Content-Range` header.
///
/// The returned `HttpResponse` preserves the **first** response's headers
/// (Content-Type, Content-Disposition, Content-Range) so callers can still
/// extract filename / MIME / total length. Its body is the concatenation of
/// all Range segments.
///
/// `fetch_segment(start, chunk_size)` fetches one continuation segment. The
/// caller owns Range-header construction (see [`range_header_value`]) plus any
/// per-request auth / routing, returning the raw [`HttpResponse`]. Decoupling
/// this behind a closure lets [`HttpTransportBackend`](crate::HttpTransportBackend) and
/// custom transports (e.g. the bot broker transport) share this segment
/// assembly state machine while each keeps its own request-signing logic.
pub fn into_resumable<F, Fut>(
    first: HttpResponse,
    chunk_size: u64,
    fetch_segment: F,
) -> HttpResponse
where
    F: Fn(u64, u64) -> Fut + Send + Sync + 'static,
    Fut: Future<Output = Result<HttpResponse>> + Send + 'static,
{
    let size = clamp_size(chunk_size);
    // `total` comes ONLY from Content-Range. In a partial response
    // `Content-Length` is the *segment* length (not the resource total), so
    // using it as `total` would terminate the stream prematurely.
    let total = first.content_range().and_then(|cr| cr.total);

    let span = first.span.clone();
    let endpoint_url = first.endpoint().to_string();
    let status = first.status().as_u16();
    let headers = first.headers().clone();
    let first_body = first.body;

    let (tx, rx) = tokio::sync::mpsc::channel::<Result<Bytes>>(32);

    // Spawn the producer task. `.instrument(span)` keeps every per-segment
    // `tracing` event inside the originating `http.request` span, so the ranged
    // download stays fully observable even though it runs on a detached task.
    tokio::spawn(
        produce_segments(fetch_segment, size, total, first_body, tx).instrument(span.clone()),
    );

    let resumable_body: ByteStream = Box::pin(tokio_stream::wrappers::ReceiverStream::new(rx));
    HttpResponse::new(endpoint_url, status, headers, resumable_body).with_span(span)
}

/// Async producer: drain the first segment, then fetch subsequent Range
/// segments, sending all bytes through `tx`. When complete (or on error),
/// `tx` is dropped, which terminates the receiver stream.
async fn produce_segments<F, Fut>(
    fetch_segment: F,
    size: u64,
    mut total: Option<u64>,
    first_body: ByteStream,
    tx: tokio::sync::mpsc::Sender<Result<Bytes>>,
) where
    F: Fn(u64, u64) -> Fut + Send + Sync + 'static,
    Fut: Future<Output = Result<HttpResponse>> + Send + 'static,
{
    let result = produce_segments_inner(&fetch_segment, size, &mut total, first_body, &tx).await;

    if let Err(e) = result {
        tracing::error!(error = %e, "range download stream failed mid-way");
        let _ = tx.send(Err(e)).await;
    }

    // tx is dropped here → receiver stream ends.
}

/// Inner logic separated so we can use `?` and references.
async fn produce_segments_inner<F, Fut>(
    fetch_segment: &F,
    size: u64,
    total: &mut Option<u64>,
    mut current: ByteStream,
    tx: &tokio::sync::mpsc::Sender<Result<Bytes>>,
) -> Result<()>
where
    F: Fn(u64, u64) -> Fut,
    Fut: Future<Output = Result<HttpResponse>>,
{
    use futures_util::StreamExt;

    let mut next: u64 = 0;
    let mut segment_count: usize = 1;

    loop {
        // 1. Drain current segment, sending each chunk through the channel.
        let mut last_seg_len: u64 = 0;
        while let Some(item) = current.next().await {
            let chunk = item?;
            let len = chunk.len() as u64;
            last_seg_len += len;
            next += len;
            if tx.send(Ok(chunk)).await.is_err() {
                // Consumer dropped the stream (e.g. early cancellation).
                tracing::debug!("range download stream cancelled by consumer");
                return Ok(());
            }
        }

        // 2. Check completion (does NOT depend on total being known).
        if let Some(t) = total {
            if next > *t {
                // Server sent more bytes than it declared — the HTTP client only
                // frames each response against its own Content-Length and cannot
                // catch a cumulative overshoot, so we must reject it here rather
                // than write a corrupt file.
                return Err(Error::other(
                    format!("range download overshot declared total: wrote {next} > {t}").into(),
                ))
                .inspect_err(|e| tracing::error!(error = %e, "range download overshot total"));
            }
            if next == *t {
                tracing::info!(
                    total_written = next,
                    segments = segment_count,
                    total = t,
                    "ranged download complete (exact)"
                );
                return Ok(());
            }
        }
        if last_seg_len == 0 && next > 0 {
            tracing::info!(
                total_written = next,
                segments = segment_count,
                total = ?total,
                "ranged download complete (empty segment)"
            );
            return Ok(());
        }
        if last_seg_len == 0 && next == 0 {
            // First segment was empty — real error.
            return Err(Error::other(
                "first range segment returned empty body".into(),
            ));
        }

        // 3. Segment count guard.
        if segment_count >= MAX_RANGE_SEGMENTS {
            return Err(Error::other(
                format!("range download exceeded {MAX_RANGE_SEGMENTS} segments without completion")
                    .into(),
            ));
        }

        // 4. Fetch next segment via the caller-provided closure. The closure
        //    owns Range-header construction (see `range_header_value`) plus any
        //    per-request signing/routing, then returns the raw response.
        tracing::debug!(
            next,
            total = ?total,
            segment = segment_count + 1,
            "fetching range segment"
        );

        let response = match fetch_segment(next, size).await {
            Ok(r) => r,
            Err(Error::Http { status: 416, .. }) if next > 0 => {
                // 416 after successful data → end of resource.
                tracing::info!(
                    total_written = next,
                    segments = segment_count,
                    "ranged download complete (416 confirmed end)"
                );
                return Ok(());
            }
            Err(e) => return Err(e),
        };

        // A valid continuation MUST be partial content (same rule as the first
        // response: `206` or a `Content-Range` header). A non-partial `2xx` here
        // means the server stopped serving the range — most commonly an
        // HTTP 200 + JSON error envelope (e.g. an expired `access_token`
        // between segments). Surface it instead of concatenating the body into
        // the output file, honoring the integrity constraint.
        let is_partial = response.status().as_u16() == 206 || response.content_range().is_some();
        if !is_partial {
            return Err(Error::other(
                format!(
                    "range segment at offset {next} was not partial content \
                     (status {}); aborting to avoid a corrupt download",
                    response.status().as_u16()
                )
                .into(),
            ))
            .inspect_err(|e| tracing::error!(error = %e, "range continuation was not partial"));
        }

        // Update total if the server provided it now.
        if let Some(cr) = response.content_range() {
            if cr.start != next {
                return Err(Error::other(
                    format!(
                        "range segment start mismatch: expected {next}, got {}",
                        cr.start
                    )
                    .into(),
                ));
            }
            if total.is_none() {
                *total = cr.total;
            }
        }

        segment_count += 1;
        current = response.body;
    }
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：resumable（Range 断点续拉流）
    //!
    //! ### 关键接口
    //! - [into_resumable] — 把首段响应包装为自动续拉的 HttpResponse
    //!
    //! ### 关键分支与异常路径
    //! - 206 + Content-Range total → next>=total 精确终止
    //! - 206 + Content-Range /* → 416/0字节 探测终止
    //! - 206 无 Content-Range → 同上
    //! - 短读（seg_len < size）不终止 → 继续探测下一段
    //! - 416(next>0) → 末尾确认
    //! - 中途段非分片响应（如 200+JSON token 过期）→ 报错，不拼接
    //! - 累计写入 > 已知 total（越界）→ 报错
    //! - offset 停滞 / 段数上限 → 报错
    //!
    //! 注：200 无 Content-Range（整体返回）是否进入本模块由上游
    //! `HttpTransportBackend::execute` 决定，不在本模块测试范围。
    //!
    //! ### 上下游交互
    //! - 上游：HttpTransportBackend::execute 在 Binary + ranged 时调用
    //! - 下游：消费者通过 bytes_stream() 读取拼接后的连续字节流

    use std::future::Future;
    use std::pin::Pin;

    use futures_util::StreamExt;
    use wiremock::matchers::{header, method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    use super::*;
    use crate::{Endpoint, HttpEndpoint, HttpTransportBackend, RequestOptions, WireOptions};

    fn ep(base: &str, p: &str) -> Endpoint {
        let http = HttpEndpoint::new(p).with_service(base);
        Endpoint::new().with(http)
    }

    /// 测试 helper：构造 HttpTransportBackend 版“段拉取闭包”。
    ///
    /// 每次调用克隆 transport / endpoint / payload / wire，为该段重设
    /// `Range: bytes={start}-{start+size-1}` 后重放同一请求，等价于
    /// 生产侧 `HttpTransportBackend::execute` 注入的续拉闭包。
    fn http_fetcher(
        transport: HttpTransportBackend,
        endpoint: Endpoint,
        payload: serde_json::Value,
        wire: WireOptions,
    ) -> impl Fn(u64, u64) -> Pin<Box<dyn Future<Output = Result<HttpResponse>> + Send>>
    + Send
    + Sync
    + 'static {
        move |start, size| {
            let transport = transport.clone();
            let endpoint = endpoint.clone();
            let payload = payload.clone();
            let mut wire = wire.clone();
            Box::pin(async move {
                wire.headers
                    .insert(reqwest::header::RANGE, range_header_value(start, size)?);
                transport
                    .post(&endpoint, payload)
                    .with_options(wire)
                    .execute()
                    .await
            })
        }
    }

    /// Drain a ByteStream into a Vec<u8>, collecting errors.
    async fn drain_stream(stream: ByteStream) -> Result<Vec<u8>> {
        let mut stream = stream;
        let mut buf = Vec::new();
        while let Some(chunk) = stream.next().await {
            buf.extend_from_slice(&chunk?);
        }
        Ok(buf)
    }

    // ── 206 + Content-Range total → 精确终止 ──

    /// P0：[into_resumable] 两段 206 拼接（total 已知），next>=total 精确终止
    /// 条件：首段 bytes=0-9→206 0-9/20(10B)；次段 bytes=10-19→206 10-19/20(10B)
    /// 断言：拼接流 drain 得 20B，发起 2 次请求
    #[tokio::test]
    async fn two_segments_206_with_total_concatenates() {
        let server = MockServer::start().await;
        let body = vec![0xABu8; 20];

        // Segment 0: bytes=0-9
        Mock::given(method("POST"))
            .and(path("/dl"))
            .and(header("range", "bytes=0-9"))
            .respond_with(
                ResponseTemplate::new(206)
                    .insert_header("Content-Type", "application/octet-stream")
                    .insert_header("Content-Range", "bytes 0-9/20")
                    .insert_header("Content-Length", "10")
                    .set_body_bytes(body[0..10].to_vec()),
            )
            .up_to_n_times(1)
            .mount(&server)
            .await;

        // Segment 1: bytes=10-19
        Mock::given(method("POST"))
            .and(path("/dl"))
            .and(header("range", "bytes=10-19"))
            .respond_with(
                ResponseTemplate::new(206)
                    .insert_header("Content-Type", "application/octet-stream")
                    .insert_header("Content-Range", "bytes 10-19/20")
                    .insert_header("Content-Length", "10")
                    .set_body_bytes(body[10..20].to_vec()),
            )
            .up_to_n_times(1)
            .mount(&server)
            .await;

        let transport = HttpTransportBackend::default();
        let endpoint = ep(&server.uri(), "/dl");
        let payload = serde_json::json!({});

        // Send first request (with Range bytes=0-9)
        let mut opts = RequestOptions::default();
        opts.headers_mut().insert(
            reqwest::header::RANGE,
            reqwest::header::HeaderValue::from_static("bytes=0-9"),
        );
        let first = transport
            .post(&endpoint, &payload)
            .with_options(opts.wire.clone())
            .execute()
            .await
            .unwrap();

        let resumable = into_resumable(
            first,
            10,
            http_fetcher(
                transport.clone(),
                endpoint.clone(),
                payload,
                opts.wire.clone(),
            ),
        );
        let bytes = drain_stream(resumable.body).await.unwrap();
        assert_eq!(bytes, body);
        assert_eq!(bytes.len(), 20);
    }

    // ── 206 + Content-Range /* → 416 探测终止 ──

    /// P0：[into_resumable] 206 Content-Range /* 时靠 416 探测终止
    /// 条件：首段 206 bytes 0-7/*(8B)；次段 bytes=8-→416
    /// 断言：拼接得 8B，416(next>0) 视为结束，不报错
    #[tokio::test]
    async fn unknown_total_416_confirms_end() {
        let server = MockServer::start().await;
        let body = vec![0xEFu8; 8];

        // First segment: any Range → 206 with data
        Mock::given(method("POST"))
            .and(path("/dl"))
            .and(header("range", "bytes=0-7"))
            .respond_with(
                ResponseTemplate::new(206)
                    .insert_header("Content-Type", "application/octet-stream")
                    .insert_header("Content-Range", "bytes 0-7/*")
                    .insert_header("Content-Length", "8")
                    .set_body_bytes(body.clone()),
            )
            .up_to_n_times(1)
            .mount(&server)
            .await;

        // Second segment: bytes=8-15 → 416
        Mock::given(method("POST"))
            .and(path("/dl"))
            .and(header("range", "bytes=8-15"))
            .respond_with(ResponseTemplate::new(416))
            .up_to_n_times(1)
            .mount(&server)
            .await;

        let transport = HttpTransportBackend::default();
        let endpoint = ep(&server.uri(), "/dl");
        let payload = serde_json::json!({});

        let mut opts = RequestOptions::default();
        opts.headers_mut().insert(
            reqwest::header::RANGE,
            reqwest::header::HeaderValue::from_static("bytes=0-7"),
        );
        let first = transport
            .post(&endpoint, &payload)
            .with_options(opts.wire.clone())
            .execute()
            .await
            .unwrap();

        let resumable = into_resumable(
            first,
            8,
            http_fetcher(
                transport.clone(),
                endpoint.clone(),
                payload,
                opts.wire.clone(),
            ),
        );
        let bytes = drain_stream(resumable.body).await.unwrap();
        assert_eq!(bytes, body);
    }

    // ── 206 无 Content-Range → 0 字节探测终止 ──

    /// P1：[into_resumable] 206 无 Content-Range 时靠空段探测终止
    /// 条件：首段 206 返回满 size(8B)，无 Content-Range；次段 206 返回 0 字节
    /// 断言：拼接得 8B，空段(next>0) 视为结束
    #[tokio::test]
    async fn no_content_range_empty_segment_confirms_end() {
        let server = MockServer::start().await;
        let body = vec![0x12u8; 8];

        Mock::given(method("POST"))
            .and(path("/dl"))
            .and(header("range", "bytes=0-7"))
            .respond_with(
                ResponseTemplate::new(206)
                    .insert_header("Content-Type", "application/octet-stream")
                    .set_body_bytes(body.clone()),
            )
            .up_to_n_times(1)
            .mount(&server)
            .await;

        // Next segment → 206 with 0 bytes
        Mock::given(method("POST"))
            .and(path("/dl"))
            .and(header("range", "bytes=8-15"))
            .respond_with(
                ResponseTemplate::new(206)
                    .insert_header("Content-Type", "application/octet-stream"),
            )
            .up_to_n_times(1)
            .mount(&server)
            .await;

        let transport = HttpTransportBackend::default();
        let endpoint = ep(&server.uri(), "/dl");
        let payload = serde_json::json!({});

        let mut opts = RequestOptions::default();
        opts.headers_mut().insert(
            reqwest::header::RANGE,
            reqwest::header::HeaderValue::from_static("bytes=0-7"),
        );
        let first = transport
            .post(&endpoint, &payload)
            .with_options(opts.wire.clone())
            .execute()
            .await
            .unwrap();

        let resumable = into_resumable(
            first,
            8,
            http_fetcher(
                transport.clone(),
                endpoint.clone(),
                payload,
                opts.wire.clone(),
            ),
        );
        let bytes = drain_stream(resumable.body).await.unwrap();
        assert_eq!(bytes, body);
    }

    // ── 中途段非分片响应（token 过期等）→ 报错 ──

    /// P1：[into_resumable] 续拉中途段返回非分片响应（HTTP 200 + JSON 错误）时报错
    /// 条件：首段 206 0-7/*(8B)；次段 bytes=8- → 200 application/json 业务错误信封
    /// 断言：drain 在拿到前 8B 后返回 Err（错误 JSON 不被拼进结果，兑现完整性约束）
    #[tokio::test]
    async fn mid_stream_non_partial_response_errors() {
        let server = MockServer::start().await;
        let body = vec![0x33u8; 8];

        Mock::given(method("POST"))
            .and(path("/dl"))
            .and(header("range", "bytes=0-7"))
            .respond_with(
                ResponseTemplate::new(206)
                    .insert_header("Content-Type", "application/octet-stream")
                    .insert_header("Content-Range", "bytes 0-7/*")
                    .set_body_bytes(body.clone()),
            )
            .up_to_n_times(1)
            .mount(&server)
            .await;

        // Next segment → HTTP 200 + JSON error envelope (e.g. token expired).
        Mock::given(method("POST"))
            .and(path("/dl"))
            .and(header("range", "bytes=8-15"))
            .respond_with(
                ResponseTemplate::new(200)
                    .insert_header("Content-Type", "application/json")
                    .set_body_json(serde_json::json!({
                        "errcode": 42001,
                        "errmsg": "access_token expired"
                    })),
            )
            .up_to_n_times(1)
            .mount(&server)
            .await;

        let transport = HttpTransportBackend::default();
        let endpoint = ep(&server.uri(), "/dl");
        let payload = serde_json::json!({});

        let mut opts = RequestOptions::default();
        opts.headers_mut().insert(
            reqwest::header::RANGE,
            reqwest::header::HeaderValue::from_static("bytes=0-7"),
        );
        let first = transport
            .post(&endpoint, &payload)
            .with_options(opts.wire.clone())
            .execute()
            .await
            .unwrap();

        let resumable = into_resumable(
            first,
            8,
            http_fetcher(
                transport.clone(),
                endpoint.clone(),
                payload,
                opts.wire.clone(),
            ),
        );
        let result = drain_stream(resumable.body).await;
        assert!(
            result.is_err(),
            "mid-stream non-partial response must surface an error, got Ok"
        );
    }

    // ── 短读非末段：不提前终止 ──

    /// P0：[into_resumable] total 未知时中途短读（seg_len < size）不终止，继续探测
    /// 条件：size=10；首段 206/*(4B, <size)；次段 bytes=4- 206/*(6B)；三段 bytes=10- 206 空
    /// 断言：短读段不被当末段，最终拼接得完整 10B（4B+6B）
    #[tokio::test]
    async fn short_read_non_terminal_continues() {
        let server = MockServer::start().await;
        let part0 = vec![0x11u8; 4];
        let part1 = vec![0x22u8; 6];

        Mock::given(method("POST"))
            .and(path("/dl"))
            .and(header("range", "bytes=0-9"))
            .respond_with(
                ResponseTemplate::new(206)
                    .insert_header("Content-Type", "application/octet-stream")
                    .insert_header("Content-Range", "bytes 0-3/*")
                    .set_body_bytes(part0.clone()),
            )
            .up_to_n_times(1)
            .mount(&server)
            .await;

        Mock::given(method("POST"))
            .and(path("/dl"))
            .and(header("range", "bytes=4-13"))
            .respond_with(
                ResponseTemplate::new(206)
                    .insert_header("Content-Type", "application/octet-stream")
                    .insert_header("Content-Range", "bytes 4-9/*")
                    .set_body_bytes(part1.clone()),
            )
            .up_to_n_times(1)
            .mount(&server)
            .await;

        // Third probe → empty 206 confirms end.
        Mock::given(method("POST"))
            .and(path("/dl"))
            .and(header("range", "bytes=10-19"))
            .respond_with(
                ResponseTemplate::new(206)
                    .insert_header("Content-Type", "application/octet-stream"),
            )
            .up_to_n_times(1)
            .mount(&server)
            .await;

        let transport = HttpTransportBackend::default();
        let endpoint = ep(&server.uri(), "/dl");
        let payload = serde_json::json!({});

        let mut opts = RequestOptions::default();
        opts.headers_mut().insert(
            reqwest::header::RANGE,
            reqwest::header::HeaderValue::from_static("bytes=0-9"),
        );
        let first = transport
            .post(&endpoint, &payload)
            .with_options(opts.wire.clone())
            .execute()
            .await
            .unwrap();

        let resumable = into_resumable(
            first,
            10,
            http_fetcher(
                transport.clone(),
                endpoint.clone(),
                payload,
                opts.wire.clone(),
            ),
        );
        let bytes = drain_stream(resumable.body).await.unwrap();
        let mut expected = part0.clone();
        expected.extend_from_slice(&part1);
        assert_eq!(bytes, expected);
        assert_eq!(bytes.len(), 10);
    }

    // ── 越界：累计写入超过已知 total ──

    /// P1：[into_resumable] 累计写入超过声明 total 时报错（服务端越界）
    /// 条件：total=20；首段 206 0-9/20(10B)；次段声明 10-24/20 但发 15B → next=25>20
    /// 断言：drain 返回 Err（不静默产出越界文件）
    #[tokio::test]
    async fn overshoot_declared_total_errors() {
        let server = MockServer::start().await;

        Mock::given(method("POST"))
            .and(path("/dl"))
            .and(header("range", "bytes=0-9"))
            .respond_with(
                ResponseTemplate::new(206)
                    .insert_header("Content-Type", "application/octet-stream")
                    .insert_header("Content-Range", "bytes 0-9/20")
                    .set_body_bytes(vec![0x01u8; 10]),
            )
            .up_to_n_times(1)
            .mount(&server)
            .await;

        // Declares start=10 (consistent) but sends 15 bytes → cumulative 25 > 20.
        Mock::given(method("POST"))
            .and(path("/dl"))
            .and(header("range", "bytes=10-19"))
            .respond_with(
                ResponseTemplate::new(206)
                    .insert_header("Content-Type", "application/octet-stream")
                    .insert_header("Content-Range", "bytes 10-24/20")
                    .set_body_bytes(vec![0x02u8; 15]),
            )
            .up_to_n_times(1)
            .mount(&server)
            .await;

        let transport = HttpTransportBackend::default();
        let endpoint = ep(&server.uri(), "/dl");
        let payload = serde_json::json!({});

        let mut opts = RequestOptions::default();
        opts.headers_mut().insert(
            reqwest::header::RANGE,
            reqwest::header::HeaderValue::from_static("bytes=0-9"),
        );
        let first = transport
            .post(&endpoint, &payload)
            .with_options(opts.wire.clone())
            .execute()
            .await
            .unwrap();

        let resumable = into_resumable(
            first,
            10,
            http_fetcher(
                transport.clone(),
                endpoint.clone(),
                payload,
                opts.wire.clone(),
            ),
        );
        let result = drain_stream(resumable.body).await;
        assert!(
            result.is_err(),
            "cumulative overshoot beyond declared total must error, got Ok"
        );
    }
}
