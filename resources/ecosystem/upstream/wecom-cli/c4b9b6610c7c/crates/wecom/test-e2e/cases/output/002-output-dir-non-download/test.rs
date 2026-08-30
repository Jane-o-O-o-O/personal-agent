#[tokio::test]
async fn run() {
    let server = wiremock::MockServer::start().await;
    setup_discovery_mocks(&server).await;

    setup_method_mock(
        &server,
        "/department/list",
        api_response(&json!({"departments": [{"id": "1"}]})),
    )
    .await;

    let tmp = tempfile::tempdir().unwrap();
    let out_dir = tmp.path().join("out");

    let buf = SharedBuf::new();
    let client = wecom::Client::builder()
        .config_dir(tmp.path())
        .transport(build_test_http_transport("test-token", &server.uri()))
        .private_fs(std::sync::Arc::new(wecom_fs::SandboxedFs::new()))
        .workspace_fs(std::sync::Arc::new(
            wecom_fs::SandboxedFs::new()
                .with_write_policy(wecom_fs::Policy::new().with_allowed_dirs(&[tmp.path()])),
        ))
        .build()
        .unwrap();

    // 兼容逻辑：非下载类方法携带 --output-dir 时按未传处理，调用照常成功。
    let result = client
        .run(hr_dept_list_argv(&[
            "--output-dir",
            out_dir.to_str().unwrap(),
        ]))
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "output-dir tolerated on non-download method");

    // stdout 为方法响应 JSON（未落盘）。
    let v = assert_stdout_json(&buf);
    assert_json_eq!(v["departments"][0]["id"], json!("1"));

    // --output-dir 目录未产生（兼容忽略，连目录本身都不会创建）。
    #[allow(clippy::disallowed_methods)] // e2e 断言层直探文件系统
    {
        assert!(
            !out_dir.exists(),
            "--output-dir must be ignored: {}",
            out_dir.display()
        );
    }
}
