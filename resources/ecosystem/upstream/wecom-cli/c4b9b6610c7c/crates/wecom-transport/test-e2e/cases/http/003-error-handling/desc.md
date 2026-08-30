# HTTP Transport 错误处理

- **场景**：验证 HTTP Transport 在服务端返回 HTTP 错误状态码和业务错误时的正确处理
- **Transport**：HTTP（reqwest）

## 测试等级

**P0**（HTTP 错误码和业务错误正确映射：HTTP 500→Error::Http，errcode→Error::Api）
- **条件**：mock 分别返回 HTTP 500、404，及 HTTP 200+业务错误（errcode=40001）
- **断言**：HTTP 500→Error::Http{status:500}，404→Error::Http{status:404}，业务错误→Error::Api{code:40001}

## 前置条件

- wiremock mock 多个场景：400 Bad Request、500 Internal Server Error 等

## 断言

- 非 2xx 状态码正确映射为对应的 Error 类型
- HTTP 400 → 对应的业务错误
- HTTP 500 → 服务端错误

## 关键上下文

- `http_client/response.rs`：HTTP 状态码到 Error 的映射
- `common/error.rs`：Error 类型定义
