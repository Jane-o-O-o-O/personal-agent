# 端点目录内建默认：ServiceDiscovery

- **场景**：确认 `EndpointCatalog` 内建默认的 ServiceDiscovery 端点路径与信封回退
- **Transport**：无（纯内存断言）
- **来源**：端点目录机制回归

## 前置条件

无特殊前置。

## 命令

```rust
wecom::EndpointCatalog::default().resolve(wecom::EndpointKey::ServiceDiscovery)
```

## 断言 — CLI

- 不涉及 CLI 执行（不构造 Client、不运行 argv），仅断言端点目录解析结果：
  - `path()` = `"/service/discovery"`
  - 请求信封 = `passthrough`，响应信封 = `gateway`（transport 默认实现）

## 断言 — HTTP Endpoint

无请求发出。本用例不启动 mock server。

## 断言 — FS

无文件读写。

## 关键上下文

- `crates/wecom/src/client/catalog.rs`：`EndpointKey::builtin_default` 定义 ServiceDiscovery 的内建默认；`base_url` 为 `None`，由 transport 在执行时回填默认值；未覆写信封时回退 transport 默认（`PassthroughReq`/`GatewayRes`）。
- `crates/wecom-cli/src/transport/catalog.rs`：产品层经 `endpoint_catalog()` 注入网关扁平信封与鉴权能力，覆盖上述默认。
