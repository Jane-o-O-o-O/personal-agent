use wiremock::matchers::{body_json, method, path};
use wiremock::{Mock, MockServer, ResponseTemplate};

/// 包装为 wecom HTTP envelope：`{ "result": "<stringified-json>", "error": null }`
fn envelope(data: &Value) -> Value {
    json!({
        "result": serde_json::to_string(data).unwrap(),
        "error": null,
    })
}

/// catalog discovery 响应体：仅含一个名为 `contact` 的服务
fn catalog_body() -> Value {
    envelope(&json!({
        "items": [
            { "name": "contact", "description": "Contact directory" }
        ]
    }))
}

/// `contact` service 详情响应体：
///   contact
///   └── users
///       ├── list   (real, no alias)
///       └── search (real, path_alias = ["/contact/search"])
fn contact_service_body(service_base_url: &str) -> Value {
    envelope(&json!({
        "description": "Contact directory service",
        "base_url": service_base_url,
        "schemas": {
            "SearchReq": {
                "type": "object",
                "properties": {
                    "keyword": { "type": "string", "description": "Search keyword" }
                }
            },
            "ListReq": {
                "type": "object",
                "properties": {
                    "page": { "type": "integer", "description": "Page index" }
                }
            }
        },
        "methods": {},
        "resources": {
            "users": {
                "methods": {
                    "list": {
                        "path": "/contact/users/list",
                        "http_method": "POST",
                        "description": "List users",
                        "request": { "$ref": "ListReq" }
                    },
                    "search": {
                        "path": "/contact/users/search",
                        "http_method": "POST",
                        "description": "Search users",
                        "path_alias": ["/contact/search"],
                        "request": { "$ref": "SearchReq" }
                    }
                },
                "resources": {}
            }
        }
    }))
}

/// 挂载 contact 服务的 catalog + service 详情 mocks，按请求体 `{}` /
/// `{"service":"contact"}` 精确分流。
async fn setup_contact_discovery(server: &MockServer) {
    Mock::given(method("POST"))
        .and(path("/service/discovery"))
        .and(body_json(json!({})))
        .respond_with(ResponseTemplate::new(200).set_body_json(catalog_body()))
        .mount(server)
        .await;

    Mock::given(method("POST"))
        .and(path("/service/discovery"))
        .and(body_json(json!({ "service": "contact" })))
        .respond_with(ResponseTemplate::new(200).set_body_json(contact_service_body(&server.uri())))
        .mount(server)
        .await;
}

/// 在 `endpoint` 上挂载一个 method mock，**不**校验请求体（请求体的正确性
/// 由用例自己读取 `received_requests` 后断言），仅断言 `expect(1)`。
async fn setup_method_mock(server: &MockServer, endpoint: &str, response_body: Value) {
    Mock::given(method("POST"))
        .and(path(endpoint.to_string()))
        .respond_with(ResponseTemplate::new(200).set_body_json(response_body))
        .expect(1)
        .mount(server)
        .await;
}

/// 从 `server` 的请求历史中取出唯一一条命中 `endpoint` 的请求 body 并解析为 JSON。
async fn captured_body(server: &MockServer, endpoint: &str) -> Value {
    let received = server
        .received_requests()
        .await
        .expect("wiremock keeps request history");
    let req = received
        .iter()
        .find(|r| r.url.path() == endpoint)
        .unwrap_or_else(|| panic!("no request hit endpoint {endpoint}"));
    serde_json::from_slice(&req.body).expect("request body is valid JSON")
}

fn argv(items: &[&str]) -> Vec<String> {
    items.iter().map(|s| s.to_string()).collect()
}

#[tokio::test]
async fn run_real_command_path() {
    let server = MockServer::start().await;
    setup_contact_discovery(&server).await;
    setup_method_mock(
        &server,
        "/contact/users/search",
        envelope(&json!({ "matched": 1 })),
    )
    .await;

    let buf = SharedBuf::new();
    let client = build_test_client(&server.uri());
    let result = client
        .run(argv(&[
            "wecom",
            "contact",
            "users",
            "search",
            "--keyword",
            "alice",
        ]))
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "real path: contact users search");

    let v = assert_stdout_json(&buf);
    assert_json_eq!(v, json!({ "matched": 1 }));
    let body = captured_body(&server, "/contact/users/search").await;
    assert_json_eq!(
        body,
        json!({ "payload": serde_json::to_string(&json!({"keyword": "alice"})).unwrap() })
    );
}

#[tokio::test]
async fn run_alias_command_path() {
    let server = MockServer::start().await;
    setup_contact_discovery(&server).await;
    setup_method_mock(
        &server,
        "/contact/users/search",
        envelope(&json!({ "matched": 1 })),
    )
    .await;

    let buf = SharedBuf::new();
    let client = build_test_client(&server.uri());
    let result = client
        .run(argv(&["wecom", "contact", "search", "--keyword", "alice"]))
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "alias path: contact search");

    let v = assert_stdout_json(&buf);
    assert_json_eq!(v, json!({ "matched": 1 }));
    let body = captured_body(&server, "/contact/users/search").await;
    assert_json_eq!(
        body,
        json!({ "payload": serde_json::to_string(&json!({"keyword": "alice"})).unwrap() })
    );
}

#[tokio::test]
async fn run_sibling_real_command() {
    let server = MockServer::start().await;
    setup_contact_discovery(&server).await;
    setup_method_mock(
        &server,
        "/contact/users/list",
        envelope(&json!({ "page": 2, "items": [] })),
    )
    .await;

    let buf = SharedBuf::new();
    let client = build_test_client(&server.uri());
    let result = client
        .run(argv(&["wecom", "contact", "users", "list", "--page", "2"]))
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "sibling real path: contact users list");

    let v = assert_stdout_json(&buf);
    assert_json_eq!(v, json!({ "page": 2, "items": [] }));
    let body = captured_body(&server, "/contact/users/list").await;
    assert_json_eq!(
        body,
        json!({ "payload": serde_json::to_string(&json!({"page": 2})).unwrap() })
    );
}

#[tokio::test]
async fn help_hides_alias_subcommand() {
    let server = MockServer::start().await;
    setup_contact_discovery(&server).await;

    let buf = SharedBuf::new();
    let client = build_test_client(&server.uri());
    let result = client
        .run(argv(&["wecom", "contact", "--help"]))
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "contact --help");

    let stdout = buf.contents();
    assert!(
        stdout.contains("users"),
        "help should mention real `users` group; got:\n{stdout}"
    );
    // Hidden alias 顶层段 `search` 不应作为 contact 的可见子命令出现。
    // 用单词边界匹配避免误中 `users` 中的 `s`。
    let alias_visible = stdout
        .lines()
        .any(|line| line.trim_start().starts_with("search "));
    assert!(
        !alias_visible,
        "alias subcommand `search` should be hidden in help; got:\n{stdout}"
    );
}
