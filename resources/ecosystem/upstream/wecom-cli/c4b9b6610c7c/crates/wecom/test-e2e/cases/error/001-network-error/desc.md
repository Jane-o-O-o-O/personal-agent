# 网络不可达时的错误处理

- **场景**：验证连接到不可达端口时返回 `Err` 且 `exit_code()` 为 1
- **Transport**：HTTP（连接失败）

## 测试等级

**P1**（网络不可达时返回 Err 且 exit_code() 为 1）
- **条件**：连接到不可达端口
- **断言**：invoke() 返回 Err，exit_code() == 1

## 前置条件

- 绑定一个端口后立即 drop listener，使连接不可达

## 调用方式

```rust
client.run(vec!["wecom", "schema", "list"]).output(...)
```

## 断言

- `run` 返回 `Err`
- `err.exit_code()` 为 `1`

## 关键上下文

- `crates/wecom-transport/src/common/error.rs`：`Error::Network` 经 `From` 装箱为 `wecom::Error::Wrapped`，其 `exit_code()` 返回 1
