/// Service "exportsvc" → resource "report" → method "get"
/// - response schema has `data` (string, x-wecom-file-save, contentEncoding: base64)
/// - 不在 schema 固定 fileName：由响应 Object 的 `file_name` 驱动（外部输入路径）。
fn file_save_service_body(service_base_url: &str) -> serde_json::Value {
    api_response(&json!({
        "description": "Export service with file-save directive",
        "base_url": service_base_url,
        "schemas": {
            "ReportGetReq": { "type": "object" },
            "ReportGetRes": {
                "type": "object",
                "properties": {
                    "data": {
                        "type": "string",
                        "x-wecom-file-save": { "contentEncoding": "base64" }
                    }
                }
            }
        },
        "methods": {},
        "resources": {
            "report": {
                "methods": {
                    "get": {
                        "path": "/report/get",
                        "http_method": "POST",
                        "request": { "$ref": "ReportGetReq" },
                        "response": { "$ref": "ReportGetRes" }
                    }
                },
                "resources": {}
            }
        }
    }))
}

fn file_save_catalog_body() -> serde_json::Value {
    api_response(&json!({
        "items": [
            { "name": "exportsvc", "description": "Export service" }
        ]
    }))
}

// file_save 指令的服务端文件名攻击面：响应 Object 的 `file_name` 是外部输入，
// 必须经 sanitize_filename 单段化后落盘。恶意名 `../../evil.csv` → 净化为
// `.._.._evil.csv`。
#[tokio::test]
async fn run() {
    use wiremock::matchers::{body_json, method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    let server = MockServer::start().await;

    Mock::given(method("POST"))
        .and(path("/service/discovery"))
        .and(body_json(json!({})))
        .respond_with(ResponseTemplate::new(200).set_body_json(file_save_catalog_body()))
        .mount(&server)
        .await;
    Mock::given(method("POST"))
        .and(path("/service/discovery"))
        .and(body_json(json!({"service": "exportsvc"})))
        .respond_with(
            ResponseTemplate::new(200).set_body_json(file_save_service_body(&server.uri())),
        )
        .mount(&server)
        .await;

    // 恶意载荷先挂载且仅响应 1 次（wiremock 按挂载顺序优先匹配），
    // 耗尽其额度后，后续调用落到后挂载的正常载荷。
    Mock::given(method("POST"))
        .and(path("/report/get"))
        .respond_with(
            ResponseTemplate::new(200).set_body_json(api_response(&json!({
                "data": { "file_name": "../../evil.csv", "content": "aGVsbG8=" }
            }))),
        )
        .up_to_n_times(1)
        .mount(&server)
        .await;
    Mock::given(method("POST"))
        .and(path("/report/get"))
        .respond_with(
            ResponseTemplate::new(200).set_body_json(api_response(&json!({
                "data": { "file_name": "report.csv", "content": "aGVsbG8=" }
            }))),
        )
        .mount(&server)
        .await;

    let run_once = || async {
        let tmp = tempfile::tempdir().unwrap();
        let out_dir = tmp.path().join("out");
        let buf = SharedBuf::new();
        let client = wecom::Client::builder()
            .config_dir(tmp.path())
            .transport(build_test_http_transport("test-token", &server.uri()))
            .private_fs(std::sync::Arc::new(wecom_fs::SandboxedFs::new()))
            .workspace_fs(std::sync::Arc::new(
                wecom_fs::SandboxedFs::new()
                    .with_write_policy(wecom_fs::Policy::new().with_allowed_dirs(&[tmp.path()])),
            ))
            .build()
            .unwrap();
        let result = client
            .run(vec![
                "wecom".into(),
                "exportsvc".into(),
                "report".into(),
                "get".into(),
                "--output-dir".into(),
                out_dir.to_string_lossy().into_owned(),
            ])
            .output(wecom::CliRunOutput::new(buf.clone()))
            .await;
        (result, buf, tmp, out_dir)
    };

    // ① 恶意 file_name：净化为单段后落盘在 output-dir 内，目录外无文件
    // （out 内仅 1 个文件：--output-dir 只约束下载产物，方法响应 JSON 仍走 stdout，
    //  其中 data 已被替换为提取件路径）
    let (result, buf, tmp, out_dir) = run_once().await;
    assert_cli_ok(&result, &buf, "file-save malicious name");
    assert_dir_file_count(&out_dir, 1);
    let content = assert_file_exists(&out_dir.join(".._.._evil.csv"));
    assert_eq!(content, "hello");
    // e2e 断言层直探文件系统（验证逃逸文件未产生），合法绕过 disallowed_methods。
    #[allow(clippy::disallowed_methods)]
    {
        assert!(
            !tmp.path().join("evil.csv").exists(),
            "escape produced outside output-dir"
        );
    }
    let response = assert_stdout_json(&buf);
    let data_path = response["data"]
        .as_str()
        .expect("data replaced with file path");
    assert!(data_path.contains(".._.._evil.csv"), "data = {data_path}");

    // ② 对照：正常 file_name 落盘成功（净化不误伤）
    let (result, buf, _tmp, out_dir) = run_once().await;
    assert_cli_ok(&result, &buf, "file-save normal name");
    let content = assert_file_exists(&out_dir.join("report.csv"));
    assert_eq!(content, "hello");
}
