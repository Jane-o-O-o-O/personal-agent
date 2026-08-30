use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};

/// A cloneable, `Write`-compatible buffer for capturing output.
#[derive(Clone, Default)]
pub struct SharedBuf(Arc<Mutex<Vec<u8>>>);

impl Write for SharedBuf {
    fn write(&mut self, buf: &[u8]) -> std::io::Result<usize> {
        self.0.lock().unwrap().write(buf)
    }
    fn flush(&mut self) -> std::io::Result<()> {
        Ok(())
    }
}

impl SharedBuf {
    pub fn new() -> Self {
        Self::default()
    }
    pub fn contents(&self) -> String {
        let buf = self.0.lock().unwrap();
        String::from_utf8_lossy(&buf).to_string()
    }
}

/// Build a standard HTTP test transport with the given bearer token and base_url.
pub fn build_test_http_transport(token: &str, base_url: &str) -> wecom::transport::Transport {
    wecom::transport::HttpTransportBackend::builder()
        .base_url(base_url)
        .header_sensitive("Authorization", format!("Bearer {}", token), true)
        .build()
        .expect("add header")
}

/// Build a test [`wecom::Client`] pointed at the given mock server URL.
///
/// To capture output, pass a [`wecom::CliRunOutput`] via `.output()` on
/// `client.run()`.
pub fn build_test_client(server_url: &str) -> wecom::Client {
    let home = leaked_tempdir();
    let transport = wecom::transport::HttpTransportBackend::builder()
        .base_url(server_url)
        .header_sensitive("Authorization", "Bearer test-token", true)
        .build()
        .expect("add header");
    wecom::Client::builder()
        .config_dir(&home)
        .transport(transport)
        .build()
        .expect("build test client")
}

/// Create a leaked tempdir (won't be cleaned up during test).
pub fn leaked_tempdir() -> PathBuf {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().to_path_buf();
    std::mem::forget(dir);
    path
}

/// Assert the CLI result is `Ok`, with rich diagnostics on failure.
pub fn assert_cli_ok(result: &Result<(), wecom::Error>, buf: &SharedBuf, context: &str) {
    if let Err(e) = result {
        let rendered = e.render();
        let stdout = buf.contents();
        let hint = if rendered.contains("501") {
            concat!(
                "\n  Hint: HTTP 501 = no mock matched the request.",
                "\n  Check: body matchers, header matchers, endpoint path.",
            )
        } else {
            ""
        };
        panic!(
            "{context} failed:\n  exit_code: {}\n  rendered: {rendered}\n  stdout: {stdout}{hint}",
            e.exit_code()
        );
    }
}

/// Assert stdout is valid JSON and return parsed Value.
pub fn assert_stdout_json(buf: &SharedBuf) -> serde_json::Value {
    let content = buf.contents();
    serde_json::from_str(content.trim()).unwrap_or_else(|e| {
        panic!("stdout is not valid JSON: {e}\nstdout:\n{content}");
    })
}

/// Assert stdout contains a substring.
pub fn assert_stdout_contains(buf: &SharedBuf, expected: &str) {
    let content = buf.contents();
    assert!(
        content.contains(expected),
        "stdout does not contain {expected:?}\nstdout:\n{content}"
    );
}

/// Assert stdout is a DownloadResult with given content_type, return parsed Value.
pub fn assert_download_result(buf: &SharedBuf, content_type: &str) -> serde_json::Value {
    let v = assert_stdout_json(buf);
    assert_eq!(
        v["content_type"], content_type,
        "DownloadResult.content_type mismatch"
    );
    assert!(
        v["file_path"].is_string(),
        "DownloadResult.file_path missing"
    );
    v
}

/// Assert file exists and return content as String.
pub fn assert_file_exists(path: &Path) -> String {
    // Test fixture: probing tempdir, not through CLI sandbox.
    #[allow(clippy::disallowed_methods)]
    let exists = path.exists();
    assert!(exists, "file does not exist: {}", path.display());
    #[allow(clippy::disallowed_methods)]
    // Test fixture: reading from tempdir, not through CLI sandbox.
    std::fs::read_to_string(path).unwrap_or_else(|e| {
        panic!("failed to read {}: {e}", path.display());
    })
}

/// Assert directory contains exactly N files.
pub fn assert_dir_file_count(dir: &Path, count: usize) {
    #[allow(clippy::disallowed_methods)]
    // Test fixture: reading from tempdir, not through CLI sandbox.
    let entries: Vec<_> = std::fs::read_dir(dir)
        .unwrap_or_else(|e| panic!("failed to read dir {}: {e}", dir.display()))
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().map(|t| t.is_file()).unwrap_or(false))
        .collect();
    assert_eq!(
        entries.len(),
        count,
        "directory {} has {} files, expected {count}",
        dir.display(),
        entries.len()
    );
}

/// Assert the CLI result is an error with the given exit code and error code.
#[allow(dead_code)]
pub fn assert_error_result(
    result: &Result<(), wecom::Error>,
    expected_exit_code: i32,
    expected_error_code: i64,
) -> serde_json::Value {
    assert!(result.is_err(), "expected error, got Ok");
    let err = result.as_ref().unwrap_err();
    assert_eq!(err.exit_code(), expected_exit_code, "exit_code mismatch");
    let rendered = err.render();
    let v: serde_json::Value = serde_json::from_str(&rendered)
        .unwrap_or_else(|e| panic!("render should be JSON: {e}\nrendered:\n{rendered}"));
    assert_eq!(
        v["error"]["code"], expected_error_code,
        "error.code mismatch, full output: {v}"
    );
    v
}
