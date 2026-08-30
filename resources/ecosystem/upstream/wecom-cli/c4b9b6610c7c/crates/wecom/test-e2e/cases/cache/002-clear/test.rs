#[tokio::test]
#[allow(clippy::disallowed_methods)]
async fn run() {
    let tmp = tempfile::tempdir().unwrap();
    let cache_dir = tmp.path().join("cache");
    std::fs::create_dir_all(&cache_dir).unwrap();
    std::fs::write(cache_dir.join("old.json"), "x").unwrap();
    std::fs::write(cache_dir.join("stale.json"), "y").unwrap();

    let buf = SharedBuf::new();
    let client = wecom::Client::builder()
        .config_dir(tmp.path())
        .transport(build_test_http_transport("test-token", "http://localhost"))
        .build()
        .unwrap();

    let result = client
        .run(vec!["wecom".into(), "cache".into(), "clear".into()])
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "cache clear");

    let v = assert_stdout_json(&buf);
    assert_eq!(v["status"], "success");

    // FS: cache dir should be empty
    assert_dir_file_count(&cache_dir, 0);
}
