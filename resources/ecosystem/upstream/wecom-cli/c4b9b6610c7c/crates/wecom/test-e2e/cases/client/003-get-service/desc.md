# Client::service 获取服务并按路径获取 method

- **场景**：验证 `service("hr")` 获取具体服务，再通过 `method(&["department", "list"])` 获取方法
- **Transport**：HTTP（wiremock）

## 测试等级

**P0**（service("hr") 获取服务 → method(["department","list"]) 获取方法）
- **条件**：mock discovery + service detail 返回 hr 服务信息
- **断言**：service handle 正确，method handle 可获取，方法 schema 正确

## 前置条件

- wiremock 挂载 discovery mock，返回 hr 服务的 service detail

## 调用方式

```rust
let svc = client.service("hr").await;
let method = svc.method(&["department", "list"]);
```

## 断言

- `service("hr")` 返回 `Ok`
- `method(&["department", "list"])` 返回 `Ok`
- 该 method 的 `name()` 为 `"list"`

## 关键上下文

- `client/mod.rs`：`service()` → discovery HTTP 请求 → ServiceHandle
- `service/service_handle.rs`：`method()` 按路径查找 method
