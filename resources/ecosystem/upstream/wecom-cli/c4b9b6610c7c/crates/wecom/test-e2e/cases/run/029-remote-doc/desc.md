# 029-remote-doc

schema 声明 `remote_doc` 时，`--doc` / `--help` / `--schema` 替换为远程生成。

## 覆盖场景

- `hr --doc` → service 级 `remote_doc: true` → 请求 `/remote_doc/get`，`{"id": "svc-hr", "type": "doc"}`
- `hr --schema` → 同上，`kind = "schema"`
- `hr --help` → clap DisplayHelp 路径同样被拦截，`kind = "help"`
- `hr`（裸跑，缺失子命令）→ `DisplayHelpOnMissingArgumentOrSubcommand` 也按帮助展示处理：拉取远程文档作为帮助内容，但 `use_stderr=true` 决定 exit code 2
- `hr department --help` → resource 节点 DisplayHelp 拦截，`id = "res-department"`
- `hr department list --doc` → 未声明的 method 继承 service 级 true，`id = "m-list"`
- `hr department list --help` → method 级 DisplayHelp 拦截，`id = "m-list"`
- `hr plain ping --doc` → resource 级 `remote_doc: false` 覆盖 → 保持本地渲染

## 断言

- 远程场景 stdout 输出远端返回的文档文本（`REMOTE-DOC-*` 标记），本地渲染内容（`Usage:`）不出现
- `/remote_doc/get` 收到的请求体为 payload-string 信封 `{"payload": "{\"id\": <节点 id>, \"type\": <doc|help|schema>}"}`
- 裸跑 `hr` 的错误文本同样含远程帮助内容（exit code 2）
- 被 `remote_doc: false` 覆盖的 method 不触发 `/remote_doc/get` 请求（`expect(0)`）
