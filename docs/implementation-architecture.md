# Personal Agent 实施架构

日期：2026-10-03。本文在应用代码创建前确定，作为首版实现与验收契约。产品目标是一个个人身份、多个独立任务、VPS 后台持续运行的助手。

## 技术与运行边界

- Node 24、TypeScript、Fastify 5；React 19 + Vite 工作台，同源 HTTP API。
- Pi `@earendil-works/pi-coding-agent@1.0.0` 是唯一规划循环。显式个人助手提示词、工具和持久 SessionManager；不开放 VPS shell、任意文件系统或默认 coding 工具。
- 每个任务独立 Pi 会话；追加输入延续会话；单 worker 串行执行。数据库拥有任务状态，网页断连不取消任务。
- Node `node:sqlite` 保存业务状态，WAL、foreign_keys、busy_timeout。该接口在 Node 24 文档中仍有 release-candidate 标记；固定运行版本并验证备份恢复。
- Browser Use Pi 固定 `f1f763667303f08e9a2532c89304522da67996e5` 的执行层单独适配，保留 MIT 与来源。不得调用其内部 Agent run/followUp。Pi 0.85/0.87 的上游包不得混入 Pi 1.0 运行路径。
- 一个 Chromium 持久 profile，一个控制权 owner。CDP 只在服务内部可达；浏览器代码执行与应用凭据分离。Node VM 不是安全沙箱，生产进程按受限用户运行。
- 国内 VPS 已确认 Ubuntu 22.04 x86_64、2 CPU、约 3.5 GB RAM、Docker，存在其他服务；使用独立目录、容器与端口。

## 数据与职责

SQLite 表：tasks、messages、operations、events、approvals、artifacts、memories、goals、settings、auth_sessions、channel_inbox、outbox。

任务字段：id/title/prompt/status/channel/goalId/sessionFile/result/error/version/runCount/createdAt/updatedAt/startedAt/finishedAt。状态为 queued、running、paused、waiting_approval、waiting_user、waiting_external、succeeded、failed、cancelled。无模型配置时保存任务为 waiting_user；重启后的在途任务改为 paused，等待用户核对并恢复，不自动重放外部动作。

待处理输入按独立 UUID 保存，Pi 接收入队不视为消费。实际用户消息写入同一条 Pi JSONL 记录时保存 `personalAgentInputIds`，文件与目录同步成功后，事务删除数据库中的对应输入。恢复先核对会话中已保存的输入 ID，再投递未消费输入并要求核对已有结果与外部操作；相同文本的多条消息仍独立处理。会话已写盘、数据库确认尚未完成的窗口也按 ID 恢复。外部操作的结果仍需业务回执核对，不能将输入确认当作操作成功。

消息字段：id/taskId/role/text/status/createdAt，role 为 user/assistant/system，status 为 streaming/complete/error。保存完整消息，文本增量用于实时展示，不发送模型 thinking。工具记录包含名称、脱敏参数、结果、状态与耗时。

所有状态修改与对应事件写入同一事务。事件 id 是全局递增游标。幂等创建请求以 clientRequestId 加内容摘要判定；重复同内容返回原资源，不同内容返回 409。版本冲突返回 409。

密钥在 settings 加密保存，密钥加密主密钥只来自运行环境。配置读取只返回公开字段与 secretFields 是否设置；不得回传明文、向模型传密钥或将凭据放日志。模型连接支持 Pi 原生 provider 与自定义 OpenAI 兼容 endpoint/model；无 Key 时不制造回复。

当前实例使用用户中转 `https://api.jane-zz.online/v1`、`gpt-6-sol` 和 Chat Completions 协议。2026-10-03 已通过只在 PNG 中提供随机数字与色块的真实图片识别测试，本地和 VPS 现有配置均为 `images=true`，Pi 可接收图像工具结果。能力声明按真实中转结果启用；新实例的默认 `images=false` 不变，不依据模型名称推断图像支持。`reasoning=false` 维持关闭，推理参数未联调。实际功能覆盖与识别证据见 [本轮测试报告](full-functional-test-report.md)。

记忆为可查看、纠错和删除的文本记录，保留来源；每次执行重新加载有效记忆。长期目标支持一次、每日（Asia/Shanghai）和固定间隔，nextRunAt 持久化；goalId + scheduledFor 唯一防重复。通知与任务独立：失败通知不重跑任务。

## HTTP 契约

统一错误：`{error:{code,message},requestId}`。认证 cookie HttpOnly、SameSite=Lax；生产 HTTPS 启用 Secure。鉴权、公开接口例外与变更请求来源校验按 Fastify 实际匹配路由判断，百分号编码路径同样受保护；API 响应禁止缓存。WebSocket 升级检查身份与 Origin，输入检查浏览器控制权。

| 接口 | 返回或写入内容 |
| --- | --- |
| GET /api/auth/session | {authenticated:boolean} |
| POST /api/auth/login | {password}；设置随机持久会话 cookie |
| POST /api/auth/logout | 删除会话与 cookie |
| GET /api/health | 不含凭据的健康信息 |
| GET /api/bootstrap | {cursor,model,tasks,integrations,pendingApprovals,browser} |
| GET /api/tasks | Task[]，updatedAt 倒序 |
| POST /api/tasks | {prompt,title?,clientRequestId} → Task |
| GET /api/tasks/:id | {task,messages,operations,artifacts,approvals} |
| POST /api/tasks/:id/messages | {text,clientRequestId,mode?:follow_up或steer} → Task |
| POST /api/tasks/:id/cancel | {version?} → Task；取消在途工具并等待退出 |
| POST /api/tasks/:id/pause | {version?} → Task |
| POST /api/tasks/:id/resume | {version?} → Task |
| GET /api/events?after=N | SSE，Last-Event-ID 优先；补发 events |
| GET /api/integrations | Integration[] |
| PATCH /api/integrations/:id | {config}，只修改提供的字段；空 secret 明确删除 |
| POST /api/integrations/:id/test | {ok,message,...}，真实连通结果 |
| GET /api/ecosystem | {items:EcosystemItem[]}；归档资源、受控适配器与不可安装的需求卡，公开字段不含凭据 |
| POST /api/ecosystem/:id/install | {config?}；只允许已适配条目，远程 MCP 先探测再启用 |
| DELETE /api/ecosystem/:id | 卸载该实例的适配器配置；不删除归档或第三方账号 |
| POST /api/ecosystem/:id/test | 对已适配项做连接探测，结果不等于业务调用或下单 |
| POST /api/integrations/weixin/connect | 获取二维码登录会话 |
| GET /api/integrations/weixin/login | 扫码、验证码或登录状态 |
| POST /api/integrations/weixin/disconnect | 停止轮询并删除该渠道授权 |
| GET/POST /api/memories | Memory[] / {content,source?} |
| PATCH/DELETE /api/memories/:id | {content,version?} / 删除 |
| GET/POST /api/goals | Goal[] / {title,prompt,schedule,enabled?,maxRuns?} |
| PATCH /api/goals/:id | 修改 title/prompt/schedule/enabled/maxRuns |
| DELETE /api/goals/:id | 删除目标，不删除历史任务 |
| GET /api/approvals | 未处理 Approval[] |
| POST /api/approvals/:id/decision | {decision:approve或reject,parametersHash,version?} |
| GET /api/artifacts/:id/download | 仅下载该数据库记录对应的工作区成果 |
| GET /api/browser | BrowserState |
| POST /api/browser/start | 启动同一持久 profile |
| POST /api/browser/takeover | {generation?}，暂停任务并取得用户控制权 |
| POST /api/browser/release | {generation?}，重新观察并交回控制权 |
| POST /api/browser/navigate | {url,generation?}，仅用户接管后可操作 |
| POST /api/browser/input | {generation,tabId?,type,...}，仅用户 owner |
| POST /api/browser/dialog | {accept,promptText?,generation}，由用户决定 |
| WS /api/browser/stream?ack=1 | 帧 {type:frame,data,mimeType,width,height,generation,sequence}；客户端回传 {type:frame_ack,sequence}，另有状态与错误；不带 ack=1 保留旧协议 |

事件：`{id:number,type:string,entityId:string,taskId?:string,createdAt:string,payload:object}`。类型包括 task.created/updated、message.started/delta/completed、tool.started/completed、approval.created/resolved、integration.updated、memory.updated/deleted、goal.updated、artifact.created、browser.updated。断连不改变任务；越界游标通知重取 bootstrap。

## 浏览器契约

BrowserState：status（stopped/starting/ready/error）、owner（none/agent/user）、generation、taskId、tabs（id/title/url）、activeTabId、viewport（width/height）、dialog、error。控制权 generation 每次变更递增；旧输入拒绝。

BrowserService 对内暴露 start/status/takeover/release/navigate/observe/execute/screenshot/input/handleDialog/subscribeFrames/dispose。execute 接收外层 AbortSignal，取消和超时必须终止 worker。接管必须先停止 Agent 输入与执行，再允许用户操作。交回后重新观察，任务保持暂停直到明确恢复。断开画面不自动恢复任务。

自动导航与观察用于查询；任意代码动作 `browser_execute` 默认创建批准请求，绑定完整代码和参数 hash、有效期与任务。批准等待可取消；拒绝不能执行；重启后待批准操作不自动运行。通用浏览器执行不承诺支付、外卖、小程序或手机 App 能力。

实时画面采用 CDP screencast+ack，必要时截图回退；该接口 experimental，需固定 Chromium 验证。工作台使用独立的 `?ack=1` 协议，每张帧按连接内 `sequence` 回传确认，包括因旧 generation 被丢弃的帧。应用最多保留一张在途帧和一张最新待发送帧，只有精确匹配在途序号的 ACK 才推进；15 秒未确认关闭连接，工作台重连。不带 `ack=1` 的客户端保留原无序号协议。该确认表示客户端收到帧，不表示图像已经绘制。

截图共享以 target、控制 generation 和顶层 document loader 为边界，文档在截图过程中被替换时拒绝旧结果；原生帧只接受当前选中 target。独立 watchdog 和选中页面首帧截图不等待原生流 stop/start 命令完成，同一共享截图对象不重复广播。标签元数据刷新带版本保护，前端忽略旧状态回包，导航或切标签的 HTTP 回包不会清除已经到达的新帧。实时截图固定为 1440×900 CSS viewport、device scale factor 1，保留当前滚动位置和滚动条像素，桌面或手机显示缩放均映射到这一坐标空间。

输入为 CDP mouse/key/insertText，中文文本按 CSS viewport 映射。移除上游快模式自动接受 confirm/prompt 的行为，交由用户。2026-10-03 VPS 工作台受控页面验收 17/17 通过，覆盖中文输入、confirm/prompt、桌面滚动与键盘、切标签、手机触控、交回后新 DOM、三种布局和 Chromium namespace/seccomp 沙箱；具体证据与第三方账号联调限制见本轮测试报告。

## 渠道与工具契约

微信适配器复用腾讯官方协议，不引入 OpenClaw 宿主；QR、bot credential、绑定 user、长轮询 cursor 和 context_token 单独持久化。uint64 message_id 存字符串。入站去重、任务创建和 cursor 推进同事务。群消息与未绑定用户拒绝。-14 进入需要重授权状态并暂停；回复发送超时为 unknown，不自动重复发送。真实扫码联调必须由用户确认。

Integration：id/name/description/status/capabilities/config/secretFields/fields/lastCheckedAt/lastError。fields 描述 name/label/type（text/password/number/select/boolean）/required/options。模型、博查、高德、和风、ima、微信、MCP 连接器在一个配置页管理。MCP 使用 Pi 官方扩展，SDK 显式 bind；PiRunner 通过 `createMcpExtension` 的 `loadConfig` 合并本实例 `dataDir/pi/mcp.json` 与已启用的受控远程 MCP，不读取宿主全局 Pi 目录或任务工作区 MCP 配置。受控服务可能在 URL 中带凭据，因此扩展调试日志不持久写入磁盘。stdio 是受信任管理员配置，不能由模型任意创建进程。

工具使用官方 TypeScript HTTP 适配，输出 ok/data/error/meta，保留 provider/source/queriedAt/dataAt/parameters/timezone。首批实现博查搜索、高德地点/公交/地铁、和风新版天气、ima 只读知识检索、本地农历与调休；可选公共天气和参考汇率须注明实际来源。缺配置、权限、额度、网络错误明确返回，不伪造数据。

后续生活服务查询沿已归档官方 MCP 扩展；出票、支付与生产叫车不在未授权状态下执行。通用 MCP 工具调用默认受批准约束，以实际 schema 和账号授权为准。

## 生态目录与受控安装

生态页从 `resources/ecosystem` 的 78 条固定资产生成目录，并补充应用内建连接器、官方远程 MCP 适配器和普通外卖等未开放需求卡。目录规模不等于实际 Pi 工具数量。条目至少公开 ID、来源、类别、接入条件、限制、安装能力与状态；前端「生态扩展」位于 `#ecosystem`，只对服务端白名单条目显示安装/卸载。归档源码和 Skill 不在 VPS 上随 UI 操作执行。

受控远程 MCP 的端点和允许暴露的工具由服务端固定，用户仅提供对应凭据，不能从浏览器传入任意 MCP URL 或命令。滴滴先用官方沙箱并限制在路线、估价、订单查询和唤端链接；瑞幸先限门店、商品、自提订单预览和已有订单查询；飞常准限航班、火车、站点与价格查询。服务端完成 MCP 初始化和工具列表验证后才启用，实际业务权限、额度和结果另行验收。普通美团外卖、淘宝闪购、京东外卖与未经企业授权的 WPS 365 条目不应有可运行的安装动作。

启用状态和凭据保存在本实例的加密 settings 中；HTTP/事件只返回是否配置和脱敏错误。Pi 创建会话时从本实例数据目录和已启用的受控配置构造 MCP 工具，不能误读宿主全局 Pi 目录。模型工具调用继续经过批准检查；改变配置只保证后续任务或新会话可见，不追溯修改正在运行的会话。卸载移除本实例配置，保留历史操作与资源快照，也不替代平台侧撤销 Token 或取消订单。具体用户操作和平台限制见[生态能力管理页说明](ecosystem-manager.md)。

## 模块所有权

- 主实现：shared/contracts、config、store、auth、task-service、Pi runtime、approval、memory/goals、HTTP、部署与端到端验证。
- 浏览器实现：server/browser、vendor/browser-use、浏览器专项测试与来源清单。
- 生态实现：server/integrations、server/channels、连接器与微信专项测试。
- 工作台实现：client、前端交互和桌面/手机验证。

## 验收矩阵

| 场景 | 证据 |
| --- | --- |
| Pi 工具循环 | 测试供应商验证真实 Pi SDK、工具调用、流式与会话恢复；当前真实中转已验证文字工具循环和 PNG 图片识别，本轮场景结果单列 |
| 持久任务 | 重复创建、页面关闭、取消、暂停、重启后需核对恢复 |
| 批准 | 参数 hash、版本、过期、拒绝、取消、重启不得自动执行 |
| 凭据 | 响应/事件不回传秘密，来源错误正文脱敏，未认证访问拒绝 |
| 记忆与目标 | 纠错/删除影响后续上下文；暂停目标停止触发；调度实例唯一 |
| 国内 API | 请求 schema、错误/额度/超时、坐标与数据时间；真实账号联调单列 |
| 微信 | uint64 去重、绑定身份、入站事务、游标恢复、-14、通知 unknown；扫码实测单列 |
| 原生浏览器 | 导航、DOM/AX、中文表单、多动作、截图、取消、接管互斥、dialog、profile重启 |
| 网页交互 | 1440×900、390×844、360×800 实际流程与截图，布局无重叠 |
| VPS | 独立部署、认证/TLS、健康、静态资源、重启持久化、浏览器非空与可输入 |

不能由测试替身证明真实第三方账号或收费业务已联通。配置缺失与待用户扫码将保留为明确的验收限制。

## 技术证据

- [Pi SDK 固定源码](../resources/ecosystem/upstream/pi/a13d35a742c6/packages/coding-agent/docs/sdk.md)
- [Pi MCP SDK 示例](../resources/ecosystem/upstream/pi/a13d35a742c6/packages/coding-agent/examples/sdk/14-codemode-mcp.ts)
- [Browser Use Pi 固定源码](https://github.com/browser-use/browser-use-pi/tree/f1f763667303f08e9a2532c89304522da67996e5)
- [微信协议与证据](weixin-channel.md)
- [国内接口及数据约束](daily-query-apis.md)
- [SSE 标准](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [CDP Page](https://chromedevtools.github.io/devtools-protocol/tot/Page/)
- [Fastify WebSocket](https://github.com/fastify/fastify-websocket)
