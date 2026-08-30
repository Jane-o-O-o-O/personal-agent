//! E2E 共享依赖：re-export 第三方类型 + 被测 crate 公开类型 + 通用 client/file 工厂。
//!
//! 所有 HTTP mock 统一使用 [`wiremock`]。

#[allow(unused_imports)]
pub use std::io::Write;
#[allow(unused_imports)]
pub use std::path::{Path, PathBuf};
#[allow(unused_imports)]
pub use std::sync::{Arc, Mutex};

#[allow(unused_imports)]
pub use assert_json_diff::assert_json_eq;
#[allow(unused_imports)]
pub use serde_json::{Value, json};

mod discovery;
mod test_client;

pub use discovery::*;
pub use test_client::*;
