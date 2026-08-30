//! ## 模块摘要：sandbox 同步校验面（resolve / check_* / denylist / 危险字符）
//!
//! ### 关键接口
//! - [SandboxedFs::resolve] — 校验输入为绝对路径并归一化（相对路径拒绝 + 危险字符筛查）
//! - [SandboxedFs::check_readable] / [SandboxedFs::check_writable] — 校验路径是否在允许的 roots 内
//!
//! ### 关键分支与异常路径
//! - 路径命中调用方指定的 deny 项 → Err("目标路径被安全策略保护")（roots=None 也生效，deny 压过 allow）
//! - 路径含控制字符 / 零宽字符 / bidi 控制 → Err("路径包含非法字符")
//! - 相对路径 → Err("路径必须是绝对路径")（锚定是调用方在入口的职责）
//!
//! ### 上下游交互
//! - 上游：fs_impl 与 mod.rs 的 resolve_* 入口都先经此校验
//! - 下游：sandbox::policy 的 Policy::check

use std::fs as stdfs;
use std::path::{Path, PathBuf};

use tempfile::TempDir;

use super::fs_with_roots;
use crate::api::*;
use crate::sandbox::*;

/// The crate's recommended denylist as a single rule.
fn recommended_deny() -> DenyRule {
    recommended_deny_rule()
}

/// 平台相关的推荐 deny 样本：Unix 用 /etc/hosts；Windows 用 %SystemRoot%
/// 下的 hosts（%SystemRoot% 在推荐 deny 内）。deny 判定先于存在性，样本
/// 无需真实存在。
#[cfg(unix)]
fn denied_sample() -> PathBuf {
    PathBuf::from("/etc/hosts")
}

/// 见 Unix 版注释。
#[cfg(windows)]
fn denied_sample() -> PathBuf {
    std::env::var_os("SystemRoot")
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from(r"C:\Windows"))
        .join(r"System32\drivers\etc\hosts")
}

/// 平台文件系统根：Unix `/`；Windows 当前盘根。
#[cfg(unix)]
fn fs_root() -> &'static Path {
    Path::new("/")
}

/// 见 Unix 版注释。
#[cfg(windows)]
fn fs_root() -> &'static Path {
    Path::new(r"C:\")
}

// ── resolve ──

/// P0：[SandboxedFs::resolve] 相对路径被拒绝
/// 条件：roots 为进程 cwd 派生的绝对路径，输入相对路径 "sub/file.txt"
/// 断言：返回 Err（validation），消息含 "绝对路径"
#[test]
fn resolve_rejects_relative_path() {
    let root = std::env::current_dir().unwrap().join("project");
    let fs = fs_with_roots(&[&root]);
    let msg = fs.resolve("sub/file.txt").unwrap_err().to_string();
    assert!(msg.contains("绝对路径"), "msg = {msg}");
}

/// P0：[SandboxedFs::resolve] 绝对路径原样返回（经归一化）
/// 条件：输入进程 cwd 锚定的 "<cwd>/other/./file.txt"
/// 断言：输出 "<cwd>/other/file.txt"（"." 段被归一化掉）
#[test]
fn resolve_keeps_absolute_path() {
    // Anchor to the process cwd: "/other/..." is a drive-relative (non
    // absolute) path on Windows and would be rejected outright.
    let cwd = std::env::current_dir().unwrap();
    let fs = fs_with_roots(&[&cwd.join("project")]);
    assert_eq!(
        fs.resolve(cwd.join("other/./file.txt")).unwrap(),
        cwd.join("other/file.txt")
    );
}

/// P0：[SandboxedFs::resolve] 危险字符路径被拒绝
/// 条件：输入绝对路径分别含零宽字符 U+200B、bidi 覆写 U+202E、换行控制字符
/// 断言：返回 Err，消息含 "非法字符"
#[test]
fn resolve_rejects_dangerous_chars() {
    let fs = SandboxedFs::new();
    // cwd-anchored absolute inputs: the dangerous-character screening is only
    // reached after the absolute-path check has passed.
    let cwd = std::env::current_dir().unwrap();
    for bad in ["a\u{200B}b.txt", "a\u{202E}b.txt", "a\nb.txt"] {
        let bad = cwd.join(bad);
        let msg = fs.resolve(&bad).unwrap_err().to_string();
        assert!(msg.contains("非法字符"), "input = {bad:?}, msg = {msg}");
    }
}

/// P1：[SandboxedFs::resolve] 正常 CJK / 空格 / 点号路径通过筛查
/// 条件：输入 cwd 锚定的绝对路径 "<cwd>/子 目录/报告.md"
/// 断言：返回 Ok，路径原样保留
#[test]
fn resolve_accepts_normal_cjk_path() {
    let fs = SandboxedFs::new();
    // cwd-anchored: "/tmp/..." is not absolute on Windows.
    let input = std::env::current_dir().unwrap().join("子 目录/报告.md");
    let resolved = fs.resolve(&input).unwrap();
    assert_eq!(resolved, input);
}

/// P2：[SandboxedFs] Debug 格式化包含 read_roots、write_roots 与两方向 deny 长度字段
/// 条件：构造受限 SandboxedFs，调用 format!("{:?}", fs)
/// 断言：输出包含 read_roots、write_roots、read_deny_len、write_deny_len
#[test]
fn debug_fmt_includes_field_names() {
    let dir = TempDir::new().unwrap();
    let fs = fs_with_roots(&[dir.path()]);
    let debug = format!("{fs:?}");
    assert!(debug.contains("read_roots"));
    assert!(debug.contains("write_roots"));
    assert!(debug.contains("read_deny_len"));
    assert!(debug.contains("write_deny_len"));
}

// ══════════════════════════════════════════════════════════════
//  Tests — caller-supplied denylist & dangerous-character screening
// ══════════════════════════════════════════════════════════════

/// P0：[Policy] roots=None 时推荐 deny 项仍被拒绝
/// 条件：无 roots，deny 为推荐列表，读取平台 deny 样本（Unix /etc/hosts；Windows %SystemRoot% 下的 hosts）
/// 断言：返回 Err(Permission)，消息含 "安全策略保护"
#[tokio::test]
async fn unrestricted_read_denies_recommended_system_file() {
    let fs = SandboxedFs::new().with_policy(Policy::new().with_deny(recommended_deny()));
    let result = fs.read_to_string(&denied_sample()).await;
    let msg = result.unwrap_err().to_string();
    assert!(msg.contains("安全策略保护"), "msg = {msg}");
}

/// P0：[SandboxedFs] deny 压过 allow：readable root 为文件系统根仍拒绝 deny 项
/// 条件：readable roots = [平台文件系统根]，deny 为推荐列表，读取平台 deny 样本
/// 断言：返回 Err(Permission)，消息含 "安全策略保护"
#[tokio::test]
async fn deny_overrides_allow_when_root_is_filesystem_root() {
    let fs = SandboxedFs::new().with_policy(
        Policy::new()
            .with_allowed_dirs(&[fs_root()])
            .with_deny(recommended_deny()),
    );
    let result = fs.read_to_string(&denied_sample()).await;
    let msg = result.unwrap_err().to_string();
    assert!(msg.contains("安全策略保护"), "msg = {msg}");
}

/// P0：[SandboxedFs] 沙箱内经符号链接逃逸进推荐 deny 目录被拒绝
/// 条件：可读根 tmp 内有符号链接 escape → 推荐 deny 目录，读取 escape 下的样本
/// 断言：返回 Err(Permission)，消息含 "安全策略保护"
///      （仅 Unix：Windows 创建 symlink 需 SeCreateSymbolicLinkPrivilege，CI 容器不具备）
#[tokio::test]
#[cfg(unix)]
async fn symlink_escape_into_recommended_deny_is_rejected() {
    let tmp = TempDir::new().unwrap();
    std::os::unix::fs::symlink("/etc", tmp.path().join("escape")).unwrap();

    let fs = SandboxedFs::new().with_policy(
        Policy::new()
            .with_allowed_dirs(&[tmp.path()])
            .with_deny(recommended_deny()),
    );
    let result = fs.read_to_string(&tmp.path().join("escape/hosts")).await;
    let msg = result.unwrap_err().to_string();
    assert!(msg.contains("安全策略保护"), "msg = {msg}");
}

/// P1：[Policy] deny 项在允许 root 内仍被拒绝
/// 条件：读写根均为 tmp，deny tmp/secret；分别读 tmp/secret/key 与 tmp/ok.txt
/// 断言：前者 Err 且消息含 "安全策略保护"，后者 Ok
#[tokio::test]
async fn deny_dirs_block_within_allowed_root() {
    let tmp = TempDir::new().unwrap();
    let secret = tmp.path().join("secret");
    stdfs::create_dir(&secret).unwrap();
    stdfs::write(secret.join("key"), "cred").unwrap();
    stdfs::write(tmp.path().join("ok.txt"), "fine").unwrap();

    let fs = SandboxedFs::new().with_policy(
        Policy::new()
            .with_allowed_dirs(&[tmp.path()])
            .with_deny(DenyRule::globs([secret.to_string_lossy().into_owned()]).unwrap()),
    );

    let msg = fs
        .read_to_string(&secret.join("key"))
        .await
        .unwrap_err()
        .to_string();
    assert!(msg.contains("安全策略保护"), "msg = {msg}");
    assert_eq!(
        fs.read_to_string(&tmp.path().join("ok.txt")).await.unwrap(),
        "fine"
    );
}

/// P1：[Fs::resolve] typo 路径不会被纠正进 deny 目录
/// 条件：读写根均为 tmp，deny tmp/secret（内含 real.txt）；输入 tmp/secre1/real.txt
/// 断言：Err，错误信息含 "找不到目标文件"（不命中 secret 内的真实文件）
#[tokio::test]
async fn resolve_read_typo_not_corrected_into_denied_dir() {
    let tmp = TempDir::new().unwrap();
    let secret = tmp.path().join("secret");
    stdfs::create_dir(&secret).unwrap();
    stdfs::write(secret.join("real.txt"), "cred").unwrap();

    let fs = SandboxedFs::new().with_policy(
        Policy::new()
            .with_allowed_dirs(&[tmp.path()])
            .with_deny(DenyRule::globs([secret.to_string_lossy().into_owned()]).unwrap()),
    );
    let fs: &dyn Fs = &fs;

    let typo = tmp.path().join("secre1/real.txt");
    let msg = fs
        .resolve(&typo, FsAccess::Read)
        .await
        .expect_err("typo path must not be corrected")
        .to_string();
    assert!(msg.contains("找不到目标文件"), "msg = {msg}");
}

/// P1：[Policy] deny 规则完全由调用方指定（new 默认为空）
/// 条件：先构造 new（不指定 deny），再 with_deny 设定一项
/// 断言：new 时 deny 长度为 0；设定后恰为 1
#[test]
fn deny_rules_are_fully_caller_specified() {
    let tmp = TempDir::new().unwrap();
    assert_eq!(Policy::new().deny_len(), 0);

    let extra = tmp.path().join("extra");
    let p =
        Policy::new().with_deny(DenyRule::globs([extra.to_string_lossy().into_owned()]).unwrap());
    assert_eq!(p.deny_len(), 1);
}

/// P1：[Fs::resolve] 写路径命中 deny 时保留原始拒绝消息
/// 条件：writable roots=[tmp]，deny 为推荐列表，目标为平台 deny 样本目录下的探针文件
/// 断言：Err 消息含 "安全策略保护"
#[tokio::test]
async fn writable_deny_rejection_preserves_deny_message() {
    let tmp = TempDir::new().unwrap();
    let fs = SandboxedFs::new().with_write_policy(
        Policy::new()
            .with_allowed_dirs(&[tmp.path()])
            .with_deny(recommended_deny()),
    );
    let fs: &dyn Fs = &fs;

    let probe = denied_sample().with_file_name("wecom-fs-probe.json");
    let msg = fs
        .resolve(&probe, FsAccess::Write)
        .await
        .unwrap_err()
        .to_string();
    assert!(msg.contains("安全策略保护"), "msg = {msg}");
}
