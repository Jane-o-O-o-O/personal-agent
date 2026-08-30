//! Path layer: the **only** module allowed to touch the filesystem by path.
//!
//! Everything else in the sandbox operates relative to a pinned
//! `cap_std::fs::Dir` handle (see [`super::io`]).  A handle cannot exist before
//! someone mints it from ambient authority, so this module holds the four
//! things that must happen *before* — or entirely outside — a handle:
//!
//! - [`resolve_real_path`] — follow symlinks to the real on-disk location, so
//!   [`Policy::check`](super::policy::Policy::check) can compare the target
//!   against the denylist.  `cap-std` cannot do this: it silently follows
//!   in-root symlinks (it only guarantees "not outside the root"), so a
//!   handle-relative view would never see that `cwd/link` lands in `~/.ssh`.
//! - [`exists`] / [`is_dir`] — existence probes for read-target verification
//!   and writable-directory validation.
//!
//! # Contract
//!
//! Functions here may **reason about** paths — resolve and probe only.  They
//! must never open, read, write, rename, unlink or mkdir: that is
//! [`super::io`]'s job, and it always goes through a handle (its one
//! exception, the pre-handle mkdir in `acquire`, is annotated there).  The
//! `#[allow(clippy::disallowed_methods)]` annotations below are scoped per
//! function and each carries a `SAFETY:` note; `crates/wecom-fs/.clippy.toml`
//! rejects the same calls everywhere else in the crate.

use std::path::{Component, Path, PathBuf};

/// Resolve a path to its real location on disk, following symlinks.
///
/// - If the full path exists, `canonicalize` is used.
/// - If the path does not exist yet, the deepest existing ancestor is
///   canonicalised and the remaining non-existent tail segments are normalised
///   and appended.
///
/// SAFETY: bootstrap path reasoning — resolves names only, opens nothing.
#[allow(clippy::disallowed_methods)]
pub(super) fn resolve_real_path(path: &Path) -> PathBuf {
    // Fast path: the full path exists.
    if let Ok(real) = path.canonicalize() {
        return real;
    }

    // Walk up until we find an ancestor that exists.
    let normalised = normalize_path(path);
    let mut existing = normalised.as_path();
    let mut tail = Vec::new();

    loop {
        if existing.exists() {
            break;
        }
        match existing.file_name() {
            Some(seg) => {
                tail.push(seg.to_os_string());
                existing = existing.parent().unwrap_or(existing);
            }
            None => break, // root or empty — nothing more to pop
        }
    }

    // Canonicalise the existing prefix (resolves symlinks).
    let mut result = existing
        .canonicalize()
        .unwrap_or_else(|_| existing.to_path_buf());

    // Re-attach the non-existent tail in reverse order.
    for seg in tail.into_iter().rev() {
        result.push(seg);
    }
    result
}

/// Logically normalise a path by resolving `.` and `..` components
/// **without** touching the filesystem.
pub(super) fn normalize_path(path: &Path) -> PathBuf {
    let mut out = PathBuf::new();
    for comp in path.components() {
        match comp {
            Component::CurDir => {} // skip "."
            Component::ParentDir => {
                out.pop();
            }
            _ => out.push(comp),
        }
    }
    out
}

/// Whether `path` currently exists (following symlinks).
///
/// SAFETY: bootstrap path probe for post-check target verification
/// (read-target existence, writable-directory shape); opens nothing.
#[allow(clippy::disallowed_methods)]
pub(super) fn exists(path: &Path) -> bool {
    path.exists()
}

/// Whether `path` exists **and** is a directory (following symlinks).
///
/// SAFETY: see [`exists`].
#[allow(clippy::disallowed_methods)]
pub(super) fn is_dir(path: &Path) -> bool {
    path.is_dir()
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    //! ## 模块摘要：paths（沙箱唯一的按路径访问层：解析 / 探测）
    //!
    //! ### 关键接口
    //! - [resolve_real_path] — 解析真实路径（跟随符号链接，最深存在祖先回退）
    //! - [normalize_path] — 逻辑归一化路径（折叠 . 与 ..）
    //! - [exists] / [is_dir] — 校验后目标验证用的存在性探针
    //!
    //! ### 关键分支与异常路径
    //! - 已存在路径 → canonicalize 结果
    //! - 不存在路径 → 最深存在祖先 canonicalize + 尾部段原样拼回
    //! - 完全不存在路径（无存在祖先）→ 保留原始名称段
    //!
    //! ### 上下游交互
    //! - 上游：[super::policy]（check 时解析真实路径）、sandbox/mod.rs（存在性探针）
    //! - 下游：`std::fs` 的 canonicalize / exists / is_dir（路径推理的唯一豁免点）

    use std::fs as stdfs;

    use tempfile::TempDir;

    use super::*;

    // ── normalize_path ──

    /// P0：[normalize_path] 路径中的 . 段被正确移除
    /// 条件：输入 "/a/./b"
    /// 断言：normalize_path 返回 "/a/b"
    #[test]
    fn normalize_removes_dot() {
        assert_eq!(normalize_path(Path::new("/a/./b")), PathBuf::from("/a/b"));
    }

    /// P0：[normalize_path] 路径中的 .. 段被正确回退
    /// 条件：输入 "/a/b/../c"
    /// 断言：normalize_path 返回 "/a/c"
    #[test]
    fn normalize_resolves_dotdot() {
        assert_eq!(
            normalize_path(Path::new("/a/b/../c")),
            PathBuf::from("/a/c")
        );
    }

    /// P1：[normalize_path] 连续多个 .. 段被逐级回退
    /// 条件：输入 "/a/b/c/../../d"
    /// 断言：normalize_path 返回 "/a/d"
    #[test]
    fn normalize_multiple_dotdots() {
        assert_eq!(
            normalize_path(Path::new("/a/b/c/../../d")),
            PathBuf::from("/a/d")
        );
    }

    /// P1：[normalize_path] 根路径 "/" 归一化后不变
    /// 条件：输入 "/"
    /// 断言：返回 "/"
    #[test]
    fn normalize_root_only() {
        assert_eq!(normalize_path(Path::new("/")), PathBuf::from("/"));
    }

    /// P1：[normalize_path] 空路径归一化后仍为空
    /// 条件：输入 ""
    /// 断言：返回 ""
    #[test]
    fn normalize_empty_path() {
        assert_eq!(normalize_path(Path::new("")), PathBuf::from(""));
    }

    /// P1：[normalize_path] 无特殊段路径归一化后不变
    /// 条件：输入 "/a/b/c"
    /// 断言：返回 "/a/b/c"
    #[test]
    fn normalize_no_special_components() {
        assert_eq!(normalize_path(Path::new("/a/b/c")), PathBuf::from("/a/b/c"));
    }

    // ── resolve_real_path ──

    /// P0：[resolve_real_path] 已存在文件的路径解析为 canonicalize 结果
    /// 条件：文件已存在于临时目录
    /// 断言：resolve_real_path 返回值与 canonicalize 一致
    #[test]
    fn resolve_real_path_existing_file() {
        let tmp = TempDir::new().unwrap();
        let file = tmp.path().join("exists.txt");
        stdfs::write(&file, "hi").unwrap();
        let resolved = resolve_real_path(&file);
        // canonicalize resolves symlinks; on real fs it should match.
        assert_eq!(resolved, file.canonicalize().unwrap());
    }

    /// P1：[resolve_real_path] 不存在文件的路径保留文件名
    /// 条件：文件在临时目录中不存在
    /// 断言：解析结果包含原始文件名
    #[test]
    fn resolve_real_path_nonexistent_file() {
        let tmp = TempDir::new().unwrap();
        let file = tmp.path().join("does-not-exist.txt");
        let resolved = resolve_real_path(&file);
        // The parent exists, so it's canonicalised + the tail appended.
        assert!(
            resolved.to_string_lossy().contains("does-not-exist.txt"),
            "resolved = {}",
            resolved.display()
        );
    }

    /// P1：[resolve_real_path] 深层不存在路径保留完整尾部
    /// 条件：路径 a/b/c/d.txt 均不存在但父目录存在
    /// 断言：解析结果以 "a/b/c/d.txt" 结尾
    #[test]
    fn resolve_real_path_deep_nonexistent() {
        let tmp = TempDir::new().unwrap();
        let path = tmp.path().join("a/b/c/d.txt");
        let resolved = resolve_real_path(&path);
        // Use Path::ends_with to be cross-platform (handles `/` vs `\`).
        assert!(
            resolved.ends_with(Path::new("a/b/c/d.txt")),
            "resolved = {}",
            resolved.display()
        );
    }

    /// P1：[resolve_real_path] 对根路径 "/" 返回 "/"
    /// 条件：输入 "/"
    /// 断言：返回 "/"
    #[test]
    #[cfg(unix)]
    fn resolve_real_path_root_slash() {
        let resolved = resolve_real_path(Path::new("/"));
        assert_eq!(resolved, PathBuf::from("/"));
    }

    /// P1：[resolve_real_path] 对 Windows 根路径返回有效的根目录
    /// 条件：输入 "C:\\"
    /// 断言：解析结果存在
    #[test]
    #[cfg(windows)]
    fn resolve_real_path_root_slash() {
        let resolved = resolve_real_path(Path::new("C:\\"));
        assert!(resolved.exists(), "resolved = {}", resolved.display());
    }

    /// P1：[resolve_real_path] 正确解析含 .. 的路径
    /// 条件：路径 a/../b 在临时目录下
    /// 断言：结果包含 "b" 且不含 ".."
    #[test]
    fn resolve_real_path_with_dotdot_components() {
        let tmp = TempDir::new().unwrap();
        let path = tmp.path().join("a/../b");
        let resolved = resolve_real_path(&path);
        assert!(resolved.to_string_lossy().contains("b"));
        assert!(!resolved.to_string_lossy().contains(".."));
    }

    /// P1：[resolve_real_path] 完全不存在路径的解析保留原始文件名
    /// 条件：路径 ___nonexistent_test_xyz___/deep/path 均不存在
    /// 断言：解析结果仍保留原始名称段
    #[test]
    fn resolve_real_path_nonexistent_under_root() {
        // This path has no existing ancestors until we reach "/".
        // Walking up will eventually hit file_name() == None on "/".
        let resolved = resolve_real_path(Path::new("/___nonexistent_test_xyz___/deep/path"));
        assert!(
            resolved
                .to_string_lossy()
                .contains("___nonexistent_test_xyz___")
        );
    }

    /// P1：[resolve_real_path] 正确处理含 . 的路径
    /// 条件：路径 ./sub/./file.txt 在临时目录下
    /// 断言：结果不包含 "/./"
    #[test]
    fn resolve_real_path_with_dot_components() {
        // Tests that CurDir (`.`) is properly handled by normalize_path
        let tmp = TempDir::new().unwrap();
        let path = tmp.path().join("./sub/./file.txt");
        let resolved = resolve_real_path(&path);
        assert!(!resolved.to_string_lossy().contains("/./"));
    }

    // ── exists / is_dir ──

    /// P0：[exists] / [is_dir] 区分文件、目录与不存在路径
    /// 条件：临时目录下分别有子目录、普通文件，以及一个不存在的名字
    /// 断言：目录 exists+is_dir；文件 exists 但非 is_dir；不存在者两者皆假
    #[test]
    fn exists_and_is_dir_classify_targets() {
        let tmp = TempDir::new().unwrap();
        let dir = tmp.path().join("d");
        stdfs::create_dir(&dir).unwrap();
        let file = tmp.path().join("f.txt");
        stdfs::write(&file, "x").unwrap();
        let missing = tmp.path().join("missing");

        assert!(exists(&dir) && is_dir(&dir));
        assert!(exists(&file) && !is_dir(&file));
        assert!(!exists(&missing) && !is_dir(&missing));
    }
}
