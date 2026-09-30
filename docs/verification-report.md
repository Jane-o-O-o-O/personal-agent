# 首版实现与验收记录

日期：2026-10-03。工作台：[https://39.107.111.115:8443](https://39.107.111.115:8443)，本地：[http://127.0.0.1:3420](http://127.0.0.1:3420)。初始访问密码保存在本机忽略文件 `data/admin-password`。

## 运行组合

- Node 24.15.0、TypeScript、Fastify、React/Vite、SQLite WAL。
- Pi `@earendil-works/pi-coding-agent@1.0.0` 为唯一规划循环，每个任务独立保存会话。
- Browser Use Pi 执行层固定 `f1f763667303f08e9a2532c89304522da67996e5`，保留 MIT 许可。
- VPS 应用与浏览器独立容器；应用仅发布 loopback 3420，浏览器服务及 CDP 不发布公网端口。

## 已完成检查

| 检查 | 结果与实际覆盖 |
| --- | --- |
| 全量自动化测试 | `npm test`：10 个文件、82 项通过。覆盖任务与事务、批准、记忆/目标、接口鉴权、会话脱敏、依赖补丁、国内工具、微信协议、真实 Chromium、目录锁与浏览器 sidecar |
| 类型与前端构建 | `npm run typecheck`、`npm run build` 通过 |
| 网页端到端 | `npx playwright test tests/e2e --workers=1 --reporter=line`：8 项通过；真实后台、SSE 补发、记忆/目标编辑删除、MCP 凭据不回填、手机布局、地址栏后台刷新、真实浏览器输入与弹窗 |
| 鉴权修复 | 按匹配路由分类；真实 Fastify 和 WebSocket 回归验证编码路径、公开例外、跨站来源与缺失 Origin；公网编码任务/记忆/批准/浏览器请求被拒绝 |
| 输入恢复修复 | 真实 Pi SDK 验证同文 `follow_up`/`steer`、暂停重启恢复、会话已写但数据库未确认、真实模型接口 401 失败恢复；已消费输入不重复投递，未消费输入保留 |
| 浏览器目录恢复 | 真实 Chrome 验证正常关闭记录 `exit_type=Normal`、本实例原生/SDK 锁释放及 cookie/localStorage 恢复；独立测试 launcher 和浏览器退出后同环境恢复，原有目录内容保留；未知原生锁、外部 namespace、活跃进程及 native PID 复用时拒绝清理 |
| 凭据保护 | 流式片段、工具显示与 Pi JSONL 脱敏；旧会话解析后原子重写，内部损坏拒绝恢复、截断尾行单独处理；会话文件权限 600 |
| 依赖修复 | 安装后检查 Pi 实际执行的 `brace-expansion@5.0.12` 及递归/重写限制；Docker 安装及 production prune 审计零已知漏洞 |
| 实际公共查询 | VPS app 容器中的 Open-Meteo 北京城市、实时/预报天气与 Frankfurter 汇率成功，结果标明来源 |
| SQLite 备份恢复 | 在线一致备份包含真实测试任务、消息和记忆；独立还原副本 `integrity_check=ok`，记录 ID 与状态一致 |

## 公网部署验收

本次完整镜像更新、公网浏览器与跨重启验收已完成。验证脚本为 `scripts/verify-deployment.mjs`，`before` 和 `after` 均通过，checkpoint 为 `after-complete`；完成时间为北京时间 2026-10-03 06:37。两阶段之间显式统一重启应用与浏览器容器，脚本不会自行重启服务器。

| 公网检查 | 结果与实际覆盖 |
| --- | --- |
| HTTPS 与鉴权 | 可信 TLS 验证成功；匿名 REST/WebSocket 与错误密码拒绝访问，跨站登录拒绝；编码任务、记忆、批准与浏览器路径均返回 401 |
| 浏览器真实交互 | 接管、地址导航、缩放后的实际点击、中文输入、手工 confirm、保存后的 DOM 结果与交回控制通过 |
| 实时画面与布局 | 桌面 1440、手机 390/360 均通过 WebSocket 帧、1440×900 图像、非空像素与无横向溢出检查；重启后三种尺寸均为 6402/1296000 非空像素 |
| 统一重启持久化 | 原登录 cookie 和服务会话、原任务与用户消息、原记忆均保留；浏览器 generation 更新，原磁盘 profile cookie 无需重新写入仍可读取 |
| 正常退出与沙箱 | 重启后启动 Chromium 前确认原 SDK/Singleton 锁已释放、`exit_type=Normal`；重启前后均通过 Layer 1 Namespace、PID/Network namespaces、Seccomp-BPF 与 TSYNC 检查 |
| 运行状态 | 应用与浏览器均 healthy；应用仅发布 loopback 3420，浏览器不发布宿主机端口；原 AirMirror、Nginx、TURN、Hermes Gateway 与邮件服务仍运行 |

脚本始终使用同一独立测试任务、记忆、登录会话与浏览器 cookie。持久化标记只在重启前写入一次，重启后仅查询，不重新 seed。页面导航完成与实时帧到达存在时间差；已复现先收到空白首帧的检测时序，脚本以 15 秒有界条件等待同一 1440×900、非空像素大于 100 的标准，保留原失败截图，不放宽断言。

临时状态与诊断截图保存在忽略的 `.runtime/deployment-verification/`。验收结束后已删除测试记忆、清除 fixture cookie、停止 fixture 进程、注销临时登录并验证后续访问为 401；权限 600 的临时 cookie 文件与 VPS 中上传的 fixture 文件已删除。仅将当前 fixture 测试标签导航到 `about:blank`，其他标签未改。测试任务已取消并保留审计轨迹。生产 `.env`、原数据目录与用户 profile 未覆盖。

## 真实模型接入

2026-10-03 已通过工作台配置接口将本地与 VPS 接入用户中转 `https://api.jane-zz.online/v1`，模型 ID 为 `gpt-6-sol`，使用自定义供应商和 Chat Completions 协议。两端真实 Pi 模型连接测试通过，健康接口均为 `modelConfigured=true`，配置在运行时生效。

VPS [真实模型工具循环验收任务](https://39.107.111.115:8443/#tasks/8fb14531-f509-4616-8f82-5afd6108dff8) 于北京时间 14:12 完成。模型实际调用 `calendar_query` 查询 `2026-10-03`，再调用 `artifact_write` 生成 886 字节的 `model-connection-check.md`，最后返回文字回复；两个工具状态与任务均为 `succeeded`。已下载核对文件中的查询日期和内容；本次约 25.1 秒，仅为一个验证样本，不作为性能测评结论。测试未写入个人记忆或触发外部订单。

本地/VPS 模型密钥均加密保存在 SQLite settings 中，接口只返回已配置标记。实际核查 Pi `auth.json`、`models.json` 未包含该密钥明文；VPS 验收任务的 Pi 会话也未包含明文，文件权限为 600。临时配置与验证登录均已注销，凭据未写入源码和本文。

上述 14:12 的接入验收覆盖文字流式回复和真实工具调用，当时未验证图片输入、推理参数、复杂任务正确完成率或不同供应商性能。

2026-10-03 14:49 已使用同一已保存凭据、同一 `gpt-6-sol` 和 Chat Completions 协议完成独立图片补测：本地 Playwright 生成 PNG，数字与色块顺序只存在于图片中；Pi `ModelRuntime.completeSimple()` 的临时克隆模型声明 `input: ['text', 'image']`，不改变持久配置。中转首轮 HTTP 200，约 5.3 秒，数字及颜色顺序完全匹配。请求检查确认实际包含一个 PNG 图像、文字提示没有正确数字、没有 `reasoning_effort`。证据在忽略的 `.runtime/full-verification/model-vision.json` 与 `vision-challenge.png`，脚本为 `scripts/verify-live-model-vision.mjs`。

补测通过后，本地和 VPS 的实际模型配置已启用 `images=true`；`reasoning=false` 维持关闭，推理参数仍未联调。图片识别样本不能推导出全部网站、复杂任务完成率或不同供应商的性能表现。当前功能场景、最终凭据复核与未完成项见 [本轮全量功能测试报告](full-functional-test-report.md)，首版自动化与公网重启验收历史保留在上文。

## 尚需账号与联调

- 微信本人扫码与真实消息收发、延迟结果回传；现有测试覆盖公开协议实现。
- 博查、高德、和风、ima 等账号凭据及权限。国内域名 DNS/TLS 可达不等于业务 API 已获授权。
- 真实模型下的正确完成率与端到端延迟、跨进程 iframe 和更多国内网站。
- 票务、快递、瑞幸、滴滴及真实订单流程仍是后续接入项；没有自动付款、普通外卖、手机 App 或小程序控制的验收结论。

实施边界见 [实施架构](implementation-architecture.md)，后续阶段见 [开发计划](development-plan.md)，部署、备份与证书见 [部署说明](../deploy/README.md)。
