# CLI 路径别名（path_alias）端到端验证

- **场景**：验证 `path_alias` 声明使得 alias 路径等价于真实命令路径，不影响 sibling 命令，且在 help 输出中隐藏
- **Transport**：HTTP（wiremock）
- **来源**：path_alias E2E

## 前置条件

- wiremock 挂载 contact 服务的 discovery mock
- `search` method 声明 `path_alias: ["/contact/search"]`
- `list` method 无 alias

## 命令

- `wecom contact users search --keyword alice`（真实路径）
- `wecom contact search --keyword alice`（alias 路径）
- `wecom contact users list --page 2`（sibling）
- `wecom contact --help`（帮助）

## 断言 — CLI

- 真实路径：命中 `/contact/users/search`，请求 body 含 `keyword: "alice"`，stdout 为 `{"matched": 1}`
- alias 路径：命中同一端点 `/contact/users/search`，请求 body 一致
- sibling：命中 `/contact/users/list`，stdout 为 `{"page": 2, "items": []}`
- help：含 `users` group，不含顶层 `search` 子命令（alias 被隐藏）

## 关键上下文

- `service/alias.rs`：path_alias 注册 hidden alias 子命令
- `service/command/build.rs`：构建 clap command tree 时隐藏 alias
