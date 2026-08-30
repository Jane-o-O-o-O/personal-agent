# Client::list_services 获取服务列表

- **场景**：验证 `list_services()` 通过 discovery 端点获取服务目录
- **Transport**：HTTP（wiremock）

## 测试等级

**P0**（list_services() 通过 discovery 获取服务目录）
- **条件**：mock discovery 返回含 hr 服务的 catalog
- **断言**：返回的服务列表含 hr 服务，service name 和 methods 数量正确

## 前置条件

- wiremock server 挂载 discovery mock，返回 `[{"name": "hr"}]`

## 调用方式

```rust
client.list_services().await
```

## 断言

- `list_services()` 返回 `Ok`
- 返回列表长度为 1
- 第一个服务的 `name` 为 `"hr"`

## 关键上下文

- `client/mod.rs`：`list_services()` → discovery HTTP 请求 → 解析 catalog
