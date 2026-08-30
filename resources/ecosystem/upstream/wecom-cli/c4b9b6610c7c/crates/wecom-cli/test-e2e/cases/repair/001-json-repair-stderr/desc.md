# json repair 成功时 stderr 输出提示

- **场景**：`--json` 传入格式错误 JSON 被自动修复后，stderr 输出提示
- **Transport**：HTTP（mockito）
- **来源**：wecom-cli main.rs 挂载的 telemetry 事件监听

## 测试等级

**P1**（json repair 成功时 stderr 提示）
- **条件**：`--json '{bad: "value"}'`（键名无引号），mock server 返回 catalog + hr detail + method 响应
- **断言**：退出码 0，stdout 正常业务输出，stderr 含 `json repair` 提示

## 前置条件

- mockito 挂载 discovery（catalog + hr service detail）与 `/department/list` method mock
- 进程级测试：监听逻辑在 `main.rs`（`telemetry::install_json_repair_listener`），库级无法验证 stderr

## 命令

```bash
wecom-cli hr department list --json '{bad: "value"}'
```

## 断言 — CLI

- 退出码：`0`
- stderr：含 `json repair` 提示
- stdout：正常业务输出（不受影响）

## 断言 — HTTP Endpoint

- `POST /service/discovery` 被调用 2 次（catalog + service detail）
- `POST /department/list` 被调用 1 次（修复后的合法 JSON 正常发出）

## 断言 — FS

无文件写入。

## 关键上下文

- wecom crate 的 `json_repair` 事件在 `ok_repaired` 时仅携带 `strategy` 与 `candidates` 字段（不含修复前后原文）
- wecom-cli 监听该事件，仅对 `outcome=ok_repaired` 输出 stderr 提示（不含具体 JSON 内容）
