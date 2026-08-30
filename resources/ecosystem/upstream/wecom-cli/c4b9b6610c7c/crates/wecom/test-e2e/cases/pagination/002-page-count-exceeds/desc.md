# `--page-count` 大于实际页数时提前终止

- **场景**：`--page-count 5` 但服务端只有 2 页数据，验证 `has_more: false` 提前终止
- **Transport**：HTTP（wiremock）
- **来源**：C.21, S9

## 前置条件

- wiremock 挂载 discovery + 2 页 method call mock
- 第 1 页：`has_more: true` — 触发翻页
- 第 2 页：`has_more: false` — 末页，没有更多数据

## 命令

```rust
client.run(hr_dept_list_argv(&["--page-count", "5", "--page-delay", "1"]))
```

## 断言

- `run` 返回 `Ok`
- stdout 输出 2 行 NDJSON（提前终止，不会拉满 5 页）
