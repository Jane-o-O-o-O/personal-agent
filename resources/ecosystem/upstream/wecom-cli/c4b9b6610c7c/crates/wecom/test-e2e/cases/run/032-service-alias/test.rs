use serde_json::json;
use wiremock::matchers::{body_json, method, path};
use wiremock::{Mock, ResponseTemplate};

/// 包含 alias 的 catalog 响应体：hr 服务有 alias `["human-resources", "hr"]`。
fn catalog_with_alias_body() -> serde_json::Value {
    api_response(&json!({
        "items": [
            {
                "name": "hr",
                "description": "Human Resources",
                "alias": ["human-resources", "hr"]
            }
        ]
    }))
}

/// 测试使用 alias 名调用服务方法：`wecom human-resources department list`
#[tokio::test]
async fn run_service_via_alias() {
    let server = wiremock::MockServer::start().await;

    // catalog mock：请求体为空对象 {}，返回带 alias 的 catalog
    Mock::given(method("POST"))
        .and(path("/service/discovery"))
        .and(body_json(json!({})))
        .respond_with(ResponseTemplate::new(200).set_body_json(catalog_with_alias_body()))
        .mount(&server)
        .await;

    // hr 详情 mock：请求体含 {"service":"hr"}（service_with_options 解析 alias 后使用原始名）
    Mock::given(method("POST"))
        .and(path("/service/discovery"))
        .and(body_json(json!({ "service": "hr" })))
        .respond_with(ResponseTemplate::new(200).set_body_json(hr_service_body(&server.uri())))
        .mount(&server)
        .await;

    // method mock：/department/list
    Mock::given(method("POST"))
        .and(path("/department/list"))
        .respond_with(
            ResponseTemplate::new(200).set_body_json(api_response(&json!({
                "departments": [
                    {"id": "1", "name": "Engineering"}
                ]
            }))),
        )
        .mount(&server)
        .await;

    let buf = SharedBuf::new();
    let client = build_test_client(&server.uri());

    // 使用 alias "human-resources" 替代原始名 "hr"
    let argv: Vec<String> = vec![
        "wecom",
        "human-resources",
        "department",
        "list",
        "--id",
        "root",
    ]
    .into_iter()
    .map(String::from)
    .collect();
    let result = client
        .run(argv)
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "run via alias");

    let v = assert_stdout_json(&buf);
    assert!(v["departments"].is_array());
    assert_eq!(v["departments"].as_array().unwrap().len(), 1);
}

/// 测试使用短 alias 名调用服务方法：`wecom hr department list`
/// （"hr" 既是原始名也是 alias，应优先匹配 name）
#[tokio::test]
async fn run_service_via_original_name_still_works() {
    let server = wiremock::MockServer::start().await;

    // catalog mock
    Mock::given(method("POST"))
        .and(path("/service/discovery"))
        .and(body_json(json!({})))
        .respond_with(ResponseTemplate::new(200).set_body_json(catalog_with_alias_body()))
        .mount(&server)
        .await;

    // hr 详情 mock
    Mock::given(method("POST"))
        .and(path("/service/discovery"))
        .and(body_json(json!({ "service": "hr" })))
        .respond_with(ResponseTemplate::new(200).set_body_json(hr_service_body(&server.uri())))
        .mount(&server)
        .await;

    // method mock
    Mock::given(method("POST"))
        .and(path("/department/list"))
        .respond_with(
            ResponseTemplate::new(200).set_body_json(api_response(&json!({
                "departments": [
                    {"id": "1", "name": "Engineering"}
                ]
            }))),
        )
        .mount(&server)
        .await;

    let buf = SharedBuf::new();
    let client = build_test_client(&server.uri());

    // 使用原始名 "hr" 仍然正常工作
    let argv: Vec<String> = vec!["wecom", "hr", "department", "list", "--id", "root"]
        .into_iter()
        .map(String::from)
        .collect();
    let result = client
        .run(argv)
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "run via original name");

    let v = assert_stdout_json(&buf);
    assert!(v["departments"].is_array());
    assert_eq!(v["departments"].as_array().unwrap().len(), 1);
}

/// 测试使用 alias 名时 `--help` 能正确展示服务文档
#[tokio::test]
async fn help_via_alias_shows_service_doc() {
    let server = wiremock::MockServer::start().await;

    // catalog mock
    Mock::given(method("POST"))
        .and(path("/service/discovery"))
        .and(body_json(json!({})))
        .respond_with(ResponseTemplate::new(200).set_body_json(catalog_with_alias_body()))
        .mount(&server)
        .await;

    // hr 详情 mock
    Mock::given(method("POST"))
        .and(path("/service/discovery"))
        .and(body_json(json!({ "service": "hr" })))
        .respond_with(ResponseTemplate::new(200).set_body_json(hr_service_body(&server.uri())))
        .mount(&server)
        .await;

    let buf = SharedBuf::new();
    let client = build_test_client(&server.uri());

    // 使用 alias 名请求 --help
    let argv: Vec<String> = vec!["wecom", "human-resources", "--help"]
        .into_iter()
        .map(String::from)
        .collect();
    let result = client
        .run(argv)
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "help via alias");

    // 帮助输出应包含服务描述
    assert_stdout_contains(&buf, "HR service description");
}

/// 测试使用 alias 名时 `--schema` 能正确展示服务 schema
#[tokio::test]
async fn schema_via_alias_shows_service_schema() {
    let server = wiremock::MockServer::start().await;

    // catalog mock
    Mock::given(method("POST"))
        .and(path("/service/discovery"))
        .and(body_json(json!({})))
        .respond_with(ResponseTemplate::new(200).set_body_json(catalog_with_alias_body()))
        .mount(&server)
        .await;

    // hr 详情 mock
    Mock::given(method("POST"))
        .and(path("/service/discovery"))
        .and(body_json(json!({ "service": "hr" })))
        .respond_with(ResponseTemplate::new(200).set_body_json(hr_service_body(&server.uri())))
        .mount(&server)
        .await;

    let buf = SharedBuf::new();
    let client = build_test_client(&server.uri());

    // 使用 alias 名请求 --schema
    let argv: Vec<String> = vec!["wecom", "human-resources", "--schema"]
        .into_iter()
        .map(String::from)
        .collect();
    let result = client
        .run(argv)
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "schema via alias");

    // schema 输出应包含服务描述
    assert_stdout_contains(&buf, "HR service description");
}
