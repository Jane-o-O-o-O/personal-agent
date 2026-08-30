# MethodHandle::run 编程式方法调用

- **场景**：验证通过 `MethodHandle::run()` 编程式调用方法，discovery → 获取 method → 发送请求
- **Transport**：HTTP（wiremock）

## 测试等级

**P0**（MethodHandle::run() 编程式调用方法完整流程）
- **条件**：mock discovery → method detail → invoke endpoint 全部返回正确数据
- **断言**：方法调用成功，响应数据与 mock 一致

## 前置条件

- wiremock 挂载 discovery mock 和 `/department/list` mock
- `/department/list` 返回 `{"departments": [{"id": "1"}]}`

## 调用方式

```rust
let run = client.run(vec!["hr", "department", "list"]);
let opts = RunOptions::new(&run);
let opts = RunOptions { payload: json!({"id": "root"}), ..opts };
method.run(opts).await
```

## 断言

- `method.run()` 返回 `Ok`
- stdout JSON 中 `departments` 是数组且长度为 1

## 关键上下文

- `service/execute.rs`：`method.run()` 构造 HTTP 请求并调用 transport
