//! Error-code allocation table for the whole workspace.
//!
//! Code space `893000-893999` is divided into per-crate sub-ranges.
//! This module is the single source of truth for the partitioning and the
//! shared codes; unit tests assert against it.

/// Total workspace-wide error-code range.
pub const RANGE: std::ops::RangeInclusive<i64> = 893000..=893999;

/// Per-crate sub-ranges.  Keep these non-overlapping.  Any new crate that
/// wants its own codes must add a sub-range here and reference it from
/// its own tests.
pub mod range {
    /// Owner: `wecom` crate (`crates/wecom/src/error.rs`).
    pub const WECOM: std::ops::RangeInclusive<i64> = 893000..=893099;
    /// Owner: `wecom-transport` crate
    /// (`crates/wecom-transport/src/common/error.rs`).
    pub const TRANSPORT: std::ops::RangeInclusive<i64> = 893100..=893199;
    /// Owner: `wecom-cli` binary (`crates/wecom-cli/src/error.rs`).
    pub const CLI: std::ops::RangeInclusive<i64> = 893200..=893299;
    /// Reserved for a bot integration crate.
    pub const BOT: std::ops::RangeInclusive<i64> = 893400..=893499;
    /// Reserved for a subagent integration crate.
    pub const SUBAGENT: std::ops::RangeInclusive<i64> = 893500..=893599;
}

/// Shared catch-all code.  Defined once here and re-exported by `wecom`
/// and `wecom-transport`.
pub const E_OTHER: i64 = 893999;

// The three codes below are shared between `wecom` and `wecom-fs`:
// `wecom_fs::Error`'s variants are a strict semantic subset of
// `wecom::Error` (Validation / Permission / Io) and are flattened into
// it, so they must produce the same code.  They are defined here so that
// both crates can import them.
//
// `wecom/src/error.rs` re-exports them so consumers of
// `wecom::{E_VALIDATION, E_IO, E_PERMISSION}` keep compiling.

/// Input-validation error code.
pub const E_VALIDATION: i64 = 893001;
/// Filesystem I/O error code.
pub const E_IO: i64 = 893003;
/// Client / builder configuration error code.
pub const E_CONFIG_CLIENT: i64 = 893005;
/// Permission-denied error code (sandbox path violation).
pub const E_PERMISSION: i64 = 893006;

#[cfg(test)]
mod tests {
    use super::*;

    /// P0：[codes] 各 crate 分配的码段不重叠且都落在总区间内
    #[test]
    fn sub_ranges_are_disjoint_and_within_total_range() {
        let ranges = [
            range::WECOM,
            range::TRANSPORT,
            range::CLI,
            range::BOT,
            range::SUBAGENT,
        ];
        for r in &ranges {
            assert!(RANGE.contains(r.start()));
            assert!(RANGE.contains(r.end()));
        }
        // pairwise disjointness — adjacent ranges must not overlap
        for (i, a) in ranges.iter().enumerate() {
            for b in ranges.iter().skip(i + 1) {
                assert!(
                    a.end() < b.start() || b.end() < a.start(),
                    "ranges {a:?} and {b:?} overlap"
                );
            }
        }
    }

    /// P0：[codes] 共享码都落在 wecom 分配区间内
    #[test]
    fn shared_codes_fall_within_wecom_range() {
        for code in [E_VALIDATION, E_IO, E_CONFIG_CLIENT, E_PERMISSION] {
            assert!(
                range::WECOM.contains(&code),
                "shared code {code} escapes the wecom sub-range"
            );
        }
        assert_eq!(E_OTHER, 893999);
    }
}
