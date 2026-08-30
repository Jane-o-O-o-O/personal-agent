#[tokio::test]
async fn run() {
    let buf = SharedBuf::new();
    let client = build_test_client("http://127.0.0.1:1");

    let result = client
        .run(vec!["wecom".into(), "--version".into()])
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "--version");
    // Format: wecom <version> (<distribution> <RFC 3339> <commit>)
    assert_stdout_contains(&buf, "wecom");
    let stdout = buf.contents();
    assert!(
        stdout.contains('T') && stdout.trim_end().ends_with(')'),
        "expected `wecom <version> (<distribution> <RFC 3339> <commit>)`, got: {stdout:?}"
    );
}
