//! ## 模块摘要：sandbox 解析入口（读路径存在性校验、写路径校验、目录形态校验）
//!
//! ### 关键接口
//! - [SandboxedFs::resolve_readable] — 读路径解析 + 存在性要求
//! - [SandboxedFs::check_writable] — 写路径解析（目标可不存在）
//! - [SandboxedFs::resolve_writable_dir] — 同上并要求目标为目录
//!
//! ### 关键分支与异常路径
//! - 直接命中且文件存在 → 原样返回
//! - 路径逃逸 roots → Err("目标路径超出可访问范围")
//! - roots 内但目标不存在 → Err("找不到目标文件")
//! - typo 路径按不存在处理
//! - 目标路径是已存在文件而非目录 → Err("无效目录路径")（resolve_writable_dir）
//! - 非 UTF-8 路径 → 所有操作入口统一拒绝（Err 含 "非 UTF-8"）
//!
//! ### 上下游交互
//! - 上游：Fs trait 的 resolve 统一入口（按 FsAccess 分派）
//! - 下游：sandbox::policy 的 Policy::check、sandbox::paths 的存在性探针

use std::fs as stdfs;

use tempfile::TempDir;

use super::fs_with_roots;
use crate::sandbox::*;

// ── resolve_readable ──

/// P0：[SandboxedFs::resolve_readable] 直接解析成功（限制模式）
/// 条件：文件在 readable roots 内且正常可读
/// 断言：返回 Ok，结果路径以原文件名结尾
#[tokio::test]
async fn resolve_readable_direct_success_restricted() {
    let tmp = TempDir::new().unwrap();
    let file = tmp.path().join("good.txt");
    stdfs::write(&file, "data").unwrap();

    let fs = fs_with_roots(&[tmp.path()]);
    let result = fs.resolve_readable(&file.to_string_lossy()).await.unwrap();
    assert!(result.ends_with("good.txt"));
}

/// P0：[SandboxedFs::resolve_readable] 直接解析成功（无限制模式）
/// 条件：文件存在，SandboxedFs 无限制
/// 断言：返回 Ok，路径正确
#[tokio::test]
async fn resolve_readable_direct_success_unrestricted() {
    let tmp = TempDir::new().unwrap();
    let file = tmp.path().join("hello.txt");
    stdfs::write(&file, "world").unwrap();

    let fs = SandboxedFs::new();
    let result = fs.resolve_readable(&file.to_string_lossy()).await.unwrap();
    assert!(result.ends_with("hello.txt"));
}

/// P1：[SandboxedFs::resolve_readable] 限制模式：路径在 roots 外 → 保留逃逸错误
/// 条件：文件存在但不在任何 readable root 下
/// 断言：返回 Err，错误信息包含 "目标路径超出可访问范围"
#[tokio::test]
async fn resolve_readable_outside_roots_permission_denied() {
    let allowed = TempDir::new().unwrap();
    let outside = TempDir::new().unwrap();
    let file = outside.path().join("orphan.txt");
    stdfs::write(&file, "data").unwrap();

    let fs = fs_with_roots(&[allowed.path()]);
    let result = fs.resolve_readable(&file.to_string_lossy()).await;
    assert!(result.is_err());
    let msg = result.unwrap_err().to_string();
    assert!(
        msg.contains("目标路径超出可访问范围"),
        "should preserve original escape error, msg = {msg}"
    );
}

/// P1：[SandboxedFs::resolve_readable] 限制模式：roots 内但文件不存在 → 报错
/// 条件：可读根 /root（空目录），路径 /root/nonexistent.md 文件不存在
/// 断言：返回 Err，错误信息包含 "找不到目标文件"
#[tokio::test]
async fn resolve_readable_restricted_nonexistent_errs() {
    let tmp = TempDir::new().unwrap();
    let root = tmp.path().join("root");
    stdfs::create_dir_all(&root).unwrap();

    let fs = fs_with_roots(&[root.as_path()]);
    let path = root.join("nonexistent.md");
    let result = fs.resolve_readable(&path.to_string_lossy()).await;
    assert!(result.is_err());
    let msg = result.unwrap_err().to_string();
    assert!(msg.contains("找不到目标文件"), "msg = {msg}");
}

/// P1：[SandboxedFs::resolve_readable] 无限制模式：文件不存在 → 报错
/// 条件：目录 /a 下无目标文件；SandboxedFs 无 roots
/// 断言：Err，错误信息包含 "找不到目标文件"
#[tokio::test]
async fn resolve_readable_unrestricted_nonexistent_errs() {
    let tmp = TempDir::new().unwrap();
    let a = tmp.path().join("a");
    stdfs::create_dir_all(&a).unwrap();
    stdfs::write(a.join("some_other_file.md"), "data").unwrap();

    let fs = SandboxedFs::new();
    let path = tmp.path().join("a/zzzzz_data.md");
    let result = fs.resolve_readable(&path.to_string_lossy()).await;
    assert!(result.is_err());
    let msg = result.unwrap_err().to_string();
    assert!(msg.contains("找不到目标文件"), "msg = {msg}");
}

/// P1：[SandboxedFs::resolve_readable] 文件名 typo 按不存在报错
/// 条件：沙箱内存在 "readme.txt"，请求 "readne.txt"（单字符替换）
/// 断言：Err，错误信息含 "找不到目标文件"
#[tokio::test]
async fn resolve_readable_typo_not_corrected() {
    let tmp = TempDir::new().unwrap();
    stdfs::write(tmp.path().join("readme.txt"), b"hi").unwrap();
    let fs = fs_with_roots(&[tmp.path()]);

    let typo = tmp.path().join("readne.txt");
    let result = fs.resolve_readable(typo.to_str().unwrap()).await;
    assert!(result.is_err());
    let msg = result.unwrap_err().to_string();
    assert!(msg.contains("找不到目标文件"), "msg = {msg}");
}

/// P1：[SandboxedFs::resolve_readable] 输入路径是已存在目录（非文件）也返回 Ok
/// 条件：目标目录在可读根内且存在
/// 断言：Ok（check_readable + exists() 对目录为 true）
#[tokio::test]
async fn resolve_readable_direct_ok_for_directory() {
    let tmp = TempDir::new().unwrap();
    let workspace = tmp.path().join("workspace");
    stdfs::create_dir_all(&workspace).unwrap();

    let fs = fs_with_roots(&[workspace.as_path()]);
    let result = fs
        .resolve_readable(&workspace.to_string_lossy())
        .await
        .unwrap();
    assert!(result.ends_with("workspace"), "got: {}", result.display());
}

// ── 非 UTF-8 路径统一拒绝 ──

/// P2：[SandboxedFs::resolve] 非 UTF-8 路径在所有操作入口统一拒绝
/// 条件：Unix 下构造含 0xFF 字节的绝对路径，分别经读/写入口调用
/// 断言：均返回 Err，消息含 "非 UTF-8"（不绕过危险字符筛查，见
///       chars.rs 只覆盖 UTF-8 拼写）
#[cfg(unix)]
#[tokio::test]
async fn resolve_rejects_non_utf8_path_on_all_entry_points() {
    use std::os::unix::ffi::OsStringExt;

    let tmp = TempDir::new().unwrap();
    let fs = fs_with_roots(&[tmp.path()]);

    let mut bytes = tmp.path().as_os_str().as_encoded_bytes().to_vec();
    bytes.extend_from_slice(b"/\xff.txt");
    let bad = std::path::PathBuf::from(std::ffi::OsString::from_vec(bytes));
    assert!(bad.to_str().is_none());

    for result in [
        fs.check_writable(&bad).await.map(|_| ()),
        fs.check_readable(&bad).await.map(|_| ()),
    ] {
        let msg = result
            .expect_err("non-UTF-8 path must be rejected")
            .to_string();
        assert!(msg.contains("非 UTF-8"), "msg = {msg}");
    }
}

// ── check_writable（FsAccess::Write 分派目标） ──

/// P0：[SandboxedFs::check_writable] 限制模式：roots 内路径直接通过
/// 条件：writable roots 包含 workspace，目标指向其下路径（不存在也允许）
/// 断言：返回 Ok，路径以原文件名结尾
#[tokio::test]
async fn check_writable_direct_success_restricted() {
    let tmp = TempDir::new().unwrap();
    let ws = tmp.path().join("workspace");
    stdfs::create_dir_all(&ws).unwrap();
    let fs = fs_with_roots(&[ws.as_path()]);
    let path = ws.join("out.json");
    let result = fs.check_writable(&path).await.expect("direct writable");
    assert!(result.ends_with("out.json"));
}

/// P1：[SandboxedFs::check_writable] 限制模式：超出沙箱 → Err
/// 条件：writable root 为 allowed，目标在允许范围外
/// 断言：Err，错误信息含 "目标路径超出可访问范围"
#[tokio::test]
async fn check_writable_outside_roots_permission_denied() {
    let allowed = TempDir::new().unwrap();
    let forbidden = TempDir::new().unwrap();
    let fs = fs_with_roots(&[allowed.path()]);
    let path = forbidden.path().join("out.json");
    let result = fs.check_writable(&path).await;
    assert!(result.is_err());
    let msg = result.unwrap_err().to_string();
    assert!(msg.contains("目标路径超出可访问范围"), "msg = {msg}");
}

/// P0：[SandboxedFs::check_writable] 无限制模式：不存在的路径直接通过
/// 条件：writable_dirs = None，路径不存在
/// 断言：Ok（无限制模式下不校验路径是否存在）
#[tokio::test]
async fn check_writable_unrestricted_nonexistent_path_ok() {
    let fs = SandboxedFs::new();
    // cwd-anchored: "/nonexistent_xyz/..." is not absolute on Windows and
    // would be rejected by the absolute-path check instead of passing through.
    let path = std::env::current_dir()
        .unwrap()
        .join("nonexistent_xyz/sub/file.txt");
    let result = fs
        .check_writable(&path)
        .await
        .expect("unrestricted mode accepts any path");
    assert!(result.to_string_lossy().contains("nonexistent_xyz"));
}

// ── resolve_writable_dir ──

/// P0：[SandboxedFs::resolve_writable_dir] 已存在目录通过
/// 条件：writable roots 包含 tmp，目标为已存在目录
/// 断言：Ok
#[tokio::test]
async fn resolve_writable_dir_existing_dir_ok() {
    let tmp = TempDir::new().unwrap();
    let dir = tmp.path().join("outputs");
    stdfs::create_dir_all(&dir).unwrap();
    let fs = fs_with_roots(&[tmp.path()]);
    let result = fs.resolve_writable_dir(&dir).await.expect("existing dir");
    assert!(result.ends_with("outputs"));
}

/// P0：[SandboxedFs::resolve_writable_dir] 不存在的目录也允许
/// 条件：目标目录尚未创建
/// 断言：Ok
#[tokio::test]
async fn resolve_writable_dir_nonexistent_ok() {
    let tmp = TempDir::new().unwrap();
    let dir = tmp.path().join("future_outputs");
    let fs = fs_with_roots(&[tmp.path()]);
    let result = fs
        .resolve_writable_dir(&dir)
        .await
        .expect("nonexistent dir should be allowed");
    assert!(result.ends_with("future_outputs"));
}

/// P1：[SandboxedFs::resolve_writable_dir] 目标为已存在文件 → Err
/// 条件：目标是一个普通文件
/// 断言：Err，错误信息含 "无效目录路径"
#[tokio::test]
async fn resolve_writable_dir_existing_file_err() {
    let tmp = TempDir::new().unwrap();
    let file = tmp.path().join("some_file.txt");
    stdfs::write(&file, b"data").unwrap();
    let fs = fs_with_roots(&[tmp.path()]);
    let result = fs.resolve_writable_dir(&file).await;
    assert!(result.is_err());
    let msg = result.unwrap_err().to_string();
    assert!(msg.contains("无效目录路径"), "msg = {msg}");
}

/// P1：[SandboxedFs::resolve_writable_dir] 校验的是 writable roots 而非 readable roots
/// 条件：readable 与 writable 指向不同目录，分别以两侧目录为目标
/// 断言：writable 目录 → Ok；仅 readable 的目录 → Err("目标路径超出可访问范围")
#[tokio::test]
async fn resolve_writable_dir_uses_writable_roots() {
    let read_dir = TempDir::new().unwrap();
    let write_dir = TempDir::new().unwrap();
    let fs = SandboxedFs::new()
        .with_read_policy(Policy::new().with_allowed_dirs(&[read_dir.path()]))
        .with_write_policy(Policy::new().with_allowed_dirs(&[write_dir.path()]));

    fs.resolve_writable_dir(write_dir.path())
        .await
        .expect("writable dir must pass");

    let msg = fs
        .resolve_writable_dir(read_dir.path())
        .await
        .expect_err("readable-only dir must be rejected")
        .to_string();
    assert!(msg.contains("目标路径超出可访问范围"), "msg = {msg}");
}
