use std::collections::HashSet;

use indexmap::IndexMap;
use wecom_transport::EndpointHttpExt;

use super::types::{MultipartPart, RequestInfo};
use crate::client::{Client, EndpointKey};
use crate::{Result, directive, json_path};

/// Build the list of requests that would be sent, without actually sending them.
///
/// Returns one `RequestInfo` per media upload + one for the main request.
pub(super) fn build_request_infos(
    client: &Client,
    http_method: &reqwest::Method,
    url: &str,
    payload: &mut serde_json::Value,
    directives: &[directive::Directive],
    multipart: bool,
) -> Result<Vec<RequestInfo>> {
    let headers = build_masked_headers(client)?;

    let mut media_files = vec![];
    let mut multipart_files = HashSet::new();

    for directive in directives {
        match directive {
            directive::Directive::UploadMedia {
                path,
                file_path,
                with_file_path,
            } => {
                let file_str = file_path.as_path().to_string_lossy().into_owned();
                let value = if *with_file_path {
                    serde_json::json!({
                        "media_id": format!("[media_id:{file_str}]"),
                        "file_path": file_str,
                    })
                } else {
                    serde_json::Value::String(format!("[media_id:{file_str}]"))
                };
                json_path::set_value_deep(payload, path, value);
                media_files.push(file_str);
            }
            directive::Directive::UploadMultipart { path, .. } => {
                multipart_files.insert(json_path::segments_to_path(path));
            }
            _ => {}
        }
    }

    let mut infos = Vec::new();

    // Media upload requests
    let media_upload_endpoint = client.resolve_builtin_endpoint(EndpointKey::MediaUpload);
    for file in &media_files {
        infos.push(RequestInfo {
            method: "POST".to_string(),
            url: media_upload_endpoint.full_url(),
            headers: headers.clone(),
            payload: None,
            multipart: Some(vec![
                MultipartPart::File {
                    name: "media".to_string(),
                    file: file.to_string(),
                },
                MultipartPart::Text {
                    name: "type".to_string(),
                    value: "file".to_string(),
                },
            ]),
        });
    }

    // Main request
    if !multipart {
        infos.push(RequestInfo {
            method: http_method.as_str().to_string(),
            url: url.to_string(),
            headers,
            payload: Some(payload.clone()),
            multipart: None,
        });
    } else {
        let mut parts = vec![];
        for (name, value) in &json_path::flatten_value(payload) {
            if multipart_files.contains(name.as_str()) {
                parts.push(MultipartPart::File {
                    name: name.clone(),
                    file: value.clone(),
                });
            } else {
                parts.push(MultipartPart::Text {
                    name: name.clone(),
                    value: value.clone(),
                });
            }
        }
        infos.push(RequestInfo {
            method: http_method.as_str().to_string(),
            url: url.to_string(),
            headers,
            payload: None,
            multipart: Some(parts),
        });
    }

    Ok(infos)
}

/// Build request headers with sensitive values masked.
fn build_masked_headers(client: &Client) -> Result<IndexMap<String, String>> {
    let mut headers = IndexMap::new();
    for (name, value) in client.transport().headers() {
        let value = if value.is_sensitive() {
            "<sensitive_value>".to_string()
        } else {
            value.to_str().unwrap_or_default().to_string()
        };
        headers.insert(name.to_string(), value);
    }
    Ok(headers)
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：preview（请求预览与构建）
    //!
    //! ### 关键接口
    //! - [build_request_infos] — 根据指令列表构建请求信息列表
    //!
    //! ### 关键分支与异常路径
    //! - 无指令非 multipart → 返回单个请求
    //! - 无指令 multipart → payload 展平为 Text 字段
    //! - UploadMedia 指令 → 添加媒体上传请求并替换 payload 中的路径
    //! - UploadMultipart 指令 → 将字段标记为 File 类型
    //! - Save 指令 → 被忽略
    //!
    //! ### 上下游交互
    //! - 上游：[MethodHandle::preview] 调用本模块
    //! - 下游：依赖 [directive::Directive] 解析指令

    use super::*;

    /// Build an isolated [Client] for unit tests.
    fn build_isolated_client() -> Client {
        let tmp = tempfile::tempdir().unwrap();
        let dir = tmp.path().to_path_buf();
        std::mem::forget(tmp);
        Client::builder().config_dir(&dir).build().unwrap()
    }

    static TEST_CLIENT: std::sync::LazyLock<Client> =
        std::sync::LazyLock::new(build_isolated_client);

    /// Helper: get a shared client reference for testing.
    fn test_client() -> &'static Client {
        &TEST_CLIENT
    }

    /// P0：[build_request_infos] 无指令非 multipart 模式返回单个请求
    /// 条件：directives 为空，multipart 为 false
    /// 断言：返回 1 个 RequestInfo，包含 payload，无 multipart
    #[test]
    fn no_directives_non_multipart_returns_single_request() {
        let client = test_client();
        let method = reqwest::Method::GET;
        let mut payload = serde_json::json!({"key": "value"});
        let dirs: Vec<directive::Directive> = vec![];

        let infos = build_request_infos(
            client,
            &method,
            "https://api.test/foo",
            &mut payload,
            &dirs,
            false,
        )
        .unwrap();

        assert_eq!(infos.len(), 1);
        assert_eq!(infos[0].method, "GET");
        assert_eq!(infos[0].url, "https://api.test/foo");
        assert!(infos[0].payload.is_some());
        assert_json_diff::assert_json_eq!(
            infos[0].payload.clone().unwrap()["key"],
            serde_json::json!("value")
        );
        assert!(infos[0].multipart.is_none());
    }

    /// P0：[build_request_infos] 无指令 multipart 模式将 payload 展平为文本字段
    /// 条件：directives 为空，multipart 为 true
    /// 断言：返回 1 个 RequestInfo，所有部分均为 Text 类型
    #[test]
    fn no_directives_multipart_returns_flattened_parts() {
        let client = test_client();
        let method = reqwest::Method::POST;
        let mut payload = serde_json::json!({"field1": "val1", "field2": "val2"});
        let dirs: Vec<directive::Directive> = vec![];

        let infos = build_request_infos(
            client,
            &method,
            "https://api.test/bar",
            &mut payload,
            &dirs,
            true,
        )
        .unwrap();

        assert_eq!(infos.len(), 1);
        assert_eq!(infos[0].method, "POST");
        let parts = infos[0].multipart.clone().unwrap();
        assert_eq!(parts.len(), 2);
        // All fields should be Text parts (no UploadMultipart directives)
        assert!(
            parts
                .iter()
                .all(|p| matches!(p, MultipartPart::Text { .. }))
        );
    }

    /// P0：[build_request_infos] UploadMedia 指令添加媒体上传请求并替换 payload 中的路径
    /// 条件：包含一个 UploadMedia 指令，非 multipart 模式
    /// 断言：返回 2 个请求（媒体上传 + 主请求），主请求中 media_id 被替换为占位符
    #[test]
    fn upload_media_directive_adds_media_request_and_replaces_payload() {
        let client = test_client();
        let method = reqwest::Method::POST;
        let mut payload = serde_json::json!({"media_id": "/tmp/photo.jpg", "other": "data"});
        let dirs = vec![directive::Directive::UploadMedia {
            path: vec![crate::json_path::PathSegment::Key("media_id".into())],
            file_path: std::path::PathBuf::from("/tmp/photo.jpg"),
            with_file_path: false,
        }];

        let infos = build_request_infos(
            client,
            &method,
            "https://api.test/send",
            &mut payload,
            &dirs,
            false,
        )
        .unwrap();

        // Should have 2 requests: media upload + main
        assert_eq!(infos.len(), 2);
        // First is the media upload
        assert_eq!(infos[0].method, "POST");
        assert!(infos[0].multipart.is_some());
        // Second is main request with replaced media_id
        assert_eq!(infos[1].url, "https://api.test/send");
        let main_payload = infos[1].payload.clone().unwrap();
        assert_json_diff::assert_json_eq!(
            main_payload["media_id"],
            serde_json::json!("[media_id:/tmp/photo.jpg]")
        );
        assert_json_diff::assert_json_eq!(main_payload["other"], serde_json::json!("data"));
    }

    /// P0：[build_request_infos] UploadMultipart 指令在 multipart 模式下将字段标记为文件
    /// 条件：包含一个 UploadMultipart 指令，multipart 为 true
    /// 断言：返回 1 个请求，file 字段为 File 类型，name 字段为 Text 类型
    #[test]
    fn upload_multipart_directive_marks_field_as_file_in_multipart_mode() {
        let client = test_client();
        let method = reqwest::Method::POST;
        let mut payload = serde_json::json!({"file": "/tmp/doc.pdf", "name": "doc"});
        let dirs = vec![directive::Directive::UploadMultipart {
            path: vec![crate::json_path::PathSegment::Key("file".into())],
            file_path: std::path::PathBuf::from("/tmp/doc.pdf"),
        }];

        let infos = build_request_infos(
            client,
            &method,
            "https://api.test/upload",
            &mut payload,
            &dirs,
            true,
        )
        .unwrap();

        assert_eq!(infos.len(), 1);
        let parts = infos[0].multipart.clone().unwrap();
        // "file" should be a File part, "name" should be Text
        let file_part = parts
            .iter()
            .find(|p| matches!(p, MultipartPart::File { name, .. } if name == "file"));
        let text_part = parts
            .iter()
            .find(|p| matches!(p, MultipartPart::Text { name, .. } if name == "name"));
        assert!(file_part.is_some(), "file should be a File part");
        assert!(text_part.is_some(), "name should be a Text part");
    }

    /// P1：[build_request_infos] 混合指令（UploadMedia + UploadMultipart）在两种模式下产生正确请求数
    /// 条件：同时包含 UploadMedia 和 UploadMultipart 指令
    /// 断言：非 multipart 和 multipart 模式均返回 2 个请求
    #[test]
    fn mixed_directives_produce_multiple_requests() {
        let client = test_client();
        let method = reqwest::Method::POST;
        let mut payload = serde_json::json!({
            "image": "/tmp/a.jpg",
            "file": "/tmp/b.pdf",
            "title": "test"
        });
        let dirs = vec![
            directive::Directive::UploadMedia {
                path: vec![crate::json_path::PathSegment::Key("image".into())],
                file_path: std::path::PathBuf::from("/tmp/a.jpg"),
                with_file_path: false,
            },
            directive::Directive::UploadMultipart {
                path: vec![crate::json_path::PathSegment::Key("file".into())],
                file_path: std::path::PathBuf::from("/tmp/b.pdf"),
            },
        ];

        // Non-multipart mode: 1 media upload + 1 main = 2 requests
        let infos = build_request_infos(
            client,
            &method,
            "https://api.test/mixed",
            &mut payload,
            &dirs,
            false,
        )
        .unwrap();
        assert_eq!(infos.len(), 2);

        // Multipart mode: 1 media upload + 1 main (multipart) = 2 requests
        let mut payload2 = serde_json::json!({
            "image": "/tmp/a.jpg",
            "file": "/tmp/b.pdf",
            "title": "test"
        });
        let infos2 = build_request_infos(
            client,
            &method,
            "https://api.test/mixed",
            &mut payload2,
            &dirs,
            true,
        )
        .unwrap();
        assert_eq!(infos2.len(), 2);
    }

    /// P1：[build_request_infos] 空指令和空 payload 返回单个空请求
    /// 条件：directives 为空，payload 为 {}，HTTP 方法为 DELETE
    /// 断言：返回 1 个请求，方法为 DELETE，payload 存在
    #[test]
    fn empty_directives_and_empty_payload_returns_single_empty_request() {
        let client = test_client();
        let method = reqwest::Method::DELETE;
        let mut payload = serde_json::json!({});
        let dirs: Vec<directive::Directive> = vec![];

        let infos = build_request_infos(
            client,
            &method,
            "https://api.test/res/1",
            &mut payload,
            &dirs,
            false,
        )
        .unwrap();

        assert_eq!(infos.len(), 1);
        assert_eq!(infos[0].method, "DELETE");
        assert!(infos[0].payload.is_some());
    }

    /// P1：[build_request_infos] Save 指令被忽略
    /// 条件：指令中仅含 Save 类型指令
    /// 断言：仅返回 1 个主请求，无额外媒体上传，payload 不变
    #[test]
    fn save_directive_is_ignored_by_build_request_infos() {
        let client = test_client();
        let method = reqwest::Method::POST;
        let mut payload = serde_json::json!({"data": "content", "other": "value"});

        let save_options = crate::schema::FileSaveOptions {
            file_name: Some("output.csv".to_string()),
            content_encoding: None,
        };
        let dirs = vec![directive::Directive::Save {
            path: vec![crate::json_path::PathSegment::Key("data".into())],
            options: &save_options,
        }];

        let infos = build_request_infos(
            client,
            &method,
            "https://api.test/save",
            &mut payload,
            &dirs,
            false,
        )
        .unwrap();

        // Save directive should be ignored → only 1 main request, no media uploads
        assert_eq!(infos.len(), 1);
        assert_eq!(infos[0].method, "POST");
        assert!(infos[0].multipart.is_none());
        // Payload should remain unchanged
        assert_json_diff::assert_json_eq!(
            infos[0].payload.clone().unwrap()["data"],
            serde_json::json!("content")
        );
    }
}
