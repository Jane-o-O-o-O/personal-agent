#[allow(unused_imports)]
pub use std::sync::{Arc, Mutex};

pub use assert_json_diff::assert_json_eq;
pub use serde_json::{Value, json};
#[allow(unused_imports)]
pub use wecom_transport::*;
pub use wiremock::matchers::{method, path};
pub use wiremock::{Mock, MockServer, ResponseTemplate};

mod mock_builders;

pub use mock_builders::*;

/// 测试 helper：构造一个 HTTP `Endpoint`。
#[allow(dead_code)]
pub fn ep(base: &str, path: &str) -> Endpoint {
    let http = HttpEndpoint::new(path).with_service(base);
    Endpoint::new().with(http)
}
