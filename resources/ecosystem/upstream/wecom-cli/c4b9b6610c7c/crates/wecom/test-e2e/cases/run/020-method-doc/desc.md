# Method `--doc` flag

- **场景**：验证 method 级 `--doc` flag，不触发实际调用
- **Transport**：HTTP（wiremock）

## 前置条件

- wiremock 挂载 discovery，method call mock 设为 `expect(0)`

## 命令

```rust
client.run(vec!["wecom", "hr", "department", "list", "--doc"])
```

## 断言

- `run` 返回 `Ok`
- stdout 包含 "Method" 和 "department.list"
- method call 未被调用
