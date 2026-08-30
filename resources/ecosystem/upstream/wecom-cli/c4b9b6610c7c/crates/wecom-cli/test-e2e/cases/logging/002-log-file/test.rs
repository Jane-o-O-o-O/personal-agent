// Process-level: logging::init_logging() only runs in main.rs.
#[cfg(feature = "custom-endpoint")]
#[test]
fn run() {
    let tmp = tempfile::tempdir().unwrap();
    let log_dir = tmp.path().join("logs");
    let config_dir = tempfile::tempdir().unwrap();

    let (server_url, _keep) = setup_sync_discovery_server();

    let output = assert_cmd::Command::cargo_bin("wecom-cli")
        .unwrap()
        .env("WECOM_CLI_BASE_URL", &server_url)
        .env("WECOM_CLI_CONFIG_DIR", config_dir.path())
        .env("WECOM_CLI_LOG_DIR", log_dir.as_os_str())
        .env("WECOM_CLI_LOG_LEVEL", "debug")
        .args(["schema", "list"])
        .output()
        .unwrap();

    assert!(output.status.success());

    // FS: log directory should have been created with a ww.log.YYYY-MM-DD file.
    assert!(log_dir.exists(), "log dir should be created");

    #[allow(clippy::disallowed_methods)]
    let entries: Vec<_> = std::fs::read_dir(&log_dir)
        .unwrap()
        .filter_map(|e| e.ok())
        .collect();
    assert!(
        !entries.is_empty(),
        "log dir should contain at least one file"
    );

    let log_file = &entries[0].path();
    let filename = log_file.file_name().unwrap().to_str().unwrap();
    assert!(
        filename.starts_with("ww.log."),
        "log file should be named ww.log.YYYY-MM-DD, got: {filename}"
    );

    #[allow(clippy::disallowed_methods)]
    let content = std::fs::read_to_string(log_file).unwrap();
    assert!(!content.is_empty(), "log file should not be empty");
}

#[cfg(not(feature = "custom-endpoint"))]
#[test]
#[ignore = "requires custom-endpoint feature"]
fn run() {}
