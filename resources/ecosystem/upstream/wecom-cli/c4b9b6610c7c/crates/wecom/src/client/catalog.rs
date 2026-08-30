//! 内置（非 schema 驱动）endpoint 的集中配置目录。
//!
//! 内置非 schema 驱动 endpoint 的集中配置表：媒体上传 / 下载、服务发现、
//! 长任务轮询、schema 方法默认信封等端点在此登记，可整体覆写或逐 key 定制。
//! [`ClientBuilder::endpoint_catalog`](crate::ClientBuilder::endpoint_catalog)
//! 支持调用方整体或逐 key 定制；未覆写的 key 一律回退到
//! [`CatalogKey::builtin_default`]，保证默认行为与现状逐字段一致。目录机制
//! （覆写 / 变换）由 [`wecom_transport::EndpointCatalog`] 泛型实现提供。

use wecom_transport::{CatalogKey, Endpoint, EndpointHttpExt, HttpEndpoint, RequestEnvelope};

/// WeCom HTTP 网关请求信封：`{"payload": "<json-string>"}`。
///
/// 按「谁使用谁定义」原则定义在本 crate（core 仅提供 trait + 自用默认），
/// 实现 `wecom_transport::RequestEnvelope`。
#[derive(Debug, Clone, Copy, Default)]
pub struct PayloadStringReq;

impl RequestEnvelope for PayloadStringReq {
    fn encode(&self, payload: serde_json::Value) -> serde_json::Value {
        serde_json::json!({ "payload": payload.to_string() })
    }

    fn name(&self) -> &'static str {
        "payload-string"
    }
}

/// 内置（非 schema 驱动）endpoint 的稳定标识。
///
/// `ServiceMethod` 是 schema 驱动方法的统一「默认信封」入口：能力袋只携带
/// 默认请求信封（[`PayloadStringReq`]）与空 path，实际 path 由
/// [`MethodHandle::endpoint`](crate::service::MethodHandle::endpoint) 以
/// schema path 派生。
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[non_exhaustive]
pub enum EndpointKey {
    /// 媒体上传（`/file/upload`）。
    MediaUpload,
    /// 服务发现（`/service/discovery`）。
    ServiceDiscovery,
    /// 长任务轮询（`/task/query`）。
    TaskQuery,
    /// schema 驱动方法的默认能力袋。
    ServiceMethod,
    /// 远程文档生成（`remote_doc`）：`--doc` / `--help` / `--schema` 的远端渲染。
    RemoteDoc,
}

impl CatalogKey for EndpointKey {
    /// 供 `EndpointCatalog::map_all` 遍历的全量 key（顺序即声明顺序）。
    const ALL: &'static [EndpointKey] = &[
        EndpointKey::MediaUpload,
        EndpointKey::ServiceDiscovery,
        EndpointKey::TaskQuery,
        EndpointKey::ServiceMethod,
        EndpointKey::RemoteDoc,
    ];

    /// 内建默认表：登记各内置 endpoint 的默认值，未覆写的 key 回退到内建默认。
    ///
    /// 请求侧信封只在需要的地方挂载：[`PayloadStringReq`]（payload 字符串
    /// 包装）用于 `ServiceDiscovery`、`TaskQuery` 与 `ServiceMethod`；其余端点使用 transport 默认
    /// `PassthroughReq`。响应侧信封一律 `None`——由 transport 在解析时回填
    /// 默认 `GatewayRes`。`base_url` 为 `None`——transport 在执行时回填其默认值。
    fn builtin_default(self) -> Endpoint {
        match self {
            EndpointKey::MediaUpload => Endpoint::new().with(HttpEndpoint::new("/file/upload")),
            EndpointKey::ServiceDiscovery => {
                Endpoint::new().with(HttpEndpoint::new("/service/discovery"))
            }
            EndpointKey::TaskQuery => Endpoint::new()
                .with(HttpEndpoint::new("/task/query").with_req_envelope(PayloadStringReq)),
            // schema 方法默认请求信封：path 为空（由 MethodHandle 以 schema path 派生）。
            EndpointKey::ServiceMethod => {
                Endpoint::new().with(HttpEndpoint::new("").with_req_envelope(PayloadStringReq))
            }
            // 远程文档：请求 `{"id": ..., "type": doc|help|schema}`，响应 result 为 `{"doc": <文档文本>}`。
            EndpointKey::RemoteDoc => Endpoint::new()
                .with(HttpEndpoint::new("/remote_doc/get"))
                .with_req_envelope(PayloadStringReq),
        }
    }
}

/// 内置 endpoint 的集中配置目录。
pub type EndpointCatalog = wecom_transport::EndpointCatalog<EndpointKey>;

#[cfg(test)]
mod tests {
    //! ## 模块摘要：wecom 域 EndpointKey（内置 endpoint 默认值表）
    //!
    //! ### 关键接口
    //! - [CatalogKey::builtin_default] — 各 key 的内建默认能力袋
    //! - [EndpointCatalog] — 泛型覆写机制（wecom_transport 侧实现，另有其单测）
    //!
    //! ### 关键分支与异常路径
    //! - 未覆写 → resolve 回退 builtin_default（默认行为与现状逐字段一致）
    //!
    //! ### 上下游交互
    //! - 上游：ClientBuilder::endpoint_catalog / Client::resolve_builtin_endpoint
    //! - 下游：wecom_transport::EndpointCatalog 泛型目录

    use wecom_transport::EndpointHttpExt;

    use super::*;

    /// P0：[EndpointCatalog::resolve] 未覆写时回退内建默认
    /// 条件：默认 catalog，resolve(MediaUpload)
    /// 断言：path == "/file/upload"，req 信封回退默认 passthrough，base_url 为空
    #[test]
    fn resolve_falls_back_to_builtin_default() {
        let catalog = EndpointCatalog::default();
        let ep = catalog.resolve(EndpointKey::MediaUpload);
        assert_eq!(ep.path(), "/file/upload");
        // MediaUpload 未显式挂请求信封：回退 transport 默认 passthrough
        // （PayloadStringReq 仅用于 TaskQuery / ServiceMethod）。
        assert_eq!(ep.req_envelope().name(), "passthrough");
        // base_url is None — transport fills at execution time.
        assert_eq!(ep.base_url(), "");
    }

    /// P0：[PayloadStringReq::name] 返回 "payload-string"
    /// 条件：调用 PayloadStringReq.name()
    /// 断言：返回策略标签 "payload-string"
    #[test]
    fn payload_string_req_name() {
        assert_eq!(PayloadStringReq.name(), "payload-string");
    }

    /// P0：[PayloadStringReq::encode] 将 payload 包进 JSON 字符串信封
    /// 条件：encode({"a": 1})
    /// 断言：返回 {"payload": "{\"a\":1}"}
    #[test]
    fn payload_string_req_encodes_payload_as_string() {
        let encoded = PayloadStringReq.encode(serde_json::json!({"a": 1}));
        assert_eq!(encoded, serde_json::json!({ "payload": "{\"a\":1}" }));
    }

    /// P1：[EndpointCatalog::resolve] ServiceMethod 默认请求信封为 payload-string
    /// 条件：默认 catalog，resolve(ServiceMethod)
    /// 断言：path 为空串经规范化后为 "/"（由 MethodHandle 以 schema path 派生），
    ///       req 信封为 payload-string，res 信封回退默认 gateway
    #[test]
    fn resolve_service_method_defaults() {
        let catalog = EndpointCatalog::default();
        let ep = catalog.resolve(EndpointKey::ServiceMethod);
        assert_eq!(ep.path(), "/");
        assert_eq!(ep.req_envelope().name(), "payload-string");
        assert_eq!(ep.res_envelope().name(), "gateway");
    }

    /// P0：[EndpointCatalog::resolve] RemoteDoc 默认 endpoint
    /// 条件：默认 catalog，resolve(RemoteDoc)
    /// 断言：path == "/remote_doc/get"，base_url 为空（transport 执行时回填
    ///       默认），req 信封为 payload-string
    #[test]
    fn resolve_remote_doc_defaults() {
        let catalog = EndpointCatalog::default();
        let ep = catalog.resolve(EndpointKey::RemoteDoc);
        assert_eq!(ep.path(), "/remote_doc/get");
        // base_url is None — transport fills at execution time.
        assert_eq!(ep.base_url(), "");
        assert_eq!(ep.req_envelope().name(), "payload-string");
    }
}
