# Service `--doc` flag

- **场景**：验证 service 级 `--doc` flag
- **Transport**：HTTP（wiremock）

## 前置条件

- wiremock 挂载 discovery

## 命令

```rust
client.run(vec!["wecom", "hr", "--doc"])
```

## 断言

- `run` 返回 `Ok`
- stdout 包含 "HR service description"
