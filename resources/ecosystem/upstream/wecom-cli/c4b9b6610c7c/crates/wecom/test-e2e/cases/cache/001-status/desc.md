# 缓存状态 `cache status`

- **场景**：验证 `cache status` 能列出缓存目录中的文件
- **Transport**：无（直接操作 FS，server 指向不可达地址）

## 测试等级

**P0**（cache status 列出缓存目录中的文件）
- **条件**：缓存目录中预先放入文件，执行 `wecom cache status`
- **断言**：stdout 包含缓存文件列表，退出码 0

## 前置条件

- 在 home 目录 `cache/` 下预置 `catalog.json`

## 命令

```rust
client.run(vec!["wecom", "cache", "status"])
```

## 断言 — CLI

- `run` 返回 `Ok`
- stdout JSON 数组，包含 `{"file": "catalog.json"}`
