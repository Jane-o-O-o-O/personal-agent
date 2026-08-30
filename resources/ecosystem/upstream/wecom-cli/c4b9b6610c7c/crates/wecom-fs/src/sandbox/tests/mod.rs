//! ## 模块摘要：sandbox::mod（SandboxedFs 门面：Policy 注入、同步校验入口与 blocking 跳板）
//!
//! ### 关键接口
//! - [SandboxedFs::new] / [SandboxedFs::with_policy] / [SandboxedFs::with_read_policy] / [SandboxedFs::with_write_policy] — 构造与 Policy 注入
//! - [Policy] — 读/写方向各自的策略对象（roots + deny 规则）
//! - [blocking] / [blocking_infallible] — 阻塞任务跳板（span 透传 + panic 映射）
//!
//! ### 关键分支与异常路径
//! - roots / deny 配置完全由调用方经 [Policy] 构造传入，无隐藏重建步骤
//! - 阻塞闭包 panic → Err(Other)，消息含 op 名
//!
//! ### 上下游交互
//! - 上游：Fs trait 实现（sandbox/fs_impl.rs）与各消费方
//! - 下游：sandbox::policy 的 Policy、sandbox::io

mod checks;
mod fs_trait;
mod ops;
mod resolve;

use super::*;
use crate::api::Error;

/// Test shorthand: a `SandboxedFs` with the same allowed roots on both
/// directions and no denylist.
pub fn fs_with_roots(roots: &[&Path]) -> SandboxedFs {
    SandboxedFs::new().with_policy(Policy::new().with_allowed_dirs(roots))
}

/// Test shorthand: write-restricted to `roots`, read unrestricted.
pub fn fs_with_write_roots(roots: &[&Path]) -> SandboxedFs {
    SandboxedFs::new().with_write_policy(Policy::new().with_allowed_dirs(roots))
}

/// Test shorthand: read-restricted to `roots`, write unrestricted.
pub fn fs_with_read_roots(roots: &[&Path]) -> SandboxedFs {
    SandboxedFs::new().with_read_policy(Policy::new().with_allowed_dirs(roots))
}

/// P1：[SandboxedFs::with_policy] 限定 roots 后沙箱外路径读写均被拒绝
/// 条件：先无限制构造，再以 with_policy 限定到 tmp
/// 断言：限定前放行；限定后沙箱外路径读写均 Err
#[tokio::test]
async fn with_policy_confines_both_directions() {
    let tmp = tempfile::tempdir().unwrap();
    let outside = tempfile::tempdir().unwrap();

    let unrestricted = SandboxedFs::new();
    assert!(unrestricted.check_readable(outside.path()).await.is_ok());

    let restricted = unrestricted.with_policy(Policy::new().with_allowed_dirs(&[tmp.path()]));
    assert!(restricted.check_readable(outside.path()).await.is_err());
    assert!(restricted.check_writable(outside.path()).await.is_err());
}

/// P1：[Policy::with_deny] 设定的 deny 规则立即生效
/// 条件：root 内子目录经 DenyRule::globs 设为 denylist
/// 断言：该子目录内路径读写均被拒绝，root 内其他路径仍可用
#[tokio::test]
async fn deny_dirs_take_effect_immediately() {
    let tmp = tempfile::tempdir().unwrap();
    let secret = tmp.path().join("secret");
    std::fs::create_dir_all(&secret).unwrap();

    let fs = SandboxedFs::new().with_policy(
        Policy::new()
            .with_allowed_dirs(&[tmp.path()])
            .with_deny(DenyRule::globs([secret.to_string_lossy().into_owned()]).unwrap()),
    );

    assert!(fs.check_readable(secret.join("token")).await.is_err());
    assert!(fs.check_writable(secret.join("token")).await.is_err());
    assert!(fs.check_readable(tmp.path().join("ok.txt")).await.is_ok());
}

// ── blocking 跳板 ──

/// P0：[blocking] 闭包成功时透传返回值
/// 条件：闭包返回 Ok(42)
/// 断言：得到 42
#[tokio::test]
async fn blocking_passes_through_ok() {
    let v = blocking("test_op", || Ok(42u32)).await.unwrap();
    assert_eq!(v, 42);
}

/// P1：[blocking] 闭包返回 Err 时透传原错误，不误判为 panic
/// 条件：闭包返回 Err(Permission)
/// 断言：得到 Err(Permission)，消息为原始内容
#[tokio::test]
async fn blocking_passes_through_inner_error() {
    let r: Result<u32> = blocking("test_op", || Err(Error::Permission("denied".to_string()))).await;
    assert!(
        matches!(&r, Err(Error::Permission(m)) if m == "denied"),
        "r = {r:?}"
    );
}

/// P1：[blocking] 闭包 panic 时映射为 Other 并带上 op 名
/// 条件：闭包内 panic
/// 断言：得到 Err，消息包含 op 名与 "task panicked"
#[tokio::test]
async fn blocking_maps_panic_to_other_with_op_name() {
    let r: Result<u32> = blocking("my_op", || panic!("boom")).await;
    let msg = r.expect_err("panic should surface as an error").to_string();
    assert!(msg.contains("my_op"), "msg = {msg}");
    assert!(msg.contains("task panicked"), "msg = {msg}");
}

/// P1：[blocking_infallible] 透传闭包返回值
/// 条件：闭包返回 bool
/// 断言：得到该值
#[tokio::test]
async fn blocking_infallible_passes_through_value() {
    assert!(blocking_infallible("probe", || true).await.unwrap());
}
