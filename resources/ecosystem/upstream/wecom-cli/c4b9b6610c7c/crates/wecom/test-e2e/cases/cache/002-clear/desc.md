# 清除缓存 `cache clear`

- **场景**：验证 `cache clear` 能删除缓存文件
- **Transport**：无（直接操作 FS）

## 测试等级

**P0**（cache clear 删除缓存文件）
- **条件**：缓存目录中预先放入文件，执行 `wecom cache clear`
- **断言**：exit 0，缓存目录被清空

## 前置条件

- 在 home 目录 `cache/` 下预置 `old.json` 和 `stale.json`

## 命令

```rust
client.run(vec!["wecom", "cache", "clear"])
```

## 断言 — CLI

- `run` 返回 `Ok`
- stdout JSON 中 `status` = `"success"`

## 断言 — FS

- 缓存目录下的文件被清空
