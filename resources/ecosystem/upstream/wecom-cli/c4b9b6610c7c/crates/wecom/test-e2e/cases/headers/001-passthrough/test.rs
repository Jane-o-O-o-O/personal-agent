/// Helper: build a Transport with Authorization + custom headers.
fn build_transport_with_headers(
    token: &str,
    extra_headers: &[(&str, &str)],
    base_url: &str,
) -> wecom_transport::Transport {
    let mut builder = wecom_transport::HttpTransportBackend::builder()
        .base_url(base_url)
        .header("Authorization", format!("Bearer {}", token));

    for (name, value) in extra_headers {
        builder = builder.header(*name, *value);
    }

    builder.build().expect("build transport")
}

/// Helper: build a client with the given transport.
fn build_client_with_transport(transport: wecom_transport::Transport) -> wecom::Client {
    wecom::Client::builder()
        .config_dir(leaked_tempdir())
        .transport(transport)
        .build()
        .unwrap()
}

#[tokio::test]
async fn headers_sent_to_discovery() {
    let server = wiremock::MockServer::start().await;

    // Mock requires the custom headers to be present
    setup_discovery_mocks_with(
        &server,
        DiscoveryMockOptions {
            header_matchers: vec![("x-custom", "val1"), ("x-trace", "trace-123")],
            expect_count: Some(1),
        },
    )
    .await;

    let buf = SharedBuf::new();
    let transport = build_transport_with_headers(
        "test-token",
        &[("X-Custom", "val1"), ("X-Trace", "trace-123")],
        &server.uri(),
    );
    let client = build_client_with_transport(transport);

    let result = client
        .run(vec!["wecom".into(), "schema".into(), "list".into()])
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "additional headers in discovery");
}

#[tokio::test]
async fn headers_sent_to_method_call() {
    let server = wiremock::MockServer::start().await;

    setup_discovery_mocks_with(
        &server,
        DiscoveryMockOptions {
            header_matchers: vec![("x-custom", "val1")],
            expect_count: None,
        },
    )
    .await;

    setup_method_mock_with_headers(
        &server,
        "/department/list",
        api_response(&json!({
            "departments": [{"id": "1", "name": "Engineering"}]
        })),
        &[("x-custom", "val1")],
    )
    .await;

    let buf = SharedBuf::new();
    let transport =
        build_transport_with_headers("test-token", &[("X-Custom", "val1")], &server.uri());
    let client = build_client_with_transport(transport);

    let result = client
        .run(hr_dept_list_argv(&[]))
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "additional headers in method call");
}

#[tokio::test]
async fn access_token_authorization_header_sent() {
    let server = wiremock::MockServer::start().await;

    setup_discovery_mocks_with(
        &server,
        DiscoveryMockOptions {
            header_matchers: vec![("authorization", "Bearer my-secret-token")],
            expect_count: Some(1),
        },
    )
    .await;

    let buf = SharedBuf::new();
    let transport = build_transport_with_headers("my-secret-token", &[], &server.uri());
    let client = build_client_with_transport(transport);

    let result = client
        .run(vec!["wecom".into(), "schema".into(), "list".into()])
        .output(wecom::CliRunOutput::new(buf.clone()))
        .await;
    assert_cli_ok(&result, &buf, "authorization header");
}

#[tokio::test]
async fn run_headers_sent_to_method_call() {
    let server = wiremock::MockServer::start().await;

    setup_discovery_mocks(&server).await;

    setup_method_mock_with_headers(
        &server,
        "/department/list",
        api_response(&json!({
            "departments": [{"id": "1", "name": "Engineering"}]
        })),
        &[("x-run-extra", "run-val")],
    )
    .await;

    let buf = SharedBuf::new();
    let client = build_test_client(&server.uri());

    let mut extra = reqwest::header::HeaderMap::new();
    extra.insert(
        reqwest::header::HeaderName::from_static("x-run-extra"),
        reqwest::header::HeaderValue::from_static("run-val"),
    );

    let result = client
        .run(hr_dept_list_argv(&[]))
        .output(wecom::CliRunOutput::new(buf.clone()))
        .headers(&extra)
        .await;
    assert_cli_ok(&result, &buf, "headers in method call");
}

#[tokio::test]
async fn builder_and_run_headers_both_sent() {
    let server = wiremock::MockServer::start().await;

    setup_discovery_mocks_with(
        &server,
        DiscoveryMockOptions {
            header_matchers: vec![("x-base", "base-val")],
            expect_count: None,
        },
    )
    .await;

    setup_method_mock_with_headers(
        &server,
        "/department/list",
        api_response(&json!({
            "departments": [{"id": "1", "name": "Engineering"}]
        })),
        &[("x-base", "base-val"), ("x-run", "run-val")],
    )
    .await;

    let buf = SharedBuf::new();
    let transport =
        build_transport_with_headers("test-token", &[("X-Base", "base-val")], &server.uri());
    let client = build_client_with_transport(transport);

    let mut extra = reqwest::header::HeaderMap::new();
    extra.insert(
        reqwest::header::HeaderName::from_static("x-run"),
        reqwest::header::HeaderValue::from_static("run-val"),
    );

    let result = client
        .run(hr_dept_list_argv(&[]))
        .output(wecom::CliRunOutput::new(buf.clone()))
        .headers(&extra)
        .await;
    assert_cli_ok(&result, &buf, "builder + run headers");
}
