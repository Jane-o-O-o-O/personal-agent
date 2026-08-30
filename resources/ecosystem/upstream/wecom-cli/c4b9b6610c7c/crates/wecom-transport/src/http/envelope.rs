//! Envelope 两轴正交化：请求侧（[`RequestEnvelope`]）与响应侧（[`ResponseEnvelope`]）
//! 作为两条正交轴挂在 [`super::HttpEndpoint`] 上；轮询循环位于 execute
//! 流水线（[`super::request`]）。
//!
//! 按「谁使用谁定义」：core 只保留扩展点 trait（[`RequestEnvelope`] /
//! [`ResponseEnvelope`]）与 transport 自己实例化作默认的两个实现
//! （[`PassthroughReq`] 请求默认、[`GatewayRes`] 响应默认）。
//! `PayloadStringReq` / `NestedRes` 由使用方各自定义。

use std::fmt::Debug;

use serde_json::Value;

use super::protocol::{ApiResponse, validate_api_response};
use crate::{Error, Result};

// ══ RequestEnvelope ══

/// 请求侧信封：把业务 JSON 包装为服务端期望的请求体。
pub trait RequestEnvelope: Debug + Send + Sync {
    /// 将业务 payload 包装为请求体 JSON。
    fn encode(&self, payload: Value) -> Value;
    /// 策略标签（日志 / 诊断用）。
    fn name(&self) -> &'static str;
}

/// 透传信封：不包装，原样发送业务 JSON（transport 请求侧默认）。
#[derive(Debug, Clone, Copy, Default)]
pub struct PassthroughReq;

impl RequestEnvelope for PassthroughReq {
    fn encode(&self, payload: Value) -> Value {
        payload
    }

    fn name(&self) -> &'static str {
        "passthrough"
    }
}

// ══ ResponseEnvelope ══

/// 响应侧信封：把响应体 JSON 解析为归一化的 [`ApiResponse`]。
pub trait ResponseEnvelope: Debug + Send + Sync {
    /// 将原始响应体 JSON 解析为 [`ApiResponse`]（协议脱壳 + 错误校验）。
    fn decode(&self, url: &str, body: Value) -> Result<ApiResponse>;
    /// 策略标签（日志 / 诊断用）。
    fn name(&self) -> &'static str;
}

/// 网关响应信封（transport 响应侧默认）：直接反序列化 [`ApiResponse`] 并做
/// `error.code` 校验。
#[derive(Debug, Clone, Copy, Default)]
pub struct GatewayRes;

impl ResponseEnvelope for GatewayRes {
    fn decode(&self, url: &str, body: Value) -> Result<ApiResponse> {
        let data: ApiResponse = serde_json::from_value(body).map_err(|e| Error::Parse {
            message: format!("Parse ApiResponse failed for {url}: {e:#}"),
            endpoint: url.to_string(),
            body: Box::new(Value::Null),
            source: Some(e),
        })?;
        validate_api_response(url, data)
    }

    fn name(&self) -> &'static str {
        "gateway"
    }
}
