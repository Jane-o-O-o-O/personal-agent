# CLI `on_poll` 长任务轮询回调

- **场景**：验证 `Client::run().on_poll()` 在长任务轮询每轮都触发心跳回调，包括 result 缺失轮
- **Transport**：HTTP（wiremock）
- **来源**：run 长任务轮询

## 前置条件

- wiremock 挂载 discovery + method call mock
- 首响应返回 `taskid` 触发轮询
- 第 1 轮：result 缺失，done=false
- 第 2 轮：result 非空，done=false
- 第 3 轮：done=true 终态

## 命令

```rust
client.run(vec!["wecom", "hr", "department", "list"]).on_poll(callback).output(output).await
```

## 断言 — CLI

- CLI 执行成功
- stdout 终态 result 中 `departments[0].id` 为 `"1"`

## 断言 — Callbacks

- `on_poll` 触发 2 次（非终态轮）
- 第 1 次 `event.result == None`（result 缺失轮仍能收到心跳）
- 第 2 次 `event.result` 为已解析的 `{"progress": 75}`
- `taskid` 字段透传为 `"T-RUN"`

## 关键上下文

- `client/run/mod.rs`：`.on_poll()` 注册长任务轮询回调，请求检测到 taskid 时轮询 `/task/query` 并触发回调
- 终态轮不触发 on_poll
