# 分页时自定义 Header 透传

- **场景**：验证分页每次翻页请求都携带 `CliRun::header` 设置的自定义 headers
- **Transport**：HTTP（wiremock）
- **来源**：分页循环中 headers 透传覆盖

## 前置条件

- wiremock 挂载 discovery（无需 header 匹配，discovery 不经过 CliRun headers）
- 3 页 method call mock，每页要求 header `x-custom: val1`

## 命令

```rust
client.run(hr_dept_list_argv(&["--page-count", "3", "--page-delay", "1"]))
    .header("x-custom", "val1")
```

## 断言 — HTTP Endpoint

- `/department/list` 被调用 3 次，每次携带 `x-custom: val1`

## 断言 — CLI

- `run` 返回 `Ok`
- stdout 输出 3 行 NDJSON

## 关键上下文

- `service/execute.rs`：分页循环每页统一走 `client.transport().invoke(..).with_options(run.get_options())`，`CliRun::header()` 设置的 headers 随 options 透传到每页请求
