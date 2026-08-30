use wiremock::matchers::{body_json, method, path};
use wiremock::{Mock, ResponseTemplate};

/// 扩展命令屏蔽同名服务：`--help` 全量发现时，同名 service 不进入命令树。
#[tokio::test]
async fn run() {
    let server = wiremock::MockServer::start().await;

    // catalog 含名为 "hr" 的服务（description: "Human Resources"）
    Mock::given(method("POST"))
        .and(path("/service/discovery"))
        .and(body_json(json!({})))
        .respond_with(ResponseTemplate::new(200).set_body_json(catalog_body()))
        .mount(&server)
        .await;
    // 故意不挂 hr schema mock：同名服务若未被屏蔽且被展开，请求会 404。

    // 注册与服务同名的 "hr" 扩展命令
    let custom = wecom::CustomCommand::new(
        clap::Command::new("hr").about("Custom HR command"),
        |_run, _matches| Box::pin(async { Ok(()) }),
    );

    let home = leaked_tempdir();
    let client = wecom::Client::builder()
        .config_dir(&home)
        .transport(build_test_http_transport("test-token", &server.uri()))
        .command(custom)
        .build()
        .unwrap();

    let buf = SharedBuf::new();
    let argv: Vec<String> = vec!["wecom", "--help"]
        .into_iter()
        .map(String::from)
        .collect();
    let result = client
        .run(argv)
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;

    assert_cli_ok(&result, &buf, "--help");

    // help 中出现的是扩展命令（扩展命令优先），服务 "Human Resources" 被屏蔽
    assert_stdout_contains(&buf, "Custom HR command");
    let out = buf.contents();
    assert!(
        !out.contains("Human Resources"),
        "same-named service should be shadowed by custom command:\n{out}"
    );

    // 仅发生 catalog 一次请求：hr schema 未被请求（服务被跳过）
    let requests = server
        .received_requests()
        .await
        .expect("wiremock keeps request history");
    assert_eq!(
        requests.len(),
        1,
        "expected exactly one discovery (catalog) request, got {requests:?}"
    );
}
