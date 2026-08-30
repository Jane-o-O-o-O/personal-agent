//! I/O layer: every filesystem operation goes through a pinned `cap-std`
//! root handle.
//!
//! Each primitive is the same three steps:
//!
//! 1. [`Policy::check`] — resolve the path (following symlinks) and take the
//!    allow / deny decision; returns the real path.
//! 2. [`acquire`] — pin a `Dir` handle and re-express the target as a path
//!    relative to it.  On Linux this makes `openat2` + `RESOLVE_BENEATH` the
//!    enforcement mechanism, so a component swapped between the check and the
//!    operation cannot escape the handle.
//! 3. the operation itself, plus the one assertion `cap-std` does not
//!    cover: the [`atomic_write`] target's link count.  There is no
//!    fd-level deny-identity or cross-mount assertion: both would defend
//!    against a same-UID local attacker, which the threat model excludes.
//!
//! There is exactly **one** implementation per operation: what differs between
//! a restricted and an unrestricted policy is only *which directory the handle
//! is pinned to* (see [`acquire`]).  The sole path-based `std::fs` call in
//! this module is [`acquire`]'s pre-handle mkdir of the directory about to be
//! pinned (annotated with its own `SAFETY:` note); every other operation goes
//! through the handle.

use std::fs::File;
use std::io::Write;
use std::path::{Path, PathBuf};

use cap_std::ambient_authority;
use cap_std::fs::Dir;

use super::policy::{Policy, is_under};
use crate::Result;
use crate::api::{DirEntry, Error};

// ── Root handle acquisition ─────────────────────────────────

/// A `Dir` handle plus the target's path relative to it.
#[derive(Debug)]
struct Rooted {
    dir: Dir,
    /// Target relative to the pinned directory; empty when the target *is*
    /// the pinned directory.
    rel: PathBuf,
}

impl Rooted {
    /// [`Self::rel`], with the empty path (target is the pinned directory
    /// itself) normalised to `"."`, which directory operations accept.
    fn rel_or_dot(&self) -> &Path {
        if self.rel.as_os_str().is_empty() {
            Path::new(".")
        } else {
            &self.rel
        }
    }
}

/// Pin a `Dir` handle for an already-checked absolute path `real`.
///
/// The pinned directory depends on the policy:
///
/// - **restricted** (roots configured) — the longest configured root that
///   contains `real`.  The root is the containment boundary: every remaining
///   hop is resolved by the kernel beneath that handle.  Failing to map
///   `real` onto any root is an internal inconsistency (the preceding
///   [`Policy::check`] already proved membership) and **fails closed**.
/// - **unrestricted** (`roots == None`) — the target's own parent directory.
///   There is no boundary to enforce, but pinning still collapses the
///   operation to a single relative hop, so the ancestors are resolved once
///   (by this call) instead of once more by every syscall.
///
/// `create_missing` distinguishes read-like from write-like callers: writers
/// materialise the directory before pinning it (a lazily created writable
/// root, e.g. a not-yet-existing output directory); readers leave it alone
/// and surface the resulting `NotFound`.
///
/// SAFETY: the `create_missing` mkdir is the one ambient (path-based) side
/// effect in this module — it cannot go through a handle because the handle
/// does not exist yet.  It only ever materialises the directory about to be
/// pinned, never touches file contents; `crates/wecom-fs/.clippy.toml`
/// rejects path-based `std::fs` everywhere else.
#[allow(clippy::disallowed_methods)]
fn acquire(real: &Path, policy: &Policy, create_missing: bool) -> Result<Rooted> {
    let pinned = match policy.roots() {
        Some(roots) => longest_containing_root(real, roots)?,
        None => parent_of(real),
    };

    if create_missing {
        // Recursive mode makes this a no-op for an existing directory (and
        // an error for an existing *file*), so no existence probe is needed.
        let mut builder = std::fs::DirBuilder::new();
        #[cfg(unix)]
        {
            use std::os::unix::fs::DirBuilderExt;
            builder.mode(0o700);
        }
        builder.recursive(true).create(&pinned).map_err(|e| {
            Error::io(
                format!("Failed to create directory {}", pinned.display()),
                e,
            )
        })?;
    }

    let dir = Dir::open_ambient_dir(&pinned, ambient_authority()).map_err(|e| {
        Error::io(
            format!("Failed to open sandbox root {}", pinned.display()),
            e,
        )
    })?;

    let rel = real
        .strip_prefix(&pinned)
        .map_err(|_| Error::Permission(format!("目标路径超出可访问范围: {}", real.display())))?
        .to_path_buf();

    Ok(Rooted { dir, rel })
}

/// The longest configured root that contains `real`.
///
/// Roots may nest — e.g. the system temporary directory as a read root
/// containing a nested writable root — and the innermost one must win, so
/// the handle is pinned as tightly as the configuration allows.  Roots
/// arrive pre-resolved (the policy's construction-time snapshot), so this
/// is a pure prefix comparison.
fn longest_containing_root(real: &Path, roots: &[PathBuf]) -> Result<PathBuf> {
    let mut best: Option<PathBuf> = None;
    for root in roots {
        if is_under(real, root)
            && best
                .as_ref()
                .is_none_or(|b| root.as_os_str().len() > b.as_os_str().len())
        {
            best = Some(root.clone());
        }
    }
    best.ok_or_else(|| {
        tracing::error!("sandbox: resolved path inside roots but not mappable to any root handle");
        Error::Permission(format!("目标路径超出可访问范围: {}", real.display()))
    })
}

/// Parent directory of `real`, or `real` itself when it has no parent (the
/// filesystem root).
fn parent_of(real: &Path) -> PathBuf {
    real.parent()
        .map(Path::to_path_buf)
        .unwrap_or_else(|| real.to_path_buf())
}

/// `mkdir -p` of `rel` **through the pinned handle**, with every created
/// component carrying the given Unix `mode` (0o700 for sandbox-owned
/// directories — the same mode [`acquire`] gives the pinned root itself,
/// instead of the umask-default 0o777).
///
/// Recursive creation is a no-op for existing directories (an existing
/// *file* component fails with `AlreadyExists`, and the later open then
/// reports `NotADirectory` — the desired error).
fn create_dir_all(dir: &Dir, rel: &Path, mode: u32) -> Result<()> {
    let mut builder = cap_std::fs::DirBuilder::new();
    builder.recursive(true);
    #[cfg(unix)]
    {
        use cap_std::fs::DirBuilderExt;
        builder.mode(mode);
    }
    #[cfg(not(unix))]
    let _ = mode;

    dir.create_dir_with(rel, &builder)
        .map_err(|e| Error::io(format!("Failed to create directory {}", rel.display()), e))
}

// ── Read ────────────────────────────────────────────────────

/// Open `path` for reading through the pinned root handle.
///
/// Returns the resolved path and the opened `std::fs::File`.
pub(super) fn open_file(path: &Path, policy: &Policy) -> Result<(PathBuf, File)> {
    let real = policy.check(path)?;
    let rooted = acquire(&real, policy, false)?;

    let file = rooted
        .dir
        .open(rooted.rel_or_dot())
        .map_err(|e| Error::io(format!("Failed to open {}", real.display()), e))?
        .into_std();

    Ok((real, file))
}

/// List all entries (files and subdirectories) of the directory at `dir`.
///
/// Entry types come from the directory listing itself (no extra syscalls);
/// entry paths are rebuilt from the resolved directory path for display.
pub(super) fn list_dir(dir: &Path, policy: &Policy) -> Result<Vec<DirEntry>> {
    let real = policy.check(dir)?;
    let rooted = acquire(&real, policy, false)?;

    let read_dir = rooted
        .dir
        .read_dir(rooted.rel_or_dot())
        .map_err(|e| Error::io(format!("Failed to read directory {}", real.display()), e))?;

    Ok(read_dir
        .flatten()
        .map(|e| {
            let file_type = e.file_type().ok();
            DirEntry {
                path: real.join(e.file_name()),
                is_dir: file_type.as_ref().is_some_and(|t| t.is_dir()),
                is_file: file_type.as_ref().is_some_and(|t| t.is_file()),
            }
        })
        .collect())
}

// ── Create ──────────────────────────────────────────────────

/// Windows: tighten a freshly created file's DACL **by handle**, replacing
/// inherited entries with `D:P(A;;FA;;;OW)(A;;FA;;;SY)(A;;FA;;;BA)` —
/// protected from inheritance, owner / SYSTEM / Administrators full
/// control.
///
/// This is the platform's fulfilment of the `create_file` contract ("most
/// restrictive default permissions of the platform"), the counterpart of
/// Unix `0o600`: without it a new file inherits the directory ACL.
/// SYSTEM / Administrators stay in the set because Unix `0o600` likewise
/// keeps the file readable by root —
/// stripping them would break AV / backup / sync tools for no
/// threat-model gain.
///
/// The operation goes through the already-open handle — no second name
/// resolution, no TOCTOU window.  `SetSecurityInfo` needs `WRITE_DAC` on
/// that handle, which is why the callers open the file with
/// `GENERIC_WRITE | WRITE_DAC` (the creator is granted the right
/// implicitly by the access check).  The DACL is written with
/// `PROTECTED_DACL_SECURITY_INFORMATION` so no inherited entry survives
/// the replacement.
///
/// Best effort by design: filesystems without security descriptors
/// (FAT32 / exFAT / some SMB shares) reject the call, and deleting a
/// low-sensitivity artifact over an ACL it never had would be the worse
/// trade — a failure logs and keeps the file.
#[cfg(windows)]
fn restrict_to_owner(file: &File) {
    use std::os::windows::ffi::OsStrExt;
    use std::os::windows::io::AsRawHandle;

    use windows_sys::Win32::Foundation::{HANDLE, LocalFree};
    use windows_sys::Win32::Security::Authorization::{
        ConvertStringSecurityDescriptorToSecurityDescriptorW, SDDL_REVISION_1, SE_FILE_OBJECT,
        SetSecurityInfo,
    };
    use windows_sys::Win32::Security::{
        DACL_SECURITY_INFORMATION, GetSecurityDescriptorDacl, PROTECTED_DACL_SECURITY_INFORMATION,
    };

    let sddl: Vec<u16> = std::ffi::OsStr::new("D:P(A;;FA;;;OW)(A;;FA;;;SY)(A;;FA;;;BA)")
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();

    // SAFETY: all pointers are valid for the duration of each call: the SDDL
    // buffer is NUL-terminated UTF-16; the security descriptor returned by
    // Convert… is LocalAlloc'd, its DACL extracted by GetSecurityDescriptorDacl
    // (borrowed, valid while the SD lives), and the SD is released with
    // LocalFree after SetSecurityInfo.  The raw handle is borrowed — `file`
    // keeps owning it.
    unsafe {
        let mut sd: windows_sys::Win32::Security::PSECURITY_DESCRIPTOR = std::ptr::null_mut();
        if ConvertStringSecurityDescriptorToSecurityDescriptorW(
            sddl.as_ptr(),
            SDDL_REVISION_1,
            &mut sd,
            std::ptr::null_mut(),
        ) == 0
        {
            tracing::warn!(
                error = %std::io::Error::last_os_error(),
                "sandbox: failed to build owner-only security descriptor; file keeps inherited ACL"
            );
            return;
        }
        let result = (|| {
            let mut dacl: *mut windows_sys::Win32::Security::ACL = std::ptr::null_mut();
            let mut present = 0;
            let mut defaulted = 0;
            if GetSecurityDescriptorDacl(sd, &mut present, &mut dacl, &mut defaulted) == 0 {
                return Err(std::io::Error::last_os_error());
            }
            let rc = SetSecurityInfo(
                file.as_raw_handle() as HANDLE,
                SE_FILE_OBJECT,
                DACL_SECURITY_INFORMATION | PROTECTED_DACL_SECURITY_INFORMATION,
                std::ptr::null_mut(),
                std::ptr::null_mut(),
                dacl,
                std::ptr::null_mut(),
            );
            if rc != 0 {
                return Err(std::io::Error::from_raw_os_error(rc as i32));
            }
            Ok(())
        })();
        LocalFree(sd as _);
        if let Err(e) = result {
            tracing::warn!(
                error = %e,
                "sandbox: owner-only DACL not applied (filesystem without security descriptors?); file keeps inherited ACL"
            );
        }
    }
}

/// Create a new file at `path` (`create_new`, `0o600`) through the pinned root
/// handle.
///
/// Missing intermediate directories are created under the same handle, so the
/// `mkdir -p` side effect cannot escape it either.
pub(super) fn create_file(path: &Path, policy: &Policy) -> Result<(PathBuf, File)> {
    let real = policy.check(path)?;
    let rooted = acquire(&real, policy, true)?;

    if let Some(parent) = rooted.rel.parent()
        && !parent.as_os_str().is_empty()
    {
        create_dir_all(&rooted.dir, parent, 0o700)?;
    }

    let mut opts = cap_std::fs::OpenOptions::new();
    opts.write(true).create_new(true);
    #[cfg(unix)]
    {
        use cap_std::fs::OpenOptionsExt;
        opts.mode(0o600);
    }
    // Windows: the handle tightens its own DACL (see [`restrict_to_owner`]),
    // which needs `WRITE_DAC` on it — request the right at open time; the
    // access check grants it to the creator implicitly.
    #[cfg(windows)]
    {
        use cap_std::fs::OpenOptionsExt;
        use windows_sys::Win32::Foundation::GENERIC_WRITE;
        use windows_sys::Win32::Storage::FileSystem::WRITE_DAC;

        opts.access_mode(GENERIC_WRITE | WRITE_DAC);
    }

    let file = rooted
        .dir
        .open_with(&rooted.rel, &opts)
        .map_err(|e| {
            Error::io(
                format!("Failed to create output file {}", real.display()),
                e,
            )
        })?
        .into_std();

    // Windows: fulfil the 0o600 contract through the open handle (see
    // [`restrict_to_owner`]); best effort — the file is kept on failure.
    #[cfg(windows)]
    restrict_to_owner(&file);

    Ok((real, file))
}

// ── Atomic write ────────────────────────────────────────────

/// Atomically write `data` to `path`: temp file in the same directory →
/// `fsync` → rename, all through the pinned root handle, so readers never see
/// a partially written file and the publish cannot escape the handle.
pub(super) fn atomic_write(
    path: &Path,
    data: &[u8],
    mode: u32,
    policy: &Policy,
) -> Result<PathBuf> {
    let real = policy.check(path)?;
    let rooted = acquire(&real, policy, true)?;

    // Normalise the relative parent: `None` / empty (target directly under the
    // pinned directory) becomes `"."`.  `create_dir_all` is not a no-op for an
    // existing `"."` and would spuriously report AlreadyExists, hence the skip.
    let parent_rel = match rooted.rel.parent() {
        Some(p) if !p.as_os_str().is_empty() => {
            create_dir_all(&rooted.dir, p, 0o700)?;
            p.to_path_buf()
        }
        _ => PathBuf::from("."),
    };

    let file_name = rooted
        .rel
        .file_name()
        .ok_or_else(|| Error::validation(format!("无效文件路径: {}", real.display())))?;

    // Isolated temp-file name: a leading `.` plus pid and a process-wide
    // counter.  It is opened with `create_new`, so a collision reports
    // AlreadyExists rather than overwriting another file.
    let tmp_rel = parent_rel.join(format!(
        ".{}.tmp{}-{}",
        file_name.to_string_lossy(),
        std::process::id(),
        unique_atomic_id()
    ));

    let mut opts = cap_std::fs::OpenOptions::new();
    opts.write(true).create_new(true);
    #[cfg(unix)]
    {
        use cap_std::fs::OpenOptionsExt;
        opts.mode(mode);
    }
    // Windows: an owner-only target is tightened through this handle (see
    // [`restrict_to_owner`]), which needs `WRITE_DAC` on it.  A
    // group-readable target keeps the inherited ACL and needs no extra right.
    #[cfg(windows)]
    if mode & 0o077 == 0 {
        use cap_std::fs::OpenOptionsExt;
        use windows_sys::Win32::Foundation::GENERIC_WRITE;
        use windows_sys::Win32::Storage::FileSystem::WRITE_DAC;

        opts.access_mode(GENERIC_WRITE | WRITE_DAC);
    }
    #[cfg(not(any(unix, windows)))]
    let _ = mode;

    let mut file = rooted
        .dir
        .open_with(&tmp_rel, &opts)
        .map_err(|e| {
            Error::io(
                format!("Failed to create temp file for {}", real.display()),
                e,
            )
        })?
        .into_std();

    // Windows: tighten the temp file's DACL before publish — the rename
    // preserves it, so the published target ends up restricted (W5).  Only
    // when the caller asked for an owner-only mode: a 0o644 cache file
    // must keep the inherited ACL, exactly as on Unix.
    #[cfg(windows)]
    if mode & 0o077 == 0 {
        restrict_to_owner(&file);
    }

    let publish = (|| -> Result<()> {
        // An existing multiply-linked target is rejected before publish.
        reject_multiply_linked_target(&rooted, &real)?;

        file.write_all(data)
            .map_err(|e| Error::io("Failed to write temp file", e))?;
        file.sync_all()
            .map_err(|e| Error::io("Failed to sync temp file", e))?;

        rooted
            .dir
            .rename(&tmp_rel, &rooted.dir, &rooted.rel)
            .map_err(|e| Error::io(format!("Failed to publish file to {}", real.display()), e))
    })();

    if publish.is_err() {
        // Best-effort cleanup of the orphaned temp file.
        drop(file);
        let _ = rooted.dir.remove_file(&tmp_rel);
        publish?;
    }

    Ok(real)
}

/// Process-wide unique counter for temp-file naming.
///
/// Combined with the leading `.` prefix and the pid this makes temp-file names
/// both recognizable in debug output and collision-free across concurrent
/// atomic writes, without pulling a random-number generator into the sandbox.
fn unique_atomic_id() -> u64 {
    use std::sync::atomic::{AtomicU64, Ordering};
    static SEQ: AtomicU64 = AtomicU64::new(0);
    SEQ.fetch_add(1, Ordering::Relaxed)
}

// ── Remove ──────────────────────────────────────────────────
//
// Deletion is file-grained by design: the capability surface has no
// recursive directory removal.  A recursive primitive would check the
// policy only at the top path, so a tree that *contains* a deny-listed
// location (e.g. `~/.ssh` when cwd is home) would destroy it.
//
// Note on hard-link aliases: unlinking removes a name, not an inode — the
// hard-linked peer elsewhere survives untouched.  `remove_file` goes
// through the shared `Policy::check` like every other primitive, so the
// decision stays in one place.

/// Remove the file at `path` through the pinned root handle.
pub(super) fn remove_file(path: &Path, policy: &Policy) -> Result<()> {
    let real = policy.check(path)?;
    let rooted = acquire(&real, policy, false)?;
    rooted
        .dir
        .remove_file(rooted.rel_or_dot())
        .map_err(|e| Error::io(format!("Failed to remove {}", real.display()), e))
}

// ── Pre-publish assertion ───────────────────────────────────
//
// The one assertion beyond [`Policy::check`]: it keeps `atomic_write`'s
// rename from silently diverging hard-linked aliases.  There is no
// fd-level deny-identity or cross-mount assertion: both would defend
// against a same-UID local attacker racing the CLI (the cross-mount case
// additionally requires `CAP_SYS_ADMIN`), which the threat model excludes.

/// Reject an [`atomic_write`] target that already exists with `nlink > 1`.
///
/// The rename itself is safe (it replaces the directory entry, not the inode),
/// but refusing the alias keeps a hard-linked name from silently changing
/// ownership of content.  A missing target is the common case and passes;
/// non-Unix platforms lack `nlink` and skip the check.
#[cfg(unix)]
fn reject_multiply_linked_target(rooted: &Rooted, shown: &Path) -> Result<()> {
    use cap_std::fs::MetadataExt;

    let md = match rooted.dir.metadata(&rooted.rel) {
        Ok(md) => md,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(()),
        Err(e) => return Err(Error::io(format!("Failed to stat {}", shown.display()), e)),
    };
    if md.is_file() && md.nlink() > 1 {
        tracing::error!(
            nlink = md.nlink(),
            "sandbox: rejected atomic_write onto multiply-linked target"
        );
        return Err(Error::Permission(format!(
            "目标文件存在多个硬链接，已拒绝访问: {}",
            shown.display(),
        )));
    }
    Ok(())
}

#[cfg(not(unix))]
fn reject_multiply_linked_target(_rooted: &Rooted, _shown: &Path) -> Result<()> {
    Ok(())
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    //! ## 模块摘要：io（经 cap-std 根句柄的同步 I/O 原语）
    //!
    //! ### 关键接口
    //! - [acquire] — 绝对路径 → (根句柄, 相对路径)；受限取最长命中 root，非受限取父目录
    //! - [open_file] / [list_dir] — 读侧原语（句柄相对 open / read_dir）
    //! - [create_file] / [atomic_write] — 写侧原语（create_new + 0o600；临时文件 → fsync → rename）
    //! - [remove_file] — 删除原语（句柄相对 unlinkat；能力面无递归删除）
    //! - [reject_multiply_linked_target] — atomic_write 发布前拒绝多硬链接目标
    //!
    //! ### 关键分支与异常路径
    //! - 路径命中 deny（roots=None 也生效）→ Err("目标路径被安全策略保护")
    //! - 路径逃逸 roots → Err("目标路径超出可访问范围")；映射不到任何 root → fail-closed
    //! - 受限 root 缺失：写侧先建后打开；读侧透传 NotFound
    //! - 文件已存在时 create_file → Err(AlreadyExists)；多硬链接文件读侧放行（deny 按解析后的路径字符串比对）
    //!
    //! ### 上下游交互
    //! - 上游：sandbox/fs_impl.rs 的异步操作
    //! - 下游：[super::policy::Policy]（判定）、[super::paths]（解析 / 建根）、cap-std 根句柄

    use std::fs as stdfs;

    use tempfile::TempDir;

    use super::*;
    use crate::sandbox::DenyRule;
    use crate::sandbox::paths::resolve_real_path;

    fn roots_of(dirs: &[&Path]) -> Vec<PathBuf> {
        dirs.iter().map(|p| p.to_path_buf()).collect()
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

    // ── acquire ──

    /// P0：[acquire] 受限模式映射到命中的 root，相对路径正确
    /// 条件：root=tmp，real=tmp/sub/f.txt（已存在）
    /// 断言：rel == "sub/f.txt"，句柄可打开该文件
    #[test]
    fn acquire_maps_relative_path_under_root() {
        let tmp = TempDir::new().unwrap();
        stdfs::create_dir(tmp.path().join("sub")).unwrap();
        stdfs::write(tmp.path().join("sub/f.txt"), "x").unwrap();
        let roots = roots_of(&[tmp.path()]);
        let policy = policy(Some(&roots), &[]);

        let real = tmp.path().join("sub/f.txt").canonicalize().unwrap();
        let rooted = acquire(&real, &policy, false).unwrap();
        assert_eq!(rooted.rel, Path::new("sub/f.txt"));
        assert!(rooted.dir.open(&rooted.rel).is_ok());
    }

    /// P1：[acquire] 受限模式下 root 自身路径映射为空相对路径
    /// 条件：real 恰好等于 root
    /// 断言：rel 为空，rel_or_dot 为 "."，句柄可用 "." 打开
    ///      （仅 Unix：Windows 不支持以 "." 打开目录句柄）
    #[cfg(unix)]
    #[test]
    fn acquire_maps_root_itself_to_dot() {
        let tmp = TempDir::new().unwrap();
        let roots = roots_of(&[tmp.path()]);
        let policy = policy(Some(&roots), &[]);

        let real = tmp.path().canonicalize().unwrap();
        let rooted = acquire(&real, &policy, false).unwrap();
        assert_eq!(rooted.rel, Path::new(""));
        assert_eq!(rooted.rel_or_dot(), Path::new("."));
        assert!(rooted.dir.open(rooted.rel_or_dot()).is_ok());
    }

    /// P1：[acquire] 嵌套 root 取最长前缀（tmp/requests ⊂ tmp）
    /// 条件：roots = [tmp, tmp/requests]，real = tmp/requests/f.txt
    /// 断言：命中 tmp/requests，rel == "f.txt"
    #[test]
    fn acquire_nested_roots_pick_longest_prefix() {
        let tmp = TempDir::new().unwrap();
        stdfs::create_dir(tmp.path().join("requests")).unwrap();
        stdfs::write(tmp.path().join("requests/f.txt"), "x").unwrap();
        let roots = vec![tmp.path().to_path_buf(), tmp.path().join("requests")];
        let policy = policy(Some(&roots), &[]);

        let real = tmp.path().join("requests/f.txt").canonicalize().unwrap();
        let rooted = acquire(&real, &policy, false).unwrap();
        assert_eq!(rooted.rel, Path::new("f.txt"));
    }

    /// P1：[acquire] real 不在任何 root 内时 fail-closed
    /// 条件：roots=[tmp]，real=/etc/passwd
    /// 断言：Err(Permission)
    #[test]
    #[cfg(unix)]
    fn acquire_outside_roots_fails_closed() {
        let tmp = TempDir::new().unwrap();
        let roots = roots_of(&[tmp.path()]);
        let policy = policy(Some(&roots), &[]);

        let real = resolve_real_path(Path::new("/etc/passwd"));
        let err = acquire(&real, &policy, false).unwrap_err();
        assert!(matches!(err, Error::Permission(_)), "err = {err:?}");
    }

    /// P0：[acquire] 非受限模式 pin 到目标父目录
    /// 条件：roots=None，real=tmp/f.txt
    /// 断言：rel == "f.txt"，句柄可打开该文件
    #[test]
    fn acquire_unrestricted_pins_parent_directory() {
        let tmp = TempDir::new().unwrap();
        stdfs::write(tmp.path().join("f.txt"), "x").unwrap();
        let policy = policy(None, &[]);

        let real = tmp.path().join("f.txt").canonicalize().unwrap();
        let rooted = acquire(&real, &policy, false).unwrap();
        assert_eq!(rooted.rel, Path::new("f.txt"));
        assert!(rooted.dir.open(&rooted.rel).is_ok());
    }

    /// P1：[acquire] 写侧 root 缺失时先创建再打开句柄（0o700）
    /// 条件：roots=[tmp/requests]（不存在），real=tmp/requests/f.txt，create_missing=true
    /// 断言：root 已被创建且（Unix）权限为 0o700，rel == "f.txt"
    #[test]
    fn acquire_missing_root_is_created_for_writers() {
        let tmp = TempDir::new().unwrap();
        let missing = tmp.path().join("requests");
        let roots = roots_of(&[missing.as_path()]);
        let policy = policy(Some(&roots), &[]);

        let real = resolve_real_path(&missing.join("f.txt"));
        let rooted = acquire(&real, &policy, true).unwrap();
        assert_eq!(rooted.rel, Path::new("f.txt"));
        assert!(missing.is_dir(), "write must create the root");
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let mode = stdfs::metadata(&missing).unwrap().permissions().mode() & 0o777;
            assert_eq!(mode, 0o700, "root mode = {mode:o}");
        }
    }

    /// P1：[acquire] 读侧 root 缺失时透传 NotFound 且无副作用
    /// 条件：roots=[tmp/requests]（不存在），create_missing=false
    /// 断言：Err(Io) 且 kind 为 NotFound，root 未被创建
    #[test]
    fn acquire_missing_root_is_not_created_for_readers() {
        let tmp = TempDir::new().unwrap();
        let missing = tmp.path().join("requests");
        let roots = roots_of(&[missing.as_path()]);
        let policy = policy(Some(&roots), &[]);

        let real = resolve_real_path(&missing.join("f.txt"));
        let err = acquire(&real, &policy, false).unwrap_err();
        assert!(
            matches!(&err, Error::Io { source, .. } if source.kind() == std::io::ErrorKind::NotFound),
            "err = {err:?}"
        );
        assert!(!missing.exists(), "read must not create the root");
    }

    // ── open_file ──

    /// P0：[open_file] 打开沙箱内已存在文件成功
    /// 条件：文件存在于 root 下
    /// 断言：返回 Ok，解析路径与 canonicalize 一致
    #[test]
    fn open_file_success() {
        let tmp = TempDir::new().unwrap();
        let roots = roots_of(&[tmp.path()]);
        let file = tmp.path().join("readable.txt");
        stdfs::write(&file, "contents").unwrap();

        let (resolved, _f) = open_file(&file, &policy(Some(&roots), &[])).unwrap();
        assert_eq!(resolved, file.canonicalize().unwrap());
    }

    /// P1：[open_file] 打开 roots 外文件被拒绝
    /// 条件：文件存在于 forbidden 目录，roots 仅含 allowed
    /// 断言：返回 Err
    #[test]
    fn open_file_rejects_outside_roots() {
        let allowed = TempDir::new().unwrap();
        let forbidden = TempDir::new().unwrap();
        let roots = roots_of(&[allowed.path()]);
        let file = forbidden.path().join("secret.txt");
        stdfs::write(&file, "secret").unwrap();

        assert!(open_file(&file, &policy(Some(&roots), &[])).is_err());
    }

    /// P1：[open_file] 打开不存在文件返回 I/O 错误
    /// 条件：文件在 root 内但不存在
    /// 断言：返回 Err，消息含 "Failed to open"
    #[test]
    fn open_file_nonexistent_file() {
        let tmp = TempDir::new().unwrap();
        let roots = roots_of(&[tmp.path()]);
        let result = open_file(&tmp.path().join("missing.txt"), &policy(Some(&roots), &[]));
        assert!(result.unwrap_err().to_string().contains("Failed to open"));
    }

    /// P1：[open_file] 沙箱内符号链接指向的文件可正常打开
    /// 条件：link.txt → real.txt，两者同在 root 内
    /// 断言：返回 Ok
    #[cfg(unix)]
    #[test]
    fn open_file_with_symlink_within_roots() {
        let tmp = TempDir::new().unwrap();
        let roots = roots_of(&[tmp.path()]);
        let real_file = tmp.path().join("real.txt");
        stdfs::write(&real_file, "data").unwrap();
        let link = tmp.path().join("link.txt");
        std::os::unix::fs::symlink(&real_file, &link).unwrap();

        assert!(open_file(&link, &policy(Some(&roots), &[])).is_ok());
    }

    /// P1：[open_file] 打开 root 目录自身返回句柄，读取时报 IsADirectory
    /// 条件：roots=[tmp]，real 就是 root 路径
    /// 断言：open 返回 Ok，后续 read_to_string 报 IsADirectory
    ///      （仅 Unix：Windows 打开目录即 PermissionDenied，拿不到句柄）
    #[cfg(unix)]
    #[test]
    fn open_file_on_root_dir_reads_as_isdir() {
        let tmp = TempDir::new().unwrap();
        let roots = roots_of(&[tmp.path()]);

        let (path, mut file) = open_file(tmp.path(), &policy(Some(&roots), &[])).unwrap();
        assert_eq!(path, tmp.path().canonicalize().unwrap());
        let mut s = String::new();
        let err = std::io::Read::read_to_string(&mut file, &mut s).unwrap_err();
        assert_eq!(err.kind(), std::io::ErrorKind::IsADirectory);
    }

    /// P0：[open_file] deny 项内文件被拒绝（受限与非受限两种模式）
    /// 条件：deny 为目标文件本身，roots 分别为 [tmp] 与 None
    /// 断言：均返回 Err，消息含 "安全策略保护"
    #[test]
    fn open_file_denies_denied_entry() {
        let tmp = TempDir::new().unwrap();
        let file = tmp.path().join("secret.txt");
        stdfs::write(&file, "cred").unwrap();
        let roots = roots_of(&[tmp.path()]);
        let deny = std::slice::from_ref(&file);

        for policy in [policy(Some(&roots), deny), policy(None, deny)] {
            let msg = open_file(&file, &policy).unwrap_err().to_string();
            assert!(msg.contains("安全策略保护"), "msg = {msg}");
        }
    }

    // ── create_file ──

    /// P0：[create_file] 在沙箱内创建新文件成功
    /// 条件：目标在 root 下且不存在
    /// 断言：返回 Ok，文件已创建
    #[test]
    fn create_file_success() {
        let tmp = TempDir::new().unwrap();
        let roots = roots_of(&[tmp.path()]);
        let (resolved, _f) =
            create_file(&tmp.path().join("new.txt"), &policy(Some(&roots), &[])).unwrap();
        assert!(resolved.exists());
    }

    /// P1：[create_file] 父目录不存在时自动创建（经根句柄）
    /// 条件：目标 sub/dir/new.txt 的父目录不存在
    /// 断言：返回 Ok，文件已创建
    #[test]
    fn create_file_creates_parent() {
        let tmp = TempDir::new().unwrap();
        let roots = roots_of(&[tmp.path()]);
        let (resolved, _f) = create_file(
            &tmp.path().join("sub/dir/new.txt"),
            &policy(Some(&roots), &[]),
        )
        .unwrap();
        assert!(resolved.exists());
    }

    /// P1：[create_file] 非受限模式父目录不存在时同样自动创建
    /// 条件：roots=None，目标 a/b/new.txt 的父目录不存在
    /// 断言：返回 Ok，文件已创建
    #[test]
    fn create_file_creates_parent_unrestricted() {
        let tmp = TempDir::new().unwrap();
        let (resolved, _f) =
            create_file(&tmp.path().join("a/b/new.txt"), &policy(None, &[])).unwrap();
        assert!(resolved.exists());
    }

    /// P1：[create_file] 拒绝在 roots 外创建
    /// 条件：目标在 forbidden 目录，roots 仅含 allowed
    /// 断言：返回 Err
    #[test]
    fn create_file_rejects_outside_roots() {
        let allowed = TempDir::new().unwrap();
        let forbidden = TempDir::new().unwrap();
        let roots = roots_of(&[allowed.path()]);
        let result = create_file(
            &forbidden.path().join("escape.txt"),
            &policy(Some(&roots), &[]),
        );
        assert!(result.is_err());
    }

    /// P1：[create_file] 目标已存在时返回错误（create_new 语义）
    /// 条件：目标文件已预先写入
    /// 断言：返回 Err 且 kind 为 AlreadyExists
    #[test]
    fn create_file_already_exists_returns_err() {
        let tmp = TempDir::new().unwrap();
        let roots = roots_of(&[tmp.path()]);
        let file = tmp.path().join("exists.txt");
        stdfs::write(&file, "data").unwrap();

        let err = create_file(&file, &policy(Some(&roots), &[])).unwrap_err();
        assert!(
            matches!(&err, Error::Io { source, .. } if source.kind() == std::io::ErrorKind::AlreadyExists),
            "err = {err:?}"
        );
    }

    /// P0：[create_file] deny 目录下创建被拒绝且不产生文件
    /// 条件：deny=tmp/protected，目标=tmp/protected/out.txt（roots 分别为 [tmp] 与 None）
    /// 断言：均返回 Err，目标文件不存在
    #[test]
    fn create_file_denies_denied_dir() {
        let tmp = TempDir::new().unwrap();
        let protected = tmp.path().join("protected");
        stdfs::create_dir(&protected).unwrap();
        let target = protected.join("out.txt");
        let roots = roots_of(&[tmp.path()]);
        let deny = std::slice::from_ref(&protected);

        for policy in [policy(Some(&roots), deny), policy(None, deny)] {
            assert!(create_file(&target, &policy).is_err());
            assert!(!target.exists());
        }
    }

    /// P1：[create_file] 占位后父目录被替换不影响已打开 fd 的写入
    /// （下载「先落位再下载」模型锁定：占位经根句柄定位后，流写全程走 fd）
    /// 条件：受限模式 create_file 占位后，将父目录 rename 为其他名字
    /// 断言：write_all + sync_all 成功；内容落在原 inode（rename 后的路径下可读）
    #[cfg(unix)]
    #[test]
    fn create_file_fd_survives_parent_directory_swap() {
        let tmp = TempDir::new().unwrap();
        let roots = roots_of(&[tmp.path()]);
        let policy = policy(Some(&roots), &[]);

        let (_real, mut file) = create_file(&tmp.path().join("out/f.bin"), &policy).unwrap();
        stdfs::rename(tmp.path().join("out"), tmp.path().join("swapped")).unwrap();

        file.write_all(b"payload").unwrap();
        file.sync_all().unwrap();
        drop(file);

        assert_eq!(
            stdfs::read(tmp.path().join("swapped/f.bin")).unwrap(),
            b"payload"
        );
    }

    // ── atomic_write ──

    /// P0：[atomic_write] 写入二进制数据
    /// 条件：向临时文件写入 [0xDE, 0xAD, 0xBE, 0xEF]
    /// 断言：读取内容与原始数据一致
    #[test]
    fn atomic_write_writes_bytes() {
        let tmp = TempDir::new().unwrap();
        let file = tmp.path().join("binary.bin");
        let data = vec![0xDE, 0xAD, 0xBE, 0xEF];
        atomic_write(&file, &data, 0o644, &policy(None, &[])).unwrap();
        assert_eq!(stdfs::read(&file).unwrap(), data);
    }

    /// P1：[atomic_write] 覆盖已有文件内容
    /// 条件：同一文件先写 "first" 再写 "second"
    /// 断言：最终读取为 "second"
    #[test]
    fn atomic_write_overwrites_existing_file() {
        let tmp = TempDir::new().unwrap();
        let file = tmp.path().join("report.xml");
        let policy = policy(None, &[]);

        atomic_write(&file, b"first", 0o644, &policy).unwrap();
        assert_eq!(stdfs::read_to_string(&file).unwrap(), "first");

        atomic_write(&file, b"second", 0o644, &policy).unwrap();
        assert_eq!(stdfs::read_to_string(&file).unwrap(), "second");
    }

    /// P1：[atomic_write] 自动创建父目录（受限经根句柄，非受限经建根）
    /// 条件：目标 a/b/c/file.txt 的父目录均不存在
    /// 断言：受限与非受限模式均写入成功
    #[test]
    fn atomic_write_creates_parent_dirs() {
        let tmp = TempDir::new().unwrap();
        let roots = roots_of(&[tmp.path()]);

        let restricted = tmp.path().join("a/b/c/file.txt");
        atomic_write(&restricted, b"deep", 0o644, &policy(Some(&roots), &[])).unwrap();
        assert_eq!(stdfs::read_to_string(&restricted).unwrap(), "deep");

        let unrestricted = tmp.path().join("x/y/z/file.txt");
        atomic_write(&unrestricted, b"deep", 0o644, &policy(None, &[])).unwrap();
        assert_eq!(stdfs::read_to_string(&unrestricted).unwrap(), "deep");
    }

    /// P1：[atomic_write] 在 Unix 上设置目标权限
    /// 条件：以 0o600 写入
    /// 断言：文件权限 & 0o777 == 0o600
    #[cfg(unix)]
    #[test]
    fn atomic_write_sets_permissions() {
        use std::os::unix::fs::PermissionsExt;
        let tmp = TempDir::new().unwrap();
        let file = tmp.path().join("perms.txt");
        atomic_write(&file, b"data", 0o600, &policy(None, &[])).unwrap();
        let mode = stdfs::metadata(&file).unwrap().permissions().mode() & 0o777;
        assert_eq!(mode, 0o600);
    }

    /// P0：[create_file / atomic_write] Windows 下 owner-only mode 的文件 DACL 收紧（W5，0o600 的平台等价物）
    /// 条件：沙箱内分别经 create_file 与 atomic_write(0o600) 落盘文件，读回安全描述符 SDDL
    /// 断言：DACL 以 "D:" 起，含 OW / SY / BA 三条完全控制 ACE，共 3 个
    #[cfg(windows)]
    #[test]
    fn create_and_atomic_write_apply_owner_only_dacl() {
        let tmp = TempDir::new().unwrap();
        let roots = roots_of(&[tmp.path()]);
        let policy = policy(Some(&roots), &[]);

        let created = tmp.path().join("config.json");
        let (_real, _f) = create_file(&created, &policy).unwrap();
        let written = tmp.path().join("cache.json");
        atomic_write(&written, b"data", 0o600, &policy).unwrap();

        for path in [&created, &written] {
            let sddl = sddl_dacl_of(path);
            assert!(sddl.starts_with("D:"), "sddl = {sddl}");
            assert!(sddl.contains("(A;;FA;;;OW)"), "sddl = {sddl}");
            assert!(sddl.contains("(A;;FA;;;SY)"), "sddl = {sddl}");
            assert!(sddl.contains("(A;;FA;;;BA)"), "sddl = {sddl}");
            assert_eq!(sddl.matches('(').count(), 3, "sddl = {sddl}");
        }
    }

    /// P1：[atomic_write] Windows 下非 owner-only mode（0o644）保留继承 ACL，与 Unix 对称
    /// 条件：同目录下一个 std 直写文件与一个 atomic_write(0o644) 落盘文件
    /// 断言：两者 DACL SDDL 逐字节一致（均未收紧，继承目录 ACL）
    #[cfg(windows)]
    #[test]
    fn atomic_write_with_group_readable_mode_keeps_inherited_dacl() {
        let tmp = TempDir::new().unwrap();
        let roots = roots_of(&[tmp.path()]);
        let policy = policy(Some(&roots), &[]);

        let plain = tmp.path().join("plain.txt");
        stdfs::write(&plain, "x").unwrap();
        let relaxed = tmp.path().join("cache.json");
        atomic_write(&relaxed, b"data", 0o644, &policy).unwrap();

        assert_eq!(sddl_dacl_of(&relaxed), sddl_dacl_of(&plain));
    }

    /// 读回 `path` 的 DACL 并以 SDDL 字符串返回（W5 断言用）。
    #[cfg(windows)]
    fn sddl_dacl_of(path: &Path) -> String {
        use std::os::windows::ffi::{OsStrExt, OsStringExt};

        use windows_sys::Win32::Foundation::LocalFree;
        use windows_sys::Win32::Security::Authorization::{
            ConvertSecurityDescriptorToStringSecurityDescriptorW, GetNamedSecurityInfoW,
            SDDL_REVISION_1, SE_FILE_OBJECT,
        };
        use windows_sys::Win32::Security::{ACL, DACL_SECURITY_INFORMATION, PSECURITY_DESCRIPTOR};

        let wide: Vec<u16> = path
            .as_os_str()
            .encode_wide()
            .chain(std::iter::once(0))
            .collect();
        // SAFETY：全部指针在各自调用期间有效；sd / sddl 由系统分配，用后
        // LocalFree 释放；`wide` 在 Get 调用期间存活。
        unsafe {
            let mut sd: PSECURITY_DESCRIPTOR = std::ptr::null_mut();
            let mut dacl: *mut ACL = std::ptr::null_mut();
            let rc = GetNamedSecurityInfoW(
                wide.as_ptr(),
                SE_FILE_OBJECT,
                DACL_SECURITY_INFORMATION,
                std::ptr::null_mut(),
                std::ptr::null_mut(),
                &mut dacl,
                std::ptr::null_mut(),
                &mut sd,
            );
            assert_eq!(rc, 0, "GetNamedSecurityInfoW failed: {rc}");

            let mut raw: windows_sys::core::PWSTR = std::ptr::null_mut();
            let ok = ConvertSecurityDescriptorToStringSecurityDescriptorW(
                sd,
                SDDL_REVISION_1,
                DACL_SECURITY_INFORMATION,
                &mut raw,
                std::ptr::null_mut(),
            );
            assert!(ok != 0, "ConvertSecurityDescriptor… failed");
            let mut len = 0usize;
            while *raw.add(len) != 0 {
                len += 1;
            }
            let s = std::ffi::OsString::from_wide(std::slice::from_raw_parts(raw, len))
                .to_string_lossy()
                .into_owned();
            LocalFree(raw as _);
            LocalFree(sd as _);
            s
        }
    }

    /// P1：[atomic_write] 写入不可写位置时失败
    /// 条件：目标位于 /proc（不可写）
    /// 断言：返回 Err，消息含 "Failed to create directory" 或 "Failed to create temp file"
    #[cfg(unix)]
    #[test]
    fn atomic_write_unwritable_dir_fails() {
        let result = atomic_write(
            Path::new("/proc/nonexistent/file.txt"),
            b"data",
            0o644,
            &policy(None, &[]),
        );
        let msg = result.unwrap_err().to_string();
        assert!(
            msg.contains("Failed to create directory")
                || msg.contains("Failed to create temp file"),
            "msg = {msg}"
        );
    }

    /// P0：[atomic_write] deny 目录下写入被拒绝且不产生文件
    /// 条件：deny 为目标所在目录（roots 分别为 [tmp] 与 None）
    /// 断言：均返回 Err，目标文件不存在
    #[test]
    fn atomic_write_denies_denied_dir() {
        let tmp = TempDir::new().unwrap();
        let target = tmp.path().join("out.txt");
        let roots = roots_of(&[tmp.path()]);
        let deny = roots_of(&[tmp.path()]);

        for policy in [policy(Some(&roots), &deny), policy(None, &deny)] {
            assert!(atomic_write(&target, b"x", 0o600, &policy).is_err());
            assert!(!target.exists());
        }
    }

    /// P1：[atomic_write] 发布前拒绝覆盖多硬链接目标
    /// 条件：root=tmp，tmp/target 与 tmp/alias 为同一 inode
    /// 断言：返回 Err（含 "多个硬链接"），target 内容保持原样
    #[cfg(unix)]
    #[test]
    fn atomic_write_rejects_multiply_linked_target() {
        let tmp = TempDir::new().unwrap();
        let target = tmp.path().join("target");
        stdfs::write(&target, "original").unwrap();
        stdfs::hard_link(&target, tmp.path().join("alias")).unwrap();

        let roots = roots_of(&[tmp.path()]);
        let msg = atomic_write(&target, b"new", 0o600, &policy(Some(&roots), &[]))
            .unwrap_err()
            .to_string();
        assert!(msg.contains("多个硬链接"), "msg = {msg}");
        assert_eq!(stdfs::read(&target).unwrap(), b"original");
    }

    /// P1：[atomic_write] 受限模式 root 缺失时先建根再写入
    /// 条件：roots=[tmp/requests]（不存在），target=tmp/requests/g.txt
    /// 断言：写入成功且内容一致
    #[test]
    fn atomic_write_missing_root_is_bootstrapped() {
        let tmp = TempDir::new().unwrap();
        let missing = tmp.path().join("requests");
        let roots = roots_of(&[missing.as_path()]);
        let target = missing.join("g.txt");

        atomic_write(&target, b"bootstrap", 0o600, &policy(Some(&roots), &[])).unwrap();
        assert_eq!(stdfs::read_to_string(&target).unwrap(), "bootstrap");
    }

    // ── remove_file ──

    /// P1：[remove_file] deny 项内文件删除被拒绝且文件保留
    /// 条件：deny 为目标文件（roots 分别为 [tmp] 与 None）
    /// 断言：均返回 Err，文件仍存在
    #[test]
    fn remove_file_denies_denied_entry() {
        let tmp = TempDir::new().unwrap();
        let keep = tmp.path().join("keep.txt");
        stdfs::write(&keep, "x").unwrap();
        let roots = roots_of(&[tmp.path()]);
        let deny = std::slice::from_ref(&keep);

        for policy in [policy(Some(&roots), deny), policy(None, deny)] {
            assert!(remove_file(&keep, &policy).is_err());
            assert!(keep.exists());
        }
    }

    // ── list_dir ──

    /// P0：[list_dir] 返回目录下所有条目（含文件与子目录）
    /// 条件：目录下有 2 个文件与 1 个子目录
    /// 断言：返回 3 个条目，其中 1 个 is_dir、2 个 is_file，路径为绝对路径
    #[test]
    fn list_dir_includes_files_and_dirs() {
        let tmp = TempDir::new().unwrap();
        stdfs::write(tmp.path().join("a.txt"), "a").unwrap();
        stdfs::write(tmp.path().join("b.txt"), "b").unwrap();
        stdfs::create_dir(tmp.path().join("subdir")).unwrap();

        let roots = roots_of(&[tmp.path()]);
        let entries = list_dir(tmp.path(), &policy(Some(&roots), &[])).unwrap();
        assert_eq!(entries.len(), 3, "list_dir must return all entries");
        assert_eq!(entries.iter().filter(|e| e.is_dir).count(), 1);
        assert_eq!(entries.iter().filter(|e| e.is_file).count(), 2);
        assert!(entries.iter().all(|e| e.path.is_absolute()));
    }

    /// P1：[list_dir] deny 目录列举被拒绝
    /// 条件：deny 为目标目录（roots 分别为 [tmp] 与 None）
    /// 断言：均返回 Err
    #[test]
    fn list_dir_denies_denied_dir() {
        let tmp = TempDir::new().unwrap();
        let roots = roots_of(&[tmp.path()]);
        let deny = roots_of(&[tmp.path()]);

        for policy in [policy(Some(&roots), &deny), policy(None, &deny)] {
            assert!(list_dir(tmp.path(), &policy).is_err());
        }
    }

    /// P1：[list_dir] 不存在的目录返回 I/O 错误
    /// 条件：目录不存在但路径在 root 内
    /// 断言：返回 Err，消息含 "Failed to read directory"
    #[test]
    fn list_dir_nonexistent_dir_returns_io_err() {
        let tmp = TempDir::new().unwrap();
        let roots = roots_of(&[tmp.path()]);
        let result = list_dir(&tmp.path().join("no-dir"), &policy(Some(&roots), &[]));
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("Failed to read directory")
        );
    }

    // ── 多硬链接读侧放行 ──

    /// P1：[open_file] 非 deny 路径名的多硬链接文件允许读取（受限与非受限）
    /// 条件：tmp/a.txt 与 tmp/b.txt 为同一 inode 的两个硬链接，无 deny 项
    /// 断言：两种模式均返回 Ok —— 不一刀切拒绝 nlink>1
    ///       （pnpm store / git clone --local 等合法场景）
    #[cfg(unix)]
    #[test]
    fn open_file_allows_multiply_linked_file() {
        let tmp = TempDir::new().unwrap();
        let a = tmp.path().join("a.txt");
        stdfs::write(&a, "shared").unwrap();
        stdfs::hard_link(&a, tmp.path().join("b.txt")).unwrap();

        let roots = roots_of(&[tmp.path()]);
        for policy in [policy(Some(&roots), &[]), policy(None, &[])] {
            assert!(open_file(&a, &policy).is_ok(), "policy = {policy:?}");
        }
    }
}
