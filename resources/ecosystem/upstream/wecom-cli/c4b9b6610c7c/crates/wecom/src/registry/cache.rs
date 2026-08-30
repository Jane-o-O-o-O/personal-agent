use std::path::Path;
use std::time::SystemTime;

use serde::Serialize;
use serde::de::DeserializeOwned;
use tracing::field::Empty;

use super::CACHE_TTL;
use crate::client::{Client, EndpointKey};
use crate::{Error, Result, fs};

#[tracing::instrument(
    name = "discovery",
    skip_all,
    fields(service_name = service_name.unwrap_or("<catalog>"), cache.hit = Empty),
)]
pub(super) async fn fetch_with_cache<T: Serialize + DeserializeOwned>(
    client: &Client,
    service_name: Option<&str>,
    force_reload: bool,
    options: &wecom_transport::RequestOptions,
) -> Result<T> {
    // Discovery cache lives in the CLI-private domain: paths are constructed
    // entirely from Client::cache_dir and sanitized service names, and the
    // operations go through the private-domain Fs instance.
    let fs = client.private_fs();

    let cache_file =
        client
            .cache_dir()
            .join(service_name.map_or("catalog.json".to_string(), |v| {
                format!("service_{}.json", fs::sanitize_filename(v))
            }));

    let span = tracing::Span::current();

    if !force_reload
        && let Some((cache_data, mtime)) = get_cache_content(fs.as_ref(), &cache_file).await
    {
        span.record("cache.hit", true);
        tracing::info!(
            service_name = service_name.unwrap_or("<catalog>"),
            path = %cache_file.display(),
            mtime = mtime.duration_since(std::time::UNIX_EPOCH).map(|d| d.as_secs()).unwrap_or(0),
            "using cached discovery data"
        );
        return Ok(cache_data);
    }
    span.record("cache.hit", false);

    let value = call_discovery(client, service_name, options).await?;
    tracing::info!(
        service_name = service_name.unwrap_or("<catalog>"),
        "remote discovery fetch succeeded"
    );

    // 写入缓存（直接用 Value 序列化）
    if let Ok(data) = serde_json::to_string(&value)
        && let Err(e) = fs
            .atomic_write(&cache_file, data.as_bytes(), Some(0o644))
            .await
    {
        tracing::info!(path = %cache_file.display(), error = %e, "Failed to write discovery cache");
    }

    // 从已序列化的字符串反序列化为目标类型（避免 move value）
    T::deserialize(&value)
        .map_err(|e| {
            Error::from(wecom_transport::Error::Parse {
                message: format!("Failed to deserialize discovery response: {e:#}"),
                endpoint: format!(
                    "//discovery?service_name={}",
                    service_name.unwrap_or("<catalog>")
                ),
                body: Box::new(value),
                source: Some(e),
            })
        })
        .inspect_err(|e| tracing::error!(error = %e, "deserialize discovery response failed"))
}

/// 通过 transport 调用一次 discovery 请求，并完成解包。
///
/// `options` 合并进请求（叠加在 transport 默认之上）：CliRun 场景传入
/// `run.get_options()`，程序式调用传入 `RequestOptions::default()`，
/// 使 headers / timeout / 扩展袋与业务请求一致生效。
async fn call_discovery(
    client: &Client,
    service_name: Option<&str>,
    options: &wecom_transport::RequestOptions,
) -> Result<serde_json::Value> {
    let payload = if let Some(service_name) = service_name {
        serde_json::json!({ "service": service_name })
    } else {
        serde_json::json!({})
    };
    client
        .transport()
        .invoke(
            client.resolve_builtin_endpoint(EndpointKey::ServiceDiscovery),
            &payload,
        )
        .with_options(options.clone())
        .await?
        .into_result()
        .map_err(Error::from)
}

/// Read and parse a cache file when it exists and is fresh.
///
/// The cache path is constructed from `Client::cache_dir()` and a sanitized
/// service name, and the caller passes the CLI-private Fs instance; this
/// helper must never be reused with a request-controlled path or the
/// workspace-domain instance.
async fn get_cache_content<T: DeserializeOwned>(
    fs: &dyn fs::Fs,
    cache_file: &Path,
) -> Option<(T, SystemTime)> {
    let metadata = match fs.metadata(cache_file).await {
        Ok(meta) => meta,
        Err(_) => return None, // 文件不存在或无法访问
    };

    let modified = metadata.modified?;

    if modified.elapsed().unwrap_or_default() >= CACHE_TTL {
        return None;
    }

    let data = match fs.read_to_string(cache_file).await {
        Ok(content) => content,
        Err(_) => return None, // 读取失败
    };

    let result = serde_json::from_str::<T>(&data);

    match result {
        Ok(data) => Some((data, modified)),
        Err(e) => {
            tracing::info!(path = %cache_file.display(), error = %e, "Ignoring corrupted discovery cache");
            None
        }
    }
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    //! ## 模块摘要：registry::cache（服务目录缓存）
    //!
    //! ### 关键接口
    //! - [get_cache_content] — 读取缓存文件，TTL 内返回解析后的 ServiceCatalog
    //! - [fetch_with_cache] — 带缓存的远程获取（先读缓存，未命中则请求远程）
    //!
    //! ### 关键分支与异常路径
    //! - 文件不存在 → 返回 None
    //! - JSON 损坏 → 返回 None
    //! - 文件超过 TTL（1分钟）→ 返回 None
    //! - 文件在 TTL 内且 JSON 合法 → 返回 Some(ServiceCatalog)
    //!
    //! ### 上下游交互
    //! - 上游：[ServiceRegistry::new] 调用 [fetch_with_cache] 尝试加载缓存
    //! - 下游：经 [fs::Fs] 读写缓存文件，测试中使用 `filetime` 修改文件时间戳

    use std::fs;

    use tempfile::TempDir;

    use super::*;
    use crate::registry::ServiceCatalog;

    /// 构造一个无限制的 [`wecom_fs::SandboxedFs`]。
    fn build_sandbox() -> wecom_fs::SandboxedFs {
        wecom_fs::SandboxedFs::new()
    }

    // ── get_cache_content 测试 ──

    /// P0：[get_cache_content] 缓存命中：有效 JSON 文件在 TTL 内返回数据
    /// 条件：文件存在且内容为合法 ServiceCatalog JSON
    /// 断言：get_cache_content 返回 Some，items[0].name 为 "svc"
    #[tokio::test]
    async fn cache_hit_within_ttl() {
        let tmp = TempDir::new().unwrap();
        let file = tmp.path().join("catalog.json");
        let catalog = r#"{ "items": [{ "name": "svc" }] }"#;
        fs::write(&file, catalog).unwrap();

        let sandbox = build_sandbox();

        let result: Option<(ServiceCatalog, _)> = get_cache_content(&sandbox, &file).await;
        assert!(result.is_some());
        let (catalog, mtime) = result.unwrap();
        assert_eq!(catalog.items[0].name, "svc");
        assert!(mtime.elapsed().unwrap_or_default() < CACHE_TTL);
    }

    /// P1：[get_cache_content] 缓存未命中：文件不存在时返回 None
    /// 条件：目标文件不存在于磁盘
    /// 断言：返回 None
    #[tokio::test]
    async fn cache_miss_file_not_exist() {
        let tmp = TempDir::new().unwrap();
        let file = tmp.path().join("nonexistent.json");

        let sandbox = build_sandbox();

        let result: Option<(ServiceCatalog, _)> = get_cache_content(&sandbox, &file).await;
        assert!(result.is_none());
    }

    /// P1：[get_cache_content] 缓存未命中：JSON 内容损坏时返回 None
    /// 条件：文件存在但内容为非法 JSON 字符串
    /// 断言：返回 None
    #[tokio::test]
    async fn cache_miss_corrupted_json() {
        let tmp = TempDir::new().unwrap();
        let file = tmp.path().join("bad.json");
        fs::write(&file, "not valid json!!!").unwrap();

        let sandbox = build_sandbox();

        let result: Option<(ServiceCatalog, _)> = get_cache_content(&sandbox, &file).await;
        assert!(result.is_none());
    }

    /// P1：[get_cache_content] 缓存文件修改时间超过 TTL（1分钟）时返回未命中
    /// 条件：有效 JSON 文件的 mtime 被设为 2 分钟前
    /// 断言：返回 None
    #[tokio::test]
    async fn cache_miss_expired() {
        use std::time::{Duration, SystemTime};

        let tmp = TempDir::new().unwrap();
        let file = tmp.path().join("old.json");
        fs::write(&file, r#"{ "items": [] }"#).unwrap();

        // 将文件修改时间设为 2 分钟前
        let two_minutes_ago = SystemTime::now() - Duration::from_secs(120);
        filetime::set_file_mtime(&file, filetime::FileTime::from_system_time(two_minutes_ago))
            .unwrap();

        let sandbox = build_sandbox();

        let result: Option<(ServiceCatalog, _)> = get_cache_content(&sandbox, &file).await;
        assert!(result.is_none());
    }

    // ── call_discovery 扩展袋种子化 ──

    /// 测试夹具：扩展袋值。
    #[derive(Debug, PartialEq)]
    struct DiscoveryExt(u32);

    /// 测试夹具：记录每次 execute 收到的 RequestOptions 的捕获型后端。
    #[derive(Debug)]
    struct CaptureBackend {
        captured: std::sync::Arc<std::sync::Mutex<Vec<wecom_transport::RequestOptions>>>,
    }

    impl wecom_transport::TransportBackend for CaptureBackend {
        fn execute<'a>(
            &'a self,
            _endpoint: std::borrow::Cow<'a, wecom_transport::Endpoint>,
            _payload: wecom_transport::HttpRequestPayload,
            options: wecom_transport::RequestOptions,
        ) -> std::pin::Pin<
            Box<
                dyn std::future::Future<
                        Output = std::result::Result<
                            wecom_transport::TransportResponse,
                            wecom_transport::Error,
                        >,
                    > + Send
                    + 'a,
            >,
        > {
            self.captured.lock().unwrap().push(options);
            Box::pin(async {
                Ok(wecom_transport::TransportResponse::Json(
                    wecom_transport::ExecuteOutput {
                        result: serde_json::json!({ "items": [] }),
                        extra: indexmap::IndexMap::new(),
                    },
                ))
            })
        }
    }

    /// P0：[call_discovery] 完整 RequestOptions 合并进 discovery 请求
    /// 条件：捕获型后端；options 含 header / timeout / DiscoveryExt(7)，
    ///       直接调用 call_discovery(&client, None, &options)
    /// 断言：后端 execute 收到的 options 三个字段全部到达
    #[tokio::test]
    async fn call_discovery_carries_full_request_options() {
        let tmp = TempDir::new().unwrap();
        let captured = std::sync::Arc::new(std::sync::Mutex::new(vec![]));
        let backend = CaptureBackend {
            captured: captured.clone(),
        };
        let client = Client::builder()
            .config_dir(tmp.path())
            .transport(
                wecom_transport::TransportBuilder::new(backend)
                    .build()
                    .unwrap(),
            )
            .build()
            .unwrap();
        let mut options = wecom_transport::RequestOptions::default();
        options.wire.headers.insert(
            "x-run-scope",
            reqwest::header::HeaderValue::from_static("run-1"),
        );
        options.wire.timeout = Some(std::time::Duration::from_secs(9));
        options.extensions.insert(DiscoveryExt(7));
        let value = call_discovery(&client, None, &options).await.unwrap();
        assert_eq!(value, serde_json::json!({ "items": [] }));
        let captured = captured.lock().unwrap();
        assert_eq!(captured.len(), 1, "expect exactly one discovery request");
        let got = &captured[0];
        assert_eq!(
            got.wire.headers.get("x-run-scope").unwrap(),
            "run-1",
            "header 应到达"
        );
        assert_eq!(
            got.wire.timeout,
            Some(std::time::Duration::from_secs(9)),
            "timeout 应到达"
        );
        assert_eq!(
            got.extensions.get::<DiscoveryExt>(),
            Some(&DiscoveryExt(7)),
            "扩展袋应到达"
        );
    }

    /// P0：[fetch_with_cache] 缓存读写只经 private_fs，与 workspace_fs 无关
    /// 条件：workspace_fs 注入全拒绝的 ErrFs；private_fs 为真实沙箱；捕获型后端
    /// 断言：fetch_with_cache 成功返回；缓存文件真实写入 config_dir/cache
    #[tokio::test]
    async fn fetch_with_cache_uses_private_fs_only() {
        let tmp = TempDir::new().unwrap();
        let captured = std::sync::Arc::new(std::sync::Mutex::new(vec![]));
        let backend = CaptureBackend {
            captured: captured.clone(),
        };
        let client = Client::builder()
            .config_dir(tmp.path())
            .private_fs(std::sync::Arc::new(wecom_fs::SandboxedFs::new()))
            .workspace_fs(std::sync::Arc::new(crate::fs::testing::ErrFs))
            .transport(
                wecom_transport::TransportBuilder::new(backend)
                    .build()
                    .unwrap(),
            )
            .build()
            .unwrap();
        let options = wecom_transport::RequestOptions::default();
        let catalog = fetch_with_cache::<ServiceCatalog>(&client, None, false, &options)
            .await
            .unwrap();
        assert!(catalog.items.is_empty());
        assert!(
            tmp.path().join("cache/catalog.json").exists(),
            "discovery cache must be written through private_fs"
        );
    }

    /// P0：[fetch_with_cache] 缓存未命中时把 options 透传进 discovery 请求
    /// 条件：捕获型后端 + 空缓存目录；options 含 DiscoveryExt(8)，调用
    ///       fetch_with_cache::<ServiceCatalog>(&client, None, false, &options)
    /// 断言：后端 execute 收到的 options.extensions 含 DiscoveryExt(8)
    #[tokio::test]
    async fn fetch_with_cache_threads_options_into_discovery() {
        let tmp = TempDir::new().unwrap();
        let captured = std::sync::Arc::new(std::sync::Mutex::new(vec![]));
        let backend = CaptureBackend {
            captured: captured.clone(),
        };
        let client = Client::builder()
            .config_dir(tmp.path())
            .transport(
                wecom_transport::TransportBuilder::new(backend)
                    .build()
                    .unwrap(),
            )
            .build()
            .unwrap();
        let mut options = wecom_transport::RequestOptions::default();
        options.extensions.insert(DiscoveryExt(8));
        let catalog = fetch_with_cache::<ServiceCatalog>(&client, None, false, &options)
            .await
            .unwrap();
        assert!(catalog.items.is_empty());
        let captured = captured.lock().unwrap();
        assert_eq!(captured.len(), 1, "expect exactly one discovery request");
        assert_eq!(
            captured[0].extensions.get::<DiscoveryExt>(),
            Some(&DiscoveryExt(8))
        );
    }
}
