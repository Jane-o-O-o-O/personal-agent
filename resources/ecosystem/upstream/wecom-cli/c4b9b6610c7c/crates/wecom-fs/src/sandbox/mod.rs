//! `SandboxedFs`: sandboxed implementation of the [`Fs`](crate::Fs) capability.
//!
//! Restricts all I/O to a set of allowed directory roots, with a
//! caller-supplied denylist that always wins over allow (even in rootless
//! mode), and kernel-level containment through `cap-std` root handles.
//!
//! Three sibling layers, in dependency order:
//!
//! | Layer | Module | Responsibility |
//! | --- | --- | --- |
//! | path | [`paths`] | caller path → absolute physical path (`std::fs`: `canonicalize` / `mkdir -p`) |
//! | decision | [`policy`] | denylist + roots; [`policy::Policy::check`] is the single "is this allowed" answer |
//! | execution | [`io`] | one implementation per operation, all through a pinned `cap-std` handle |
//!
//! This module itself holds the struct, its builders, the `resolve` /
//! `check_*` decision entry points, and the `spawn_blocking` plumbing;
//! [`fs_impl`] is the async execution facade above them (per-operation
//! `resolve` → `spawn_blocking` → primitive hops, the stream adapter, and
//! the [`Fs`](crate::Fs) bridge).

mod fs_impl;
mod io;
mod paths;
mod policy;

use std::path::{Path, PathBuf};
use std::sync::Arc;

pub use policy::{DenyRule, Policy, recommended_deny_rule};
use tokio::task::{JoinHandle, spawn_blocking};

use crate::api::{Error, Result};

/// Sandboxed file-system handle that restricts all I/O to the [`Policy`]
/// configured per direction.
///
/// All paths passed to a `SandboxedFs` must be **absolute**; anchoring
/// relative input to a working directory is the caller's concern, handled
/// at the entry boundary (see `wecom::fs::absolutize` in the `wecom`
/// crate).
///
/// Read and write operations are validated against **separate** policies:
///
/// - the **read** policy governs read-only operations (`read_to_string`,
///   `metadata`, `open_for_read`, `list_dir`);
/// - the **write** policy governs operations that create, modify or delete
///   (`create_file`, `atomic_write`, `remove_file`).
///
/// Configuration is **fully caller-specified** and lives on [`Policy`]:
/// [`new`](Self::new) starts with two unrestricted, deny-empty policies;
/// callers build policies up front (roots / deny entries / segment rules)
/// and hand them over — there is no hidden rebuild step, so builder call
/// order cannot multiply snapshot cost.  See [`recommended_deny_rule`] for
/// the crate's suggested denylist baseline.
/// Deny always wins over allow and applies even in rootless mode.
///
/// All operations are reached through the [`Fs`](crate::Fs) trait — that is
/// the single entry point for sandbox semantics.
///
/// # Example
///
/// ```rust,no_run
/// use std::path::Path;
/// use wecom_fs::{Policy, SandboxedFs, recommended_deny_rule};
///
/// // Unrestricted, no denylist:
/// let fs = SandboxedFs::new();
///
/// // Equal read/write roots + the recommended deny globs:
/// let policy = Policy::new()
///     .with_allowed_dirs(&[Path::new("/project"), Path::new("/home/user/.config")])
///     .with_recommended_deny();
/// let fs = SandboxedFs::new().with_policy(policy);
///
/// // Separate read/write policies (cloning a rule shares its compiled state):
/// let deny = recommended_deny_rule();
/// let read = Policy::new()
///     .with_allowed_dirs(&[Path::new("/project"), Path::new("/data/readonly")])
///     .with_deny(deny.clone());
/// let write = Policy::new()
///     .with_allowed_dirs(&[Path::new("/project")])
///     .with_deny(deny);
/// let fs = SandboxedFs::new()
///     .with_read_policy(read)
///     .with_write_policy(write);
/// ```
#[derive(Clone)]
pub struct SandboxedFs {
    /// Read-direction policy.  `Arc` because every Fs operation moves the
    /// direction's policy into the blocking pool — one refcount bump per
    /// operation instead of a `Policy` clone.
    read: Arc<Policy>,
    /// Write-direction policy.
    write: Arc<Policy>,
}

/// Hand-written so the configuration reads at a glance: the per-direction
/// [`Policy`] values would otherwise dump the compiled deny globs into
/// every log line.
impl std::fmt::Debug for SandboxedFs {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("SandboxedFs")
            .field("read_roots", &self.read.roots())
            .field("write_roots", &self.write.roots())
            .field("read_deny_len", &self.read.deny_len())
            .field("write_deny_len", &self.write.deny_len())
            .finish()
    }
}

impl Default for SandboxedFs {
    fn default() -> Self {
        Self::new()
    }
}

impl SandboxedFs {
    // ── Construction (public) ───────────────────────────────

    /// Create a new `SandboxedFs` with two unrestricted, deny-empty
    /// policies — every operation is allowed everywhere.  Supply configured
    /// [`Policy`] values via [`with_policy`](Self::with_policy) /
    /// [`with_read_policy`](Self::with_read_policy) /
    /// [`with_write_policy`](Self::with_write_policy).
    pub fn new() -> Self {
        let unrestricted = Arc::new(Policy::new());
        Self {
            read: unrestricted.clone(),
            write: unrestricted,
        }
    }

    /// Convenience constructor: one policy confining **both** directions to
    /// the given roots, with no denylist.  Equivalent to
    /// `SandboxedFs::new().with_policy(Policy::new().with_allowed_dirs(dirs))`.
    pub fn confined_to(dirs: &[&Path]) -> Self {
        Self::new().with_policy(Policy::new().with_allowed_dirs(dirs))
    }

    /// Use the same policy for both directions (builder style): one `Arc`
    /// shared by both.  Every deny rule it carries applies to **both**
    /// directions — which is also the intended shape of the built-in rules
    /// ([`recommended_deny_rule`] denies credential shapes on writes as
    /// well as reads).  Use [`with_read_policy`](Self::with_read_policy) /
    /// [`with_write_policy`](Self::with_write_policy) only when the two
    /// directions genuinely differ (e.g. distinct roots).
    #[must_use]
    pub fn with_policy(mut self, policy: Policy) -> Self {
        let policy = Arc::new(policy);
        self.read = policy.clone();
        self.write = policy;
        self
    }

    /// Set the read-direction policy (builder style).
    #[must_use]
    pub fn with_read_policy(mut self, policy: Policy) -> Self {
        self.read = Arc::new(policy);
        self
    }

    /// Set the write-direction policy (builder style).
    #[must_use]
    pub fn with_write_policy(mut self, policy: Policy) -> Self {
        self.write = Arc::new(policy);
        self
    }

    // ── Internal: resolution & access checks ────────────────
    //
    // Private on purpose, matching the [`Fs`](crate::Fs) implementor contract:
    // no synchronous resolve / precheck is part of the public capability — a
    // sync entry point can only fail closed on "needs approval", and the async
    // `Fs::resolve` is the single access-control entry point.
    //
    // The two `check_*` methods are async: the cheap logical `resolve` runs
    // on the caller thread, while the canonicalizing [`Policy::check`] is
    // dispatched to the blocking pool — callers never wrap them in
    // [`blocking`] themselves.

    /// Map a caller-supplied path to an absolute, logically-normalised
    /// physical path.
    ///
    /// Synchronous and cheap: the input must already be absolute (anchoring
    /// relative input to a working directory is the caller's concern,
    /// handled at the entry boundary) and UTF-8 — non-UTF-8 bytes would
    /// silently bypass the dangerous-character screening below, so every
    /// operation entry rejects them here (not only `Fs::resolve`); `.` /
    /// `..` are folded logically and the result is screened for dangerous
    /// characters ([`policy::reject_dangerous_chars`]).  No filesystem
    /// access happens here — symlink resolution belongs to
    /// [`policy::Policy::check`], which runs on the blocking pool.
    fn resolve(&self, path: impl AsRef<Path>) -> Result<PathBuf> {
        let path = path.as_ref();
        if !path.is_absolute() {
            return Err(Error::validation(format!(
                "路径必须是绝对路径: {}",
                path.display()
            )));
        }
        if path.to_str().is_none() {
            return Err(Error::validation(format!(
                "路径包含非 UTF-8 字符: {}",
                path.display()
            )));
        }
        let resolved = paths::normalize_path(path);
        policy::reject_dangerous_chars(&resolved)?;
        Ok(resolved)
    }

    /// Resolve and validate that `path` stays within the readable roots.
    ///
    /// Returns the resolved (symlink-followed) path on success.  [`resolve`]
    /// is pure path arithmetic and runs inline; [`Policy::check`]
    /// canonicalizes (a syscall) and is dispatched to the blocking pool.
    ///
    /// [`resolve`]: Self::resolve
    async fn check_readable(&self, path: impl AsRef<Path>) -> Result<PathBuf> {
        let resolved = self.resolve(path)?;
        let policy = self.read.clone();
        blocking("check_readable", move || policy.check(&resolved)).await
    }

    /// Resolve and validate that `path` stays within the writable roots.
    ///
    /// Returns the resolved (symlink-followed) path on success.  Dispatch
    /// notes as in [`check_readable`](Self::check_readable).
    async fn check_writable(&self, path: impl AsRef<Path>) -> Result<PathBuf> {
        let resolved = self.resolve(path)?;
        let policy = self.write.clone();
        blocking("check_writable", move || policy.check(&resolved)).await
    }

    /// Resolve a readable path and require the target to exist.
    ///
    /// Passing [`check_readable`](Self::check_readable) is not enough: this
    /// resolver serves *read* (upload source) paths, so a path that merely
    /// stays within the roots but does not exist is rejected with a uniform
    /// "找不到目标文件" error rather than returned to the caller.
    pub(crate) async fn resolve_readable(&self, file_path: &str) -> Result<PathBuf> {
        let real = self.check_readable(file_path).await?;
        let probe = real.clone();
        if blocking_infallible("readable_exists_probe", move || paths::exists(&probe)).await? {
            Ok(real)
        } else {
            Err(Error::other(format!("找不到目标文件: {file_path}").into()))
        }
    }

    /// Resolve a writable path that must be a directory (or not exist yet;
    /// existing files are rejected).
    pub(crate) async fn resolve_writable_dir(&self, dir_path: impl AsRef<Path>) -> Result<PathBuf> {
        let resolved = self.check_writable(dir_path).await?;

        // If the path already exists it must be a directory.  Both probes are
        // blocking syscalls, so they run on the blocking pool.
        let probe = resolved.clone();
        let is_existing_file = blocking_infallible("writable_dir_probe", move || {
            paths::exists(&probe) && !paths::is_dir(&probe)
        })
        .await?;
        if is_existing_file {
            return Err(Error::validation(format!(
                "无效目录路径: {}",
                resolved.display(),
            )));
        }

        Ok(resolved)
    }
}

// ── `spawn_blocking` plumbing ───────────────────────────────
//
// Two concerns are centralised here so that every async operation stays one
// line: the current tracing span is re-entered inside the pool thread (it is
// not inherited), and a panicking task becomes an [`Error::other`] carrying
// the operation name.

/// Run a fallible sandbox primitive on the blocking pool.
///
/// `op` names the operation and appears in the panic-mapped error message.
/// The closure's `Result` is flattened, so callers get `Result<T>` directly.
async fn blocking<T, F>(op: &'static str, f: F) -> Result<T>
where
    F: FnOnce() -> Result<T> + Send + 'static,
    T: Send + 'static,
{
    spawn_blocking_in_span(f)
        .await
        .map_err(|e| Error::other(format!("{op} task panicked: {e}").into()))?
}

/// Like [`blocking`], but for closures that cannot fail.
///
/// Used to move blocking `exists()` / `is_dir()` probes off the async
/// threads.
async fn blocking_infallible<T, F>(op: &'static str, f: F) -> Result<T>
where
    F: FnOnce() -> T + Send + 'static,
    T: Send + 'static,
{
    spawn_blocking_in_span(f)
        .await
        .map_err(|e| Error::other(format!("{op} task panicked: {e}").into()))
}

/// Like `tokio::task::spawn_blocking`, but inherits the current tracing span.
fn spawn_blocking_in_span<F, T>(f: F) -> JoinHandle<T>
where
    F: FnOnce() -> T + Send + 'static,
    T: Send + 'static,
{
    let span = tracing::Span::current();
    spawn_blocking(move || {
        let _enter = span.enter();
        f()
    })
}

/// Test fixtures set up files directly, which the crate's `disallowed_methods`
/// list rejects in production code — see `crates/wecom-fs/.clippy.toml`.
#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests;
