# JSON 修复（jsonrepair）端到端

- **场景**：验证 `--json` 传入格式错误 JSON 时 `jsonrepair-rs` 能自动修复
- **Transport**：HTTP（wiremock）

## 测试等级

**P1**（--json 传入格式错误 JSON 时 jsonrepair-rs 自动修复）
- **条件**：--json 参数传入尾部多逗号等格式错误 JSON
- **断言**：jsonrepair 自动修复后正常解析，方法调用成功

## 前置条件

- wiremock 挂载 discovery + method call mock

## 命令

```rust
client.run(hr_dept_list_argv(&["--json", r#"{bad: "value"}"#]))
```

## 断言

- `run` 返回 `Ok`（jsonrepair 将未加引号的 key 自动补全）
