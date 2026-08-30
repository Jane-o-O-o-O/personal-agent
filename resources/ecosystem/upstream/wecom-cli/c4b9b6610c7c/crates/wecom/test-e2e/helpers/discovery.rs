//! 基于 `wiremock` 的 discovery + method 调用 mock 基础设施。
//!
//! 供 `client` / `run` / `headers` / `error` 等非 upload 用例共用。
//!
//! 覆盖能力：
//! 1. 标准网关信封构造（`api_response`——`{ "result", "error" }`）；
//! 2. 两个 discovery 响应体（`catalog_body` / `hr_service_body`），按 `body_json`
//!    matcher 按请求体精确分流；
//! 3. 预置 discovery mocks 的便捷构造器（带/不带 header matcher 与 expect count）；
//! 4. 通用的 method 调用端点 mock（带/不带 header matcher）；
//! 5. CLI argv 构造器 `hr_dept_list_argv`。

use serde_json::{Value, json};
use wiremock::matchers::{body_json, header, method, path};
use wiremock::{Mock, MockServer, ResponseTemplate};

/// 包装为标准网关响应：`{ "result": "<stringified-json>", "error": null }`。
pub fn api_response(data: &Value) -> Value {
    json!({
        "result": serde_json::to_string(data).unwrap(),
        "error": null,
    })
}

/// catalog discovery 响应体：仅含一个名为 "hr" 的服务。
pub fn catalog_body() -> Value {
    api_response(&json!({
        "items": [
            { "name": "hr", "description": "Human Resources" }
        ]
    }))
}

/// "hr" service 详情响应体：含单资源 `department`，方法 `list` 指向 `/department/list`。
pub fn hr_service_body(service_base_url: &str) -> Value {
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

/// 构造 `wecom hr department list --id root` 的 argv，可追加额外参数。
pub fn hr_dept_list_argv(extra_args: &[&str]) -> Vec<String> {
    let mut v: Vec<&str> = vec!["wecom", "hr", "department", "list", "--id", "root"];
    v.extend(extra_args);
    v.into_iter().map(String::from).collect()
}

/// 自定义 discovery mocks 的参数。
///
/// - `header_matchers`：每个 entry 为 `(header_name, expected_value)`，两个
///   discovery mock 都会加上这些 header 匹配条件。
/// - `expect_count`：若为 `Some(n)`，两个 mock 各自被命中且**仅**命中 n 次
///   （由 wiremock 在 `MockServer` Drop 时自动断言，失败会 panic）。
pub struct DiscoveryMockOptions<'a> {
    pub header_matchers: Vec<(&'a str, &'a str)>,
    pub expect_count: Option<u64>,
}

/// 挂载标准 discovery mocks（catalog + hr service 详情）。
///
/// 请求体为裸 JSON（`ServiceDiscovery` 端点使用 transport 默认请求信封），
/// 按 `{}` vs `{"service":"hr"}` 精确分流到两个不同响应。
pub async fn setup_discovery_mocks(server: &MockServer) {
    setup_discovery_mocks_with(
        server,
        DiscoveryMockOptions {
            header_matchers: Vec::new(),
            expect_count: None,
        },
    )
    .await;
}

/// 与 [`setup_discovery_mocks`] 相同，但允许增加 header matcher 与 expect count。
pub async fn setup_discovery_mocks_with<'a>(server: &MockServer, opts: DiscoveryMockOptions<'a>) {
    // catalog：请求体为空对象 {}
    let mut catalog_builder = Mock::given(method("POST"))
        .and(path("/service/discovery"))
        .and(body_json(json!({})));
    for (k, v) in &opts.header_matchers {
        catalog_builder = catalog_builder.and(header(*k, *v));
    }
    let mut catalog =
        catalog_builder.respond_with(ResponseTemplate::new(200).set_body_json(catalog_body()));
    if let Some(n) = opts.expect_count {
        catalog = catalog.expect(n);
    }
    catalog.mount(server).await;

    // hr 详情：请求体含 {"service":"hr"}
    let mut hr_builder = Mock::given(method("POST"))
        .and(path("/service/discovery"))
        .and(body_json(json!({ "service": "hr" })));
    for (k, v) in &opts.header_matchers {
        hr_builder = hr_builder.and(header(*k, *v));
    }
    let mut hr = hr_builder
        .respond_with(ResponseTemplate::new(200).set_body_json(hr_service_body(&server.uri())));
    if let Some(n) = opts.expect_count {
        hr = hr.expect(n);
    }
    hr.mount(server).await;
}

/// 挂载一个 method 调用端点：POST `endpoint` → 固定 JSON envelope 响应体。
pub async fn setup_method_mock(server: &MockServer, endpoint: &str, response_body: Value) {
    Mock::given(method("POST"))
        .and(path(endpoint.to_string()))
        .respond_with(ResponseTemplate::new(200).set_body_json(response_body))
        .mount(server)
        .await;
}

/// 与 [`setup_method_mock`] 相同，但附加 header 匹配条件且断言被命中 1 次。
pub async fn setup_method_mock_with_headers<'a>(
    server: &MockServer,
    endpoint: &str,
    response_body: Value,
    header_matchers: &[(&'a str, &'a str)],
) {
    let mut builder = Mock::given(method("POST")).and(path(endpoint.to_string()));
    for (k, v) in header_matchers {
        builder = builder.and(header(*k, *v));
    }
    builder
        .respond_with(ResponseTemplate::new(200).set_body_json(response_body))
        .expect(1)
        .mount(server)
        .await;
}
