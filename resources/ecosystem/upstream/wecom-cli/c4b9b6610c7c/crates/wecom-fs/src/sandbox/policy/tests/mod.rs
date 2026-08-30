//! ## 模块摘要：policy（访问策略：推荐 deny 列表 + roots 校验 + 段级 deny + 危险字符筛查）
//!
//! ### 关键接口
//! - [Policy::new] + `with_*` builders — roots / deny 逐项构造（构造期解析 roots、快照 deny 状态）
//! - [DenyRule::new] / [DenyRule::prefix] / [DenyRule::globs] — 自定义谓词 / 固定目录 / glob 预设构造（克隆跨 Policy 共享，零 syscall；非法 glob 模式返回校验错误）
//! - [Policy::with_recommended_deny] — 追加推荐基线（recommended_deny_rule）
//! - [Policy::check] — 唯一「是否允许」判定入口：解析 + deny + roots
//! - [Policy::check] — 唯一判定入口：解析 + deny + roots
//! - [recommended_deny_rule] / [COMMON_DENY_GLOBS] — 内建 deny 表（固定系统目录经 prefix + 凭据形状经 glob）与推荐规则
//! - [reject_dangerous_chars] — 拒绝控制 / 零宽 / bidi 字符（Windows 另拒 ADS 冒号）
//!
//! ### 关键分支与异常路径
//! - roots=None → 跳过 roots 校验，deny 仍生效
//! - 路径逃逸 roots（含 .. 注入）→ Err("目标路径超出可访问范围")
//! - 路径命中 deny（前缀 / 符号链接 / 段级规则）→ Err("安全策略保护")
//! - 形状 deny（.env / id_rsa / *.pem / .git / .ssh / .azure 段、.gitconfig / history 文件名、.config+gh 等连续序列，任意深度）→ opt-in 双向规则，覆盖矩阵见 tests/denylist.rs
//! - deny 项构造后被替换同名目录 → 仍按启动快照（解析后的路径前缀）拒绝
//! - root symlink 构造后被换向 → 按启动快照位置判定，allow 边界不漂移
//! - 家目录凭据项锚定 env home 单基座：HOME 挪动 → 条目跟随挪动
//! - 危险字符报错带码点（"路径包含非法字符 U+XXXX: <原路径>"）
//!
//! ### 上下游交互
//! - 上游：sandbox/mod.rs（check_readable / check_writable）、[super::io]（每个原语先 check）
//! - 下游：[super::paths::resolve_real_path]、`std::fs` 的 metadata

use std::fs as stdfs;

use tempfile::TempDir;

use super::*;

mod denylist;

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

/// Platform-native absolute fake root for check-logic tests (the target
/// need not exist; only path arithmetic is exercised).
fn fake_root() -> PathBuf {
    if cfg!(windows) {
        PathBuf::from(r"C:\home\user\project")
    } else {
        PathBuf::from("/home/user/project")
    }
}

/// Platform-native absolute path outside [`fake_root`].
fn outside_path() -> &'static Path {
    if cfg!(windows) {
        Path::new(r"C:\etc\passwd")
    } else {
        Path::new("/etc/passwd")
    }
}

/// Test shorthand: build a [`Policy`] from raw roots and raw deny paths.
fn policy(roots: Option<&[PathBuf]>, deny: &[PathBuf]) -> Policy {
    let p = Policy::new();
    let p = if deny.is_empty() {
        p
    } else {
        p.with_deny(
            DenyRule::globs(
                deny.iter()
                    .map(|d| d.to_string_lossy().into_owned())
                    .collect::<Vec<_>>(),
            )
            .expect("test deny globs must compile"),
        )
    };
    match roots {
        Some(roots) => {
            let refs: Vec<&Path> = roots.iter().map(PathBuf::as_path).collect();
            p.with_allowed_dirs(&refs)
        }
        None => p,
    }
}

// ── Policy::check：roots ──

/// P1：[Policy::new] 无 roots 无 deny 时构造出完全无限制的策略
/// 条件：roots 为 None、deny 为空
/// 断言：roots() 为 None，任意路径 check 通过
#[test]
fn unrestricted_policy_has_no_roots() {
    let policy = policy(None, &[]);
    assert!(policy.roots().is_none());
    assert!(policy.check(Path::new("/tmp")).is_ok());
}

/// P0：[Policy::check] 根目录下的绝对路径通过校验并返回解析后路径
/// 条件：文件位于临时根目录的子目录下
/// 断言：返回 Ok，路径以 "output/result.json" 结尾
#[test]
fn check_absolute_under_root() {
    let tmp = TempDir::new().unwrap();
    let roots = vec![tmp.path().to_path_buf()];
    let file = tmp.path().join("output/result.json");
    let real = policy(Some(&roots), &[]).check(&file).unwrap();
    assert!(
        real.ends_with("output/result.json"),
        "real = {}",
        real.display()
    );
}

/// P0：[Policy::check] 含 ./ 的路径通过校验并正确解析
/// 条件：使用 ./data/file.txt 形式的路径
/// 断言：返回 Ok，解析后不含 ./
#[test]
fn check_dot_path() {
    let tmp = TempDir::new().unwrap();
    let roots = vec![tmp.path().to_path_buf()];
    let joined = tmp.path().join("./data/file.txt");
    let real = policy(Some(&roots), &[]).check(&joined).unwrap();
    assert!(real.ends_with("data/file.txt"), "real = {}", real.display());
}

/// P0：[Policy::check] 内部 .. 段（不越界）通过校验
/// 条件：路径包含 sub/../other 仍在根目录内
/// 断言：返回 Ok，解析后指向 other 目录
#[test]
fn check_inner_dotdot_stays_in_root() {
    let tmp = TempDir::new().unwrap();
    let roots = vec![tmp.path().to_path_buf()];
    let joined = tmp.path().join("sub/../other/file.txt");
    let real = policy(Some(&roots), &[]).check(&joined).unwrap();
    assert!(
        real.ends_with("other/file.txt"),
        "real = {}",
        real.display()
    );
}

/// P0：[Policy::check] 多根目录时文件位于额外根目录下通过校验
/// 条件：配置两个根目录，文件位于第二个根目录
/// 断言：返回 Ok
#[test]
fn check_allows_path_under_extra_root() {
    let tmp1 = TempDir::new().unwrap();
    let tmp2 = TempDir::new().unwrap();
    let roots = vec![tmp1.path().to_path_buf(), tmp2.path().to_path_buf()];
    let file = tmp2.path().join("upload.bin");
    let real = policy(Some(&roots), &[]).check(&file).unwrap();
    assert!(real.ends_with("upload.bin"), "real = {}", real.display());
}

/// P1：[Policy::check] 利用 .. 越出根目录被拒绝
/// 条件：路径通过 ../../../etc/passwd 尝试逃逸
/// 断言：返回 Err，消息含 "目标路径超出可访问范围"
#[test]
fn check_rejects_escape() {
    let root = fake_root();
    let roots = vec![root.clone()];
    let joined = root.join("../../../etc/passwd");
    let err = policy(Some(&roots), &[]).check(&joined);
    let msg = err.unwrap_err().to_string();
    assert!(msg.contains("目标路径超出可访问范围"), "msg = {msg}");
}

/// P1：[Policy::check] 根目录外的绝对路径被拒绝
/// 条件：路径为 /etc/passwd，根目录为 /home/user/project
/// 断言：返回 Err(Permission)，消息含 "目标路径超出可访问范围"
#[test]
fn check_rejects_absolute_outside_roots() {
    let roots = vec![fake_root()];
    let err = policy(Some(&roots), &[]).check(outside_path());
    assert!(matches!(err, Err(Error::Permission(_))), "err = {err:?}");
    assert!(
        err.unwrap_err()
            .to_string()
            .contains("目标路径超出可访问范围")
    );
}

/// P1：[Policy::check] 深层嵌套的 .. 段逃逸被拒绝
/// 条件：路径通过 a/b/../../../../.. 越出根目录
/// 断言：返回 Err
#[test]
fn check_rejects_sneaky_dotdot() {
    let root = fake_root();
    let roots = vec![root.clone()];
    let joined = root.join("a/b/../../../../etc/shadow");
    assert!(policy(Some(&roots), &[]).check(&joined).is_err());
}

/// P1：[Policy::check] 路径不在任何根目录下时被拒绝
/// 条件：配置两个根目录，路径为 /etc/passwd 均不匹配
/// 断言：返回 Err
#[test]
fn check_rejects_path_outside_all_roots() {
    let second = if cfg!(windows) {
        PathBuf::from(r"C:\tmp\wecom")
    } else {
        PathBuf::from("/tmp/wecom")
    };
    let roots = vec![fake_root(), second];
    assert!(policy(Some(&roots), &[]).check(outside_path()).is_err());
}

/// P1：[Policy] roots 为启动快照 —— 构造后 root symlink 换向，allow 边界不漂移
/// 条件：root 经 link → real_a 配置，构造 Policy 后 link 换向 real_b
/// 断言：real_a 下路径仍 Ok（构造期 pin 的位置），real_b 下路径 Err(Permission)
#[test]
#[cfg(unix)]
fn roots_are_resolved_at_construction() {
    let tmp = TempDir::new().unwrap();
    let real_a = tmp.path().join("real_a");
    let real_b = tmp.path().join("real_b");
    stdfs::create_dir_all(&real_a).unwrap();
    stdfs::create_dir_all(&real_b).unwrap();
    let link = tmp.path().join("link");
    std::os::unix::fs::symlink(&real_a, &link).unwrap();

    let policy = policy(Some(std::slice::from_ref(&link)), &[]);
    stdfs::remove_file(&link).unwrap();
    std::os::unix::fs::symlink(&real_b, &link).unwrap();

    // The boundary stays where construction pinned it: the swap target
    // real_b is NOT authorised.
    assert!(policy.check(&real_a.join("f.txt")).is_ok());
    let err = policy.check(&real_b.join("f.txt"));
    assert!(matches!(err, Err(Error::Permission(_))), "err = {err:?}");
}

// ── Policy::check：deny ──

/// P1：[Policy::check] deny 项优先于 roots，即使 deny 位于 root 之内
/// 条件：root 为临时目录，deny 为该目录下的子目录
/// 断言：deny 子目录内路径返回 Err(Permission)，root 内其他路径 Ok
#[test]
fn deny_wins_over_roots() {
    let root = TempDir::new().unwrap();
    let secret = root.path().join("secret");
    stdfs::create_dir_all(&secret).unwrap();
    let roots = vec![root.path().to_path_buf()];
    let policy = policy(Some(&roots), std::slice::from_ref(&secret));

    let err = policy.check(&secret.join("token"));
    assert!(matches!(err, Err(Error::Permission(_))), "err = {err:?}");
    assert!(policy.check(&root.path().join("ok.txt")).is_ok());
}

/// P1：[Policy] deny 为启动快照 —— 构造后重建同名 deny 目录仍被拒绝
/// 条件：构造 Policy 后删除并重建同名 deny 目录
/// 断言：新目录下的路径依然按构造期解析的路径前缀被拒绝
#[test]
fn deny_pattern_is_snapshotted_at_construction() {
    let root = TempDir::new().unwrap();
    let secret = root.path().join("secret");
    stdfs::create_dir_all(&secret).unwrap();
    let roots = vec![root.path().to_path_buf()];
    let policy = policy(Some(&roots), std::slice::from_ref(&secret));

    // Replace the denied directory: same resolved path, new directory.
    stdfs::remove_dir_all(&secret).unwrap();
    stdfs::create_dir_all(&secret).unwrap();

    let err = policy.check(&secret.join("token"));
    assert!(matches!(err, Err(Error::Permission(_))), "err = {err:?}");
}

/// P0：[Policy::check] roots=None 时默认 denylist 仍拒绝系统目录
/// 条件：roots 为 None，deny 为默认列表，目标为平台 deny 样本
/// 断言：返回 Err，消息含 "安全策略保护"
#[test]
fn check_denies_system_dir_even_when_unrestricted() {
    let policy = Policy::new().with_recommended_deny();
    let result = policy.check(&denied_sample());
    let msg = result.unwrap_err().to_string();
    assert!(msg.contains("安全策略保护"), "msg = {msg}");
}

/// P0：[Policy::check] deny 压过 allow（allow root 为文件系统根仍拒绝）
/// 条件：roots = [平台文件系统根]，deny 为默认列表，目标为平台 deny 样本
/// 断言：返回 Err
#[test]
fn check_deny_overrides_allow_root() {
    let roots: Vec<&Path> = vec![if cfg!(windows) {
        Path::new(r"C:\")
    } else {
        Path::new("/")
    }];
    let policy = Policy::new()
        .with_allowed_dirs(&roots)
        .with_recommended_deny();
    assert!(policy.check(&denied_sample()).is_err());
}

/// P1：[Policy::check] 符号链接逃逸进 deny 目录被拒绝
/// 条件：沙箱内 link → secret（deny 项），目标为 link/key.pem
/// 断言：解析后落在 deny 项内，返回 Err，消息含 "安全策略保护"
#[test]
#[cfg(unix)]
fn check_deny_catches_symlink_escape_into_denied_dir() {
    let tmp = TempDir::new().unwrap();
    let secret = tmp.path().join("secret");
    stdfs::create_dir(&secret).unwrap();
    std::os::unix::fs::symlink(&secret, tmp.path().join("link")).unwrap();

    let roots = vec![tmp.path().to_path_buf()];
    let target = tmp.path().join("link/key.pem");
    let result = policy(Some(&roots), &[secret]).check(&target);
    let msg = result.unwrap_err().to_string();
    assert!(msg.contains("安全策略保护"), "msg = {msg}");
}

/// P2：[Policy::check] 不存在的 deny 项不影响正常路径
/// 条件：deny 项不存在，目标为沙箱内正常文件
/// 断言：返回 Ok
#[test]
fn check_deny_nonexistent_entry_is_harmless() {
    let tmp = TempDir::new().unwrap();
    let file = tmp.path().join("ok.txt");
    stdfs::write(&file, "x").unwrap();
    let deny = vec![tmp.path().join("nope")];
    assert!(policy(None, &deny).check(&file).is_ok());
}

// ── 形状 deny（内建凭据形状，双向；覆盖矩阵见 tests/denylist.rs）──

/// 构造带内建形状 deny 的策略（roots 之外无 caller deny 项）。
fn policy_with_shape_deny(roots: Option<&[PathBuf]>) -> Policy {
    policy(roots, &[]).with_deny(recommended_deny_rule())
}

/// P1：[Policy::check] 形状规则是 opt-in：未挂形状规则的 Policy 放行凭据形状路径
/// 条件：无 deny 项的策略，roots 为临时目录
/// 断言：.env / report.pem / .git/config 均 Ok（形状拦截完全由接线决定；
///       生产 workspace 接线读写两个方向都挂，见 default_workspace_fs）
#[test]
fn shape_deny_is_opt_in() {
    let tmp = TempDir::new().unwrap();
    let roots = vec![tmp.path().to_path_buf()];
    let policy = policy(Some(&roots), &[]);
    for target in [
        tmp.path().join("sub/.env"),
        tmp.path().join("report.pem"),
        tmp.path().join(".git/config"),
    ] {
        assert!(
            policy.check(&target).is_ok(),
            "target = {}",
            target.display()
        );
    }
}

/// P1：[Policy::check] 形状比对的大小写折叠与 is_under 同规则（fold_case_if_needed 共用）
/// 条件：带形状 deny 的策略，目标为 ".SSH" / ".Env"（大写拼法）
/// 断言：大小写不敏感平台（macOS/Windows）拒绝；其余平台放行（大小写敏感文件系统不错杀）
#[test]
fn shape_deny_folds_case_like_is_under() {
    let tmp = TempDir::new().unwrap();
    let roots = vec![tmp.path().to_path_buf()];
    let policy = policy_with_shape_deny(Some(&roots));
    let upper_ssh = tmp.path().join("proj/.SSH/key");
    let upper_env = tmp.path().join("proj/.Env");
    if cfg!(any(target_os = "macos", windows)) {
        assert!(policy.check(&upper_ssh).is_err());
        assert!(policy.check(&upper_env).is_err());
    } else {
        assert!(policy.check(&upper_ssh).is_ok());
        assert!(policy.check(&upper_env).is_ok());
    }
}

/// P2：[Policy::with_allowed_dirs] 相对 root 在 debug 构建下 panic
/// 条件：root 为相对路径（契约要求绝对输入）
/// 断言：debug_assert 触发（相对 root 静默全域拒绝，必须在测试期响亮暴露；
///       release 构建不断言，故用例仅 debug 下编译）
#[cfg(debug_assertions)]
#[test]
#[should_panic(expected = "sandbox root must be absolute")]
fn allowed_dirs_relative_root_panics_in_debug() {
    let _ = Policy::new().with_allowed_dirs(&[Path::new("no/such/ancestor/rel-root")]);
}

// ── DenyRule::globs 校验（运行期输入的 fallible 入口） ──

/// P1：[DenyRule::globs] 合法模式返回 Ok 并按规则拒绝命中路径
/// 条件：混合绝对前缀与 **/ 形状、*.ext 条目
/// 断言：编译 Ok；命中路径被拒，未命中路径放行
#[test]
fn globs_accepts_valid_patterns() {
    let tmp = TempDir::new().unwrap();
    let secret = tmp.path().join("vault");
    stdfs::create_dir_all(&secret).unwrap();

    let rule = DenyRule::globs([
        secret.to_string_lossy().into_owned(),
        "**/hidden".to_string(),
        "**/*.vault".to_string(),
    ])
    .expect("valid patterns must compile");

    let policy = Policy::new()
        .with_allowed_dirs(&[tmp.path()])
        .with_deny(rule);
    assert!(policy.check(&secret.join("k.txt")).is_err());
    assert!(policy.check(&tmp.path().join("a/hidden/x")).is_err());
    assert!(policy.check(&tmp.path().join("a/data.vault")).is_err());
    assert!(policy.check(&tmp.path().join("ok.txt")).is_ok());
}

/// P0：[DenyRule::prefix] 固定目录规则拒绝目录自身及其下路径，放行兄弟路径
/// 条件：以临时目录下的 vault 为 deny 目录（构造不返回值——infallible）
/// 断言：vault 自身与 vault/k.txt 被拒；同级 ok.txt 与无关路径放行；报错含「安全策略保护」
#[test]
fn prefix_denies_dir_and_children() {
    let tmp = TempDir::new().unwrap();
    let vault = tmp.path().join("vault");
    stdfs::create_dir_all(&vault).unwrap();

    let policy = Policy::new()
        .with_allowed_dirs(&[tmp.path()])
        .with_deny(DenyRule::prefix(&vault));

    for denied_path in [&vault, &vault.join("k.txt")] {
        let err = policy.check(denied_path).unwrap_err();
        assert!(
            err.to_string().contains("安全策略保护"),
            "{denied_path:?}: err = {err}"
        );
    }
    assert!(policy.check(&tmp.path().join("ok.txt")).is_ok());
    assert!(policy.check(&tmp.path().join("vaults/x.txt")).is_ok());
}

/// P1：[DenyRule::prefix] 构造期解析 symlink（与绝对 glob 前缀同语义）
/// 条件：deny 目录经 symlink 指向真实目录，访问真实目录下路径
/// 断言：真实目录下路径被拒（构造期 resolve 一次，零 syscall per check）
#[cfg(unix)]
#[test]
fn prefix_resolves_symlink_at_construction() {
    let tmp = TempDir::new().unwrap();
    let real = tmp.path().join("real-vault");
    stdfs::create_dir_all(&real).unwrap();
    let link = tmp.path().join("link-vault");
    std::os::unix::fs::symlink(&real, &link).unwrap();

    let policy = Policy::new()
        .with_allowed_dirs(&[tmp.path()])
        .with_deny(DenyRule::prefix(&link));

    assert!(policy.check(&real.join("k.txt")).is_err());
}

/// P1：[DenyRule::globs] 非法模式逐类返回中文校验错误而非 panic
/// 条件：空串、相对非 **/ 开头、空组件、空扩展名
/// 断言：均返回 Err 且消息点名违规条目
#[test]
fn globs_rejects_malformed_patterns() {
    for (bad, expect) in [
        ("", "不能为空"),
        ("vault", "必须是绝对路径"),
        ("**/a//b", "空的路径组件"),
        ("**/*.", "扩展名为空"),
    ] {
        let err =
            DenyRule::globs([bad.to_string()]).expect_err("malformed pattern must be rejected");
        let msg = err.to_string();
        assert!(msg.contains(expect), "pattern {bad:?}: msg = {msg}");
        assert!(
            bad.is_empty() || msg.contains(bad),
            "message should name the offending entry: msg = {msg}"
        );
    }
}

// ── reject_dangerous_chars 文案 ──

/// P1：[reject_dangerous_chars] 错误消息标出违规字符的码点
/// 条件：路径 "ab" + U+200B + "c"
/// 断言：消息含 "非法字符" 与 "U+200B"
#[test]
fn reject_dangerous_chars_reports_codepoint_and_offset() {
    let err = reject_dangerous_chars(Path::new("ab\u{200B}c")).unwrap_err();
    let msg = err.to_string();
    assert!(msg.contains("非法字符"), "msg = {msg}");
    assert!(msg.contains("U+200B"), "msg = {msg}");
}
