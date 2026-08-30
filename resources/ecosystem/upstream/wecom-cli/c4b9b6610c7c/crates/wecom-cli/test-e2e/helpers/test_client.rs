use std::io::Write;
use std::path::PathBuf;
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

/// Build a test [`wecom::Client`] pointed at the given mock server URL.
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
