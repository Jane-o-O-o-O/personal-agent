# CaptureScope 单 scope HTTP 采集与隔离

- **场景**：验证 CaptureScope 对 HTTP 请求的字段采集、scope 隔离、on_request span_id 有效性、last-wins 语义等
- **Transport**：HTTP（reqwest）

## 测试等级

**P0**（CaptureScope 字段采集：HTTP span_id、backend、endpoint、duration 等字段正确采集）
- **条件**：HTTP transport 发送请求，通过 CaptureScope 采集
- **断言**：HTTP backend=="reqwest"，span_id>0，并行 scope 严格隔离，on_request last-wins 语义正确

## 前置条件

- wiremock 挂载 HTTP 端点 `/cgi-bin/capture-test`、`/cgi-bin/outside-scope`、`/cgi-bin/inside-scope`、`/cgi-bin/scope-{i}`、`/cgi-bin/attach-test`、`/cgi-bin/span-id`

## 断言

### HTTP 单 scope 采集
- 采集到 1 个 span，`span_id > 0`，`backend == "reqwest"`
- `endpoint` 包含 `/cgi-bin/capture-test`，`res_status == 200`，`res_body_len > 0`
- `duration_total_ms >= duration_headers_ms`，`error.is_none()`

### Scope 隔离
- scope 外的请求不触发 on_request
- 4 个并行 scope 各仅采集到自己的 1 条记录

### 回调语义
- `on_request` 每次请求精确触发 1 次
- `on_request` last-wins：第一次注册的回调计数为 0
- `on_request` span_id 非零有效
- 未注册 on_request 时 scope 不 panic

### 特殊场景
- 未挂载 TraceLayer 时 CaptureScope 不采集（no-op）
- `CaptureScope::attach()` 自定义 span 名称正常工作

## 关键上下文

- `telemetry/capture.rs`：CaptureScope、TraceLayer
- `telemetry/records.rs`：HttpRequestRecord、CaptureSpanId
