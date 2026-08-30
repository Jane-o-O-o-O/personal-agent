# CLI `run` 通过 argv 驱动方法调用

- **场景**：验证 `Client::run(argv).output()` 端到端流程 —— discovery → method call → 输出
- **Transport**：HTTP（wiremock）
- **来源**：run 方法调用集成测试

## 前置条件

- wiremock 挂载 discovery mock 和 `/department/list` mock
- method mock 返回 `{"departments": [{"id": "1", "name": "Engineering"}, {"id": "2", "name": "Marketing"}]}`

## 命令

```rust
client.run(vec!["wecom", "hr", "department", "list"]).output(output).await
```

## 断言 — CLI

- `run` 返回 `Ok`
- stdout JSON 中 `departments` 为数组且长度为 2

## 断言 — HTTP Endpoint

- discovery 被调用（解析 service schema）
- `/department/list` 被调用 1 次

## 关键上下文

- `client/run/execute.rs`：`CliRun::execute` 解析 argv → 匹配 service/method → 执行请求 → 输出
