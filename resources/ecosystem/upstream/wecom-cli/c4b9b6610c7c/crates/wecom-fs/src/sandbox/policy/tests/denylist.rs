//! ## 模块摘要：policy::denylist（内建 deny glob 表 + 推荐规则 / 危险字符 / is_under）
//!
//! ### 关键接口
//! - [recommended_deny_rule] / [COMMON_DENY_GLOBS] — 内建表与其编译出的推荐规则
//! - [DenyRule::globs] — glob 方言：绝对前缀 / `**/` 连续组件序列 / 组件内 `*.ext`
//! - [reject_dangerous_chars] — 危险字符筛查与报错文案
//! - [is_under] — 组件级前缀比对（大小写折叠规则）
//!
//! ### 关键分支与异常路径
//! - 绝对前缀：命中自身与其下；同级前缀（/a/bc vs /a/b）不误命中
//! - `**/a/b`：任意深度连续序列命中；不连续（a/x/b）放行
//! - `*.ext`：任意组件按扩展名命中（目录同名也拦，已声明接受）
//! - 非法 glob（空 / 相对路径 / 空组件）→ 构造期 panic
//! - 危险字符 → Err 含码点（U+XXXX）；正常 CJK 路径放行
//!
//! ### 上下游交互
//! - 上游：sandbox/policy/mod.rs 的 Policy 与 sandbox/io.rs 的 acquire
//! - 下游：super::paths（resolve 快照）、super::compare（折叠比对）

use std::path::{Path, PathBuf};

use tempfile::TempDir;

use super::super::denylist::COMMON_DENY_GLOBS;
use crate::sandbox::policy::{
    DenyRule, Policy, is_under, recommended_deny_rule, reject_dangerous_chars,
};

/// 构造只挂给定规则的策略（roots 之外无其他 deny 项）。
fn rule_policy(roots: Option<&[PathBuf]>, rule: DenyRule) -> Policy {
    let p = Policy::new().with_deny(rule);
    match roots {
        Some(roots) => {
            let refs: Vec<&Path> = roots.iter().map(|r| r.as_path()).collect();
            p.with_allowed_dirs(&refs)
        }
        None => p,
    }
}

// ── recommended_deny_rule：系统目录 ──

/// P0：[recommended_deny_rule] 系统目录经绝对前缀命中（自身与其下）
/// 条件：roots 为 None，目标为平台系统目录样本（无需存在：deny 先于存在性探针）
/// 断言：Err(Permission)，消息含 "安全策略保护" 与 "命中路径 deny 清单项"
#[test]
#[cfg(unix)]
fn recommended_rule_denies_system_dirs() {
    let policy = rule_policy(None, recommended_deny_rule());
    for target in ["/etc", "/etc/hosts", "/proc/self/status", "/root/.ssh"] {
        let msg = policy.check(Path::new(target)).unwrap_err().to_string();
        assert!(
            msg.contains("安全策略保护"),
            "target = {target}, msg = {msg}"
        );
        assert!(msg.contains("命中路径 deny 清单项"), "msg = {msg}");
    }
    assert!(policy.check(Path::new("/tmp/ok.txt")).is_ok());
}

/// P1：[recommended_deny_rule] 表内条目不依赖任何 env / home（纯字面量 + Windows SystemRoot 例外）
/// 条件：直接读表（跨平台形状表 + 本平台的固定目录表与形状表）
/// 断言：无 `$HOME`/`~` 形式条目；所有条目要么绝对要么 `**/` 开头
#[test]
fn recommended_globs_are_env_independent() {
    #[cfg(unix)]
    let (dirs, shapes): (&[&str], &[&str]) = (super::super::denylist::UNIX_DENY_DIRS, &[]);
    #[cfg(windows)]
    let (dirs, shapes): (&[&str], &[&str]) = (
        super::super::denylist::WINDOWS_DENY_DIRS,
        super::super::denylist::WINDOWS_DENY_SHAPES,
    );
    for g in COMMON_DENY_GLOBS
        .iter()
        .chain(dirs.iter())
        .chain(shapes.iter())
    {
        assert!(!g.contains('$') && !g.starts_with('~'), "entry = {g}");
        assert!(
            g.starts_with("**/") || Path::new(g).is_absolute() || g.as_bytes()[1] == b':',
            "entry = {g}"
        );
    }
}

// ── recommended_deny_rule：凭据形状 ──

/// P0：[recommended_deny_rule] 段 / 文件名 / 扩展名 / 连续子路径在任意深度命中
/// 条件：roots 为临时目录，夹具真实存在（存在性不构成拒绝原因——deny 先于探针）
/// 断言：全部 Err(Permission)，消息含 "安全策略保护" 与 "凭据形状"
#[test]
fn recommended_rule_covers_credential_shapes_at_any_depth() {
    let tmp = TempDir::new().unwrap();
    for dir in [
        "proj/.ssh",
        "proj/.azure",
        "proj/.git",
        "proj/.config/gh",
        "proj/.cargo",
        "proj/deep",
    ] {
        std::fs::create_dir_all(tmp.path().join(dir)).unwrap();
    }
    for file in [
        "proj/.ssh/config",
        "proj/.azure/tokens.json",
        "proj/.git/config",
        "proj/.config/gh/hosts.yml",
        "proj/.cargo/credentials.toml",
        "proj/deep/.env",
        "proj/deep/id_rsa",
        "proj/deep/report.pem",
        "proj/deep/.gitconfig",
        "proj/deep/.bash_history",
    ] {
        std::fs::write(tmp.path().join(file), "x").unwrap();
    }

    let roots = vec![tmp.path().to_path_buf()];
    let policy = rule_policy(Some(&roots), recommended_deny_rule());
    for target in [
        tmp.path().join("proj/.ssh/config"),
        tmp.path().join("proj/.azure/tokens.json"),
        tmp.path().join("proj/.git/HEAD"),
        tmp.path().join("proj/.config/gh/hosts.yml"),
        tmp.path().join("proj/.cargo/credentials.toml"),
        tmp.path().join("proj/deep/.env"),
        tmp.path().join("proj/deep/id_rsa"),
        tmp.path().join("proj/deep/report.pem"),
        tmp.path().join("proj/deep/.gitconfig"),
        tmp.path().join("proj/deep/.bash_history"),
    ] {
        let msg = policy.check(&target).unwrap_err().to_string();
        assert!(
            msg.contains("安全策略保护") && msg.contains("凭据形状"),
            "target = {}, msg = {msg}",
            target.display()
        );
    }

    // DPAPI 形状在 Windows 表内（cfg(windows) 门控），仅 Windows 命中
    #[cfg(windows)]
    {
        let msg = policy
            .check(
                &tmp.path()
                    .join("x/AppData/Roaming/Microsoft/Credentials/vault"),
            )
            .unwrap_err()
            .to_string();
        assert!(msg.contains("凭据形状"), "msg = {msg}");
    }
}

/// P1：[recommended_deny_rule] 不误伤合法文件；不连续序列与非同扩展名放行
/// 条件：roots 为临时目录
/// 断言：ok.txt / 普通 config / .config/other / a/.config/x/gh / notes.pem.txt 均 Ok
#[test]
fn recommended_rule_leaves_legitimate_files_alone() {
    let tmp = TempDir::new().unwrap();
    let roots = vec![tmp.path().to_path_buf()];
    let policy = rule_policy(Some(&roots), recommended_deny_rule());
    for ok in [
        tmp.path().join("proj/ok.txt"),
        tmp.path().join("proj/config"),
        tmp.path().join("proj/.config/other/settings.toml"),
        tmp.path().join("a/.config/x/gh"),
        tmp.path().join("proj/notes.pem.txt"),
    ] {
        assert!(policy.check(&ok).is_ok(), "target = {}", ok.display());
    }
}

/// P1：[recommended_deny_rule] 拒绝文案带具体命中 pattern（供 Agent 自我纠正）
/// 条件：roots 为临时目录
/// 断言：.ssh → "**/.ssh"；.env → "**/.env"；report.pem → "**/*.pem"；
///       .config/gh → "**/.config/gh"
#[test]
fn recommended_rule_reports_matched_pattern() {
    let tmp = TempDir::new().unwrap();
    let roots = vec![tmp.path().to_path_buf()];
    let policy = rule_policy(Some(&roots), recommended_deny_rule());
    let cases: [(PathBuf, &str); 4] = [
        (tmp.path().join("proj/.ssh/config"), "凭据形状 `**/.ssh`"),
        (tmp.path().join("proj/.env"), "凭据形状 `**/.env`"),
        (tmp.path().join("proj/report.pem"), "凭据形状 `**/*.pem`"),
        (
            tmp.path().join("proj/.config/gh/hosts.yml"),
            "凭据形状 `**/.config/gh`",
        ),
    ];
    for (target, reason) in cases {
        let msg = policy.check(&target).unwrap_err().to_string();
        assert!(msg.contains(reason), "msg = {msg}, want {reason}");
    }
}

// ── DenyRule::globs 方言 ──

/// P1：[DenyRule::globs] 绝对前缀：命中自身与其下；同级前缀不误命中
/// 条件：deny = [tmp/secret]，roots 为临时目录
/// 断言：secret 与 secret/token 被拒；secret2 放行
#[test]
fn globs_absolute_prefix_matches_self_and_below() {
    let tmp = TempDir::new().unwrap();
    let secret = tmp.path().join("secret");
    std::fs::create_dir_all(&secret).unwrap();
    std::fs::create_dir_all(tmp.path().join("secret2")).unwrap();

    let roots = vec![tmp.path().to_path_buf()];
    let rule = DenyRule::globs([secret.to_string_lossy().into_owned()]).unwrap();
    let policy = rule_policy(Some(&roots), rule);
    assert!(policy.check(&secret).is_err());
    assert!(policy.check(&secret.join("token")).is_err());
    assert!(policy.check(&tmp.path().join("secret2/ok.txt")).is_ok());
}

/// P1：[DenyRule::globs] `**/a/b` 连续组件序列任意深度命中；不连续放行
/// 条件：deny = ["**/.config/wecom"]，roots 为临时目录
/// 断言：tmp/.config/wecom 与 tmp/a/.config/wecom/config.json 被拒；
///       tmp/.config/other 放行；tmp/a/.config/x/wecom（组件不连续）放行
#[test]
fn globs_anywhere_sequence_matches_at_any_depth() {
    let tmp = TempDir::new().unwrap();
    let roots = vec![tmp.path().to_path_buf()];
    let policy = rule_policy(Some(&roots), DenyRule::globs(["**/.config/wecom"]).unwrap());

    assert!(policy.check(&tmp.path().join(".config/wecom")).is_err());
    assert!(
        policy
            .check(&tmp.path().join("a/.config/wecom/config.json"))
            .is_err()
    );
    assert!(policy.check(&tmp.path().join(".config/other")).is_ok());
    assert!(policy.check(&tmp.path().join("a/.config/x/wecom")).is_ok());
}

/// P1：[DenyRule::globs] Windows 盘符绝对模式在 Unix 上构造合法且永不命中
/// 条件：deny = [r"C:\Windows"]，roots 为临时目录
/// 断言：任意 Unix 路径放行（跨平台共表的安全性）
#[test]
#[cfg(unix)]
fn globs_drive_absolute_never_matches_on_unix() {
    let tmp = TempDir::new().unwrap();
    let roots = vec![tmp.path().to_path_buf()];
    let policy = rule_policy(Some(&roots), DenyRule::globs([r"C:\Windows"]).unwrap());
    assert!(policy.check(&tmp.path().join("ok.txt")).is_ok());
}

/// P1：[DenyRule::globs] 非法 pattern 构造期返回校验错误（非 panic）
/// 条件：相对路径 / 空串 / `**/` 空尾 / 空组件
/// 断言：均返回 Err
#[test]
fn globs_reject_malformed_patterns() {
    for bad in ["relative/path", "", "**/", "**/x//y"] {
        assert!(
            DenyRule::globs([bad]).is_err(),
            "pattern {bad:?} must be rejected"
        );
    }
}

// ── reject_dangerous_chars ──

/// P0：[reject_dangerous_chars] 控制字符 / 零宽字符 / bidi 覆写 / U+2028 均被拒绝
/// 条件：路径分别含 \n、U+200B、U+202E、U+2028
/// 断言：全部返回 Err，消息含 "非法字符"
#[test]
fn reject_dangerous_chars_rejects_dangerous_input() {
    for bad in ["a\nb", "a\u{200B}b", "a\u{202E}b", "a\u{2028}b"] {
        let result = reject_dangerous_chars(Path::new(bad));
        let msg = result.unwrap_err().to_string();
        assert!(msg.contains("非法字符"), "input = {bad:?}, msg = {msg}");
    }
}

/// P1：[reject_dangerous_chars] 正常 CJK / 空格 / 点号路径通过
/// 条件：路径为 "子 目录/报告 v2.final.md"
/// 断言：返回 Ok
#[test]
fn reject_dangerous_chars_accepts_normal_cjk_path() {
    assert!(reject_dangerous_chars(Path::new("子 目录/报告 v2.final.md")).is_ok());
}

// ── is_under ──

/// P1：[is_under] 组件级前缀比对：同级前缀不误命中
/// 条件：/a/bc 与前缀 /a/b
/// 断言：不命中；/a/b/c 命中 /a/b
#[test]
fn is_under_compares_by_component() {
    assert!(!is_under(Path::new("/a/bc"), Path::new("/a/b")));
    assert!(is_under(Path::new("/a/b/c"), Path::new("/a/b")));
}

/// P1：[is_under] 大小写折叠分支：仅大小写差异在 macOS/Windows 命中
/// 条件：路径 /A/B/c 与前缀 /a/b
/// 断言：命中（折叠比对，fail closed on case-insensitive filesystems）
#[test]
#[cfg(any(target_os = "macos", windows))]
fn is_under_folds_case_on_case_insensitive_platforms() {
    assert!(is_under(Path::new("/A/B/c"), Path::new("/a/b")));
}

/// P1：[is_under] Linux 字节精确：仅大小写差异不命中
/// 条件：路径 /A/B/c 与前缀 /a/b
/// 断言：不命中（大小写敏感平台无折叠）
#[test]
#[cfg(all(unix, not(target_os = "macos")))]
fn is_under_is_byte_exact_on_linux() {
    assert!(!is_under(Path::new("/A/B/c"), Path::new("/a/b")));
}
