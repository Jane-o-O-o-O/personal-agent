#[test]
fn run() {
    let home = leaked_tempdir();
    let out = leaked_tempdir();

    let transport = wecom_transport::HttpTransportBackend::builder()
        .base_url("https://custom.api.com")
        .header_sensitive("Authorization", "Bearer my-token", true)
        .build()
        .unwrap();

    let client = wecom::Client::builder()
        .config_dir(&home)
        .default_output_dir(&out)
        .transport(transport)
        .build()
        .unwrap();

    assert_eq!(client.config_dir(), home.as_path());
    assert_eq!(client.default_output_dir(), Some(out.as_path()));
    // Transport should have Authorization header
    assert!(client.transport().headers().contains_key("authorization"));
}
