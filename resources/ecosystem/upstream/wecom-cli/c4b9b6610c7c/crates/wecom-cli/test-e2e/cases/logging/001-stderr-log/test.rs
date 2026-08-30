// Process-level: logging::init_logging() only runs in main.rs.
// Library-level cannot test stderr output.
#[cfg(feature = "custom-endpoint")]
#[test]
fn run() {
    let (server_url, _keep) = setup_sync_discovery_server();
    let tmp = tempfile::tempdir().unwrap();

    let output = assert_cmd::Command::cargo_bin("wecom-cli")
        .unwrap()
        .env("WECOM_CLI_BASE_URL", &server_url)
        .env("WECOM_CLI_CONFIG_DIR", tmp.path())
        .env("WECOM_CLI_LOG_LEVEL", "debug")
        .args(["schema", "list"])
        .output()
        .unwrap();

    assert!(output.status.success());

    let stderr = String::from_utf8_lossy(&output.stderr);
    // Only assert stderr is non-empty; log format is volatile.
    assert!(!stderr.is_empty(), "stderr should contain log output");
}

#[cfg(not(feature = "custom-endpoint"))]
#[test]
#[ignore = "requires custom-endpoint feature"]
fn run() {}
