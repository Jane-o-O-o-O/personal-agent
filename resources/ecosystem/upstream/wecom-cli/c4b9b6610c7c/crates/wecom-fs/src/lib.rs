//! Filesystem capability API and its sandboxed implementation.
//!
//! - [`api`] — the shared capability layer: the [`Fs`] trait, abstract stream
//!   types, error and telemetry contracts.  Business code depends only on
//!   these types, never on a concrete implementation.  Internal layout:
//!   `api/types.rs` holds the stream contracts and metadata snapshots, and
//!   `api/fs.rs` the [`Fs`] trait with the helpers built on it.
//! - `sandbox` — the production implementation behind [`SandboxedFs`]:
//!   restricts all I/O to a set of allowed directory roots, with a
//!   caller-supplied denylist that always wins over allow (even in rootless
//!   mode), built-in segment-level deny on the read direction, and
//!   `cap-std` root-handle containment.  Four layers: `sandbox/paths.rs`
//!   (path → absolute physical path), `sandbox/policy/` (the single
//!   allow / deny decision), `sandbox/io.rs` (one implementation per
//!   operation, all through a pinned root handle) and `sandbox/fs_impl.rs`
//!   (async execution facade + [`Fs`] bridge).
//!
//! The implementation is injected by the caller; all path-resolution and
//! access-control semantics belong to the implementor.  Authorization across
//! domains (e.g. CLI-private state vs. user workspace) is expressed by
//! injecting one differently configured instance per domain.

pub mod api;
mod sandbox;
mod sanitize;

pub use api::{
    DirEntry, Error, FileMeta, FileReader, FileWriter, Fs, FsAccess, FsFuture, FsRead, FsWrite,
    Result,
};
pub use sandbox::{DenyRule, Policy, SandboxedFs, recommended_deny_rule};
pub use sanitize::sanitize_filename;
