# CLI `run` 通过 alias 解析服务

- **场景**：验证 `ServiceInfo.alias` 在 CLI 中正常工作 —— 使用 alias 名调用服务方法
- **Transport**：HTTP（wiremock）
- **来源**：run 方法集成测试

## 前置条件

- wiremock 挂载包含 alias 的 catalog mock 和 `/department/list` mock
- catalog 中 hr 服务有 alias `["human-resources", "hr"]`
- method mock 返回 `{"departments": [{"id": "1", "name": "Engineering"}]}`

## 命令

```rust
client.run(vec!["wecom", "human-resources", "department", "list"]).output(output).await
```

## 断言 — CLI

- `run` 返回 `Ok`
- stdout JSON 中 `departments` 为数组且长度为 1

## 断言 — HTTP Endpoint

- discovery 被调用（解析 service schema）
- `/department/list` 被调用 1 次

## 关键上下文

- `registry/types.rs`：`ServiceInfo.alias` 字段；`find_service_by_name`（精确 name 优先）
- `client/run/execute.rs`：alias 注册为服务命令的 clap hidden alias，解析归一化为规范名
- `client/mod.rs`：`service_with_options` 中 alias 解析
