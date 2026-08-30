# `--page-count` 上限截断

- **场景**：`--page-count 2` 但服务端有更多数据，验证达到上限后停止
- **Transport**：HTTP（wiremock）
- **来源**：C.21, S9

## 前置条件

- wiremock 挂载 discovery + 2 页 method call mock
- 第 1 页：`has_more: true` — 触发翻页
- 第 2 页：`has_more: true` — 服务端还有更多数据
- 第 3 页 mock **不挂载**，若被调用则 wiremock 返回 404 导致测试失败

## 命令

```rust
client.run(hr_dept_list_argv(&["--page-count", "2", "--page-delay", "1"]))
```

## 断言

- `run` 返回 `Ok`
- stdout 输出恰好 2 行 NDJSON
- 第 3 页未被请求（wiremock 无匹配 mock → 404 → 测试失败）
