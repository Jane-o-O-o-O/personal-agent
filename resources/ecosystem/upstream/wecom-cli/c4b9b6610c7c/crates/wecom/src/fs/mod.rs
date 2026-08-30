//! Filesystem capability re-exports and reqwest glue helpers.
//!
//! The [`Fs`] trait and its abstract types live in the `wecom-fs` crate (the
//! `api` module) and are re-exported here, so that business code and the
//! sandbox implementation share one capability definition.
//!
//! Business code depends only on the [`Fs`] trait — never on a concrete
//! implementation.  The implementation is injected by the caller when
//! building a [`crate::Client`] — one configured instance per domain
//! (private state vs. workspace); all path-resolution and access-control
//! semantics belong to the implementor.

mod reqwest_ext;

use std::path::{Path, PathBuf};

pub use wecom_fs::{
    DirEntry, FileMeta, FileReader, FileWriter, Fs, FsAccess, FsFuture, FsRead, FsWrite,
};

use crate::{Error, Result};

/// Absolutize an externally-derived path against `cwd`.
///
/// [`Fs`] implementations require absolute paths; relative input from CLI
/// arguments or model payloads is anchored here, at the construction
/// boundary, before the first [`Fs`] call.  The anchor is the owning
/// client's configured working directory ([`crate::Client::cwd`]), pinned
/// at client construction — never a late `std::env::current_dir()` read,
/// so the base cannot drift mid-run.  Pure path arithmetic — no
/// filesystem access, and no `.` / `..` folding (the implementor's
/// resolve step owns normalization).
pub fn absolutize(cwd: &Path, path: &Path) -> PathBuf {
    if path.is_absolute() {
        return path.to_path_buf();
    }
    cwd.join(path)
}

/// Sanitize a filename for safe use on all platforms.
///
/// Delegates to [`wecom_fs::sanitize_filename`]; retained so existing
/// `fs::sanitize_filename` call sites stay put.
pub fn sanitize_filename(name: &str) -> String {
    wecom_fs::sanitize_filename(name)
}

pub use reqwest_ext::{content_disposition_filename, open_as_multipart_part, stream_to_file};

/// Pre-flight check: verify that the file at `file_path` does not exceed
/// `max_size` bytes, so callers can fail fast on oversized files without
/// wasting network I/O.
pub async fn check_file_size_limit(fs: &dyn Fs, file_path: &Path, max_size: u64) -> Result<()> {
    let file_size = fs.metadata(file_path).await?.len;

    if file_size > max_size {
        tracing::warn!(file_size, limit = max_size, "file exceeds size limit");
        return Err(Error::validation(format!(
            "文件 \"{}\" 大小超过 {:.1} MB 限制",
            file_path.display(),
            max_size as f64 / 1_048_576.0,
        )));
    }

    Ok(())
}

/// Test doubles for this crate's unit tests. Working-filesystem tests use
/// [`wecom_fs::SandboxedFs`] directly; [`ErrFs`] covers rejection propagation.
#[cfg(test)]
pub(crate) mod testing {
    use std::future::Future;
    use std::path::{Path, PathBuf};
    use std::pin::Pin;

    use wecom_fs::{DirEntry, Error, FileMeta, FileReader, FileWriter, FsAccess, Result};

    use super::Fs;

    /// Filesystem stub whose every operation fails with [`Error::Permission`],
    /// for testing error propagation through consumers.
    #[derive(Debug, Default)]
    pub(crate) struct ErrFs;

    impl ErrFs {
        fn reject<T>(path: &Path) -> Result<T> {
            Err(Error::Permission(format!(
                "目标路径超出可访问范围: {}",
                path.display()
            )))
        }
    }

    impl Fs for ErrFs {
        /// 全部拒绝的测试替身：准入入口同样拒绝。
        fn resolve<'a>(
            &'a self,
            path: &'a Path,
            _access: FsAccess,
        ) -> Pin<Box<dyn Future<Output = Result<PathBuf>> + Send + 'a>> {
            Box::pin(async move { Self::reject(path) })
        }

        fn metadata<'a>(
            &'a self,
            path: &'a Path,
        ) -> Pin<Box<dyn Future<Output = Result<FileMeta>> + Send + 'a>> {
            Box::pin(async move { Self::reject(path) })
        }

        fn open_for_read<'a>(
            &'a self,
            path: &'a Path,
        ) -> Pin<Box<dyn Future<Output = Result<(PathBuf, FileReader)>> + Send + 'a>> {
            Box::pin(async move { Self::reject(path) })
        }

        fn list_dir<'a>(
            &'a self,
            dir: &'a Path,
        ) -> Pin<Box<dyn Future<Output = Result<Vec<DirEntry>>> + Send + 'a>> {
            Box::pin(async move { Self::reject(dir) })
        }

        fn create_file<'a>(
            &'a self,
            path: &'a Path,
        ) -> Pin<Box<dyn Future<Output = Result<(PathBuf, FileWriter)>> + Send + 'a>> {
            Box::pin(async move { Self::reject(path) })
        }

        fn atomic_write<'a>(
            &'a self,
            path: &'a Path,
            _data: &'a [u8],
            _mode: Option<u32>,
        ) -> Pin<Box<dyn Future<Output = Result<PathBuf>> + Send + 'a>> {
            Box::pin(async move { Self::reject(path) })
        }

        fn remove_file<'a>(
            &'a self,
            path: &'a Path,
        ) -> Pin<Box<dyn Future<Output = Result<()>> + Send + 'a>> {
            Box::pin(async move { Self::reject(path) })
        }
    }
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：fs（消费侧测试替身 ErrFs、文件大小预检与路径锚定）
    //!
    //! ### 关键接口
    //! - [ErrFs] — 全部操作一律拒绝（Permission）的测试替身
    //! - [check_file_size_limit] — 文件大小预检
    //! - [absolutize] — 相对路径锚定到 client cwd（构造点调用）
    //!
    //! ### 关键分支与异常路径
    //! - ErrFs 任一方法 → Err(Permission)，消息含 "目标路径超出可访问范围"
    //! - 文件小于 / 等于 / 超过 max_size → Ok / Ok / Err(validation)
    //! - absolutize：相对路径 → 拼 cwd；绝对路径 → 原样返回
    //!
    //! ### 上下游交互
    //! - 上游：本 crate 各消费侧测试注入该替身（如 directive / service / reqwest_ext）

    use wecom_fs::Error as FsError;

    use super::testing::ErrFs;
    use super::{Fs, FsAccess, absolutize, check_file_size_limit};

    /// P0：[absolutize] 相对路径拼接到给定 cwd
    /// 条件：cwd = "/work"，输入 "sub/file.txt"
    /// 断言：返回 "/work/sub/file.txt"
    #[test]
    fn absolutize_joins_relative_path_onto_cwd() {
        assert_eq!(
            absolutize(
                std::path::Path::new("/work"),
                std::path::Path::new("sub/file.txt")
            ),
            std::path::PathBuf::from("/work/sub/file.txt")
        );
    }

    /// P0：[absolutize] 绝对路径原样返回（不拼 cwd）
    /// 条件：输入 "/etc/hosts"
    /// 断言：返回 "/etc/hosts"
    #[test]
    fn absolutize_keeps_absolute_path() {
        assert_eq!(
            absolutize(
                std::path::Path::new("/work"),
                std::path::Path::new("/etc/hosts")
            ),
            std::path::PathBuf::from("/etc/hosts")
        );
    }

    /// P0：[ErrFs] 读侧方法一律返回 Permission 错误
    /// 条件：对 ErrFs 调用 resolve / metadata / open_for_read / list_dir
    /// 断言：均返回 Err(Permission)，消息含 "目标路径超出可访问范围"
    #[tokio::test]
    async fn err_fs_rejects_read_operations() {
        let fs = ErrFs;
        let path = std::path::Path::new("/tmp/anywhere.txt");

        let err = fs.resolve(path, FsAccess::Read).await.err();
        assert!(
            matches!(err, Some(FsError::Permission(_))),
            "resolve should reject with Permission"
        );
        let err = fs.metadata(path).await.err();
        assert!(
            matches!(err, Some(FsError::Permission(_))),
            "metadata should reject with Permission"
        );
        let err = fs.open_for_read(path).await.err();
        assert!(
            matches!(err, Some(FsError::Permission(_))),
            "open_for_read should reject with Permission"
        );
        let err = fs.list_dir(path).await.err();
        assert!(
            matches!(err, Some(FsError::Permission(_))),
            "list_dir should reject with Permission"
        );
    }

    /// P0：[ErrFs] 写侧方法一律返回 Permission 错误
    /// 条件：对 ErrFs 调用 create_file / atomic_write / remove_file
    /// 断言：均返回 Err(Permission)
    #[tokio::test]
    async fn err_fs_rejects_write_operations() {
        let fs = ErrFs;
        let path = std::path::Path::new("/tmp/anywhere.txt");

        let err = fs.create_file(path).await.err();
        assert!(
            matches!(err, Some(FsError::Permission(_))),
            "create_file should reject with Permission"
        );
        let err = fs.atomic_write(path, b"data", None).await.err();
        assert!(
            matches!(err, Some(FsError::Permission(_))),
            "atomic_write should reject with Permission"
        );
        let err = fs.remove_file(path).await.err();
        assert!(
            matches!(err, Some(FsError::Permission(_))),
            "remove_file should reject with Permission"
        );
    }

    // ── check_file_size_limit ──

    /// P0：[check_file_size_limit] 文件小于限制时返回 Ok
    /// 条件：创建 10 字节文件，max_size = 1024
    /// 断言：返回 Ok(())
    #[tokio::test]
    #[allow(clippy::disallowed_methods)] // 测试夹具直接落盘构造前置文件
    async fn check_file_size_limit_small_file_passes() {
        let tmp = tempfile::tempdir().unwrap();
        let file_path = tmp.path().join("small.txt");
        std::fs::write(&file_path, b"1234567890").unwrap();

        let fs = wecom_fs::SandboxedFs::new();
        let result = check_file_size_limit(&fs, &file_path, 1024).await;
        assert!(result.is_ok());
    }

    /// P0：[check_file_size_limit] 文件超过限制时返回 Err
    /// 条件：创建 10 字节文件，max_size = 4
    /// 断言：返回 Err，错误信息包含文件路径
    #[tokio::test]
    #[allow(clippy::disallowed_methods)] // 测试夹具直接落盘构造前置文件
    async fn check_file_size_limit_oversized_file_fails() {
        let tmp = tempfile::tempdir().unwrap();
        let file_path = tmp.path().join("big.txt");
        std::fs::write(&file_path, b"1234567890").unwrap();
        let file_path_str = file_path.to_string_lossy().to_string();

        let fs = wecom_fs::SandboxedFs::new();
        let result = check_file_size_limit(&fs, &file_path, 4).await;
        assert!(result.is_err());
        let msg = result.unwrap_err().to_string();
        assert!(
            msg.contains(&file_path_str),
            "error should mention file path: {msg}"
        );
    }

    /// P1：[check_file_size_limit] 文件大小等于限制时返回 Ok
    /// 条件：创建 10 字节文件，max_size = 10
    /// 断言：返回 Ok(())（等于限制不视为超限）
    #[tokio::test]
    #[allow(clippy::disallowed_methods)] // 测试夹具直接落盘构造前置文件
    async fn check_file_size_limit_equal_limit_passes() {
        let tmp = tempfile::tempdir().unwrap();
        let file_path = tmp.path().join("exact.txt");
        std::fs::write(&file_path, b"1234567890").unwrap();

        let fs = wecom_fs::SandboxedFs::new();
        let result = check_file_size_limit(&fs, &file_path, 10).await;
        assert!(result.is_ok());
    }
}
