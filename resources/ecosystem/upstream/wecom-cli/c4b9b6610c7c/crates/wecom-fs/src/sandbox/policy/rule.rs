//! Deny rules: one uniform named-predicate shape, a [`DenyRule::prefix`]
//! preset for fixed directories, and a glob-pattern preset that covers the
//! built-in table.
//!
//! This module is only the machinery — the built-in deny *table* lives in
//! [`super::denylist`].

use std::path::{Path, PathBuf};
use std::sync::Arc;

use super::super::paths::resolve_real_path;
use super::compare::{fold_case_if_needed, folded_segments, is_under};
use crate::Result;
use crate::api::Error;

// ── Deny rules ──────────────────────────────────────────────

/// The shared deny-verdict message: a stable prefix (tests and callers
/// match on `安全策略保护`), the rule-specific reason, and the resolved
/// path.  The reason matters: the caller is often an Agent that
/// self-corrects from the message (cf. `reject_dangerous_chars` carrying
/// the offending code point).
pub(super) fn denied(reason: &str, real: &Path) -> Error {
    Error::Permission(format!(
        "目标路径被安全策略保护（{reason}），禁止访问: {}",
        real.display()
    ))
}

/// A deny rule: a named predicate over the resolved path.
///
/// Rules capture their compiled state at construction, so the per-check
/// cost is pure comparison, and cloning a rule (e.g. sharing it between
/// the read and write policies) is an `Arc` bump, never a recompile.
///
/// The predicate signature behind every rule: resolved path in, deny
/// verdict out (`Err` = denied, with the caller-facing reason).
type Predicate = Arc<dyn Fn(&Path) -> Result<()> + Send + Sync>;

/// Deny always wins over allow and applies even in rootless mode.
pub struct DenyRule {
    name: std::borrow::Cow<'static, str>,
    f: Predicate,
}

impl Clone for DenyRule {
    fn clone(&self) -> Self {
        Self {
            name: self.name.clone(),
            f: Arc::clone(&self.f),
        }
    }
}

impl std::fmt::Debug for DenyRule {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("DenyRule")
            .field("name", &self.name)
            .finish()
    }
}

/// A compiled glob-pattern component — see [`DenyRule::globs`] for the
/// dialect.
#[derive(Debug)]
enum SegPat {
    Exact(String),
    Ext(String),
}

impl SegPat {
    fn matches(&self, component: &str) -> bool {
        match self {
            Self::Exact(s) => component == s,
            Self::Ext(ext) => component
                .rfind('.')
                .is_some_and(|dot| dot + 1 < component.len() && component[dot + 1..] == *ext),
        }
    }
}

/// A Windows drive-absolute pattern (`C:\…` / `C:/…`).  Recognised on
/// every platform so the built-in table can stay one unconditional list —
/// on Unix such a prefix simply never matches.
fn is_drive_absolute(p: &str) -> bool {
    let b = p.as_bytes();
    b.len() >= 3 && b[0].is_ascii_alphabetic() && b[1] == b':' && (b[2] == b'\\' || b[2] == b'/')
}

impl DenyRule {
    /// A custom rule from a predicate over the resolved path.
    ///
    /// Return `Err` to deny: the error is propagated to the caller
    /// **verbatim**, so build an [`Error::Permission`] whose message says
    /// *why* the path is denied (`denied` in this module is the shared
    /// message shape).  `Ok(())` passes the path to the next rule.  This is the
    /// escape hatch for anything the glob dialect cannot express.
    pub fn new(
        name: impl Into<std::borrow::Cow<'static, str>>,
        f: impl Fn(&Path) -> Result<()> + Send + Sync + 'static,
    ) -> Self {
        Self {
            name: name.into(),
            f: Arc::new(f),
        }
    }

    /// Human-readable rule name, used in rejection logs.
    pub fn name(&self) -> &str {
        &self.name
    }

    /// Evaluate the already-resolved `real` path: `Err` carries the deny
    /// verdict (reason + path), `Ok(())` is a pass.
    pub(super) fn evaluate(&self, real: &Path) -> Result<()> {
        (self.f)(real)
    }

    /// A fixed-directory deny rule: the resolved `dir` itself and
    /// everything under it.
    ///
    /// Same evaluation semantics as an absolute [`globs`](Self::globs)
    /// pattern (`dir` is resolved once at construction, compared
    /// case-folded on macOS / Windows), but for an already-resolved
    /// directory: infallible (no pattern validation, no metacharacter
    /// interpretation) and stringly-typed free.  Prefer this over
    /// `globs([path])` when the deny target is a concrete directory known
    /// at wiring time (e.g. the CLI's config directory).
    pub fn prefix(dir: impl AsRef<Path>) -> Self {
        let display = dir.as_ref().display().to_string();
        let resolved = resolve_real_path(dir.as_ref());
        Self::new(format!("path deny ({display})"), move |real: &Path| {
            if is_under(real, &resolved) {
                return Err(denied(&format!("命中路径 deny 清单项 `{display}`"), real));
            }
            Ok(())
        })
    }

    /// A glob-pattern deny rule.  Two pattern forms:
    ///
    /// - **Absolute** (`/etc`, `C:\Windows`): the resolved path itself and
    ///   everything under it.  The pattern is resolved (symlinks followed)
    ///   once at construction and compared case-folded on macOS / Windows.
    /// - **`**/segment[/segment…]`**: the consecutive component sequence
    ///   at any depth (the location itself and everything under it).  A
    ///   component of the form `*.ext` matches by extension.
    ///
    /// Both forms are pure string comparison over the already-resolved
    /// path — zero syscalls per check.  Patterns are compiled (folded /
    /// resolved) once at construction.
    ///
    /// Note: matching is pure string comparison — a hard-linked alias of a
    /// denied file is not caught by inode identity.  Catching it would
    /// defend against a same-UID local actor, which the threat model
    /// excludes.
    ///
    /// A malformed pattern (empty, relative without `**/`, empty
    /// component, `~` home shorthand is not expanded) yields
    /// [`Error::validation`] naming the offending entry — validation
    /// happens at construction so that runtime-supplied patterns (e.g. a
    /// config file) fail with a proper error instead of crashing the
    /// process.  Callers with in-code tables (the built-in deny lists,
    /// whose correctness is covered by unit tests) may `.expect()` the
    /// result.
    pub fn globs<I, S>(patterns: I) -> Result<Self>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        let (prefixes, anywheres, count) = compile_globs(patterns)?;
        Ok(Self::new(
            format!("glob deny ({count} patterns)"),
            move |real: &Path| -> Result<()> {
                for (orig, prefix) in &prefixes {
                    if is_under(real, prefix) {
                        return Err(denied(&format!("命中路径 deny 清单项 `{orig}`"), real));
                    }
                }
                if !anywheres.is_empty() {
                    let hay = folded_segments(real);
                    for (orig, segs) in &anywheres {
                        let n = segs.len();
                        if hay.len() >= n
                            && hay
                                .windows(n)
                                .any(|w| w.iter().zip(segs).all(|(comp, pat)| pat.matches(comp)))
                        {
                            return Err(denied(&format!("凭据形状 `{orig}`"), real));
                        }
                    }
                }
                Ok(())
            },
        ))
    }
}

/// Absolute-prefix glob patterns: original spelling + resolved path.
type PrefixPats = Vec<(String, PathBuf)>;

/// `**/…` glob patterns: original spelling + compiled components.
type AnywherePats = Vec<(String, Vec<SegPat>)>;

/// Compiled glob state: prefix patterns, anywhere patterns, pattern count
/// (used for the rule name).
type CompiledGlobs = (PrefixPats, AnywherePats, usize);

/// Validate and compile glob patterns into prefix / anywhere-component
/// tables; the pattern count is returned for the rule name.
///
/// Validation errors are user-facing (the patterns may come from a
/// config file), so the messages are in Chinese and name the offending
/// entry.
fn compile_globs<I, S>(patterns: I) -> Result<CompiledGlobs>
where
    I: IntoIterator<Item = S>,
    S: AsRef<str>,
{
    let mut prefixes: PrefixPats = Vec::new();
    let mut anywheres: AnywherePats = Vec::new();
    let mut count = 0usize;

    for p in patterns {
        let orig = p.as_ref();
        if orig.is_empty() {
            return Err(Error::validation("deny glob 不能为空字符串".to_string()));
        }
        count += 1;

        if let Some(rest) = orig.strip_prefix("**/") {
            let mut segs = Vec::new();
            for c in rest.split('/') {
                if c.is_empty() {
                    return Err(Error::validation(format!(
                        "deny glob 存在空的路径组件: `{orig}`"
                    )));
                }
                if let Some(ext) = c.strip_prefix("*.") {
                    if ext.is_empty() {
                        return Err(Error::validation(format!(
                            "deny glob 的扩展名为空: `{orig}`"
                        )));
                    }
                    segs.push(SegPat::Ext(fold_case_if_needed(ext).into_owned()));
                } else {
                    segs.push(SegPat::Exact(fold_case_if_needed(c).into_owned()));
                }
            }
            anywheres.push((orig.to_string(), segs));
        } else {
            let path = PathBuf::from(orig);
            if !(path.is_absolute() || is_drive_absolute(orig)) {
                return Err(Error::validation(format!(
                    "deny glob 必须是绝对路径或以 `**/` 开头: `{orig}`"
                )));
            }
            prefixes.push((orig.to_string(), resolve_real_path(&path)));
        }
    }

    Ok((prefixes, anywheres, count))
}
