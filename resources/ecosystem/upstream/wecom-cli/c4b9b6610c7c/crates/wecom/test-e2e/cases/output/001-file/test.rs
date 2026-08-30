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
    let out_path = tmp.path().join("out.json");

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

    let result = client
        .run(hr_dept_list_argv(&["--output", out_path.to_str().unwrap()]))
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "output file");

    // CLI stdout should be DownloadResult
    let v = assert_download_result(&buf, "application/json");
    assert!(v["size"].as_u64().unwrap() > 0);

    // FS: file exists with correct content
    let content = assert_file_exists(&out_path);
    let file_v: serde_json::Value = serde_json::from_str(&content).unwrap();
    assert!(file_v["departments"].is_array());
}
