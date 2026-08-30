# 自定义 Header 透传

- **场景**：验证 ClientBuilder 设置的自定义 header 能正确传递到 discovery 和 method 调用，以及 access_token 的 Authorization header
- **Transport**：HTTP（wiremock）
- **来源**：header 透传验证

## 测试等级

**P1**（ClientBuilder 自定义 header 正确传递到 discovery 和 method 调用）
- **条件**：ClientBuilder 设置自定义 header 和 access_token
- **断言**：discovery 和 method 请求均携带自定义 header，Authorization header 正确

## 前置条件

- wiremock 挂载 discovery 和 method call 端点，各需校验自定义 header

## 调用方式

```rust
Client::builder()
    .header("X-Custom", "val1")
    .header("X-Trace", "trace-123")
    .access_token("my-secret-token")
    .build()
```

## 断言

- discovery 请求携带 `x-custom: val1`、`x-trace: trace-123`、`authorization: Bearer my-secret-token`
- method 调用请求携带自定义 header
- CLI 执行成功

## 关键上下文

- `client/builder.rs`：`header()` 将自定义 header 注册到 transport
- `transport`：builder 的 header 附加到所有请求
