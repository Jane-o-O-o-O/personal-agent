/// 扩展命令参与子命令帮助体系：`wecom auth --help` 输出包含其子命令。
#[tokio::test]
async fn run() {
    let server = wiremock::MockServer::start().await;

    // 扩展命令命中时跳过 discovery；--help 走 clap 渲染，不触网。
    // 不挂任何 mock：若触网即 404，run 失败。

    // 注册带子命令的扩展命令（对齐 bin 侧 auth：login / show）
    let custom = wecom::CustomCommand::new(
        clap::Command::new("auth")
            .about("Authenticate with the bot platform")
            .subcommand(clap::Command::new("login").about("Log in"))
            .subcommand(clap::Command::new("show").about("Show status")),
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
    let argv: Vec<String> = vec!["wecom", "auth", "--help"]
        .into_iter()
        .map(String::from)
        .collect();
    let result = client
        .run(argv)
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;

    assert_cli_ok(&result, &buf, "auth --help");
    assert_stdout_contains(&buf, "login");
    assert_stdout_contains(&buf, "show");

    // 扩展命令命中 → 服务发现被跳过，全程零网络请求
    let requests = server
        .received_requests()
        .await
        .expect("wiremock keeps request history");
    assert!(
        requests.is_empty(),
        "expected no HTTP requests for custom command help, got {requests:?}"
    );
}
