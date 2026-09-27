# Personal Agent

基于 Pi、部署在独立 VPS 上的个人 Agent。已实现网页工作台、持久任务、个人记忆、定时目标、国内查询连接器、微信协议适配器、可接管的原生浏览器，以及逐封审批的 Resend 发信。

## 使用

VPS 工作台：[https://39.107.111.115:8443](https://39.107.111.115:8443)。初始访问密码保存在本机忽略文件 `data/admin-password`，不写入本文。本地与 VPS 已接入用户中转 `https://api.jane-zz.online/v1`，模型为 `gpt-6-sol`，使用 Chat Completions 协议。登录后可直接提交任务，在「连接」管理模型和其他服务配置，在「生态扩展」查看生态目录及受控安装项。国内接口按实际账号填写；微信需要本人扫码确认。

本地使用 Node 24.15.0：

```sh
npm ci
npm run build
npm start
```

打开 [http://127.0.0.1:3420](http://127.0.0.1:3420)。首次启动自动生成 `data/admin-password` 和 `data/master-key`。开发时使用 `npm run dev`；前端独立热更新使用 `npm run dev:web`。运行数据、密码与 `.env` 均已加入忽略规则。

部署与备份见 [VPS 部署说明](deploy/README.md)，模块边界见 [实施架构](docs/implementation-architecture.md)。

自动化、网页和公网持久化测试的具体结果见 [首版验收记录](docs/verification-report.md)。最新保存凭据下的真实模型场景与本轮功能覆盖见 [全量功能测试报告](docs/full-functional-test-report.md)，其中单独列出尚需真实账号验证的能力。

## 项目目标

- 以独立 VPS 作为后端运行环境。
- 参考 [Meta Muse](https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/) 的长期目标、后台执行、个人记忆、主动建议和用户授权体验。
- 全面接入国内生态，优先复用软件厂商公开的 MCP、Agent Skills、CLI 和 API。

## 开发计划

[本地开发计划](docs/development-plan.md) 汇总已确定的 Pi、VPS、微信与 Browser Use Pi 选型，以及国内生态范围、实施阶段、验收条件和当前进度。后续开发按计划推进，接口与授权边界查阅对应专项资料。

## 开发范围

以 [可开发能力清单](docs/development-scope.md) 作为当前开发范围，列出具体功能、Pi 接入路线与账号前置条件。

当前组合为 Pi SDK + 微信协议适配器 + 网页工作台 + 持久化后台任务，配合博查、高德、和风、ima、本地日历，以及标明来源的公共天气和参考汇率。[生态能力管理页说明](docs/ecosystem-manager.md)区分归档资料、可安装适配器、待凭据与已启用状态。票务、快递、瑞幸自提与滴滴沙箱尚未通过用户真实账号完成业务联调，没有接通真实订单或自动付款。

微信采用腾讯 [OpenClaw Weixin Channel](https://github.com/Tencent/openclaw-weixin) 公开的协议，自行实现 Pi 渠道适配器。官方插件依赖 OpenClaw，不能直接作为 Pi 扩展安装。先验证扫码登录和文字消息收发，再增加图片、文件与后台结果回传；主动通知的可用条件需要账号联调。具体方案见 [微信渠道接入方案](docs/weixin-channel.md)。

邮件首版从 `i@jane-zz.me` 通过 Resend 发送单收件人纯文本邮件；每封在应用内核对完整内容后批准，结果为“Resend 已接受”，不代表投递成功。QQ 邮箱与 Gmail 的 IMAP 收信仍待各自授权，`i@jane-zz.me` 也未启用收信。范围和限制见 [邮件集成说明](docs/mail-integration.md)。

## 调研资料

- [Muse 产品研究与 Pi 项目方案](docs/muse-and-pi.md)：Muse 已公开能力、证据边界、单 VPS 架构和分阶段验收建议。
- [浏览器控制调研与 Pi/VPS 选型](docs/browser-control-research.md)：Muse 控制方式的已知与未知、主流开放项目的源码机制、性能证据、常驻浏览器与接管方案。
- [微信渠道接入方案](docs/weixin-channel.md)：首版入口选型、Pi 适配路线、消息持久化与通知验收。
- [国内开放生态调研记录](docs/domestic-ecosystem.md)：保留 37 项软件/产品的来源、开放能力和限制，供实现时查证；实际开发范围以精简清单为准。核查日期为 2026-10-02。
- [日常查询接口清单](docs/daily-query-apis.md)：天气、地图、公交地铁、火车票、航班与机票、搜索、快递、调休日、农历节气和汇率的接法、账号条件与数据边界。

## 框架选型

采用 [Pi Agent Harness](https://github.com/earendil-works/pi)，原仓库地址为 `badlogic/pi-mono`。

当前使用 Node 24.15.0 和 TypeScript，通过 `@earendil-works/pi-coding-agent@1.0.0` 的 SDK 嵌入 Pi，复用工具、会话保存、上下文压缩、自动重试与扩展机制。网页使用 React/Vite，HTTP 服务使用 Fastify，业务状态使用 SQLite WAL。

Pi 各组件的职责：

- `@earendil-works/pi-ai`：统一的多供应商模型接口。
- `@earendil-works/pi-agent-core`：Agent 执行循环、工具调用与事件；可用于需要自行管理会话的定制实现。
- `@earendil-works/pi-coding-agent`：CLI 与可嵌入的 TypeScript SDK，包含会话和资源管理。

Pi 官方 MCP 扩展支持 stdio 和 Streamable HTTP；SDK 会话需显式配置 `createMcpExtension()` 并初始化，具体步骤见 [日常查询接入说明](docs/daily-query-apis.md#pi-sdk-的-mcp-配置)。

浏览器使用 [Browser Use Pi](https://github.com/browser-use/browser-use-pi) 固定提交的 TypeScript 执行模块，代码位于 `vendor/browser-use` 并保留 MIT 许可。Pi 是唯一规划循环；独立浏览器容器运行常驻 Chromium，支持 CDP、AX/DOM、截图流、中文输入、接管、弹窗与持久 profile。适配与限制见 [浏览器实现说明](src/server/browser/README.md)。

项目已在 Pi 之上实现访问认证、任务管理、个人记忆、成果下载、定时目标和批准流程。默认禁用 coding/shell 工具，MCP 使用 Pi 官方扩展；MCP 操作及任意浏览器代码需要批准。浏览器容器仅共享任务工作区，不挂载应用凭据、SQLite 或 Pi 会话。

Pi SDK 保存会话不等于自动恢复任意执行中的任务。官方另有实验性的 `pi-durable`，具备任务检查点与恢复能力；是否采用，需要在明确任务需求后评估。

官方资料：[SDK](https://github.com/earendil-works/pi/blob/v1.0.0/packages/coding-agent/docs/sdk.md)、[容器化](https://github.com/earendil-works/pi/blob/v1.0.0/packages/coding-agent/docs/containerization.md)、[pi-durable](https://github.com/earendil-works/pi/tree/v1.0.0/packages/durable)。

## 本地生态资源

已筛选的 Skills、MCP/CLI/SDK 开放代码、公开发布包、数据和 API 文档集中保存在 [resources/ecosystem](resources/ecosystem/README.md)。目前合计 78 项开发资产，本轮日常查询新增 31 项。通过 [本地资源索引](resources/ecosystem/INDEX.md) 查看每项的来源性质、文件位置、固定版本、账号条件和 Pi 接入限制。

`upstream/` 保存独立版本快照，`sources.lock.json` 保存来源、提交和文件校验值，`downloads/` 保存原始发布包。同步工具为 `python3 scripts/sync_ecosystem.py`，只下载归档，不执行上游安装器或业务代码。公开发布包、完整源码和仅文档的资源已区分；美团酒旅因当前公开包授权依赖不完整，仅作为参考保留。

管理页展示资源目录和应用中实际适配的连接器，但 78 条归档资源不能一键当作 78 个 Pi 工具。具体安装范围、凭据和卸载含义见[生态能力管理页说明](docs/ecosystem-manager.md)。普通美团外卖、淘宝闪购和京东外卖仍没有已核实的个人点餐接口；WPS 365 需要企业授权，不能因归档了 CLI 就标为已连接。

## 当前状态

应用已部署到 VPS，工作台可创建任务、追加消息、暂停/取消/恢复、查看操作和成果、编辑记忆与目标、配置连接、接管浏览器。任务与消息持久化，流式事件可补发；重启后的在途任务暂停，需核对后恢复。

真实 Pi SDK 已通过本地兼容测试模型验证工具循环、流式与会话恢复；网页与真实 Chromium 已完成桌面和手机交互验证。当前本地与 VPS 的 `gpt-6-sol` 真实模型连接测试通过，VPS 已完成真实日历查询、Markdown 文件生成和最终回复的工具循环。中转图片输入已通过随机数字与色块 PNG 的真实识别测试，本地和 VPS 均已启用 `images=true`。`reasoning=false` 保持关闭，推理参数尚未联调；一个识别样本不代表复杂任务完成率或综合性能结论，具体场景见 [本轮报告](docs/full-functional-test-report.md)。密钥加密保存在配置数据库中，接口不回填；实际 Pi 会话与模型运行配置文件未发现该密钥明文。微信扫码与国内业务 API Key 仍需用户提供。Muse 的内部浏览器协议和跨进程 iframe 全面验收仍未取得证据。

依赖安装会自动修复 Pi 1.0.0 shrinkwrap 固定的 `brace-expansion`，并检查实际执行版本；升级 Pi 前需要复核 `scripts/patch-pi-dependencies.mjs`。

## 本地配置

运行配置项见 `.env.example`。业务凭据在工作台保存后由 AES-256-GCM 加密，接口不回填密钥。备份必须同时保留数据和原加密 key；归档生态资源不代表服务已启用。
