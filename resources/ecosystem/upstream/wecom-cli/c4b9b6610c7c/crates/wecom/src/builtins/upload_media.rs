use std::path::PathBuf;

use serde::Deserialize;
use wecom_transport::{HttpRequestPayload, RequestOptions};

use crate::client::EndpointKey;
use crate::{Client, Error, Result, fs};

/// Response from a media upload request.
#[derive(Debug, Deserialize)]
pub struct UploadMediaResponse {
    /// The media ID returned by the server.
    pub media_id: String,
    /// Extra fields returned by the server, captured for forward-compatibility.
    #[serde(flatten)]
    pub extra: indexmap::IndexMap<String, serde_json::Value>,
}

/// `fs` is taken as `&Arc` (not `&dyn Fs`) because the multipart form
/// factory closure requires a `'static` clone.
#[tracing::instrument(level = "info", name = "media.upload", skip_all)]
pub(crate) async fn upload_media(
    client: &Client,
    fs: &std::sync::Arc<dyn fs::Fs>,
    file_path: PathBuf,
    options: &RequestOptions,
) -> Result<UploadMediaResponse> {
    tracing::info!(file_path = %file_path.display(), "upload_media begin");

    // multipart 经工厂包装（延迟物化）：每次发送/重放时重新打开文件构建独立表单。
    let fs = std::sync::Arc::clone(fs);
    let form = HttpRequestPayload::form(move || {
        let fs = std::sync::Arc::clone(&fs);
        let file_path = file_path.clone();
        async move {
            let part = fs::open_as_multipart_part(fs.as_ref(), &file_path)
                .await
                .map_err(crate::util::to_transport_error)?;
            Ok(reqwest::multipart::Form::new()
                .part("media", part)
                .text("type", "file"))
        }
    });

    let response = client
        .transport()
        .invoke(
            client.resolve_builtin_endpoint(EndpointKey::MediaUpload),
            form,
        )
        .with_options(options.clone())
        .await?
        .into_result()
        .map_err(Error::from)
        .inspect_err(|e| tracing::warn!(error = %e, "upload_media failed"))?;

    let response = UploadMediaResponse::deserialize(&response)
        .map_err(|e| {
            Error::Wrapped(Box::new(wecom_transport::Error::Parse {
                message: format!("Failed to deserialize 'upload_media' response: {e:#}"),
                endpoint: "utils://upload_media".into(),
                body: Box::new(response),
                source: Some(e),
            }))
        })
        .inspect_err(|e| tracing::warn!(error = %e, "deserialize upload_media response failed"))?;

    tracing::info!(media_id = %response.media_id, "upload_media succeeded");
    Ok(response)
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    //! ## 模块摘要：upload_media（媒体上传 HTTP 路径单元测试）
    //!
    //! ### 关键接口
    //! - [upload_media] — HTTP multipart 上传入口
    //! - [UploadMediaResponse] — 上传结果，含 media_id / extra
    //!
    //! ### 关键分支与异常路径
    //! - HTTP 成功 → result 包含 media_id
    //! - 缺 media_id → UploadMediaResponse 反序列化失败，返回 Parse 错误
    //!
    //! ### 上下游交互
    //! - 上游：client.upload_media() 公共 API
    //! - 下游：Client（transport 分发）、Fs（文件读取）

    use std::io::Write;

    use wecom_transport::RequestOptions;
    use wiremock::matchers::{method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    use super::*;
    use crate::Client;

    fn make_http_test_client(base_url: &str, tmp: &std::path::Path) -> Client {
        let home = tempfile::TempDir::new().unwrap();
        let transport = wecom_transport::HttpTransportBackend::builder()
            .base_url(base_url)
            .header_sensitive("Authorization", "Bearer test-token", true)
            .build()
            .unwrap();
        Client::builder()
            .config_dir(home.path())
            .workspace_fs(std::sync::Arc::new(wecom_fs::SandboxedFs::confined_to(&[
                tmp,
            ])))
            .transport(transport)
            .build()
            .unwrap()
    }

    /// P0：[HttpRequestPayload] 同一 multipart 工厂经真实发送链连发两次，body 各自完整且 boundary 独立
    /// 条件：HttpRequestPayload::form 读取临时文件；raw post 连发两次到 mock（两次均捕获请求体）
    /// 断言：两次请求体均含完整文件内容；两次首行 boundary 不同（各自重建而非复用已消费表单）
    #[tokio::test]
    async fn multipart_factory_double_send_produces_complete_bodies() {
        let server = MockServer::start().await;
        let tmp = tempfile::tempdir().unwrap();
        let test_file = tmp.path().join("photo.jpg");
        std::fs::write(&test_file, b"fake-jpeg-bytes").unwrap();
        let file_path_str = test_file.to_string_lossy().to_string();

        let bodies = std::sync::Arc::new(std::sync::Mutex::new(Vec::<Vec<u8>>::new()));
        let bodies_sink = bodies.clone();
        Mock::given(method("POST"))
            .and(path("/file/upload"))
            .respond_with(move |req: &wiremock::Request| {
                bodies_sink.lock().unwrap().push(req.body.clone());
                ResponseTemplate::new(200)
                    .set_body_json(serde_json::json!({"result": "{\"media_id\":\"M\"}"}))
            })
            .expect(2)
            .mount(&server)
            .await;

        let fs = wecom_fs::SandboxedFs::new();
        let factory = wecom_transport::HttpRequestPayload::form(move || {
            let fs = fs.clone();
            let file_path = std::path::PathBuf::from(file_path_str.clone());
            async move {
                let part = fs::open_as_multipart_part(&fs, &file_path)
                    .await
                    .map_err(crate::util::to_transport_error)?;
                Ok(reqwest::multipart::Form::new()
                    .part("media", part)
                    .text("type", "file"))
            }
        });

        let backend = wecom_transport::HttpTransportBackend::default();
        let endpoint = wecom_transport::Endpoint::new()
            .with(wecom_transport::HttpEndpoint::new("/file/upload").with_base_url(server.uri()));
        backend.post(&endpoint, factory.clone()).await.unwrap();
        backend.post(&endpoint, factory).await.unwrap();

        let bodies = bodies.lock().unwrap();
        assert_eq!(bodies.len(), 2, "expected exactly two sends");
        let boundary_of = |body: &[u8]| {
            String::from_utf8_lossy(body)
                .lines()
                .next()
                .expect("multipart body has boundary line")
                .to_owned()
        };
        for (i, body) in bodies.iter().enumerate() {
            let text = String::from_utf8_lossy(body);
            assert!(
                text.contains("fake-jpeg-bytes"),
                "send #{i} body incomplete: {text}"
            );
        }
        assert_ne!(
            boundary_of(&bodies[0]),
            boundary_of(&bodies[1]),
            "each send must materialize an independent form (distinct boundaries)"
        );
    }

    /// P0：[upload_media] HTTP 路径成功上传
    /// 条件：wiremock mock /file/upload 端点，返回 media_id
    /// 断言：result.media_id == "HTTP_MEDIA_001"
    #[tokio::test]
    async fn upload_media_http_success() {
        let server = MockServer::start().await;
        let tmp = tempfile::tempdir().unwrap();
        let test_file = tmp.path().join("photo.jpg");
        let mut f = std::fs::File::create(&test_file).unwrap();
        f.write_all(b"fake-jpeg-bytes").unwrap();
        f.flush().unwrap();
        drop(f);
        let file_path_str = test_file.to_string_lossy().to_string();

        Mock::given(method("POST"))
            .and(path("/file/upload"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "result": r#"{"media_id":"HTTP_MEDIA_001"}"#,
            })))
            .expect(1)
            .mount(&server)
            .await;

        let client = make_http_test_client(&server.uri(), tmp.path());
        let fs = client.workspace_fs().clone();
        let result = upload_media(
            &client,
            &fs,
            std::path::PathBuf::from(&file_path_str),
            &RequestOptions::default(),
        )
        .await
        .expect("upload_media HTTP should succeed");

        assert_eq!(result.media_id, "HTTP_MEDIA_001");
    }
}
