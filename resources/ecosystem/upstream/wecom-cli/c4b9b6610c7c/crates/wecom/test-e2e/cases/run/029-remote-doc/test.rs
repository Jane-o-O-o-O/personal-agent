use wiremock::matchers::{body_json, method, path};
use wiremock::{Mock, MockServer, ResponseTemplate};

/// hr 服务 schema：三层 remote_doc 覆盖，各节点声明 id。
///
/// - service 级：id = svc-hr，remote_doc = true
/// - department 资源（id = res-department，未声明 remote_doc）：
///   list 方法（id = m-list）继承 service → 远程
/// - plain 资源：id = res-plain，remote_doc = false → 其下 ping 方法保持本地渲染
fn hr_remote_doc_schema_body() -> Value {
    api_response(&json!({
        "id": "svc-hr",
        "description": "Human Resources service",
        "remote_doc": true,
        "resources": {
            "department": {
                "id": "res-department",
                "methods": {
                    "list": {
                        "id": "m-list",
                        "path": "/cgi-bin/hr/department/list",
                        "http_method": "GET",
                        "description": "List departments",
                        "request": {
                            "type": "object",
                            "properties": {
                                "id": { "type": "integer", "description": "Department ID" }
                            }
                        }
                    }
                }
            },
            "plain": {
                "id": "res-plain",
                "remote_doc": false,
                "methods": {
                    "ping": {
                        "id": "m-ping",
                        "path": "/cgi-bin/hr/plain/ping",
                        "http_method": "GET",
                        "description": "Ping method"
                    }
                }
            }
        }
    }))
}

/// 挂载 discovery mock（catalog + hr detail）。
async fn setup_remote_doc_discovery(server: &MockServer) {
    Mock::given(method("POST"))
        .and(path("/service/discovery"))
        .and(body_json(json!({})))
        .respond_with(ResponseTemplate::new(200).set_body_json(catalog_body()))
        .mount(server)
        .await;
    Mock::given(method("POST"))
        .and(path("/service/discovery"))
        .and(body_json(json!({ "service": "hr" })))
        .respond_with(ResponseTemplate::new(200).set_body_json(hr_remote_doc_schema_body()))
        .mount(server)
        .await;
}

/// 挂载 `/remote_doc/get` mock：断言请求体为 payload-string 信封
/// `{"payload": "{\"id\": <id>, \"type\": <kind>}"}`，响应 result 固定为
/// `{"doc": <文档文本>}`。
async fn mock_remote_doc(server: &MockServer, id: &str, kind: &str, doc: &str) {
    Mock::given(method("POST"))
        .and(path("/remote_doc/get"))
        .and(body_json(
            json!({ "payload": serde_json::to_string(&json!({ "id": id, "type": kind })).unwrap() }),
        ))
        .respond_with(
            ResponseTemplate::new(200).set_body_json(api_response(&json!({ "doc": doc }))),
        )
        .expect(1)
        .mount(server)
        .await;
}

#[tokio::test]
async fn run() {
    let server = MockServer::start().await;
    setup_remote_doc_discovery(&server).await;
    mock_remote_doc(&server, "svc-hr", "doc", "REMOTE-DOC-SERVICE-DOC").await;
    mock_remote_doc(&server, "svc-hr", "schema", "REMOTE-DOC-SERVICE-SCHEMA").await;
    // service help 触发两次：显式 `hr --help` 与裸跑 `hr`（缺失子命令的自动帮助）。
    Mock::given(method("POST"))
        .and(path("/remote_doc/get"))
        .and(body_json(
            json!({ "payload": serde_json::to_string(&json!({ "id": "svc-hr", "type": "help" })).unwrap() }),
        ))
        .respond_with(
            ResponseTemplate::new(200)
                .set_body_json(api_response(&json!({ "doc": "REMOTE-DOC-SERVICE-HELP" }))),
        )
        .expect(2)
        .mount(&server)
        .await;
    mock_remote_doc(
        &server,
        "res-department",
        "help",
        "REMOTE-DOC-RESOURCE-HELP",
    )
    .await;
    mock_remote_doc(&server, "m-list", "doc", "REMOTE-DOC-METHOD-DOC").await;
    mock_remote_doc(&server, "m-list", "help", "REMOTE-DOC-METHOD-HELP").await;
    // plain.ping 被 resource 级 remote_doc=false 覆盖：不应触发远程文档请求。
    Mock::given(method("POST"))
        .and(path("/remote_doc/get"))
        .and(body_json(
            json!({ "payload": serde_json::to_string(&json!({ "id": "m-ping", "type": "doc" })).unwrap() }),
        ))
        .respond_with(ResponseTemplate::new(200).set_body_json(api_response(&json!("UNREACHABLE"))))
        .expect(0)
        .mount(&server)
        .await;

    let buf = SharedBuf::new();
    let home = leaked_tempdir();
    let transport = wecom::transport::HttpTransportBackend::builder()
        .base_url(server.uri())
        .header_sensitive("Authorization", "Bearer test-token", true)
        .build()
        .expect("add header");
    let client = wecom::Client::builder()
        .config_dir(&home)
        .transport(transport)
        .build()
        .expect("build test client");

    // service --doc → 远程
    let result = client
        .run(vec!["wecom".into(), "hr".into(), "--doc".into()])
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "hr --doc");

    // service --schema → 远程
    let result = client
        .run(vec!["wecom".into(), "hr".into(), "--schema".into()])
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "hr --schema");

    // service --help（clap DisplayHelp 拦截）→ 远程
    let result = client
        .run(vec!["wecom".into(), "hr".into(), "--help".into()])
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "hr --help");

    // 裸跑 service（缺失子命令，DisplayHelpOnMissingArgumentOrSubcommand）→ 同样走
    // 远程文档，但 use_stderr=true 决定 exit code 2。
    let result = client
        .run(vec!["wecom".into(), "hr".into()])
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    let err = result.expect_err("bare hr should fail with exit code 2");
    assert_eq!(err.exit_code(), 2, "bare hr exit code");
    let err_msg = err.to_string();
    assert!(
        err_msg.contains("REMOTE-DOC-SERVICE-HELP"),
        "bare hr 应输出远程帮助: {err_msg}"
    );

    // resource --help（clap DisplayHelp 拦截）→ 远程，id 取 resource 自身
    let result = client
        .run(vec![
            "wecom".into(),
            "hr".into(),
            "department".into(),
            "--help".into(),
        ])
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "hr department --help");

    // method --doc（继承 service 级 remote_doc=true）→ 远程
    let result = client
        .run(vec![
            "wecom".into(),
            "hr".into(),
            "department".into(),
            "list".into(),
            "--doc".into(),
        ])
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "hr department list --doc");

    // method --help（clap DisplayHelp 拦截）→ 远程
    let result = client
        .run(vec![
            "wecom".into(),
            "hr".into(),
            "department".into(),
            "list".into(),
            "--help".into(),
        ])
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "hr department list --help");

    // method 被 resource 级 remote_doc=false 覆盖 → 保持本地渲染
    let result = client
        .run(vec![
            "wecom".into(),
            "hr".into(),
            "plain".into(),
            "ping".into(),
            "--doc".into(),
        ])
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "hr plain ping --doc");

    assert_stdout_contains(&buf, "REMOTE-DOC-SERVICE-DOC");
    assert_stdout_contains(&buf, "REMOTE-DOC-SERVICE-SCHEMA");
    assert_stdout_contains(&buf, "REMOTE-DOC-SERVICE-HELP");
    assert_stdout_contains(&buf, "REMOTE-DOC-RESOURCE-HELP");
    assert_stdout_contains(&buf, "REMOTE-DOC-METHOD-DOC");
    assert_stdout_contains(&buf, "REMOTE-DOC-METHOD-HELP");
    // 远程场景不输出本地渲染的 clap help
    let content = buf.contents();
    assert!(
        !content.contains("Usage: wecom hr"),
        "remote_doc 场景不应输出本地 clap help: {content}"
    );
    // remote_doc=false 覆盖场景保持本地渲染（本地 method doc 含 Method 标题与描述）
    assert_stdout_contains(&buf, "Method");
    assert_stdout_contains(&buf, "Ping method");
    assert!(
        !content.contains("UNREACHABLE"),
        "remote_doc=false 的 method 不应触发远程文档请求: {content}"
    );
}
