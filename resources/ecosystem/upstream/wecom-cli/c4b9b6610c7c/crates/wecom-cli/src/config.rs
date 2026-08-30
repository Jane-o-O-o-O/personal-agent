//! Configuration file parsing and env-var loading for the wecom CLI.

use std::collections::HashMap;
use std::path::{Path, PathBuf};

use serde::Deserialize;
use wecom::ClientBuilder;
use wecom::transport::{TransportBackend, TransportBuilder};

use crate::{Error, Result};

// ── ConfigFile ─────────────────────────────────────────────────

/// Schema for `~/.config/wecom/config.json`.
///
/// All fields are optional; only the ones present in the file will be applied.
/// `base_url` / `auth_endpoint` 仅在 `custom-endpoint` feature 下编译生效。
///
/// Example `config.json`:
/// ```json
/// {
///     "base_url": "https://custom.example.com/api/",
///     "auth_endpoint": "https://custom.example.com/auth",
///     "headers": {
///         "X-Custom": "value"
///     }
/// }
/// ```
///
/// Note: the access token is intentionally NOT configurable via `config.json`;
/// it comes from the encrypted credentials cache (`credentials.enc`).
#[derive(Debug, Default, Clone, Deserialize)]
pub struct ConfigFile {
    /// Override the default base URL (`custom-endpoint` feature 下生效)。
    #[cfg(feature = "custom-endpoint")]
    pub base_url: Option<String>,
    /// Override the default auth bootstrap endpoint (`custom-endpoint` feature 下生效)。
    #[cfg(feature = "custom-endpoint")]
    pub auth_endpoint: Option<String>,
    /// Extra HTTP headers added to every request.
    #[serde(alias = "additional_headers")]
    pub headers: Option<HashMap<String, String>>,
}

/// Returns the default configuration directory for the wecom CLI.
///
/// Resolution order:
/// 1. `WECOM_CLI_CONFIG_DIR` env var (empty treated as unset; a relative
///    value is anchored to the process working directory)
/// 2. `~/.config/wecom`
pub fn default_home_dir() -> PathBuf {
    env_var(crate::env::CONFIG_DIR)
        .map(|v| absolutize_external_path(&v))
        .unwrap_or_else(|| {
            dirs::home_dir()
                .unwrap_or_else(|| PathBuf::from("."))
                .join(".config")
                .join("wecom")
        })
}

/// Returns the default config file path.
///
/// Equivalent to [`default_home_dir()`] joined with `config.json`.
pub fn default_config_path() -> PathBuf {
    default_home_dir().join("config.json")
}

// ── Config file loading ────────────────────────────────────────

/// Try to load and parse a `ConfigFile` from the given path via the
/// CLI-private filesystem capability.
///
/// `config_dir` 的解析不依赖 config 内容（仅 env / 默认值），因此可以先构造
/// PrivateFs 再经它读 config——本函数即运行在 `main.rs` 的两阶段启动的
/// 第一阶段。
///
/// Returns `Ok(None)` if the file does not exist.
/// Returns `Err` if the file exists but cannot be read or parsed (including
/// sandbox rejections — a denied config path must not silently fall back to
/// defaults).
pub async fn load_config_file(fs: &dyn wecom::Fs, path: &Path) -> Result<Option<ConfigFile>> {
    match fs.read_to_string(path).await {
        Ok(contents) => {
            let cfg: ConfigFile = serde_json::from_str(&contents)
                .map_err(|e| {
                    Error::from(wecom::Error::config(format!(
                        "Failed to parse config file {}: {e}",
                        path.display()
                    )))
                })
                .inspect_err(|e| tracing::error!(error = %e, "parse config file failed"))?;
            tracing::debug!(path = %path.to_string_lossy(), "Loading config file");
            Ok(Some(cfg))
        }
        Err(wecom_fs::Error::Io { source, .. })
            if source.kind() == std::io::ErrorKind::NotFound =>
        {
            Ok(None)
        }
        Err(wecom_fs::Error::Io { source, .. }) => Err(wecom::Error::io(
            format!("Failed to read config file {}", path.display()),
            source,
        )
        .into())
        .inspect_err(|e| tracing::error!(error = %e, "read config file failed")),
        Err(e) => Err(Error::from(e))
            .inspect_err(|e| tracing::error!(error = %e, "read config file failed")),
    }
}

// ── Builder helpers ────────────────────────────────────────────

/// Apply config-file and environment variable settings to a [`ClientBuilder`].
///
/// Config-file values are applied first; environment variables take precedence
/// and override them when both are present.
///
/// Only handles non-transport settings (paths).
/// Transport settings (base_url / auth_endpoint) must be configured via
/// [`crate::transport::build`] / [`crate::auth`].
pub fn apply_config(mut builder: ClientBuilder, _cfg: &ConfigFile) -> Result<ClientBuilder> {
    // ── Environment variables (highest priority) ──
    if let Some(v) = env_var(crate::env::CONFIG_DIR) {
        builder = builder.config_dir(absolutize_external_path(&v));
    }
    Ok(builder)
}

// ── Resolution helpers ───────────────────────────────────────────

/// 端点 URL 统一解析（优先级高 → 低）：
/// 1. `runtime`：运行时来源（env > config.json，仅 `custom-endpoint` feature
///    下由调用方经 `runtime_endpoint` 求值，否则传 `None`）
/// 2. `compile_time`：编译期环境变量值（调用方经 `option_env!` 传入；空值视为未设置）
/// 3. `default` 兜底
pub fn resolve_endpoint(
    runtime: Option<String>,
    compile_time: Option<&str>,
    default: &str,
) -> String {
    runtime
        .filter(|v| !v.is_empty())
        .or_else(|| compile_time.filter(|v| !v.is_empty()).map(str::to_owned))
        .unwrap_or_else(|| default.to_string())
}

/// 运行时端点来源解析：非空 env > 非空 config 值（`custom-endpoint` feature 专用）。
#[cfg(feature = "custom-endpoint")]
pub fn runtime_endpoint(env_name: &str, cfg_val: Option<&str>) -> Option<String> {
    std::env::var(env_name)
        .ok()
        .filter(|v| !v.is_empty())
        .or_else(|| cfg_val.filter(|v| !v.is_empty()).map(|s| s.to_owned()))
}

// ── Transport builder helpers ─────────────────────────────────────

/// Apply transport-agnostic config (headers, CLI info) to a
/// [`TransportBuilder`], regardless of its backend type.
///
/// The `Authorization` token is intentionally NOT baked here: it is injected
/// per-request by the transport backend whenever a token is available
/// (see [`crate::transport::backend::WecomBackend`]).
/// Endpoints marked with `RequireAuth` additionally enforce a pre-request
/// gate that rejects calls without a token.
///
/// All header validation errors are deferred to [`TransportBuilder::build`].
pub fn apply_transport_config<B: TransportBackend + 'static>(
    mut builder: TransportBuilder<B>,
    cfg: &ConfigFile,
) -> Result<TransportBuilder<B>> {
    // ── Config file (headers only; token is not configurable via config.json) ──
    if let Some(headers) = &cfg.headers {
        for (k, v) in headers {
            builder = builder.header(k.as_str(), v.as_str());
        }
    }

    let prefix = format!("{}_", crate::env::ADDITIONAL_HEADERS);
    for (key, value) in std::env::vars() {
        if key != crate::env::ADDITIONAL_HEADERS && !key.starts_with(&prefix) {
            continue;
        }
        if let Ok(map) = serde_json::from_str::<HashMap<String, String>>(&value) {
            for (k, v) in map {
                builder = builder.header(k, v);
            }
        }
    }

    Ok(builder)
}

// ── Path helpers ───────────────────────────────────────────────

/// Anchor an externally supplied path (env var / config.json value) to an
/// absolute one: relative values are joined onto the process working
/// directory; absolute values pass through unchanged.
///
/// Pure lexical arithmetic — the target need not exist, and `.` / `..`
/// folding is left to the sandbox resolve step. Sandbox roots and the
/// [`wecom::Fs`] entry points require absolute paths; a relative root
/// would silently couple the access boundary to the ambient cwd, so every
/// external path is pinned here, before it reaches the sandbox builders.
fn absolutize_external_path(value: &str) -> PathBuf {
    let path = Path::new(value);
    if path.is_absolute() {
        return path.to_path_buf();
    }
    std::env::current_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join(path)
}

/// Read a non-empty environment variable value (empty treated as unset).
fn env_var(name: &str) -> Option<String> {
    std::env::var(name).ok().filter(|v| !v.is_empty())
}

/// 沙箱临时目录 root 的固定取值（刻意不用 `std::env::temp_dir()`）。
///
/// `std::env::temp_dir()` 在 Unix 读 `TMPDIR`、Windows 读 `TMP`/`TEMP`——这些
/// 变量由调用方环境控制，信任它等于给沙箱 roots 留了一个 env 扩展口
/// （`TMPDIR=/` 会把整个文件系统变成可写 root）。因此固定取值：
/// Unix 固定 `/tmp`（macOS 的 `/tmp` 经 realpath 落 `/private/tmp`，root 在
/// `Policy` 构造期解析一次）；Windows 取账户的 `LocalAppData\Temp`（`dirs`
/// 走 Known Folder API，不受 `TMP`/`TEMP` 影响）。取不到时丢弃该 root
/// （fail-closed），workspace 只留 cwd。
pub(crate) fn pinned_temp_dir() -> Option<PathBuf> {
    #[cfg(unix)]
    let value = Some(PathBuf::from("/tmp"));
    #[cfg(windows)]
    let value = dirs::data_local_dir().map(|d| d.join("Temp"));
    #[cfg(not(any(unix, windows)))]
    let value = None;
    value
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：config（CLI 配置文件解析与环境变量加载）
    //!
    //! ### 关键接口
    //! - [ConfigFile] — 配置文件 `~/.config/wecom/config.json` 的 serde 反序列化目标，字段全部可选
    //! - [default_config_path] — 返回默认配置文件路径
    //! - [load_config_file] — 从文件路径加载并解析 ConfigFile
    //! - [absolutize_external_path] — 外部输入路径（env / config.json）统一锚定为绝对路径
    //!
    //! ### 关键分支与异常路径
    //! - ConfigFile 反序列化：完整 JSON → 全部字段解析为 Some；空 JSON → 全 None；含未知字段 → 忽略
    //! - load_config_file：文件存在且合法 JSON → Ok(Some(cfg))；文件不存在 → Ok(None)；非法 JSON → Err(Error::Config)
    //! - absolutize_external_path：绝对路径 → 原样返回；相对路径 → 拼进程 cwd（default_home_dir / apply_config 的外部入口共用）
    //!
    //! ### 上下游交互
    //! - 上游：CLI 入口（`main.rs`），在构造 `Client` 前加载配置
    //! - 下游：`wecom::ClientBuilder`（通过 `apply_config` 应用配置项与环境变量）

    use serde_json::json;

    use super::*;

    // ========== ConfigFile 反序列化 ==========

    /// P0：[ConfigFile] 完整 ConfigFile JSON 反序列化
    /// 条件：JSON 包含全部字段（base_url / auth_endpoint / headers）
    /// 断言：所有字段均为 Some 且值正确；access_token 字段被静默忽略（不允许经 config.json 配置）
    #[test]
    fn config_file_deserialize_full() {
        let raw = json!({
            "base_url": "https://api.example.com/",
            "auth_endpoint": "https://api.example.com/auth",
            "access_token": "tok123",
            "headers": {"X-Custom": "val"}
        });
        let cfg: ConfigFile = serde_json::from_value(raw).unwrap();
        #[cfg(feature = "custom-endpoint")]
        assert_eq!(cfg.base_url, Some("https://api.example.com/".to_string()));
        #[cfg(feature = "custom-endpoint")]
        assert_eq!(
            cfg.auth_endpoint,
            Some("https://api.example.com/auth".to_string())
        );
        assert!(cfg.headers.is_some());
    }

    /// P0：[ConfigFile] 空对象反序列化为全 None
    /// 条件：JSON 为 {}
    /// 断言：所有字段均为 None
    #[test]
    fn config_file_deserialize_empty_is_default() {
        let cfg: ConfigFile = serde_json::from_value(json!({})).unwrap();
        #[cfg(feature = "custom-endpoint")]
        assert!(cfg.base_url.is_none());
        #[cfg(feature = "custom-endpoint")]
        assert!(cfg.auth_endpoint.is_none());
        assert!(cfg.headers.is_none());
    }

    /// P1：[ConfigFile] 反序列化时忽略未知字段
    /// 条件：JSON 包含已知字段 base_url 和未知字段 unknown_field
    /// 断言：base_url 正确解析，未知字段被静默忽略
    #[test]
    fn config_file_deserialize_unknown_fields_ignored() {
        let raw = json!({
            "base_url": "http://a.com",
            "unknown_field": "ignored"
        });
        #[cfg_attr(not(feature = "custom-endpoint"), allow(unused_variables))]
        let cfg: ConfigFile = serde_json::from_value(raw).unwrap();
        #[cfg(feature = "custom-endpoint")]
        assert_eq!(cfg.base_url, Some("http://a.com".to_string()));
    }

    // ========== resolve_endpoint ==========

    /// P0：[resolve_endpoint] 运行时来源优先级最高
    /// 条件：runtime / compile_time / default 均有值
    /// 断言：返回 runtime 值
    #[test]
    fn resolve_endpoint_runtime_wins() {
        assert_eq!(
            resolve_endpoint(Some("rt".to_string()), Some("ct"), "def"),
            "rt"
        );
    }

    /// P0：[resolve_endpoint] 运行时空串跳级到编译期来源
    /// 条件：runtime 为空串，compile_time 有值
    /// 断言：返回 compile_time 值
    #[test]
    fn resolve_endpoint_empty_runtime_falls_to_compile_time() {
        assert_eq!(
            resolve_endpoint(Some(String::new()), Some("ct"), "def"),
            "ct"
        );
    }

    /// P0：[resolve_endpoint] 仅编译期来源生效
    /// 条件：runtime 为 None，compile_time 有值
    /// 断言：返回 compile_time 值
    #[test]
    fn resolve_endpoint_compile_time_only() {
        assert_eq!(resolve_endpoint(None, Some("ct"), "def"), "ct");
    }

    /// P0：[resolve_endpoint] 全空（含编译期空串）回落 default
    /// 条件：runtime 为 None，compile_time 为 None 或空串
    /// 断言：返回 default
    #[test]
    fn resolve_endpoint_all_empty_falls_back_to_default() {
        assert_eq!(resolve_endpoint(None, None, "def"), "def");
        assert_eq!(resolve_endpoint(None, Some(""), "def"), "def");
    }

    // ========== absolutize_external_path ==========

    /// P1：[absolutize_external_path] 绝对路径原样返回（不拼 cwd）
    /// 条件：输入平台原生绝对路径
    /// 断言：返回值与输入一致
    #[test]
    fn absolutize_external_path_keeps_absolute() {
        #[cfg(unix)]
        let abs = "/tmp/wecom-abs";
        #[cfg(windows)]
        let abs = r"C:\tmp\wecom-abs";
        assert_eq!(absolutize_external_path(abs), PathBuf::from(abs));
    }

    /// P1：[absolutize_external_path] 相对路径锚定到进程 cwd
    /// 条件：输入相对路径 "rel/dir"
    /// 断言：返回 <cwd>/rel/dir（沙箱 root 必须是绝对路径，相对值在此钉死）
    #[test]
    fn absolutize_external_path_anchors_relative_to_cwd() {
        let cwd = std::env::current_dir().unwrap();
        assert_eq!(
            absolutize_external_path("rel/dir"),
            cwd.join("rel").join("dir")
        );
    }

    // ========== pinned_temp_dir ==========

    /// P0：[pinned_temp_dir] Unix 固定返回 /tmp（字面常量，天然不受 TMPDIR 影响）
    #[cfg(unix)]
    #[test]
    fn pinned_temp_dir_unix_is_literal_tmp() {
        assert_eq!(pinned_temp_dir(), Some(PathBuf::from("/tmp")));
    }

    /// P0：[pinned_temp_dir] Windows 返回账户 Temp（绝对路径、以 Temp 结尾），
    ///      经 Known Folder API 取得，不受 TMP/TEMP 影响
    #[cfg(windows)]
    #[test]
    fn pinned_temp_dir_windows_is_account_temp() {
        let p = pinned_temp_dir().expect("windows account temp must resolve");
        assert!(p.is_absolute(), "pinned temp must be absolute: {p:?}");
        assert_eq!(p.file_name().unwrap(), "Temp", "pinned temp = {p:?}");
    }

    // ========== default_config_path ==========

    /// P0：[default_config_path] 以 config.json 结尾
    /// 条件：调用 default_config_path()
    /// 断言：返回路径的 file_name() == "config.json"
    #[test]
    fn default_config_path_ends_with_config_json() {
        let path = default_config_path();
        assert!(
            path.file_name().unwrap() == "config.json",
            "expected config.json, got {:?}",
            path.file_name()
        );
    }

    // ========== load_config_file ==========

    /// 测试夹具：以 root 为唯一 allowed 目录的私有域沙箱。
    fn private_fs(root: &Path) -> wecom_fs::SandboxedFs {
        wecom_fs::SandboxedFs::confined_to(&[root])
    }

    /// P0：[load_config_file] 加载不存在的配置文件返回 None
    /// 条件：传入不存在的文件路径
    /// 断言：返回 Ok(None)
    #[tokio::test]
    async fn load_config_file_nonexistent_returns_none() {
        let dir = tempfile::tempdir().unwrap();
        let fs = private_fs(dir.path());
        let result = load_config_file(&fs, &dir.path().join("config.json")).await;
        assert!(result.unwrap().is_none());
    }

    /// P0：[load_config_file] 加载有效 JSON 正确解析
    /// 条件：临时文件写入有效 JSON（base_url + headers）
    /// 断言：返回 Ok(Some(cfg))，headers 值与写入一致
    #[tokio::test]
    #[allow(clippy::disallowed_methods)]
    async fn load_config_file_valid_json_returns_config() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("config.json");
        std::fs::write(
            &path,
            r#"{"base_url": "https://custom.test", "headers": {"X-Custom": "val"}}"#,
        )
        .unwrap();

        let fs = private_fs(dir.path());
        let result = load_config_file(&fs, &path).await.unwrap();
        assert!(result.is_some());
        let cfg = result.unwrap();
        #[cfg(feature = "custom-endpoint")]
        assert_eq!(cfg.base_url, Some("https://custom.test".to_string()));
        assert_eq!(
            cfg.headers.as_ref().and_then(|h| h.get("X-Custom")),
            Some(&"val".to_string())
        );
    }

    /// P1：[load_config_file] 加载非法 JSON 返回错误
    /// 条件：临时文件写入非法 JSON "{invalid json!!!"
    /// 断言：返回 Err，code 为 wecom::E_CONFIG_CLIENT
    #[tokio::test]
    #[allow(clippy::disallowed_methods)]
    async fn load_config_file_invalid_json_returns_error() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("bad.json");
        std::fs::write(&path, "{invalid json!!!").unwrap();

        let fs = private_fs(dir.path());
        let result = load_config_file(&fs, &path).await;
        assert!(result.is_err());
        match result.unwrap_err() {
            Error::Wecom(e) if e.code() == wecom::E_CONFIG_CLIENT => {}
            other => panic!("Expected Config error for invalid JSON, got {other:?}"),
        }
    }

    /// P1：[load_config_file] 文件存在但读取失败（路径为目录）返回 IO 错误
    /// 条件：传入一个目录路径（`read_to_string` 对目录报 `IsADirectory`）
    /// 断言：返回 Err 且错误码为 E_IO，而非 `Ok(None)`（NotFound 之外的读取失败不能静默吞掉）
    #[tokio::test]
    async fn load_config_file_unreadable_returns_io_error() {
        let dir = tempfile::tempdir().unwrap();

        let fs = private_fs(dir.path());
        let result = load_config_file(&fs, dir.path()).await;
        assert!(result.is_err());
        match result.unwrap_err() {
            Error::Wecom(e) if e.code() == wecom::E_IO => {}
            other => panic!("Expected Io error for unreadable path, got {other:?}"),
        }
    }

    /// P0：[load_config_file] config 落在 PrivateFs roots 外时返回错误而非静默默认
    /// 条件：注入 roots 不含目标路径的沙箱，目标 config.json 真实存在
    /// 断言：返回 Err（E_PERMISSION），不得返回 Ok(None) 静默回退默认配置
    #[tokio::test]
    #[allow(clippy::disallowed_methods)]
    async fn load_config_file_outside_roots_errors() {
        let allowed = tempfile::tempdir().unwrap();
        let forbidden = tempfile::tempdir().unwrap();
        let path = forbidden.path().join("config.json");
        std::fs::write(&path, "{}").unwrap();

        let fs = private_fs(allowed.path());
        let result = load_config_file(&fs, &path).await;
        match result.expect_err("config outside private roots must error") {
            Error::Wecom(e) if e.code() == wecom::E_PERMISSION => {}
            other => panic!("Expected Permission error, got {other:?}"),
        }
    }
}
