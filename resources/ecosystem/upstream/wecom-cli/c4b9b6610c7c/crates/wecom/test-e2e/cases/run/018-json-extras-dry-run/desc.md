# CLI `--json` 中 `dry_run` 被 apply_extras 提取并触发干跑模式

- **场景**：验证通过 `--json` 传入 `dry_run: true` 时，`apply_extras` 正确提取并阻止实际 API 调用
- **Transport**：HTTP（wiremock）
- **来源**：apply_extras 干跑路径

## 前置条件

- wiremock 挂载 discovery mock
- method mock 设置 `expect(0)`，确保干跑模式下不会发起实际 API 调用

## 命令

```rust
client.run(vec!["wecom", "hr", "department", "list", "--json", "{"dry_run": true}"])
    .output(output)
    .await
```

## 断言 — CLI

- `run` 返回 `Ok`
- stdout 包含 `=== Dry Run ===`

## 断言 — HTTP Endpoint

- `/department/list` 未被调用（`expect(0)` 保证）

## 关键上下文

- `service/command/assemble.rs`：`apply_extras` 需要正确处理 clap 对 `Option<bool>` + `SetTrue` 字段的默认填充（`Some(false)`），将 `Value::Bool(false)` 视为"未设置"
- `service/handler.rs`：`args.dry_run == Some(true)` 时输出预演信息并提前返回，不发起请求
