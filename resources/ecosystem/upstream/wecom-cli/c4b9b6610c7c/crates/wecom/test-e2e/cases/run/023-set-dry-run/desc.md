# `--set` 与 `dry_run` 组合使用

- **场景**：验证 `--set` 参数 + `--json '{"dry_run": true}'` 组合时，`apply_extras` 正确提取 `dry_run` 并触发干跑模式
- **Transport**：HTTP（wiremock）
- **来源**：`--set` × `dry_run` 组合路径

## 前置条件

- wiremock 挂载 discovery mock
- method mock 挂载 `/department/list`，`expect(0)` 确保干跑模式下不发起 API 调用

## 命令

```rust
client.run(vec!["wecom", "hr", "department", "list", "--id", "root", "--set", "x=1", "--json", "{"dry_run": true}"])
    .output(output)
    .await
```

## 断言 — CLI

- `run` 返回 `Ok`
- stdout 包含 `=== Dry Run ===`
- method mock 未被命中（`expect(0)`）

## 关键上下文

- `service/command/assemble.rs`：`assemble_payload` 先 extract extras → `apply_extras` 提取 `dry_run`，再应用 `--set`
- `service/handler.rs`：`args.dry_run == Some(true)` 输出预演信息并提前返回
- `telemetry/contract.rs`：`apply_set_ops` 发射 `set_path` 遥测事件
