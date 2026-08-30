// Process-level: load_config_file runs before client.run() in main.rs.
#[cfg(feature = "custom-endpoint")]
#[test]
fn run() {
    let tmp = tempfile::tempdir().unwrap();
    #[allow(clippy::disallowed_methods)]
    std::fs::write(tmp.path().join("config.json"), "{invalid json!!!").unwrap();

    let output = assert_cmd::Command::cargo_bin("wecom-cli")
        .unwrap()
        .env("WECOM_CLI_CONFIG_DIR", tmp.path().as_os_str())
        .env("WECOM_CLI_BASE_URL", "http://127.0.0.1:1")
        .args(["--version"])
        .output()
        .unwrap();

    assert_eq!(output.status.code(), Some(1));

    let stdout = String::from_utf8_lossy(&output.stdout);
    let v: Value = serde_json::from_str(stdout.trim())
        .unwrap_or_else(|e| panic!("stdout not JSON: {e}\n{stdout}"));
    assert_eq!(v["error"]["type"], "ConfigError");
    assert_eq!(v["error"]["code"], 893005);
    assert!(
        v["error"]["message"]
            .as_str()
            .unwrap()
            .contains("Failed to parse config file"),
    );
}
