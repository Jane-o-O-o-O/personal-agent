use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};

use wiremock::matchers::{body_json, method, path};
use wiremock::{Mock, ResponseTemplate};

/// 构建带扩展命令的测试 client（`auth` 命令 + `login` 子命令）。
fn build_client_with_auth_cmd(server_uri: &str, called: Arc<AtomicBool>) -> wecom::Client {
    let custom = wecom::CustomCommand::new(
        clap::Command::new("auth")
            .about("Authenticate with the bot platform")
            .subcommand(clap::Command::new("login")),
        move |_run, matches| {
            let called = called.clone();
            Box::pin(async move {
                called.store(
                    matches.subcommand_matches("login").is_some(),
                    Ordering::SeqCst,
                );
                Ok(())
            })
        },
    );

    let home = leaked_tempdir();
    wecom::Client::builder()
        .config_dir(&home)
        .transport(build_test_http_transport("test-token", server_uri))
        .command(custom)
        .build()
        .unwrap()
}

/// 扩展命令命中：分发到 handler，且全程不触发 service discovery（零网络请求）。
#[tokio::test]
async fn custom_command_dispatches_without_discovery() {
    let server = wiremock::MockServer::start().await;
    // 故意不挂任何 mock：若 execute() 对扩展命令触发 service discovery，
    // 请求会 404，run 失败。

    let called = Arc::new(AtomicBool::new(false));
    let client = build_client_with_auth_cmd(&server.uri(), called.clone());

    let buf = SharedBuf::new();
    let argv: Vec<String> = vec!["wecom", "auth", "login"]
        .into_iter()
        .map(String::from)
        .collect();
    let result = client
        .run(argv)
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;

    assert_cli_ok(&result, &buf, "auth login");
    assert!(
        called.load(Ordering::SeqCst),
        "custom command handler was not invoked"
    );

    // 扩展命令命中 → 服务发现被跳过，全程零网络请求
    let requests = server
        .received_requests()
        .await
        .expect("wiremock keeps request history");
    assert!(
        requests.is_empty(),
        "expected no HTTP requests for custom command, got {requests:?}"
    );
}

/// 扩展命令参与 clap 帮助体系：`wecom --help` 输出中包含扩展命令。
#[tokio::test]
async fn custom_command_appears_in_help() {
    let server = wiremock::MockServer::start().await;

    // --help 触发全量 service discovery，需挂 catalog mock
    Mock::given(method("POST"))
        .and(path("/service/discovery"))
        .and(body_json(json!({})))
        .respond_with(ResponseTemplate::new(200).set_body_json(catalog_body()))
        .mount(&server)
        .await;

    let called = Arc::new(AtomicBool::new(false));
    let client = build_client_with_auth_cmd(&server.uri(), called);

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
    assert_stdout_contains(&buf, "auth");
    assert_stdout_contains(&buf, "Authenticate with the bot platform");
}
