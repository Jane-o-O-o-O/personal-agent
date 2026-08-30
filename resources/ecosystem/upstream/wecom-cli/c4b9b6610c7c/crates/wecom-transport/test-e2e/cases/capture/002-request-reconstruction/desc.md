# Capture HTTP 请求重建（reconstruction）

- **场景**：验证从 CaptureScope 采集的 HttpRequestRecord 可以重建出完整的 HTTP 请求（URL、header、body）并与原始请求一致
- **Transport**：HTTP（reqwest）

## 测试等级

**P1**（HttpRequestRecord 正确捕获请求和响应 header 用于请求重建）
- **条件**：发送带自定义 header（x-test-req）的 HTTP 请求，通过 CaptureScope 采集
- **断言**：req_headers 含 x-test-req，res_headers 含 content-type 和自定义响应头

## 前置条件

- wiremock 端点 mock，记录原始请求用于对比
- CaptureScope 采集 on_request 回调

## 断言

- 采集到的 endpoint、header（包括自定义 header 和 content-type）、body 与 wiremock 接收到的原始请求一致
- 可以基于 HttpRequestRecord 重建出等价的 HTTP 请求

## 关键上下文

- `telemetry/records.rs`：HttpRequestRecord 包含 endpoint、req_headers 等字段
- `common/debug.rs`：headers_from_json 可将 JSON 格式 header 恢复为 HeaderMap
