mod catalog;
pub(crate) mod constants;
mod debug;
mod endpoint;
pub mod error;
mod extensions;
mod header;
pub mod options;
mod poll;

pub use catalog::{CatalogKey, EndpointCatalog};
pub use debug::MaskedHeaders;
pub(crate) use debug::headers_from_json;
pub use endpoint::{Endpoint, EndpointExt, IntoCowEndpoint};
pub use extensions::{Extension, Extensions};
pub use header::{IntoHeaderName, IntoHeaderValue};
pub use options::{RequestOptions, WireOptions};
pub use poll::PollEndpoint;

// Re-export capability types and extension traits from their home modules.
// These are public API used by downstream crates; suppress "unused" within the
// module since they are consumed only through `pub use common::*` in lib.rs.
#[allow(unused_imports)]
pub use crate::http::{EndpointHttpExt, HttpEndpoint};
