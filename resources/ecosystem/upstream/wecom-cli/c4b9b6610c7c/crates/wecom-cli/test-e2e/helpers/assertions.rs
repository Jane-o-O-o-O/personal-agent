use super::test_client::SharedBuf;

/// Assert the CLI result is `Ok`.
pub fn assert_cli_ok(result: &Result<(), wecom::Error>, buf: &SharedBuf, context: &str) {
    if let Err(e) = result {
        let rendered = e.render();
        let stdout = buf.contents();
        panic!(
            "{context} failed:\n  exit_code: {}\n  rendered: {rendered}\n  stdout: {stdout}",
            e.exit_code()
        );
    }
}

/// Assert stdout contains a substring.
pub fn assert_stdout_contains(buf: &SharedBuf, expected: &str) {
    let content = buf.contents();
    assert!(
        content.contains(expected),
        "stdout does not contain {expected:?}\nstdout:\n{content}"
    );
}
