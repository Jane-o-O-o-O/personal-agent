//! Abstract stream contracts and metadata snapshots exchanged through
//! [`crate::Fs`].
//!
//! Business code handles files as [`FileReader`] / [`FileWriter`] trait
//! objects and reads attributes from the [`FileMeta`] snapshot, so it stays
//! independent of any concrete I/O backend.

use std::future::Future;
use std::path::PathBuf;
use std::pin::Pin;
use std::time::SystemTime;

use tokio::io::{AsyncRead, AsyncWrite};

use crate::api::Result;

/// Boxed future returned by [`crate::Fs`] trait methods.
pub type FsFuture<'a, T> = Pin<Box<dyn Future<Output = Result<T>> + Send + 'a>>;

/// Read-end of a file opened via [`crate::Fs::open_for_read`], with fd-level
/// metadata access.
pub trait FsRead: AsyncRead + Send + Unpin {
    /// Metadata of the opened file (fd-level, TOCTOU-safe).
    fn metadata<'a>(&'a self) -> FsFuture<'a, FileMeta>;
}

/// Boxed read-end returned by [`crate::Fs::open_for_read`].
pub type FileReader = Box<dyn FsRead>;

/// Write-end of a file created via [`crate::Fs::create_file`] /
/// [`crate::Fs::create_file_unique`], with durability and pre-allocation
/// support.
pub trait FsWrite: AsyncWrite + Send + Unpin {
    /// Flush buffers and sync file content and metadata to stable storage.
    fn sync_all<'a>(&'a mut self) -> FsFuture<'a, ()>;

    /// Pre-allocate (or truncate) the file to `len` bytes.
    fn set_len<'a>(&'a mut self, len: u64) -> FsFuture<'a, ()>;

    /// Metadata of the opened file (fd-level).
    fn metadata<'a>(&'a self) -> FsFuture<'a, FileMeta>;
}

/// Boxed write-end returned by [`crate::Fs::create_file`] /
/// [`crate::Fs::create_file_unique`].
pub type FileWriter = Box<dyn FsWrite>;

/// File metadata snapshot.
#[derive(Debug, Clone)]
pub struct FileMeta {
    /// File size in bytes.
    pub len: u64,
    /// Last modification time, when available.
    pub modified: Option<SystemTime>,
    /// Whether the path is a directory.
    pub is_dir: bool,
    /// Whether the path is a regular file.
    pub is_file: bool,
}

/// A single directory entry returned by [`crate::Fs::list_dir`].
#[derive(Debug, Clone)]
pub struct DirEntry {
    /// Full path of the entry.
    pub path: PathBuf,
    /// Whether the entry is a directory.
    pub is_dir: bool,
    /// Whether the entry is a regular file.
    pub is_file: bool,
}
