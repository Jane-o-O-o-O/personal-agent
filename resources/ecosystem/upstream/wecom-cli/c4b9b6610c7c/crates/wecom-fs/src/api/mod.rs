//! Filesystem capability trait and abstract types.
//!
//! This module is the shared API layer between business code (e.g. the CLI
//! core `wecom`) and `Fs` implementations ([`crate::SandboxedFs`] or one
//! provided by the embedding Agent).
//!
//! Business code depends only on the [`Fs`] trait — never on a concrete
//! implementation. The implementation is injected by the caller; all
//! path-resolution and access-control semantics belong to the implementor.
//!
//! Internal layout: `api/types.rs` holds the abstract stream contracts and
//! metadata snapshots, and `api/fs.rs` the [`Fs`] trait plus the helpers
//! built on it.

mod error;
mod fs;
mod types;

pub use error::{Error, Result};
pub use fs::{Fs, FsAccess};
pub use types::{DirEntry, FileMeta, FileReader, FileWriter, FsFuture, FsRead, FsWrite};
