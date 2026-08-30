//! The [`Fs`] capability trait.
//!
//! [`Fs`] is the single filesystem capability behind every CLI file
//! operation.

use std::fmt;
use std::path::{Path, PathBuf};

use rand::RngExt;
use tokio::io::AsyncReadExt;

use crate::api::{DirEntry, Error, FileMeta, FileReader, FileWriter, FsFuture};

/// Access mode requested by [`Fs::resolve`].
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FsAccess {
    /// Read access: the target must exist and be readable.
    Read,
    /// Write access to a file: the target may not exist yet.
    Write,
    /// Write access to a directory: when the target already exists, it must
    /// be a directory.
    WriteDir,
}

/// Filesystem capability: path resolution, reading, writing, deletion and
/// directory listing.
///
/// All CLI file operations use this capability. Authorization is expressed
/// by **which instance** a caller holds: the embedding Agent injects one
/// configured instance per domain (e.g. the CLI's private state directory
/// vs. the user workspace) and remains the sole owner of directory,
/// authorization, backup and I/O policy for each.
///
/// # Implementor notes
///
/// - All methods are async. Access control may need to interact with the
///   user (e.g. an approval prompt), which a synchronous signature cannot
///   express — a sync entry point can only fail closed on "needs approval",
///   so no sync `resolve` / `check_readable` / `check_writable` exists.
///   Implementors that want a non-interactive pure-rule precheck should keep
///   it as an inherent method, not on this trait.
/// - Seven methods are required; `read_to_string` and `create_file_unique`
///   are provided and build on the required ones.
/// - All paths passed to this capability must be **absolute**. Anchoring
///   relative input to a working directory is the caller's concern, handled
///   at the construction boundary (see `wecom::fs::absolutize` in the
///   `wecom` crate); implementors reject relative input rather than guess
///   a base.
/// - Configuration (sandbox roots, path resolver) is a construction-time
///   concern of the implementor, not part of this capability contract;
///   callers swap behavior by injecting a differently configured instance.
/// - Implementors carry full responsibility for path safety: resolution,
///   symlink handling and access control all live behind this trait.
///   Virtual-path mapping (e.g. `virtual://...`) belongs inside the
///   implementor's own resolution step.
/// - `create_file` contract: parent directories are created recursively,
///   creation is exclusive (`create_new` semantics — an existing target
///   yields `Error::Io` with `source.kind() == AlreadyExists`), and the new
///   file carries the most restrictive default permissions of the platform
///   (`0o600` on Unix).
pub trait Fs: fmt::Debug + Send + Sync {
    /// Metadata of the file at `path`.
    fn metadata<'a>(&'a self, path: &'a Path) -> FsFuture<'a, FileMeta>;

    /// Open the file at `path` for reading; returns the resolved (absolute,
    /// access-checked) path and the read-end stream.
    fn open_for_read<'a>(&'a self, path: &'a Path) -> FsFuture<'a, (PathBuf, FileReader)>;

    /// List entries of the directory at `dir` (non-recursive).
    fn list_dir<'a>(&'a self, dir: &'a Path) -> FsFuture<'a, Vec<DirEntry>>;

    /// Create a new file at `path` (exclusive); returns the resolved
    /// (absolute, access-checked) path and the write-end stream.  See the
    /// trait-level contract notes.
    fn create_file<'a>(&'a self, path: &'a Path) -> FsFuture<'a, (PathBuf, FileWriter)>;

    /// Atomically write `data` to `path` (temp file → fsync → rename);
    /// returns the resolved (absolute, access-checked) path.
    /// `mode` is a Unix permission hint (`None` = implementor default);
    /// non-Unix and virtual implementations may ignore it.
    fn atomic_write<'a>(
        &'a self,
        path: &'a Path,
        data: &'a [u8],
        mode: Option<u32>,
    ) -> FsFuture<'a, PathBuf>;

    /// Remove the file at `path`.
    ///
    /// Deletion is deliberately file-grained: no recursive directory removal
    /// exists on this capability.  A recursive primitive would only consult
    /// the access policy at the top path, letting a tree that *contains* a
    /// deny-listed location destroy it (e.g. `~/.ssh` when cwd is home) —
    /// and no production caller needs it (cache clear lists + unlinks
    /// files individually).
    fn remove_file<'a>(&'a self, path: &'a Path) -> FsFuture<'a, ()>;

    /// Resolve `path` for the requested `access` and verify the access is
    /// permitted.  `Read` additionally requires the target to exist; write
    /// modes accept not-yet-existing paths.
    ///
    /// This is the **only** access-control entry point: there is no
    /// synchronous precheck to fall back on, so no default implementation is
    /// provided — a default that skipped access control would fail open.
    /// Being async, it may prompt the user for approval.
    ///
    /// The input derives from raw external/model text (already anchored to
    /// an absolute path at the construction boundary), so implementors
    /// should quote it verbatim in error messages.
    fn resolve<'a>(&'a self, path: &'a Path, access: FsAccess) -> FsFuture<'a, PathBuf>;

    /// Read the entire file at `path` as a UTF-8 string.
    ///
    /// The default streams the content through [`Fs::open_for_read`],
    /// inheriting that method's resolution and access checks.
    ///
    /// **No size limit is applied** — the whole file is buffered in memory.
    /// Every current caller reads CLI-owned files (config, discovery cache).
    /// A new caller that reads paths an external party can steer must impose
    /// its own limit (e.g. `AsyncReadExt::take` on the reader), or move one
    /// into this default implementation in that form.
    fn read_to_string<'a>(&'a self, path: &'a Path) -> FsFuture<'a, String> {
        Box::pin(async move {
            let (real, mut reader) = self.open_for_read(path).await?;
            let mut contents = String::new();
            reader
                .read_to_string(&mut contents)
                .await
                .map_err(|e| Error::io(format!("Failed to read {}", real.display()), e))?;
            Ok(contents)
        })
    }

    /// Like [`Fs::create_file`], but retries with a random suffix inserted
    /// before the extension when the target already exists.
    ///
    /// The default retries [`Fs::create_file`] (up to 1 000 attempts) while
    /// it reports `Error::Io` with `source.kind() == AlreadyExists`;
    /// implementors with native collision avoidance may override it.
    fn create_file_unique<'a>(&'a self, path: &'a Path) -> FsFuture<'a, (PathBuf, FileWriter)> {
        Box::pin(async move {
            let mut candidate = path.to_path_buf();
            let mut attempts = 0u32;
            loop {
                match self.create_file(&candidate).await {
                    Ok(pair) => break Ok(pair),
                    Err(Error::Io { source, .. })
                        if source.kind() == std::io::ErrorKind::AlreadyExists
                            && attempts < 1000 =>
                    {
                        candidate = random_suffix_candidate(path);
                        attempts += 1;
                    }
                    Err(e) => break Err(e),
                }
            }
        })
    }
}

/// Insert a random alphanumeric suffix before the extension of `path`,
/// keeping the parent directory: `dir/report.json` → `dir/report.<suffix>.json`.
fn random_suffix_candidate(path: &Path) -> PathBuf {
    let stem = path.file_stem().unwrap_or_default().to_string_lossy();
    let suffix: String = rand::rng()
        .sample_iter(rand::distr::Alphanumeric)
        .take(8)
        .map(|b| b as char)
        .collect();
    let name = match path.extension().map(|e| e.to_string_lossy()) {
        Some(ext) => format!("{stem}.{suffix}.{ext}"),
        None => format!("{stem}.{suffix}"),
    };
    path.parent().unwrap_or(path).join(name)
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    //! ## 模块摘要：api::fs（Fs trait 默认方法）
    //!
    //! ### 关键接口
    //! - [Fs::read_to_string] / [Fs::create_file_unique] — trait 默认方法
    //! - [random_suffix_candidate] — 冲突避让的随机后缀文件名
    //!
    //! ### 关键分支与异常路径
    //! - create_file_unique 目标已存在 → AlreadyExists 触发随机后缀重试
    //! - random_suffix_candidate 无扩展名 → 仅追加后缀，不引入 ".json"
    //!
    //! ### 上下游交互
    //! - 上游：wecom crate 业务代码经 `&dyn Fs` 调用
    //! - 下游：默认方法构建于必需方法之上（测试替身 MinimalFs 委托 SandboxedFs）

    use super::*;

    // ── Fs trait 默认方法 ──

    /// 最小 Fs 实现：必需方法全部委托 [`crate::SandboxedFs`]，默认方法保持 trait 提供版本。
    ///
    /// `inner` 持 `Arc<dyn Fs>`（而非具体类型）是为了让方法调用解析到 trait
    /// 方法——`SandboxedFs` 的同名 inherent 方法在 crate 内会遮蔽 trait 方法。
    #[derive(Debug)]
    struct MinimalFs {
        inner: std::sync::Arc<dyn Fs>,
    }

    impl MinimalFs {
        fn new() -> Self {
            Self {
                inner: std::sync::Arc::new(crate::SandboxedFs::new()),
            }
        }
    }

    impl Fs for MinimalFs {
        fn metadata<'a>(&'a self, path: &'a Path) -> FsFuture<'a, FileMeta> {
            self.inner.metadata(path)
        }

        fn open_for_read<'a>(&'a self, path: &'a Path) -> FsFuture<'a, (PathBuf, FileReader)> {
            self.inner.open_for_read(path)
        }

        fn list_dir<'a>(&'a self, dir: &'a Path) -> FsFuture<'a, Vec<DirEntry>> {
            self.inner.list_dir(dir)
        }

        fn create_file<'a>(&'a self, path: &'a Path) -> FsFuture<'a, (PathBuf, FileWriter)> {
            self.inner.create_file(path)
        }

        fn atomic_write<'a>(
            &'a self,
            path: &'a Path,
            data: &'a [u8],
            mode: Option<u32>,
        ) -> FsFuture<'a, PathBuf> {
            self.inner.atomic_write(path, data, mode)
        }

        fn remove_file<'a>(&'a self, path: &'a Path) -> FsFuture<'a, ()> {
            self.inner.remove_file(path)
        }

        fn resolve<'a>(&'a self, path: &'a Path, access: FsAccess) -> FsFuture<'a, PathBuf> {
            self.inner.resolve(path, access)
        }
    }

    /// P0：[MinimalFs] 必需方法全链路冒烟（委托 SandboxedFs）
    /// 条件：在临时沙箱内依次调用 resolve / metadata / open_for_read /
    ///       list_dir / create_file / atomic_write / remove_file
    /// 断言：全部返回 Ok 且副作用真实发生
    #[tokio::test]
    async fn minimal_fs_required_methods_smoke() {
        let tmp = tempfile::tempdir().unwrap();
        let fs = MinimalFs::new();

        let file = tmp.path().join("a.txt");
        std::fs::write(&file, b"hello").unwrap();

        let resolved = fs.resolve(&file, FsAccess::Read).await.unwrap();
        assert_eq!(fs.metadata(&resolved).await.unwrap().len, 5);
        let (_path, _reader) = fs.open_for_read(&file).await.unwrap();
        assert!(!fs.list_dir(tmp.path()).await.unwrap().is_empty());

        let (_path, _writer) = fs.create_file(&tmp.path().join("b.txt")).await.unwrap();
        fs.atomic_write(&tmp.path().join("c.txt"), b"c", None)
            .await
            .unwrap();
        assert_eq!(std::fs::read(tmp.path().join("c.txt")).unwrap(), b"c");
        fs.remove_file(&tmp.path().join("c.txt")).await.unwrap();
        assert!(!tmp.path().join("c.txt").exists());
    }

    /// P0：[Fs::read_to_string] 默认实现经 open_for_read 读取全文
    /// 条件：MinimalFs（未 override read_to_string），目标文件内容为 "hello fs"
    /// 断言：返回 "hello fs"
    #[tokio::test]
    async fn default_read_to_string_reads_full_content() {
        let tmp = tempfile::tempdir().unwrap();
        let file = tmp.path().join("note.txt");
        std::fs::write(&file, "hello fs").unwrap();

        let fs = MinimalFs::new();
        let content = fs.read_to_string(&file).await.unwrap();
        assert_eq!(content, "hello fs");
    }

    /// P0：[Fs::create_file_unique] 默认实现在目标已存在时插入随机后缀重试
    /// 条件：预先创建 data.json，再对同一路径调用 create_file_unique
    /// 断言：返回 Ok，新文件名形如 data.<随机后缀>.json
    #[tokio::test]
    async fn default_create_file_unique_retries_with_suffix() {
        let tmp = tempfile::tempdir().unwrap();
        let file = tmp.path().join("data.json");
        std::fs::write(&file, "{}").unwrap();

        let fs = MinimalFs::new();
        let (resolved, _writer) = fs.create_file_unique(&file).await.unwrap();
        let name = resolved.file_name().unwrap().to_string_lossy();
        assert_ne!(name, "data.json");
        assert!(name.starts_with("data."), "name = {name}");
        assert!(name.ends_with(".json"), "name = {name}");
    }

    /// P1：[random_suffix_candidate] 保留父目录与扩展名
    /// 条件：输入 "dir/report.json" 与 "dir/report"
    /// 断言：前者产出 dir/report.<后缀>.json；后者产出 dir/report.<后缀>
    #[test]
    fn random_suffix_candidate_keeps_parent_and_extension() {
        let with_ext = random_suffix_candidate(Path::new("dir/report.json"));
        assert_eq!(with_ext.parent(), Some(Path::new("dir")));
        let name = with_ext.file_name().unwrap().to_string_lossy();
        assert!(name.starts_with("report."), "name = {name}");
        assert!(name.ends_with(".json"), "name = {name}");

        let no_ext = random_suffix_candidate(Path::new("dir/report"));
        let name = no_ext.file_name().unwrap().to_string_lossy();
        assert!(name.starts_with("report."), "name = {name}");
        assert!(!name.ends_with(".json"), "name = {name}");
    }
}
