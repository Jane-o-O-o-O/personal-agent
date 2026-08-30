# HTTP Transport 自定义 Header 透传

- **场景**：验证 HTTP Transport 用户自定义 header 正确传递到服务端
- **Transport**：HTTP（reqwest）

## 测试等级

**P1**（自定义 HTTP header 正确透传到服务端）
- **条件**：通过 HeaderMap 构建 x-custom-auth header，调用 .headers(&extra) 附加
- **断言**：mock 期望被满足，返回 `{"authenticated": true}`

## 前置条件

- wiremock mock `POST /cgi-bin/headers`，需校验 `x-custom: my-value`

## 调用方式

```rust
transport.invoke(ep(&server.uri(), "/cgi-bin/headers"), payload).await
```

## 断言

- 请求携带 `x-custom: my-value` header
- mock `expect(1)` 被满足

## 关键上下文

- `http_client/request.rs`：HttpRequest 构造时附加自定义 header
