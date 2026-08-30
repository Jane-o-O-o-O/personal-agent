# HTTP Transport raw 模式（原始 HTTP 请求/响应）

- **场景**：验证 HTTP Transport raw 模式下直接透传 HTTP 请求和响应，不做 envelope 解析
- **Transport**：HTTP（reqwest，raw 模式）

## 测试等级

**P1**（raw 模式 post() 直接透传原始 HTTP 信封，不做 result 抽取和 long_task 轮询）
- **条件**：使用 post() 发送请求，mock 返回完整 JSON 信封
- **断言**：post() 返回完整信封（不抽取 result），不触发 long_task 轮询，不转换业务错误，二进制响应正确处理

## 前置条件

- wiremock mock 端点返回各种格式的响应（JSON、文本、二进制）
- Transport 配置为 raw 模式

## 断言

- raw 模式下不进行 envelope（result/error 字段）解析
- 响应 body 原样返回
- HTTP 状态码、header 直接透传

## 关键上下文

- `http/mod.rs`：`HttpTransportBackend` raw 模式
- `http/protocol.rs`：raw 模式下的请求/响应处理
