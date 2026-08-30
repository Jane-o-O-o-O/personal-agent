use std::path::{Path, PathBuf};

use serde::Serialize;
use tokio::io::AsyncWriteExt;

use crate::{Error, Result, fs, schema};

// ── DownloadResult ──────────────────────────────────────────

// `DownloadResult` is the single source of truth: the serialized payload
// ([`to_json`]), the `--schema` JSON Schema ([`json_schema`]) and the `--doc`
// TypeScript declaration ([`ts_doc`]) are all derived from it via `schemars`,
// so there is nothing to keep in sync by hand. The doc-comment below is the
// user-visible description, so keep it Chinese and free of dev-facing notes.
/// 文件下载结果。
#[derive(Serialize, schemars::JsonSchema)]
pub(crate) struct DownloadResult {
    /// 文件保存的绝对路径
    pub file_path: PathBuf,
    /// 文件大小（字节）
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub size: Option<u64>,
    /// 下载文件的 MIME 类型，例如 `image/png`
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub content_type: Option<String>,
}

impl DownloadResult {
    /// TypeScript interface name for the built-in download result.
    const TS_NAME: &'static str = "WeComCliDownloadRes";

    /// Serialize a download result for a path and a pre-fetched size.
    ///
    /// `size` is fetched by the caller from the just-written file handle
    /// (fd-level metadata, TOCTOU-safe relative to the written file); a
    /// failed fetch yields `None`.
    pub fn to_json(file_path: &Path, size: Option<u64>, content_type: &str) -> serde_json::Value {
        let value = Self {
            file_path: file_path.to_path_buf(),
            size,
            content_type: Some(content_type.to_owned()),
        };
        serde_json::to_value(value).expect("DownloadResult serialization should never fail")
    }

    /// TypeScript interface declaration for [`DownloadResult`], used by `--doc` output.
    ///
    /// Generated from the Rust struct via `schemars`, so the shape and field
    /// docs stay in sync with [`json_schema`](Self::json_schema) automatically.
    pub(super) fn ts_doc() -> String {
        let (decl, _deps) = schema::schema_to_ts(Self::TS_NAME, &schema::schema_for_type::<Self>());
        decl
    }

    /// JSON Schema for [`DownloadResult`], used by `--schema` output.
    ///
    /// Derived from the Rust struct via `schemars` rather than hand-written.
    pub(super) fn json_schema() -> serde_json::Value {
        serde_json::to_value(schema::schema_for_type::<Self>()).unwrap_or_default()
    }
}

/// Pre-reserved output destination.
///
/// The file is created exclusively (`create_new`) with restrictive permissions
/// (`0o600` on Unix) so that no window exists between the existence check and
/// creation (TOCTOU-safe).  The caller later writes into `file` and the path
/// is reported back to the user.
pub(super) struct OutputFileInfo {
    path: PathBuf,
    file: fs::FileWriter,
}

impl OutputFileInfo {
    /// Append a single line (with trailing newline) to the output file.
    ///
    /// Used by the paginate loop to write each page as one NDJSON line.
    pub(super) async fn write_line(&mut self, line: &str) -> Result<()> {
        for chunk in [line.as_bytes(), b"\n".as_slice()] {
            self.file
                .write_all(chunk)
                .await
                .map_err(|e| Error::io(format!("Failed to write to {}", self.path.display()), e))
                .inspect_err(|e| tracing::error!(error = %e, "write output file failed"))?;
        }
        Ok(())
    }

    /// Return a JSON value describing the file result (for user-facing output).
    ///
    /// Flushes the underlying file first so that the reported `size` is
    /// accurate even when the handle is still open.
    pub(super) async fn result_ndjson(&mut self) -> serde_json::Value {
        // Flush to ensure all buffered data reaches the kernel.
        let _ = self.file.flush().await;
        let size = self.file.metadata().await.ok().map(|m| m.len);
        DownloadResult::to_json(&self.path, size, "application/x-ndjson")
    }
}

/// Atomically reserve (create) an output file at `path`.
///
/// The path is resolved and security-checked inside
/// [`Fs::create_file`](crate::Fs::create_file),
/// which also handles parent-directory creation, `create_new(true)` atomicity,
/// `0o600` permissions, and TOCTOU-safe fd-based path verification.
pub(super) async fn create_output_file(fs: &dyn fs::Fs, path: &Path) -> Result<OutputFileInfo> {
    let (resolved, file) = fs
        .create_file(path)
        .await
        .inspect_err(|e| tracing::error!(error = %e, "create output file failed"))?;
    Ok(OutputFileInfo {
        path: resolved,
        file,
    })
}

/// Atomically reserve (create) an output file at `path`, with unique-suffix
/// collision avoidance.
///
/// If a file at `path` already exists, a random alphanumeric suffix is inserted
/// before the extension and retried (up to 1 000 attempts).
///
/// Delegates to [`Fs::create_file_unique`](crate::Fs::create_file_unique) so
/// the result is TOCTOU-safe
/// and permissions are `0o600` on Unix.
pub(super) async fn create_output_file_unique(
    fs: &dyn fs::Fs,
    path: &Path,
) -> Result<OutputFileInfo> {
    let (resolved, file) = fs
        .create_file_unique(path)
        .await
        .inspect_err(|e| tracing::error!(error = %e, "create output file failed"))?;
    Ok(OutputFileInfo {
        path: resolved,
        file,
    })
}

/// Write string `data` to the appropriate destination and return a
/// user-facing result string.
///
/// Priority:
/// 1. `output` – write into the pre-reserved file.
/// 2. Otherwise – return `data` verbatim for stdout.
///
/// `--output-dir` deliberately has no role here: it only governs downloaded
/// files (mirroring curl's `--output-dir`, which produces no file on its
/// own). Structured JSON responses are written to disk via `--output` or
/// shell redirection.
pub(super) async fn handle_json_output(
    data: serde_json::Value,
    output_file: Option<OutputFileInfo>,
) -> Result<serde_json::Value> {
    let Some(mut output) = output_file else {
        return Ok(data);
    };
    // Write into the pre-reserved file and sync to disk.
    output
        .file
        .write_all(data.to_string().as_bytes())
        .await
        .map_err(|e| Error::io(format!("Failed to write to {}", output.path.display()), e))
        .inspect_err(|e| tracing::error!(error = %e, "write output file failed"))?;

    output
        .file
        .sync_all()
        .await
        .inspect_err(|e| tracing::error!(error = %e, "sync output file failed"))?;

    let size = output.file.metadata().await.ok().map(|m| m.len);
    Ok(DownloadResult::to_json(
        &output.path,
        size,
        "application/json",
    ))
}

/// Stream a binary `response` body to the appropriate destination and return a
/// user-facing result string.
///
/// Both paths use streaming I/O so that large files never need to be buffered
/// entirely in memory.  When the server provides a `Content-Length` header the
/// destination file is pre-allocated (`set_len`) before writing so the
/// filesystem can reserve contiguous space up-front.
///
/// Priority:
/// 1. `output` – stream into the pre-reserved file.
/// 2. `output_dir` / default output dir (the run's cwd) – stream into a temp
///    file first, then atomically rename into the target directory
///    (TOCTOU-safe, `0o600`).
pub(super) async fn handle_binary_output(
    options: &super::RunOptions<'_>,
    response: wecom_transport::HttpResponse,
    output_file: Option<OutputFileInfo>,
    method_path: &[String],
) -> Result<serde_json::Value> {
    let output = if let Some(file_info) = output_file {
        file_info
    } else {
        let target = options.output_dir();
        let fs = options.run.get_fs();
        let filename = fs::content_disposition_filename(response.headers())
            .unwrap_or_else(|| format!("{}.bin", method_path.join("_")));
        create_output_file_unique(fs.as_ref(), &target.join(fs::sanitize_filename(&filename)))
            .await?
    };

    let mut file = output.file;

    // Pre-allocate disk space when the server tells us the size
    // (prefers Content-Range total over Content-Length).  Best-effort:
    // a failed pre-allocation must not abort the download.
    if let Some(len) = response.total_length()
        && let Err(e) = file.set_len(len).await
    {
        tracing::warn!(error = %e, path = %output.path.display(), "file pre-allocation failed; continuing");
    }

    let content_type = response
        .headers()
        .get("Content-Type")
        .and_then(|s| s.to_str().ok())
        .map(str::to_owned);

    fs::stream_to_file(&mut file, &output.path, response)
        .await
        .inspect_err(|e| tracing::error!(error = %e, "stream to file failed"))?;

    // `stream_to_file` already called `sync_all`; read the size from the
    // same handle (fd-level, no second path-based lookup).
    let size = file.metadata().await.ok().map(|m| m.len);

    Ok(DownloadResult::to_json(
        &output.path,
        size,
        content_type
            .as_deref()
            .unwrap_or("application/octet-stream"),
    ))
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    //! ## 模块摘要：output（输出处理与文件管理）
    //!
    //! ### 关键接口
    //! - [create_output_file] — 原子创建输出文件（TOCTOU-safe）
    //! - [create_output_file_unique] — 带唯一后缀冲突避免的文件创建
    //! - [handle_json_output] — 按优先级写入 JSON 数据（--output 文件 > stdout）
    //! - [handle_binary_output] — 流式写入二进制响应到目标路径（--output > output_dir/默认 cwd）
    //! - [DownloadResult::to_json] — 生成下载结果 JSON
    //! - [DownloadResult::json_schema] / [DownloadResult::ts_doc] — 由 schemars 从结构体派生 schema / TS
    //!
    //! ### 关键分支与异常路径
    //! - 文件已存在 → create_output_file 返回 Err（原子创建冲突）
    //! - 空文件 → DownloadResult 的 size 为 0
    //! - 无 output_file/output_dir → handle_json_output 原样返回数据
    //! - 同名文件冲突 → create_output_file_unique 追加随机后缀
    //! - schema / TS 均由 #[derive(schemars::JsonSchema)] 派生，描述来自结构体 doc-comment
    //!
    //! ### 上下游交互
    //! - 上游：[execute::execute_and_output] 调用 handle_json_output/handle_binary_output
    //! - 下游：依赖 [Fs]（原子写入、创建文件）、tokio 异步 I/O；schema/TS 经 [crate::schema] 派生

    use std::fs;

    use assert_json_diff::assert_json_include;
    use tempfile::TempDir;

    use super::*;

    // ── DownloadResult ──

    /// P0：[DownloadResult::to_json] 对已存在文件生成正确结果
    /// 条件：打开已写入 "hello"（5 字节）的文件句柄，content_type 为 "image/png"
    /// 断言：content_type 为 "image/png"，size 为 5，file_path 包含文件名
    #[test]
    fn download_result_to_json_existing_file() {
        let tmp = TempDir::new().unwrap();
        let file_path = tmp.path().join("test.bin");
        fs::write(&file_path, b"hello").unwrap();
        let file = fs::File::open(&file_path).unwrap();

        let size = file.metadata().map(|m| m.len()).ok();
        let val = DownloadResult::to_json(&file_path, size, "image/png");
        assert_json_diff::assert_json_eq!(val["content_type"], serde_json::json!("image/png"));
        assert_json_diff::assert_json_eq!(val["size"], serde_json::json!(5));
        assert!(val["file_path"].as_str().unwrap().contains("test.bin"));
    }

    /// P1：[DownloadResult::to_json] 空文件的处理
    /// 条件：新建空文件并传入其句柄
    /// 断言：size 为 0，content_type 原样回显
    #[test]
    fn download_result_to_json_empty_file() {
        let tmp = TempDir::new().unwrap();
        let file_path = tmp.path().join("empty.bin");
        let file = fs::File::create(&file_path).unwrap();

        let size = file.metadata().map(|m| m.len()).ok();
        let val = DownloadResult::to_json(&file_path, size, "application/octet-stream");
        assert_json_diff::assert_json_eq!(
            val["content_type"],
            serde_json::json!("application/octet-stream")
        );
        assert_json_diff::assert_json_eq!(val["size"], serde_json::json!(0));
    }

    /// P1：[DownloadResult::json_schema] 由 schemars 派生，描述为中文且字段齐全
    /// 条件：调用派生生成的 json_schema（单一定义来源）
    /// 断言：type=object、中文描述、size 为 integer；仅 file_path 必填（size/content_type 为 Option）
    #[test]
    fn download_result_schema_is_chinese_and_derived() {
        let schema = DownloadResult::json_schema();
        assert_json_include!(
            actual: schema.clone(),
            expected: serde_json::json!({
                "type": "object",
                "description": "文件下载结果。",
                "properties": {
                    "content_type": { "type": "string", "description": "下载文件的 MIME 类型，例如 `image/png`" },
                    "file_path": { "type": "string", "description": "文件保存的绝对路径" },
                    "size": { "type": "integer", "description": "文件大小（字节）" }
                }
            })
        );
        let required = schema["required"].as_array().unwrap();
        assert_eq!(required.len(), 1);
        assert!(required.iter().any(|r| r == "file_path"));
        for optional in ["size", "content_type"] {
            assert!(
                !required.iter().any(|r| r == optional),
                "{optional} should be optional"
            );
        }
    }

    /// P1：[DownloadResult::ts_doc] 生成中文 JSDoc 的 TS 接口且不泄漏开发者说明
    /// 条件：调用由 schemars 派生的 ts_doc
    /// 断言：接口名为 WeComCliDownloadRes、含中文描述、size/content_type 为可选字段（带 ?）
    #[test]
    fn download_result_ts_doc_is_chinese() {
        let ts = DownloadResult::ts_doc();
        assert!(ts.contains("interface WeComCliDownloadRes"));
        assert!(ts.contains("/** 文件下载结果。 */"));
        assert!(ts.contains("file_path: string;"));
        assert!(ts.contains("content_type?: string;"));
        assert!(ts.contains("size?: number;"));
        assert!(ts.contains("下载文件的 MIME 类型，例如 `image/png`"));
        // 用户可见的 TS 不应混入开发者实现说明
        assert!(!ts.contains("single source of truth"));
    }

    // ── reserve_output_file ──

    /// P0：[create_output_file] 创建新文件
    /// 条件：目标路径不存在
    /// 断言：文件创建成功，路径存在
    #[tokio::test]
    async fn reserve_output_file_creates_new_file() {
        let tmp = TempDir::new().unwrap();
        let fs_handle = wecom_fs::SandboxedFs::new();
        let path = tmp.path().join("output.json");

        let info = create_output_file(&fs_handle, &path).await.unwrap();
        assert!(info.path.exists());
    }

    /// P1：[create_output_file] 在文件已存在时返回错误
    /// 条件：目标文件已预先创建
    /// 断言：返回 Err（原子创建冲突）
    #[tokio::test]
    async fn reserve_output_file_fails_if_exists() {
        let tmp = TempDir::new().unwrap();
        let fs_handle = wecom_fs::SandboxedFs::new();
        let path = tmp.path().join("output.json");
        fs::write(&path, "").unwrap();

        let result = create_output_file(&fs_handle, &path).await;
        assert!(result.is_err());
    }

    /// P1：[create_output_file] 自动创建父目录
    /// 条件：目标路径包含多层不存在的父目录 a/b/
    /// 断言：文件创建成功，路径存在
    #[tokio::test]
    async fn reserve_output_file_creates_parent_dirs() {
        let tmp = TempDir::new().unwrap();
        let fs_handle = wecom_fs::SandboxedFs::new();
        let path = tmp.path().join("a").join("b").join("output.json");

        let info = create_output_file(&fs_handle, &path).await.unwrap();
        assert!(info.path.exists());
    }

    // ── OutputFileInfo::write_line / result_json ──

    /// P0：[OutputFileInfo::write_line] 和 [OutputFileInfo::result_ndjson] 功能
    /// 条件：创建文件后写入两行 NDJSON 数据
    /// 断言：result_ndjson 返回 content_type 为 ndjson，size > 0
    #[tokio::test]
    async fn output_file_info_write_line_and_result() {
        let tmp = TempDir::new().unwrap();
        let fs_handle = wecom_fs::SandboxedFs::new();
        let path = tmp.path().join("test.ndjson");

        let mut info = create_output_file(&fs_handle, &path).await.unwrap();
        info.write_line(r#"{"page":1}"#).await.unwrap();
        info.write_line(r#"{"page":2}"#).await.unwrap();

        let result = info.result_ndjson().await;
        assert_json_diff::assert_json_eq!(
            result["content_type"],
            serde_json::json!("application/x-ndjson")
        );
        let size = result["size"].as_u64().unwrap();
        assert!(size > 0, "file size should be > 0");
    }

    // ── create_output_file_unique ──

    /// P0：[create_output_file_unique] 创建新文件
    /// 条件：目标路径无冲突
    /// 断言：文件创建成功，文件名以 "test.ndjson" 结尾
    #[tokio::test]
    async fn create_output_file_unique_creates_file() {
        let tmp = TempDir::new().unwrap();
        let fs_handle = wecom_fs::SandboxedFs::new();

        let info = create_output_file_unique(&fs_handle, &tmp.path().join("test.ndjson"))
            .await
            .unwrap();
        assert!(info.path.exists());
        assert!(info.path.to_string_lossy().ends_with("test.ndjson"));
    }

    /// P1：[create_output_file_unique] 通过唯一后缀避免文件名冲突
    /// 条件：同一路径调用两次，第二次文件已存在
    /// 断言：两次返回不同路径，第二个路径仍包含原文件名且以 .ndjson 结尾
    #[tokio::test]
    async fn create_output_file_unique_avoids_collision() {
        let tmp = TempDir::new().unwrap();
        let fs_handle = wecom_fs::SandboxedFs::new();

        let info1 = create_output_file_unique(&fs_handle, &tmp.path().join("data.ndjson"))
            .await
            .unwrap();
        let info2 = create_output_file_unique(&fs_handle, &tmp.path().join("data.ndjson"))
            .await
            .unwrap();
        assert_ne!(info1.path, info2.path);
        assert!(info2.path.to_string_lossy().contains("data."));
        assert!(info2.path.to_string_lossy().ends_with(".ndjson"));
    }

    // ── handle_json_output ──

    /// P0：[handle_json_output] 在无输出文件时原样返回数据
    /// 条件：output_file 为 None
    /// 断言：返回原始 JSON 数据不变
    #[tokio::test]
    async fn handle_json_output_no_file_returns_data() {
        let data = serde_json::json!({"key": "value"});
        let result = handle_json_output(data.clone(), None).await.unwrap();
        assert_json_diff::assert_json_eq!(result, data);
    }

    /// P0：[handle_json_output] 写入到预分配的输出文件
    /// 条件：提供了预分配的 output_file
    /// 断言：返回 DownloadResult 结构，文件中包含写入的内容
    #[tokio::test]
    async fn handle_json_output_to_file() {
        let tmp = TempDir::new().unwrap();
        let fs_handle = wecom_fs::SandboxedFs::new();
        let path = tmp.path().join("out.json");
        let output_file = create_output_file(&fs_handle, &path).await.unwrap();

        let data = serde_json::json!({"foo": "bar"});
        let result = handle_json_output(data, Some(output_file)).await.unwrap();

        assert_json_diff::assert_json_eq!(
            result["content_type"],
            serde_json::json!("application/json")
        );
        let saved = fs::read_to_string(&path).unwrap();
        assert!(saved.contains("bar"));
    }

    /// 构造一个 octet-stream 测试响应（无 Content-Length / Content-Disposition）。
    fn test_response() -> wecom_transport::HttpResponse {
        let body: wecom_transport::ByteStream = Box::pin(futures::stream::once(async {
            Ok(bytes::Bytes::from_static(b"artifact"))
        }));
        let mut headers = reqwest::header::HeaderMap::new();
        headers.insert(
            reqwest::header::CONTENT_TYPE,
            reqwest::header::HeaderValue::from_static("application/octet-stream"),
        );
        wecom_transport::HttpResponse::new("http://test/file", 200, headers, body)
    }

    /// P0：默认落盘 cwd 经 workspace 实例写入成功；
    ///     显式指定 workspace roots 外的目录被拒绝。
    /// 条件：workspace_fs 写 roots = [cwd]；client cwd = tmp/cwd
    /// 断言：缺省 output_dir 成功且文件落在 cwd 下；显式 output_dir 指向 roots 外失败
    #[tokio::test]
    async fn binary_output_writes_through_workspace_fs() {
        let tmp = TempDir::new().unwrap();
        let cwd = tmp.path().join("cwd");
        std::fs::create_dir(&cwd).unwrap();
        let client = crate::Client::builder()
            .config_dir(tmp.path())
            .cwd(&cwd)
            .workspace_fs(std::sync::Arc::new(
                wecom_fs::SandboxedFs::new()
                    .with_write_policy(wecom_fs::Policy::new().with_allowed_dirs(&[cwd.as_path()])),
            ))
            .build()
            .unwrap();
        let run = client.run(vec!["test".into()]);
        let default_options = crate::service::RunOptions::new(&run);

        let result =
            handle_binary_output(&default_options, test_response(), None, &["default".into()])
                .await
                .expect("default output to cwd should succeed");
        let file_path = PathBuf::from(result["file_path"].as_str().unwrap());
        let expected_dir = cwd.canonicalize().unwrap();
        let actual_dir = file_path.parent().map(|p| p.canonicalize().unwrap());
        assert_eq!(
            actual_dir.as_deref(),
            Some(expected_dir.as_path()),
            "default download must land under cwd: {file_path:?}"
        );

        let mut explicit_options = crate::service::RunOptions::new(&run);
        explicit_options.output_dir = Some(tmp.path().join("elsewhere"));
        let result = handle_binary_output(
            &explicit_options,
            test_response(),
            None,
            &["explicit".into()],
        )
        .await;
        assert!(result.is_err());
    }

    /// P0：[handle_binary_output] Content-Disposition 文件名经 sanitize 净化为单段
    /// 条件：响应头 Content-Disposition: attachment; filename="../../evil.sh"，默认落盘 cwd
    /// 断言：落盘文件直接位于 cwd 下，文件名为净化后的单段
    #[tokio::test]
    async fn binary_output_sanitizes_content_disposition_filename() {
        let tmp = TempDir::new().unwrap();
        let client = crate::Client::builder()
            .config_dir(tmp.path().join("config"))
            .cwd(tmp.path())
            .workspace_fs(std::sync::Arc::new(wecom_fs::SandboxedFs::new()))
            .build()
            .unwrap();
        let run = client.run(vec!["test".into()]);
        let options = crate::service::RunOptions::new(&run);

        let body: wecom_transport::ByteStream = Box::pin(futures::stream::once(async {
            Ok(bytes::Bytes::from_static(b"x"))
        }));
        let mut headers = reqwest::header::HeaderMap::new();
        headers.insert(
            reqwest::header::CONTENT_TYPE,
            reqwest::header::HeaderValue::from_static("application/octet-stream"),
        );
        headers.insert(
            reqwest::header::CONTENT_DISPOSITION,
            reqwest::header::HeaderValue::from_static("attachment; filename=\"../../evil.sh\""),
        );
        let response = wecom_transport::HttpResponse::new("http://test/file", 200, headers, body);

        let result = handle_binary_output(&options, response, None, &["m".into()])
            .await
            .unwrap();
        let file_path = PathBuf::from(result["file_path"].as_str().unwrap());
        // Canonicalize both sides: the fs layer returns resolved real paths
        // (on macOS the tempdir /var base is symlinked to /private/var).
        let cwd = tmp.path().canonicalize().unwrap();
        let actual_dir = file_path.parent().map(|p| p.canonicalize().unwrap());
        assert_eq!(
            actual_dir.as_deref(),
            Some(cwd.as_path()),
            "sanitized file must land directly under the cwd: {file_path:?}"
        );
        let name = file_path.file_name().unwrap().to_string_lossy();
        assert_eq!(name, ".._.._evil.sh", "name = {name}");
    }

    /// P0：run 级 `cwd()` 覆盖移出沙箱 roots 后，默认下载目录随之越界 → fail-closed
    /// 条件：workspace_fs 写 roots = [root]；run.cwd(outside)（roots 外）
    /// 断言：默认下载被拒绝（不动边界只动锚点的契约锁定），outside 下不产生文件
    #[tokio::test]
    async fn binary_output_fails_closed_when_run_cwd_leaves_roots() {
        let tmp = TempDir::new().unwrap();
        let root = tmp.path().join("root");
        let outside = tmp.path().join("outside");
        std::fs::create_dir(&root).unwrap();
        std::fs::create_dir(&outside).unwrap();
        let client = crate::Client::builder()
            .config_dir(tmp.path())
            .cwd(&root)
            .workspace_fs(std::sync::Arc::new(
                wecom_fs::SandboxedFs::new().with_write_policy(
                    wecom_fs::Policy::new().with_allowed_dirs(&[root.as_path()]),
                ),
            ))
            .build()
            .unwrap();
        let run = client.run(vec!["test".into()]).cwd(&outside);
        let options = crate::service::RunOptions::new(&run);

        let result = handle_binary_output(&options, test_response(), None, &["m".into()]).await;
        assert!(
            result.is_err(),
            "download must fail closed when the run cwd override leaves the roots"
        );
        assert!(
            std::fs::read_dir(&outside).unwrap().count() == 0,
            "no file may be produced outside the roots"
        );
    }

    /// `set_len` 永远失败的 [fs::FileWriter] 替身：写入字节直接丢弃，
    /// `sync_all` 成功，`metadata` 失败（调用侧均按 `.ok()` 容错处理）。
    #[derive(Debug)]
    struct FailSetLenWriter;

    impl tokio::io::AsyncWrite for FailSetLenWriter {
        fn poll_write(
            self: std::pin::Pin<&mut Self>,
            _cx: &mut std::task::Context<'_>,
            buf: &[u8],
        ) -> std::task::Poll<std::io::Result<usize>> {
            std::task::Poll::Ready(Ok(buf.len()))
        }

        fn poll_flush(
            self: std::pin::Pin<&mut Self>,
            _cx: &mut std::task::Context<'_>,
        ) -> std::task::Poll<std::io::Result<()>> {
            std::task::Poll::Ready(Ok(()))
        }

        fn poll_shutdown(
            self: std::pin::Pin<&mut Self>,
            _cx: &mut std::task::Context<'_>,
        ) -> std::task::Poll<std::io::Result<()>> {
            std::task::Poll::Ready(Ok(()))
        }
    }

    // 注：本模块 `use std::fs;` 遮蔽了 `crate::fs`，这里用全路径引用 Fs 抽象类型。
    impl crate::fs::FsWrite for FailSetLenWriter {
        fn sync_all<'a>(&'a mut self) -> crate::fs::FsFuture<'a, ()> {
            Box::pin(async { Ok(()) })
        }

        fn set_len<'a>(&'a mut self, len: u64) -> crate::fs::FsFuture<'a, ()> {
            Box::pin(async move {
                Err(wecom_fs::Error::other(
                    format!("set_len({len}) unsupported").into(),
                ))
            })
        }

        fn metadata<'a>(&'a self) -> crate::fs::FsFuture<'a, crate::fs::FileMeta> {
            Box::pin(async { Err(wecom_fs::Error::other("no metadata".into())) })
        }
    }

    /// P1：[handle_binary_output] 预分配文件句柄且 set_len 失败时仍完成下载
    /// 条件：传入 OutputFileInfo（其 writer 的 set_len 永远失败），响应带 Content-Length: 4
    /// 断言：返回 Ok（预分配失败仅告警不中断），content_type 为 octet-stream，size 缺省
    #[tokio::test]
    async fn binary_output_with_reserved_file_survives_set_len_failure() {
        let tmp = TempDir::new().unwrap();
        let client = crate::Client::builder()
            .config_dir(tmp.path())
            .workspace_fs(std::sync::Arc::new(wecom_fs::SandboxedFs::new()))
            .build()
            .unwrap();
        let run = client.run(vec!["test".into()]);
        let options = crate::service::RunOptions::new(&run);

        let body: wecom_transport::ByteStream = Box::pin(futures::stream::once(async {
            Ok(bytes::Bytes::from_static(b"data"))
        }));
        let mut headers = reqwest::header::HeaderMap::new();
        headers.insert(
            reqwest::header::CONTENT_LENGTH,
            reqwest::header::HeaderValue::from_static("4"),
        );
        let response = wecom_transport::HttpResponse::new("http://test/file", 200, headers, body);

        let info = OutputFileInfo {
            path: tmp.path().join("sink.bin"),
            file: Box::new(FailSetLenWriter),
        };
        let result = handle_binary_output(&options, response, Some(info), &["m".into()])
            .await
            .expect("set_len failure must not abort the download");
        assert_json_diff::assert_json_eq!(
            result["content_type"],
            serde_json::json!("application/octet-stream")
        );
        assert!(
            result.get("size").is_none(),
            "size should be absent: {result}"
        );
    }
}
