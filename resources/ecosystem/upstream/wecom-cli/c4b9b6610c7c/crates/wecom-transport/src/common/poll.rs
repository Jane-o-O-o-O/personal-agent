//! Protocol-level long-task poll endpoint capability.
//!
//! Carried inside a business endpoint's capability bag so the transport's
//! polling framework knows *where* to send `TaskQuery` polling rounds.
//!
//! The layer above (e.g. `wecom`'s endpoint catalog, another protocol
//! endpoint catalog) fills this capability from its own `TaskQuery` entry;
//! the transport reads it and falls back to a protocol-level default
//! (`/task/query`) when absent, keeping the transport self-sufficient.

use super::Endpoint;

/// Capability describing where `TaskQuery` long-task polling rounds go.
///
/// The inner [`Endpoint`] is the poll endpoint for the in-flight business
/// request. It may leave `base_url` as `None`; the
/// transport fills them with its own defaults before sending.
#[derive(Clone, Debug)]
pub struct PollEndpoint(pub Endpoint);
