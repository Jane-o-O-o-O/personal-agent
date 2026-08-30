/// 后台接口返回 10021 错误码时，Err 分支额外输出当前命令的 help。
#[tokio::test]
async fn run() {
    let server = wiremock::MockServer::start().await;
    setup_discovery_mocks(&server).await;

    // method 接口返回网关错误信封：error.code = 10021
    setup_method_mock(
        &server,
        "/department/list",
        json!({
            "result": null,
            "error": { "code": 10021, "message": "invalid usage" }
        }),
    )
    .await;

    let buf = SharedBuf::new();
    let client = build_test_client(&server.uri());

    let result = client
        .run(hr_dept_list_argv(&[]))
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;

    // 10021 以 CliOutput 返回（用法错误，exit_code 2），而非原始 Api 错误
    assert!(result.is_err(), "expected Err for API code 10021");
    let err = result.unwrap_err();
    assert_eq!(err.exit_code(), 2);
    assert!(matches!(err, wecom::Error::CliOutput { .. }));

    // 渲染内容对齐 clap 错误：error 行（后台 errmsg）+ 空行 + 当前子命令 help
    let rendered = err.render();
    assert!(
        rendered.contains("error: invalid usage"),
        "rendered:\n{rendered}"
    );
    assert!(rendered.contains("Usage"), "rendered:\n{rendered}");
    assert!(
        rendered.contains("List departments"),
        "rendered:\n{rendered}"
    );
}
