/// Maximum request body size: 100 MB.
///
/// Shared by media upload and multipart form-data uploads.
pub(crate) const MAX_UPLOAD_SIZE: u64 = 100 * 1024 * 1024;

/// 默认 CLI 二进制名（命令名）。
///
/// 库 crate 编译时 `CARGO_BIN_NAME` 不可用（仅在二进制 target 编译时设置），
/// 故回退到包名；真实二进制名由外部（wecom-cli）经
/// [`ClientBuilder::bin_name`](crate::client::ClientBuilder::bin_name) 注入。
pub const DEFAULT_BIN_NAME: &str = match option_env!("CARGO_BIN_NAME") {
    Some(name) => name,
    None => env!("CARGO_PKG_NAME"),
};

/// CLI 环境与构建信息，`X-WeCom-Cli-Info` 请求头的结构化表示，
/// 同时承担 `--version` 人类可读输出（[`Display`](std::fmt::Display)）。
///
/// 所有字段均为编译期确定的 `&'static str`，[CliInfo::new] 是 `const fn`，
/// 可在编译期求值，运行时零成本；对外统一使用 [CLI_INFO] 常量。
#[derive(Debug)]
pub struct CliInfo {
    /// 目标平台二元组 `os/arch`（如 `linux/x86_64`），
    /// 由 build.rs 在编译期拼接注入。
    pub platform: &'static str,
    /// RFC 3339 构建时间（编译期注入）。
    pub build_time: &'static str,
    /// Git commit 短哈希（非 git 构建时为空串）。
    pub commit_id: &'static str,
    /// 版本号（`BUILD_VERSION`）。
    pub version: &'static str,
    /// 发行渠道（`WECOM_CLI_DISTRIBUTION`，未设置时回退 `unknown`）。
    pub distribution: &'static str,
}

/// 当前构建的 CLI 信息，对外统一入口。
///
/// 编译期求值，调用方直接复用，无需每次 [CliInfo::new]。
pub const CLI_INFO: CliInfo = CliInfo::new();

impl CliInfo {
    /// 采集当前编译期环境与构建信息（`const`，可编译期求值，运行时零成本）。
    pub const fn new() -> Self {
        Self {
            platform: env!("TARGET_PLATFORM"),
            build_time: env!("BUILD_TIME_RFC3339"),
            commit_id: env!("GIT_COMMIT_ID"),
            version: env!("BUILD_VERSION"),
            distribution: match option_env!("WECOM_CLI_DISTRIBUTION") {
                Some(d) => d,
                None => "unknown",
            },
        }
    }

    /// 序列化为 JSON 值（`X-WeCom-Cli-Info` 请求头经 `to_string()` 使用）。
    ///
    /// 字段均为编译期字符串标量，`json!` 构造不存在失败路径，
    /// 无需 `Result`/`expect`。
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::json!({
            "platform": self.platform,
            "build_time": self.build_time,
            "commit_id": self.commit_id,
            "version": self.version,
            "distribution": self.distribution,
        })
    }

    /// 以指定二进制名渲染 `--version` 输出。
    ///
    /// 格式 `{name} {version} ({distribution} {build_time} {commit})`，
    /// [`Display`](std::fmt::Display) 以 [`DEFAULT_BIN_NAME`] 为默认名称；
    /// 名称时通过 [`Client::bin_name`](crate::Client::bin_name) 调用本方法。
    pub fn display_with_name(&self, name: &str) -> String {
        format!(
            "{name} {version} ({distribution} {build_time} {commit})",
            version = self.version,
            distribution = self.distribution,
            build_time = self.build_time,
            commit = self.commit_id,
        )
    }
}

impl Default for CliInfo {
    fn default() -> Self {
        Self::new()
    }
}

/// 人类可读版本信息，`--version` 输出格式
/// `{name} {version} ({distribution} {build_time} {commit})`，如
/// `wecom 1.1.0 (unknown 2026-08-05T03:47:03Z a1b2c3d)`。
impl std::fmt::Display for CliInfo {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.display_with_name(DEFAULT_BIN_NAME))
    }
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：constants（常量定义 + 构建信息格式化）
    //!
    //! ### 关键接口
    //! - [CLI_INFO] — 当前构建的 CLI 信息，对外统一入口（编译期常量）
    //! - [CliInfo] — 结构化 CLI 信息（`platform`/`build_time`/`commit_id`/`version`/`distribution`，其中 `platform` 为 `os/arch` 经 build.rs 拼接注入），`to_json()` 供 `X-WeCom-Cli-Info` 请求头；`Display`（及 `ToString` 的 `to_string()`）供 `--version`
    //!
    //! ### 关键分支与异常路径
    //! - `CliInfo::new()` 为 `const fn`：字段均为编译期常量（`env!`/`option_env!`），可编译期求值、运行时零成本
    //! - `CliInfo::to_json()` 用 `json!` 直接构造 `Value`，无失败路径（无 `Result`/`expect`）
    //! - `Display` 为 `--version` 格式：`{name} {version} ({distribution} {build_time} {commit})`
    //! - 构建信息（`BUILD_VERSION`/`BUILD_TIME_RFC3339`/`GIT_COMMIT_ID`/`TARGET_PLATFORM`）由 build.rs 在编译期注入，内联于 [CliInfo::new]，无独立常量暴露
    //!
    //! ### 上下游交互
    //! - 上游：[ClientBuilder::build] 经 `CLI_INFO.to_json().to_string()` 设置 `X-WeCom-Cli-Info` 请求头
    //! - 上游：[Client::run] 经 `format!("{}", CLI_INFO)` 输出 `--version`，经 `CLI_INFO.version` 取版本号
    //! - 下游：服务端通过该 header 获取客户端环境信息

    use super::*;

    // ── CliInfo ──

    /// P0：[CLI_INFO] 字段与编译期注入值一致，且 const 可求值
    /// 条件：引用 CLI_INFO
    /// 断言：各字段 == 编译期 env/平台常量；platform == `os/arch` 拼接
    #[test]
    fn cli_info_matches_compile_time_values() {
        assert_eq!(
            CLI_INFO.platform,
            format!("{}/{}", std::env::consts::OS, std::env::consts::ARCH)
        );
        assert_eq!(CLI_INFO.build_time, env!("BUILD_TIME_RFC3339"));
        assert_eq!(CLI_INFO.commit_id, env!("GIT_COMMIT_ID"));
        assert_eq!(CLI_INFO.version, env!("BUILD_VERSION"));
        assert_eq!(
            CLI_INFO.distribution,
            option_env!("WECOM_CLI_DISTRIBUTION").unwrap_or("unknown")
        );
    }

    /// P0：[CLI_INFO] 与 [CliInfo::new] 等价
    /// 条件：比较 CLI_INFO 与 CliInfo::new()
    /// 断言：to_json/Display 输出一致
    #[test]
    fn cli_info_constant_matches_new() {
        assert_eq!(CLI_INFO.to_json(), CliInfo::new().to_json());
        assert_eq!(format!("{CLI_INFO}"), format!("{}", CliInfo::new()));
    }

    /// P0：[CLI_INFO] 版本号与 commit 非空
    /// 条件：引用 CLI_INFO
    /// 断言：version 非空；git 仓库构建时 commit_id 非空
    #[test]
    fn cli_info_build_info_is_non_empty() {
        assert!(!CLI_INFO.version.is_empty(), "version should not be empty");
        assert!(
            !CLI_INFO.commit_id.is_empty(),
            "commit_id should not be empty when built from a git repository"
        );
    }

    /// P0：[CliInfo::to_json] 返回含全部字段的 JSON 对象
    /// 条件：调用 CLI_INFO.to_json()
    /// 断言：返回 Value 为 object，含 platform / build_time / commit_id / version / distribution
    #[test]
    fn cli_info_to_json_contains_all_fields() {
        let v = CLI_INFO.to_json();
        assert!(v.is_object());
        assert_eq!(
            v["platform"].as_str(),
            Some(format!("{}/{}", std::env::consts::OS, std::env::consts::ARCH).as_str())
        );
        assert_eq!(v["build_time"].as_str(), Some(env!("BUILD_TIME_RFC3339")));
        assert_eq!(v["commit_id"].as_str(), Some(env!("GIT_COMMIT_ID")));
        assert_eq!(v["version"].as_str(), Some(env!("BUILD_VERSION")));
        assert_eq!(
            v["distribution"].as_str(),
            Some(option_env!("WECOM_CLI_DISTRIBUTION").unwrap_or("unknown"))
        );
    }

    /// P0：[CliInfo] `to_string()` 与 `Display` 一致
    /// 条件：调用 CLI_INFO.to_string() 与 format!("{}", CLI_INFO)
    /// 断言：二者完全相等
    #[test]
    fn cli_info_to_string_matches_display() {
        assert_eq!(CLI_INFO.to_string(), format!("{CLI_INFO}"));
    }

    /// P0：[CliInfo::to_json] 输出可序列化为单行 JSON 字符串（请求头用途）
    /// 条件：调用 CLI_INFO.to_json().to_string()
    /// 断言：结果可被反序列化回 object
    #[test]
    fn cli_info_to_json_string_is_parseable() {
        let s = CLI_INFO.to_json().to_string();
        assert!(!s.contains('\n'), "header should be single line: {s}");
        let parsed: serde_json::Value = serde_json::from_str(&s).expect("valid JSON");
        assert!(parsed.is_object());
    }

    /// P0：[CliInfo] `Display` 输出 `--version` 新格式
    /// 条件：format!("{}", CLI_INFO)
    /// 断言：格式 `{name} {version} ({distribution} {build_time} {commit})`，单行
    #[test]
    fn cli_info_display_matches_version_format() {
        let info = CLI_INFO;
        let s = format!("{info}");
        let expected = format!(
            "{name} {version} ({distribution} {build_time} {commit})",
            name = DEFAULT_BIN_NAME,
            version = info.version,
            distribution = info.distribution,
            build_time = info.build_time,
            commit = info.commit_id,
        );
        assert_eq!(s, expected);
        assert!(!s.contains('\n'), "Display should be single line: {s}");
        assert!(
            s.contains('T') && s.trim_end().ends_with(')'),
            "expected `{DEFAULT_BIN_NAME} <version> (<distribution> <RFC 3339> <commit>)`: {s}"
        );
    }

    /// P1：[CliInfo] 默认实现等于 [CLI_INFO]
    /// 条件：调用 CliInfo::default()
    /// 断言：与 CLI_INFO 等价
    #[test]
    fn cli_info_default_matches_constant() {
        let d = CliInfo::default();
        assert_eq!(d.to_json(), CLI_INFO.to_json());
        assert_eq!(format!("{d}"), format!("{CLI_INFO}"));
    }
}
