# Client::invoke 长任务轮询回调

- **场景**：验证 `on_poll` 回调在长任务轮询每一轮都正确触发，包括 result 缺失轮和 result 非空轮
- **Transport**：HTTP（wiremock）

## 测试等级

**P1**（on_poll 回调在长任务每轮轮询中正确触发）
- **条件**：mock 长任务多轮轮询，包含 result 缺失轮和 result 非空轮
- **断言**：on_poll 每轮均触发，回调参数反映每轮状态变化

## 前置条件

- wiremock 挂载多轮响应：首响应返回 `{"taskid": "t1"}` 触发轮询
- 第 1 轮轮询：`done=false`，result 缺失
- 第 2 轮轮询：`done=false`，`result={"progress": 50}`
- 第 3 轮轮询：`done=true`，`result={"departments":[{"id":"42"}]}`

## 调用方式

```rust
client.invoke(&["hr", "department", "list"], json!({"id": "root"}))
    .on_poll(callback)
    .await
```

## 断言

- `invoke` 返回 `Ok`，终态 result 中 `departments[0].id` 为 `"42"`
- `on_poll` 回调触发 2 次（非终态轮，终态轮不触发）
- 第 1 次回调 `event.result` 为 `None`
- 第 2 次回调 `event.result` 为 `Some(json!({"progress": 50}))`

## 关键上下文

- `client/invoke.rs`：`invoke()` 检测 taskid → 轮询 `/task/query` → on_poll 回调
- 终态轮不触发 on_poll，直接返回最终结果
