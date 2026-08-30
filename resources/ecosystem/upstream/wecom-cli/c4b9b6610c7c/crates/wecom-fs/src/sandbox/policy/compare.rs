//! Path comparison primitives shared by the deny rules and the policy:
//! one case-folding rule for every platform-sensitive comparison.

use std::path::{Component, Path};

// ── Path identity helpers ───────────────────────────────────

/// Case-fold for comparison on case-insensitive platforms (macOS / Windows);
/// identity elsewhere.  Shared by [`is_under`] and the segment-level deny
/// rules so every comparison folds with exactly one rule — both users change
/// together whenever the folding changes.
pub(in crate::sandbox) fn fold_case_if_needed(s: &str) -> std::borrow::Cow<'_, str> {
    if cfg!(any(target_os = "macos", windows)) {
        std::borrow::Cow::Owned(s.to_lowercase())
    } else {
        std::borrow::Cow::Borrowed(s)
    }
}

/// Component-wise containment check: is `path` under `prefix`?  Folds case
/// on case-insensitive platforms (macOS / Windows) so folded spellings
/// cannot slip past.
pub(in crate::sandbox) fn is_under(path: &Path, prefix: &Path) -> bool {
    if cfg!(any(target_os = "macos", windows)) {
        let prefix_raw = prefix.to_string_lossy();
        let path_raw = path.to_string_lossy();
        let prefix = fold_case_if_needed(&prefix_raw);
        let path = fold_case_if_needed(&path_raw);
        Path::new(path.as_ref()).starts_with(Path::new(prefix.as_ref()))
    } else {
        path.starts_with(prefix)
    }
}

/// The normal components of `real`, case-folded through
/// [`fold_case_if_needed`] — the same helper as [`is_under`], so `.SSH` /
/// `.Env` cannot slip past on case-insensitive filesystems.
pub(in crate::sandbox) fn folded_segments(real: &Path) -> Vec<String> {
    real.components()
        .filter_map(|c| match c {
            Component::Normal(s) => Some(fold_case_if_needed(&s.to_string_lossy()).into_owned()),
            _ => None,
        })
        .collect()
}
