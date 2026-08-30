//! Access policy: the single decision point for "is this path allowed".
//!
//! One [`Policy`] per direction (read / write) is held by
//! [`SandboxedFs`](super::SandboxedFs).  It carries the allowed roots plus the
//! caller-supplied denylist, and answers [`Policy::check`] — resolve the path
//! (following symlinks) and verify it stays inside the roots and outside every
//! deny entry.  Deny always wins over allow and applies even when no roots are
//! configured.
//!
//! Credential-shape deny globs ([`recommended_deny_rule`]) are deny rules
//! like any other: system directories plus credential segments, file
//! names, extensions and consecutive-component sequences rejected at any
//! depth inside the roots, independent of `$HOME`.  Callers append them
//! explicitly; the built-in globs apply in **both** directions — reads and
//! writes are screened identically.
//!
//! `Policy` is a plain value: [`SandboxedFs`](super::SandboxedFs) holds it
//! behind `Arc`, so moving a policy into a blocking task is one refcount
//! bump, and cloning a `Policy` by hand only bumps the per-rule `Arc`s
//! (the compiled rule state is never deep-copied).
//!
//! `std::fs` never appears here: the construction-time resolution goes
//! through [`super::paths`], the crate's single ambient-access module.

mod chars;
mod compare;
mod denylist;
mod rule;

use std::path::{Path, PathBuf};

pub(super) use self::chars::reject_dangerous_chars;
pub(super) use self::compare::is_under;
pub use self::denylist::recommended_deny_rule;
pub use self::rule::DenyRule;
use super::paths::resolve_real_path;
use crate::Result;
use crate::api::Error;

// ── Policy ──────────────────────────────────────────────────

/// Resolved access policy for one direction (read or write).
///
/// `roots == None` means unrestricted; the denylist applies either way —
/// deny always wins over allow, including in rootless mode.
///
/// # Roots and deny patterns are both a startup snapshot
///
/// Both sides are pinned when the `Policy` is built: each root is resolved
/// to its on-disk location once, and each deny glob is compiled once
/// (absolute patterns resolved, shape patterns case-folded).  The hot path
/// therefore performs zero `canonicalize` calls on policy data, and neither
/// boundary drifts at runtime — a root symlink swapped after construction
/// still authorises the location pinned at startup (never the swap target).
/// Roots and deny locations are long-lived, so this is an accepted
/// trade-off.
#[derive(Clone, Debug, Default)]
pub struct Policy {
    /// Roots resolved (symlink-followed) at construction time.
    roots: Option<Vec<PathBuf>>,
    /// Deny rules, each internally shared (`Arc`) across policies.
    deny: Vec<DenyRule>,
}

impl Policy {
    /// An unrestricted policy with an empty denylist.  Configure it with the
    /// `with_*` builders; each call pins its own increment immediately
    /// (roots resolve, deny globs compile), so construction order never
    /// multiplies snapshot cost.
    pub fn new() -> Self {
        Self::default()
    }

    /// Replace the allowed roots (resolved to their on-disk location now).
    ///
    /// Roots must be **absolute** (the capability contract rejects relative
    /// input everywhere else too): a relative root can at best be resolved
    /// against ambient state, and one that cannot be resolved at
    /// construction would silently confine every operation (no absolute
    /// path is ever `is_under` a relative root) — the debug assertion
    /// below makes that misconfiguration loud in tests instead of
    /// surfacing as blanket permission errors.  Callers receiving
    /// externally-derived values (env vars, config files) must absolutize
    /// them first (see the CLI's `absolutize_external_path`).
    pub fn with_allowed_dirs(mut self, dirs: &[&Path]) -> Self {
        for dir in dirs {
            debug_assert!(
                dir.is_absolute(),
                "sandbox root must be absolute, otherwise it never matches resolved paths: {}",
                dir.display()
            );
        }
        self.roots = Some(dirs.iter().map(|p| resolve_real_path(p)).collect());
        self
    }

    /// Append a deny rule.  Cloning a [`DenyRule`] beforehand shares its
    /// compiled state with another policy for free (an `Arc` bump), so a
    /// denylist consumed by several policies pays its compile cost exactly
    /// once.
    pub fn with_deny(mut self, rule: DenyRule) -> Self {
        self.deny.push(rule);
        self
    }

    /// Append the recommended deny baseline ([`recommended_deny_rule`]),
    /// compiled once.
    pub fn with_recommended_deny(self) -> Self {
        self.with_deny(recommended_deny_rule())
    }

    /// Configured roots, or `None` when unrestricted.
    pub(crate) fn roots(&self) -> Option<&[PathBuf]> {
        self.roots.as_deref()
    }

    /// Number of configured deny entries (diagnostics / tests).
    pub(crate) fn deny_len(&self) -> usize {
        self.deny.len()
    }

    /// Resolve `path` (following symlinks) and verify it stays inside the
    /// roots and outside every deny rule.
    ///
    /// Returns the resolved path.  This is the single decision point for
    /// "is this path allowed"; every I/O primitive starts here.  It stays
    /// crate-private on purpose: the only public access-control entry point
    /// is the async [`Fs::resolve`](crate::Fs::resolve).
    pub(crate) fn check(&self, path: &Path) -> Result<PathBuf> {
        let real = resolve_real_path(path);

        for rule in self.deny.iter() {
            if let Err(verdict) = rule.evaluate(&real) {
                tracing::error!(
                    deny_rule = %rule.name(),
                    "sandbox: path rejected by denylist"
                );
                return Err(verdict);
            }
        }

        let Some(roots) = self.roots() else {
            // No roots configured — unrestricted access (denylist still applied).
            return Ok(real);
        };

        // Roots were resolved at construction — a pure prefix comparison.
        if !roots.iter().any(|root| is_under(&real, root)) {
            let allowed = roots
                .iter()
                .map(|r| r.display().to_string())
                .collect::<Vec<_>>()
                .join(", ");
            tracing::error!("sandbox: path outside allowed roots");
            return Err(Error::Permission(format!(
                "目标路径超出可访问范围: {} (允许范围: {})",
                path.display(),
                allowed,
            )));
        }
        Ok(real)
    }
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests;
