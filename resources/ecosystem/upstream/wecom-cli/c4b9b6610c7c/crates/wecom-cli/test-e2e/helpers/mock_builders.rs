// Used by config tests gated behind feature flags (custom-endpoint).
#![allow(dead_code)]

use serde_json::{Value, json};

/// 扁平协议的 `results_json` 内层字符串：`{"result": "<stringified-json>"}`。
///
/// wecom 网关把业务数据放在 `results_json` 字段里，该字段本身是 JSON 文本，
/// 内容为 `{"result": "<json-string>"}`——业务 JSON 再序列化一层。
pub fn results_json(data: &Value) -> String {
    json!({ "result": serde_json::to_string(data).unwrap() }).to_string()
}

/// Build a wecom flat response body:
/// `{ "errcode": 0, "errmsg": "ok", "results_json": "<inner>" }`
pub fn api_response(data: &Value) -> String {
    json!({
        "errcode": 0,
        "errmsg": "ok",
        "results_json": results_json(data),
    })
    .to_string()
}

/// 网关请求包裹：请求体为 `{"payload": "<json 字符串>"}`。
pub fn payload_wrap(data: &Value) -> Value {
    json!({ "payload": serde_json::to_string(data).unwrap() })
}

/// Catalog listing: one service named "hr".
pub fn catalog_body() -> String {
    api_response(&json!({
        "items": [
            { "name": "hr", "description": "Human Resources" }
        ]
    }))
}

/// Catalog with a custom single service.
pub fn custom_catalog_body(service_name: &str, description: &str) -> String {
    api_response(&json!({
        "items": [
            { "name": service_name, "description": description }
        ]
    }))
}

/// Service detail for "hr": one resource "department" with method "list".
pub fn hr_service_body(service_base_url: &str) -> String {
    api_response(&json!({
        "description": "HR service description",
        "base_url": service_base_url,
        "schemas": {
            "DeptListReq": {
                "type": "object",
                "properties": {
                    "id": { "type": "string", "description": "Dept ID" }
                }
            },
            "DeptListRes": {
                "type": "object",
                "properties": {
                    "departments": {
                        "type": "array",
                        "items": { "type": "object" }
                    }
                }
            }
        },
        "methods": {},
        "resources": {
            "department": {
                "methods": {
                    "list": {
                        "path": "/department/list",
                        "http_method": "POST",
                        "description": "List departments",
                        "request": { "$ref": "DeptListReq" },
                        "response": { "$ref": "DeptListRes" }
                    }
                },
                "resources": {}
            }
        }
    }))
}
