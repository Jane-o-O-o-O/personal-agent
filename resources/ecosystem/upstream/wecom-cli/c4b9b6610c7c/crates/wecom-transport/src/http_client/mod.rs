//! HTTP 后端与传输层核心类型。
//!
//! 模块结构：
//! - `request`   — HttpRequest / HttpRequestPayload / HttpRequestBody / HttpRequestContext（纯 HTTP 透传）
//! - `response`  — HttpResponse / ByteStream
//! - [`HttpClient`]（trait）— 唯一发送抽象；`reqwest::Client` 直接 impl
//! - `body_guard` — Drop-guarded body length counter for ByteStream
//! - `shared`     — reqwest request finalization / error-mapping helpers

mod body_guard;
mod request;
mod reqwest_send;
mod response;
pub(crate) mod shared;

use std::fmt::Debug;
use std::future::Future;
use std::pin::Pin;

pub(crate) use request::HttpRequestPayloadKind;
pub use request::{HttpRequest, HttpRequestBody, HttpRequestPayload, IntoHttpRequestPayload};
pub use response::{ByteStream, ContentRange, HttpResponse};

use crate::{IntoCowEndpoint, Result};

// ── HttpClient trait（唯一发送抽象） ───────────────────────────

/// 唯一发送抽象：执行一个 [`HttpRequest`]，返回原始 [`HttpResponse`]。
///
/// - **reqwest**：内置 `impl HttpClient for reqwest::Client`（无 wrapper）。
/// - 外部后端 / 协议 crate 也可实现本 trait 接入同一 [`HttpRequest`] 流水线。
///
/// # Object safety
///
/// `send` 返回 `Pin<Box<dyn Future>>`（而非 RPITIT），因此本 trait 是
/// **dyn-compatible** 的——业务侧可用 `Arc<dyn HttpClient>` 动态分发。
pub trait HttpClient: Debug + Send + Sync {
    /// 发送一个原始 HTTP 请求，返回原始响应。
    fn send<'a>(
        &'a self,
        req: HttpRequest<'a>,
    ) -> Pin<Box<dyn Future<Output = Result<HttpResponse>> + Send + 'a>>;

    /// 后端标签（日志 / 诊断用）。默认 `"unknown"`。
    fn name(&self) -> &'static str {
        "unknown"
    }
}

/// `reqwest::Client` 直接作为 [`HttpClient`]。
impl HttpClient for reqwest::Client {
    fn send<'a>(
        &'a self,
        req: HttpRequest<'a>,
    ) -> Pin<Box<dyn Future<Output = Result<HttpResponse>> + Send + 'a>> {
        Box::pin(reqwest_send::reqwest_request(self, req))
    }

    fn name(&self) -> &'static str {
        "reqwest"
    }
}

/// `dyn HttpClient` 的 inherent 请求构造方法（非 trait 方法）。
///
/// `post` 要保持 ergonomic（`impl IntoCowEndpoint` / `impl IntoHttpRequestPayload`）
/// 就得是泛型方法，而泛型方法会让 `HttpClient` trait 失去 object-safety；放在
/// `impl dyn HttpClient` 上则 `self` 本身就是 `&dyn HttpClient`，无 unsize 障碍，
/// 且 inherent 方法不参与 object-safety 判定。业务主形态 `Arc<dyn HttpClient>`
/// 经 Deref 自动命中。
impl<'x> dyn HttpClient + 'x {
    /// 构造一个 [`HttpRequest`]。
    pub fn post<'a, E, P>(&'a self, endpoint: E, payload: P) -> HttpRequest<'a>
    where
        E: IntoCowEndpoint<'a>,
        P: IntoHttpRequestPayload,
    {
        HttpRequest::new(
            self,
            endpoint.into_cow_endpoint(),
            payload.into_http_request_payload(),
        )
    }
}
