//! WeChat Work (企业微信) API client library.
//!
//! Provides unified access to the WeChat Work open API via HTTP JSON-RPC transport.
//!
//! # Quick start
//!
//! ```rust,no_run
//! # async fn example() -> Result<(), Box<dyn std::error::Error>> {
//! let client = wecom::Client::builder()
//!     .workspace_fs(std::sync::Arc::new(wecom_fs::SandboxedFs::new()))
//!     .build()?;
//!
//! // CLI-style invocation via argv
//! let argv = vec!["wecom", "contact", "users", "list", "--json", "{}"]
//!     .into_iter().map(String::from).collect();
//! client.run(argv).await?;
//!
//! // Programmatic API
//! let svc = client.service("contact").await?;
//! let method = svc.method(&["users", "list"])?;
//! method.invoke(serde_json::json!({})).await?;
//! # Ok(())
//! # }
//! ```
//!
//! # Feature Flags
//!
//! | Feature           | Description                                    |
//! |-------------------|------------------------------------------------|
//! | `custom-endpoint` | Allow custom endpoints via environment variables |

// ── Re-Exports ───────────────────────────────────────────────
// ── Public API ───────────────────────────────────────────────
pub use builtins::UploadMediaResponse;
pub use clap::Error as ClapError;
pub use clap::error::ErrorKind as ClapErrorKind;
pub use client::{
    CliRun, CliRunOutput, Client, ClientBuilder, ClientInvokeRequest, ClientUploadMediaRequest,
    CustomCommand, EndpointCatalog, EndpointKey, PayloadStringReq, Writer, default_private_fs,
    default_workspace_fs,
};
pub use constants::{CLI_INFO, CliInfo, DEFAULT_BIN_NAME};
pub use error::*;
pub use fs::{
    DirEntry, FileMeta, FileReader, FileWriter, Fs, FsFuture, FsRead, FsWrite, absolutize,
};
pub use helpers::{Helper, HelperMeta, HelperRegistry};
pub use registry::ServiceInfo;
pub use schema::{AdditionalProperties, JsonSchema};
pub use service::{
    MethodHandle, MethodInvokeRequest, MethodSchemaInfo, MethodSummary, MultipartPart, RequestInfo,
    RunOptions, ServiceHandle, ServiceSchemaInfo,
};

pub mod telemetry;
pub mod transport;

// ── Internal modules ─────────────────────────────────────────
pub(crate) mod builtins;
pub(crate) mod client;
pub(crate) mod commands;
pub(crate) mod constants;
pub(crate) mod directive;
pub(crate) mod error;
pub(crate) mod fs;
pub(crate) mod helpers;
pub(crate) mod json_path;
pub(crate) mod registry;
pub(crate) mod schema;
pub(crate) mod service;
pub(crate) mod util;

pub(crate) type Result<T> = std::result::Result<T, Error>;
