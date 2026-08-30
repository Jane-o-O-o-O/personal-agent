/// 扩展命令 handler 返回错误时，`run` 返回 `Err` 且 `exit_code()` 非零
/// （对齐 wecom-cli 的 `auth` 错误路径：handler 错误走 `wecom::Error` 统一退出码）。
#[tokio::test]
async fn run() {
    let server = wiremock::MockServer::start().await;
    // 不挂任何 mock：扩展命令命中时跳过 discovery，若触网即 404。

    // 注册一个 handler 固定返回错误的扩展命令
    let custom = wecom::CustomCommand::new(
        clap::Command::new("boom").about("Always fails"),
        |_run, _matches| Box::pin(async { Err(wecom::Error::other("boom!".into())) }),
    );

    let home = leaked_tempdir();
    let client = wecom::Client::builder()
        .config_dir(&home)
        .transport(build_test_http_transport("test-token", &server.uri()))
        .command(custom)
        .build()
        .unwrap();

    let buf = SharedBuf::new();
    let argv: Vec<String> = vec!["wecom", "boom"]
        .into_iter()
        .map(String::from)
        .collect();
    let result = client
        .run(argv)
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;

    assert!(result.is_err(), "handler error should propagate to run()");
    let err = result.unwrap_err();
    // 非 CliOutput 错误统一退出码为 1
    assert_eq!(err.exit_code(), 1, "exit_code should be 1");
    assert_eq!(err.code(), wecom::E_OTHER);
    assert_eq!(err.message(), "boom!");

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
