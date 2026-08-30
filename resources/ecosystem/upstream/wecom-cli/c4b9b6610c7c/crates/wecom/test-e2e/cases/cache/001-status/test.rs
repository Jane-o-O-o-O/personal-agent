#[tokio::test]
async fn run() {
    let tmp = tempfile::tempdir().unwrap();
    let cache_dir = tmp.path().join("cache");
    std::fs::create_dir_all(&cache_dir).unwrap();
    #[allow(clippy::disallowed_methods)]
    std::fs::write(cache_dir.join("catalog.json"), "{}").unwrap();

    let buf = SharedBuf::new();
    let client = wecom::Client::builder()
        .config_dir(tmp.path())
        .transport(build_test_http_transport("test-token", "http://localhost"))
        .build()
        .unwrap();

    let result = client
        .run(vec!["wecom".into(), "cache".into(), "status".into()])
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "cache status");

    let v = assert_stdout_json(&buf);
    let arr = v.as_array().expect("output should be array");
    assert_eq!(arr.len(), 1);
    assert_eq!(arr[0]["file"], "catalog.json");
}
