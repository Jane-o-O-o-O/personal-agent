use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use serde_with::skip_serializing_none;

use crate::{Error, Result, polling};

#[skip_serializing_none]
#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse {
    pub result: Option<String>,
    pub error: Option<ApiErrorInfo>,
    pub taskid: Option<String>,
    pub poll_mode: Option<polling::PollMode>,
    pub long_task_poll: Option<polling::LongTaskPollInfo>,
    #[serde(flatten)]
    pub extra: IndexMap<String, serde_json::Value>,
}

#[skip_serializing_none]
#[derive(Debug, Serialize, Deserialize)]
pub struct ApiErrorInfo {
    pub code: Option<i64>,
    pub message: Option<String>, // 错误信息描述
    #[serde(flatten)]
    pub extra: IndexMap<String, serde_json::Value>,
}

/// 校验已反序列化的 ApiResponse 的业务错误码。
///
/// 反序列化（`ApiResponse::deserialize`）由调用方通过
/// `HttpResponse::json::<ApiResponse>()` 完成，本函数只做 `error.code != 0`
/// 的业务校验——该逻辑无法用自定义 `Deserialize` 表达（需 `endpoint`
/// 注入且需产出带结构化 `code` 的 `Error::Api`）。
pub fn validate_api_response(url: &str, data: ApiResponse) -> Result<ApiResponse> {
    if let Some(error) = &data.error {
        let code = error.code.unwrap_or(0);
        if code != 0 {
            return Err(Error::Api {
                message: error
                    .message
                    .as_deref()
                    .unwrap_or("Unknown error")
                    .to_string(),
                action: url.to_string(),
                code: Some(code),
                body: Box::new(serde_json::to_value(&data).unwrap_or_default()),
            })
            .inspect_err(|e| tracing::error!(error = %e, "API error response"));
        }
    }

    Ok(data)
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：protocol（HTTP 协议解析）
    //!
    //! ### 关键接口
    //! - [ApiResponse] 结构体 — API 响应结构，包含 result、error、taskid、long_task_poll 字段
    //! - [ApiErrorInfo] 结构体 — API 错误信息，包含 code、message 字段及任意额外字段
    //! - [validate_api_response] — 校验已反序列化的 ApiResponse 业务错误码
    //!
    //! ### 关键分支与异常路径
    //! - ApiResponse.error.code != 0 → 返回 Error::Api
    //! - ApiResponse.error.code == 0 或无 error 字段 → 返回 Ok

    use serde_json::json;

    use super::*;

    // ── ApiResponse 序列化/反序列化 ──

    /// P0：[ApiResponse] ApiResponse 正确序列化/反序列化往返
    /// 条件：构建含 result、error、taskid、long_task_poll 的 ApiResponse
    /// 断言：序列化后再反序列化，各字段值保持一致
    #[test]
    fn api_response_serialize_deserialize_roundtrip() {
        let original = ApiResponse {
            result: Some("{\"key\":\"value\"}".to_string()),
            error: Some(ApiErrorInfo {
                code: Some(40001),
                message: Some("invalid credential".to_string()),
                extra: IndexMap::new(),
            }),
            taskid: Some("task-123".to_string()),
            long_task_poll: None,
            poll_mode: None,
            extra: IndexMap::new(),
        };
        let serialized = serde_json::to_string(&original).unwrap();
        let deserialized: ApiResponse = serde_json::from_str(&serialized).unwrap();
        assert_eq!(deserialized.result, original.result);
        assert_eq!(
            deserialized.error.as_ref().unwrap().code,
            original.error.as_ref().unwrap().code
        );
        assert_eq!(deserialized.taskid, original.taskid);
    }

    /// P1：[ApiResponse] ApiResponse 缺少可选字段时反序列化成功（Option 字段为 None）
    /// 条件：JSON 只包含 result 字段
    /// 断言：error、taskid、long_task_poll 均为 None
    #[test]
    fn api_response_deserialize_partial_fields() {
        let json = json!({
            "result": "{\"status\":\"ok\"}"
        });
        let resp: ApiResponse = serde_json::from_value(json).unwrap();
        assert!(resp.result.is_some());
        assert!(resp.error.is_none());
        assert!(resp.taskid.is_none());
    }

    // ── ApiErrorInfo 序列化/反序列化 ──

    /// P0：[ApiErrorInfo] ApiErrorInfo 正确序列化/反序列化往返
    /// 条件：构建含 code、message 及额外字段的 ApiErrorInfo
    /// 断言：序列化后再反序列化，字段值保持一致
    #[test]
    fn api_error_info_serialize_deserialize_roundtrip() {
        let mut undefined = IndexMap::new();
        undefined.insert("instruction".to_string(), json!("refresh token"));
        let original = ApiErrorInfo {
            code: Some(40001),
            message: Some("invalid credential".to_string()),
            extra: undefined,
        };
        let serialized = serde_json::to_string(&original).unwrap();
        let deserialized: ApiErrorInfo = serde_json::from_str(&serialized).unwrap();
        assert_eq!(deserialized.code, original.code);
        assert_eq!(deserialized.message, original.message);
        assert_eq!(
            deserialized.extra.get("instruction"),
            original.extra.get("instruction")
        );
    }

    /// P1：[ApiErrorInfo] ApiErrorInfo 所有字段为 None 时序列化正确
    /// 条件：code、message 均为 None，extra 为空
    /// 断言：序列化结果为空对象（skip_serializing_none）
    #[test]
    fn api_error_info_skip_serializing_none() {
        let info = ApiErrorInfo {
            code: None,
            message: None,
            extra: IndexMap::new(),
        };
        let serialized = serde_json::to_string(&info).unwrap();
        assert_eq!(serialized, "{}");
    }

    /// P1：[ApiErrorInfo] ApiErrorInfo 可从仅含额外字段的 JSON 反序列化
    /// 条件：JSON 仅包含非预定义字段（如 instruction）
    /// 断言：额外字段被捕获到 extra 中，code 与 message 为 None
    #[test]
    fn api_error_info_deserialize_undefined_fields() {
        let json = json!({ "instruction": "please retry later" });
        let info: ApiErrorInfo = serde_json::from_value(json).unwrap();
        assert_eq!(
            info.extra.get("instruction"),
            Some(&json!("please retry later"))
        );
        assert!(info.code.is_none());
        assert!(info.message.is_none());
    }

    // ── validate_api_response 测试 ──

    /// P1：validate_api_response 对空对象返回 Ok（无 error 字段不报错）
    /// 条件：传入 result 为 None 的 ApiResponse
    /// 断言：返回 Ok，result 为 None
    #[test]
    fn validate_api_response_empty_object() {
        let resp = ApiResponse {
            result: None,
            error: None,
            taskid: None,
            long_task_poll: None,
            poll_mode: None,
            extra: IndexMap::new(),
        };
        let data = super::validate_api_response("http://test", resp).unwrap();
        assert!(data.result.is_none());
    }

    /// P1：validate_api_response 对 error.code=0 返回 Ok
    /// 条件：ApiResponse 含 error.code=0
    /// 断言：返回 Ok，result 字段正确
    #[test]
    fn validate_api_response_error_code_zero_is_ok() {
        let resp = ApiResponse {
            result: Some("{}".to_string()),
            error: Some(ApiErrorInfo {
                code: Some(0),
                message: Some("ok".to_string()),
                extra: IndexMap::new(),
            }),
            taskid: None,
            long_task_poll: None,
            poll_mode: None,
            extra: IndexMap::new(),
        };
        let data = super::validate_api_response("http://test", resp).unwrap();
        assert_eq!(data.result.as_deref(), Some("{}"));
    }

    /// P1：validate_api_response 无 error 字段时返回 Ok
    /// 条件：ApiResponse 不含 error 字段
    /// 断言：返回 Ok，error 为 None
    #[test]
    fn validate_api_response_no_error_field_is_ok() {
        let resp = ApiResponse {
            result: Some("{\"status\":\"success\"}".to_string()),
            error: None,
            taskid: None,
            long_task_poll: None,
            poll_mode: None,
            extra: IndexMap::new(),
        };
        let data = super::validate_api_response("http://test", resp).unwrap();
        assert_eq!(data.result.as_deref(), Some("{\"status\":\"success\"}"));
        assert!(data.error.is_none());
    }

    /// P1：validate_api_response error.code 为 None 时返回 Ok
    /// 条件：ApiResponse 含 error 但 code 缺失
    /// 断言：返回 Ok（code 为 None 时 unwrap_or(0) == 0，不报错）
    #[test]
    fn validate_api_response_error_code_none_is_ok() {
        let resp = ApiResponse {
            result: Some("{}".to_string()),
            error: Some(ApiErrorInfo {
                code: None,
                message: Some("some msg".to_string()),
                extra: IndexMap::new(),
            }),
            taskid: None,
            long_task_poll: None,
            poll_mode: None,
            extra: IndexMap::new(),
        };
        let data = super::validate_api_response("http://test", resp).unwrap();
        assert_eq!(data.result.as_deref(), Some("{}"));
        assert!(data.error.as_ref().unwrap().code.is_none());
    }

    /// P0：validate_api_response error.code != 0 时返回 Error::Api
    /// 条件：ApiResponse 含 error.code=40001
    /// 断言：错误类型为 Error::Api，code 和 message 正确
    #[test]
    fn validate_api_response_error_code_non_zero_returns_api_error() {
        let resp = ApiResponse {
            result: None,
            error: Some(ApiErrorInfo {
                code: Some(40001),
                message: Some("invalid credential".to_string()),
                extra: IndexMap::new(),
            }),
            taskid: None,
            long_task_poll: None,
            poll_mode: None,
            extra: IndexMap::new(),
        };
        let err = super::validate_api_response("http://test", resp).unwrap_err();
        match err {
            Error::Api { message, code, .. } => {
                assert_eq!(code, Some(40001));
                assert_eq!(message, "invalid credential");
            }
            _ => panic!("expected Error::Api, got: {err:?}"),
        }
    }

    /// P1：validate_api_response error.code != 0 且 message 为 None 时使用默认错误信息
    /// 条件：ApiResponse 含 error.code=50001 但无 message 字段
    /// 断言：错误类型为 Error::Api，message 为 "Unknown error"
    #[test]
    fn validate_api_response_error_without_message_uses_default() {
        let resp = ApiResponse {
            result: None,
            error: Some(ApiErrorInfo {
                code: Some(50001),
                message: None,
                extra: IndexMap::new(),
            }),
            taskid: None,
            long_task_poll: None,
            poll_mode: None,
            extra: IndexMap::new(),
        };
        let err = super::validate_api_response("http://test", resp).unwrap_err();
        match err {
            Error::Api { message, code, .. } => {
                assert_eq!(code, Some(50001));
                assert_eq!(message, "Unknown error");
            }
            _ => panic!("expected Error::Api, got: {err:?}"),
        }
    }

    // ── ApiErrorInfo extra 序列化/反序列化 ──

    /// P1：[ApiErrorInfo] extra 中的字段在序列化时被保留
    /// 条件：构建含 extra 的 ApiErrorInfo
    /// 断言：序列化后再反序列化，extra 中的字段保持不变
    #[test]
    fn api_error_info_extra_preserved_in_serde() {
        let mut undefined = IndexMap::new();
        undefined.insert("instruction".to_string(), json!("retry later"));
        undefined.insert("details".to_string(), json!({"step": 3}));
        let original = ApiErrorInfo {
            code: Some(40001),
            message: Some("error occurred".to_string()),
            extra: undefined,
        };
        let serialized = serde_json::to_string(&original).unwrap();
        let deserialized: ApiErrorInfo = serde_json::from_str(&serialized).unwrap();

        assert_eq!(deserialized.code, original.code);
        assert_eq!(deserialized.message, original.message);
        assert_eq!(deserialized.extra.len(), original.extra.len());
        assert_eq!(
            deserialized.extra.get("instruction"),
            Some(&json!("retry later"))
        );
        assert_eq!(deserialized.extra.get("details"), Some(&json!({"step": 3})));
    }
}
