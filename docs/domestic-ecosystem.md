# 国内开放生态接入清单

核查日期：2026-10-02。项目目标：以 Pi 为执行核心，在独立 VPS 上运行类似 Meta Muse 的个人 Agent，接入国内软件和服务。

本轮覆盖 37 个软件或产品，包含后续专项核验的瑞幸与滴滴，依据公开的厂商文档、官方仓库、实际 `SKILL.md` 或官方发布包，以及技能商店的发布者身份。调研不包含登录用户账号、申请业务权限、执行支付或实测生产接口。部分接入条件需要在实现对应连接器时用实际账号验证。

官方开发资产已归档至 [本地资源库](../resources/ecosystem/README.md)，文件位置与固定版本见 [索引](../resources/ecosystem/INDEX.md)。后续实物核验发现美团酒旅公开包的授权依赖不满足普通 VPS 条件，已修正开发范围，详见下文。

## 四种接入资产

| 形式 | 提供什么 | 在 Pi 项目中的用法 |
| --- | --- | --- |
| MCP | 以标准协议暴露可调用的工具 | 将官方服务器配置接到 Pi 的 MCP 扩展，处理鉴权和工具授权 |
| Agent Skill | `SKILL.md` 工作说明，可能包含脚本或 CLI 用法 | 加载技能及随附资源，并提供其需要的 CLI、脚本运行环境与凭据 |
| CLI | 可运行的命令行客户端 | 在 Linux 执行环境安装，处理登录和输出；可由 Skill 指导调用，或包装为受控工具 |
| API | 软件真实的 HTTP/SDK/消息协议接口 | 编写 Pi 工具或渠道适配器，也可按需要封装成 MCP |

这些资产可以同时存在。例如，腾讯文档 Skill 调用 MCP，飞书 Skill 使用 CLI 调用 OpenAPI。安装 Skill 不会自动赋予用户数据权限，OpenClaw 插件也不等于可直接加载的 Pi 扩展。

标记约定：**已确认**表示找到可归属于厂商的公开证据；**待核验**表示相关细节尚未确认。表格中的“未确认”只描述本轮调研结果，不能解释为该厂商不存在此能力。

## 办公、知识和通信

| 软件 | 官方 MCP | 官方 Skill / CLI | API 与实际能力 | 账号条件及建议 |
| --- | --- | --- | --- | --- |
| 飞书 | [lark-openapi-mcp](https://github.com/larksuite/lark-openapi-mcp) 已确认；另有个人托管 MCP | [lark-cli 与 Skills](https://github.com/larksuite/cli) 已确认 | 文档、知识库、多维表格、表格、消息、日历、任务、邮件等 OpenAPI | CLI 支持个人开发者路径，仍需应用、用户 OAuth 和资源权限。[个人托管 MCP](https://open.feishu.cn/document/mcp_open_tools/end-user-call-remote-mcp-server.md) 新链接有效 7 天且将逐步下线，官方推荐 CLI；此限制不代表自部署 MCP 或 CLI 也只有效 7 天 |
| 钉钉 | [dingtalk-mcp](https://github.com/open-dingtalk/dingtalk-mcp) 已确认 | 本轮未确认独立官方 Skill 包 | [Stream SDK](https://github.com/open-dingtalk/dingtalk-stream-sdk-nodejs) 可接机器人、事件和卡片回调；MCP 包装平台 API | 需要组织应用的 Client ID/Secret 与相应权限。消息入口可用出站 Stream 连接 |
| 企业微信 | 本轮未确认通用官方 MCP | [wecom-cli 与 Skills](https://github.com/WecomTeam/wecom-cli) 已确认 | 文档、智能表格、邮件、日程、会议、待办、微盘、通讯录；[智能机器人长连接](https://developer.work.weixin.qq.com/document/path/101463) | 企业微信账号；CLI 扫码授权，机器人按场景配置 Bot ID/Secret。主动推送仅限机器人最近对话过的单聊/群聊；VPS 可用 Linux 版本 |
| 腾讯文档 | 官方发布包已确认多个 HTTP MCP 端点，详见下文 | [官方 Agent 发布页](https://docs.qq.com/scenario/open-claw.html?nlc=1) 与 [SkillHub 官方条目](https://skillhub.cn/skills/tencent-adm/tencent-docs) | 文档、表格、幻灯片及文件管理 | QQ/微信个人扫码授权；Skill 依赖 Node.js、Bash 和 mcporter。部分能力受会员或积分条件限制 |
| 腾讯 ima | 本轮未确认独立官方 MCP | [腾讯认证发布者的 ima-skills](https://skillhub.cn/skills/tencent-adm/ima-skills)，已读取发布包中的 `SKILL.md` | [IMA OpenAPI 凭据入口](https://ima.qq.com/agent-interface)；笔记搜索/读写、知识库检索、文件和网页导入 | Client ID + API Key；Node.js 脚本调用官方 HTTPS JSON API。适合个人知识库连接器 |
| 微信 | 本轮未确认通用官方 MCP | 官方发布形态为 [openclaw-weixin 渠道插件](https://github.com/Tencent/openclaw-weixin)，不能直接视为 Pi Skill | [公开协议](https://github.com/Tencent/openclaw-weixin/blob/main/docs/protocol_zh_CN.md)：扫码登录、消息收发与媒体、HTTPS 长轮询 | 可以研究实现 Pi 的微信渠道适配器。不能据此承诺读取全部私人微信历史、朋友圈或任意群聊；延时通知条件需实测 |
| QQ | 本轮未确认通用官方 MCP | [腾讯官方插件与 Skills](https://github.com/tencent-connect/openclaw-qqbot)：频道接入、提醒等；部分内容依赖 OpenClaw 宿主 | [官方 Agent 接入](https://bot.q.qq.com/wiki/agent-qqbot/) 与机器人 API | 有个人主体及快速 Agent 接入路径；一般开发平台与快速接入的审核、IP 等条件应分别核查。Pi 需要自己的渠道适配层 |
| 语雀 | [yuque-mcp-server](https://github.com/yuque/yuque-mcp-server) 已确认 | [yuque-ecosystem](https://github.com/yuque/yuque-ecosystem) 已确认有实际 Skills，部分依赖语雀 MCP | 知识库与文档读取、搜索、写入等语雀 API | 个人 Token 和知识库权限；当前生态仓库的团队版 `yuque-group` 暂时下线、团队统计工具尚未提供，不能据此推断全部团队 API 下线 |
| WPS / WPS 365 | [官方 MCP 广场](https://open.wps.cn/documents/mcp)；[官方目录 JSON](https://open.wps.cn/docs/api/mcp?lang=zh-CN) 已核验 11 项发布条目，发布者均为金山办公 | 门户宣称提供 WPS365 Skill，本轮未取得具体包；[官方 CLI](https://github.com/wps365-open/cli) 已确认 | 文档、多维表格、日历、邮件、会议等，具体范围取决于接入产品 | WPS 365 CLI 需企业账号、自建应用和管理员审批；不能推广为所有个人 MCP 的条件。MCP 具体 URL、传输及鉴权，Skill 依赖仍待核验 |
| 有道云笔记 | [网易官方文档](https://mopen.163.com/doc/) 已确认 SSE MCP | 官方文档提供 CLI；本轮未确认官方 Skill | 笔记查询等 MCP/CLI 能力；独立通用 REST 文档本轮未核实 | [平台注册](https://mopen.163.com/)获取 API Key，只能访问注册手机号下的笔记。Pi 不原生支持此旧式 SSE，需桥接或评估 CLI |

### 腾讯文档的 MCP 端点

官方发布包 `https://cdn.addon.tencentsuite.com/static/tencent-docs.zip` 的鉴权说明列出以下四个服务，使用同一授权 Token：

- `https://docs.qq.com/openapi/mcp`
- `https://docs.qq.com/api/v6/slide/mcp`
- `https://docs.qq.com/api/v6/doc/mcp`
- `https://docs.qq.com/api/v6/sheet/mcp`

这是“官方 Skill 内部使用 MCP”的具体例子。接 Pi 前需验证协议握手、Token 生命周期及各服务实际可用的工具范围。

### ima 的直接 API 路线

已读取腾讯认证发布者的 `ima-skills` 发布包 v1.1.9：根目录及 notes、knowledge-base 子目录都有 `SKILL.md`，附 `ima_api.cjs` 和文件上传脚本。

技能说明给出 `IMA_OPENAPI_CLIENTID`、`IMA_OPENAPI_APIKEY`，通过 `https://ima.qq.com` 的 HTTP POST + JSON 调用 OpenAPI。可以复用 Skill，也可以基于公开接口写 Pi 工具；用户长期记忆与 ima 知识库应分别管理。

### 有道云笔记的传输限制

官方 MCP 地址为 `https://open.mail.163.com/api/ynote/mcp/sse`，使用 `x-api-key` 请求头，传输为旧式 SSE。它是笔记接口，不能因域名包含 `mail.163.com` 就推断开放了 163 邮件。

普通 QQ 邮箱、163 邮箱的官方 MCP/Skill，本轮未取得可靠证据。企业微信邮箱、WPS 邮箱也不能视为普通个人邮箱接入；若需要邮件能力，应另外核验目标邮箱的 IMAP/SMTP、授权码及开放接口。

## 地图、检索和生活服务

| 软件 / 服务 | 官方 MCP | 官方 Skill / CLI | API 与实际能力 | 个人接入条件和边界 |
| --- | --- | --- | --- | --- |
| 高德地图 | [官方 MCP](https://lbs.amap.com/api/mcp-server/gettingstarted)，远程 `https://mcp.amap.com/mcp?key=...`；也提供本地 MCP 包 | [官方 CLI + Skill](https://lbs.amap.com/api/cli/map-cli/summary)，官网直接提供 [Skill ZIP](https://a.amap.com/jsapi/static/openClaw/amap-cli-skill.zip) | POI、天气、路线与地图；导航、打车等能力包含唤端链接 | 开发者注册及 Web 服务 Key、配额。CLI 的 `@amap-lbs/amap-gui` 配合可视化地图容器，纯 VPS 查询优先 MCP；不能将打车链接视为直接下单付款 |
| 百度地图 | [官方 MCP 仓库](https://github.com/baidu-maps/mcp)，地图服务 `https://mcp.map.baidu.com/mcp?ak=...` | [官方 bmap-cli Skill](https://github.com/baidu-maps/bmap-cli-skills/blob/main/skills/bmap-cli/SKILL.md) 已确认 | 地点、路线、地图等；[文档 MCP](https://lbs.baidu.com/docs/ai?title=docs-mcp/guide) 为 `https://docs.map.baidu.com/mcp` | 常规接入需开发者 AK、配额，部分高级能力另需权限。Agent Plan 有普通用户 Token 路径宣传及内测提示，开放范围仍需确认；文档检索 MCP 不提供地图业务数据 |
| 百度搜索 | 本轮未独立确认通用官方搜索 MCP | [百度官方搜索 Skill](https://github.com/baidubce/skills/blob/develop/skills/baidu-search/SKILL.md)，仓库默认分支为 `develop` | 调用 `https://qianfan.baidubce.com/v2/ai_search/web_search`，返回网页检索结果 | `BAIDU_API_KEY`，启用对应服务及账户余额；Skill 可作为工作说明，也可直接包装 HTTP API |
| 博查搜索 | [BochaAI 官方 MCP](https://github.com/BochaAI/bocha-search-mcp) 已确认 | 本轮未独立确认官方 Skill | [官方 API](https://open.bochaai.com/) 的 web-search、ai-search；时效过滤、结构化检索 | 注册取 API Key，按实际套餐和请求计费；适合国内网页检索工具 |
| 瑞幸咖啡 | [官方 AI 开放平台](https://open.lkcoffee.com/mcp)，Streamable HTTP `https://gwmcp.lkcoffee.com/order/user/mcp` | [官方 My Coffee Skill](https://open.lkcoffee.com/skill) 与 CLI；已读取官方发布包 v0.8.4 | 查门店、商品和 SKU，预览优惠、创建订单、支付二维码、查单和取餐码、取消订单 | 手机号短信登录后创建个人 Token，Bearer `LUCKIN_MCP_TOKEN`。当前 Skill 只支持到店自取；用户扫码付款，未确认通用自动扣款能力 |
| 滴滴出行 | [官方 MCP](https://mcp.didichuxing.com/)，Streamable HTTP；[个人入口](https://mcp.didichuxing.com/claw) | 官网直接链接 [didi-ride-skill-official](https://clawhub.ai/didi/didi-ride-skill-official)，归属已确认；[官方 Skills 文档](https://mcp.didichuxing.com/skills.md) | 价格预估、创建/查询/取消订单、司机位置、地图路线；[API 文档](https://mcp.didichuxing.com/api.md) | 已注册滴滴个人账号可激活 MCP Key。Beta 仅唤端链接；直接叫车需 Pro 权限生效、实名认证和免密支付。Skill 的 OpenClaw 配置、消息、cron 命令需适配 Pi |
| 美团 | 本轮未确认可独立使用的通用官方消费者 MCP | 已读认证发布者的 [跑腿](https://skillhub.cn/skills/org-tzvk0vz3/meituan-paotui)、[酒旅](https://skillhub.cn/skills/org-tzvk0vz3/meituan-trip)；另有 [开放平台开发 Skill](https://skillhub.cn/skills/org-tzvk0vz3/mt-openplatform-integrator) | 跑腿有用户授权、费用预览、确认和提交；酒旅通过官方 CLI 查询规划并返回跳转链接 | 认证主体北京三快在线科技有限公司；有[个人开发者 Key 入口](https://developer.meituan.com/zh/v2/dev/token)，具体流程取决于分发渠道。跑腿提交后 15 分钟内到 App 支付；调用方条件见下文 |
| 携程 | 本轮未确认通用官方 MCP | [携程问道 Skill](https://skillhub.cn/skills/org-rdj3h8zv/ctripaitravelassistant)，已读取实际 `SKILL.md` | 调官方 `externalcallback.ctrip.com`，旅行问答、机酒火车票查询与行程规划 | 认证主体上海携程商务有限公司；[Token 申请](https://www.ctrip.com/wendao/openclaw)，`WENDAO_API_KEY` + Node.js，额度需确认。直接订单提交/付款未核实；eBooking Skill 属于酒店商户经营 |
| 支付宝 | [官方收款 MCP](https://www.npmjs.com/package/@alipay/mcp-server-alipay)，用途是支付接入/收款 | [Agent Pay 官方指南](https://aipay.alipay.com/agentpay.md) 提供 `@alipay/agent-payment` 的 Skill 体验安装；另有商户开发 Skill | 确有消费者 Agent 钱包，支持用户授权下的下单、支付、凭证回传 | 每笔交易需用户授权；支持的商品供给、账户准入和 Pi 集成尚未实测。收款 MCP 或商户开发 Skill 不等于任意平台的消费购物权限 |
| 微信支付 | 本轮未确认通用消费者 MCP | [官方支付开发 Skills](https://github.com/wechatpay-apiv3/wechatpay-skills)；[SkillHub 官方条目](https://skillhub.cn/skills/tencent-adm/wechatpay-payment-integration) | [微信 AI 支付/AI 专属卡](https://pay.weixin.qq.com/doc/v3/merchant/4035576700.md) 已有官方产品文档；开发 Skill 提供选型、接入与排障 | AI 专属卡资金与主账户隔离，当前逐笔扫码授权；商户 Skill 需接入对应支付链路。个人消费路径和商户 API 条件应分别验证 |
| 京东 | 本轮未确认京东商城通用购物 MCP | [AI 付开发 Skill](https://github.com/jd-opensource/jd-aipay-skill)、[Clawtip 支付 Skill](https://github.com/jd-opensource/jd-clawtip-payment-skill) 已确认 | 前者用于商户支付接入；后者用于付费 Skill 的用户 Token、支付请求和授权状态 | 不能等同京东全品类搜索、加购和购物接口；消费者购物权限本轮未确认 |
| 淘宝 / 淘宝闪购 | 本轮未确认第一方通用购物 MCP | 本轮未确认可独立复用的第一方通用购物 Skill | [淘宝开放平台](https://open.taobao.com/) 有商家/生态 API；支付宝 Agent Pay 已列出淘宝闪购消费案例 | 官方案例证明存在特定 Agent 交易链路，但个人自建 Pi 是否可接、商品和地区范围需确认，不能承诺任意账号与商品下单 |
| 小红书 | 本轮未确认第一方 MCP；常见项目为社区实现 | 本轮未确认第一方个人内容 Skill | [官方开放平台](https://open.xiaohongshu.com/) 及商家相关接口 | 个人内容检索/发布准入未完成核验；社区 MCP 需要登录或自动化，不应列为第一方开放能力 |
| B 站 | 本轮未确认第一方 MCP | 本轮未确认第一方 Skill | [官方开放平台](https://open.bilibili.com/)、[文档](https://open.bilibili.com/doc)，身份认证后按应用开放能力接入，如稿件分发 | 个人主体、应用审核及具体权限需验证；社区视频 MCP 不能代表官方授权 |
| 抖音 | 本轮未确认第一方 MCP | 本轮未确认第一方 Skill | [官方视频搜索 API](https://developer.open-douyin.com/docs/resource/zh-CN/dop/develop/openapi/douyin-search-capability/aweme-dy-video-search)：`GET /dy_open_api/v1/search/video/` | 应用需获 `aweme.dy.video_search` 权限，使用 `client_token` 并受配额约束；有个人开发者指引不等于新应用必然获得该权限 |

### 消费服务的真实执行范围

连接器应分别记录“查询、生成跳转链接、预览订单、提交订单、支付、取消/退款”是否获准。搜索到商品、输出预订链接、提交待支付订单和扣款是不同的结果；任务状态需要准确反映实际完成的步骤。

- **美团跑腿**：[实际 Skill](https://api.skillhub.cn/api/v1/skills/meituan-paotui/file?path=SKILL.md&namespace=org-tzvk0vz3) 要求先预览费用，用户确认后以相同参数提交，随后在 15 分钟内到美团 App 支付。它还声明“调用方应确保所使用的 AI 助手已在中国大陆完成安全备案”；个人自建场景的适用性与准入需要向平台核实，因此暂不将此路线列为已验证可上线的交易连接器。
- **美团酒旅、携程问道**：已确认旅行查询和规划；本轮未取得足以证明完整自主预订、付款链路的证据。[携程实际 Skill](https://api.skillhub.cn/api/v1/skills/ctripaitravelassistant/file?path=SKILL.md&namespace=org-rdj3h8zv) 的描述出现“预订”，本身不足以证明有订单提交接口。
- **支付宝、微信支付、京东**：已存在 Agent 支付相关产品或实际 Skill。具体购买仍取决于供给方接入和用户授权，支付工具不会自动获得电商平台完整购物能力。

来源归属：美团与携程条目已核对 SkillHub 的认证发布者主体，并读取实际技能文件；其他条目以第一方官网、仓库及发布包为依据。上述交易能力没有用用户账号实际下单或支付验证。

**美团酒旅归档核验补充**：完整下载官方 `1.0.1` ZIP 后，主 Skill 的必需授权流程指向内嵌的 `meituan-passport-user-auth`。该子 Skill 明确写明“仅支持美团内网：外网无法访问 npm registry 和授权接口”；安装器需要的 `mtuser-pt-passport-*.tgz` 未包含在公开包中，公共 npm 也没有可用的该授权包。主 Skill 没有个人 Developer Key 备用路线。其业务 CLI `@meituan-travel/ht-ai-open@0.0.4` 可以公开下载，但不能补齐授权依赖。因此只保留为参考资产，不列为普通 VPS 已验证可开发的连接器。见 [固定版本官方包](https://api.skillhub.cn/api/v1/download?slug=meituan-trip&namespace=org-tzvk0vz3&version=1.0.1)。

### 瑞幸与滴滴的个人接入

**瑞幸**：官网直接发布 [My Coffee Skill ZIP](https://unpkg.luckincoffeecdn.com/@luckin/my-coffee-skill@latest/dist/my-coffee-skill.zip)，本次读取的 `SKILL.md` 版本为 0.8.4，并由[官方工具文档](https://open.lkcoffee.com/docs)交叉支持。流程为确认门店与商品、预览价格和优惠、创建订单、展示支付二维码，用户支付后查询订单与取餐码；当前明确不支持配送/外卖。个人 Token 与账号会话绑定并有有效期。VPS IP 不能当成用户当前位置，应使用用户提供的地址、手机位置或常用门店。

**滴滴**：第一方网站及 [api.md](https://mcp.didichuxing.com/api.md) 明确支持个人账号激活 MCP Key，版本分为普通用户 Beta、独立开发者 Pro、企业 Pro+。Beta 获取链接后到 App/小程序叫车；Pro 可直接在 Agent 内叫车、查单、获取司机位置和取消。官网公开控制台文案列出实名认证、开通免密支付和 Pro 申请/审核步骤，审核提示预计 1～3 个工作日短信通知；实际权限以账号获批为准。

- 生产：`https://mcp.didichuxing.com/mcp-servers?key=...`，会产生真实订单和费用。
- 沙箱：`https://mcp.didichuxing.com/mcp-servers-sandbox?key=...`，返回 Mock 数据、不产生真实订单；适合先验证 Pi 连接和任务流程。
- 叫车需先预估取得有时效的 `traceId`。官方 API 要求展示车型/价格并获得确认，Skill 的部分偏好直发流程更宽；首版采用明确确认后的下单流程。
- Skill 中的定时叫车通过 OpenClaw cron 实现，不能视为 Pi 已内置，也不能自动等同滴滴原生预约产品；本项目需用自己的调度与通知实现。

支付宝[新终端智能体支付](https://aipay.alipay.com/products/device-agent-pay.md)也明确提到瑞幸选品下单、取单号回传，但当前限定企业 AI 终端厂商定向邀请试运营，不能作为个人 VPS 的默认路线。

### 外卖点餐的开放边界

按本项目“个人 Pi/VPS 使用本人消费者账号，完成选店、选餐、提交订单和付款”的标准，目前未核实淘宝闪购、美团、京东任一家具有公开、可供普通个人直接申请的完整官方消费接口。已有合作 Agent 的点餐案例、商家管理 API 和支付产品，应分别记录，不能据此认定个人连接器已经可用。

| 路线 | 已核实证据 | 对个人 Pi 的含义 |
| --- | --- | --- |
| 淘宝闪购 / 饿了么官方链路 | [支付宝 AgentPay](https://aipay.alipay.com/agentpay.md) 明确展示 jvsclaw 淘宝闪购点奶茶案例 | 业务链路确实存在；本次未确认向普通个人自建 Pi 开放同样的选店、选餐、下单接口 |
| 美团官方跑腿 | 帮取送、帮买、预览、提交，再去 App 付款 | 可作为跑腿场景候选，不能与普通美团外卖菜单点餐混为一谈；商家外卖管理 API 也不是个人消费接口 |
| 京东外卖 | 本次未确认第一方消费者点餐 MCP/Skill | 京东支付 Skill 不能代替外卖点餐接口，暂不承诺完整接入 |
| 饿了么社区浏览器路线 | 已读 [eleme-order](https://skillhub.cn/skills/clawhub_xbralready/eleme-order) 的实际 Skill：用 Playwright MCP 操作 H5，浏览商家、选规格、加购、确认后提交，用户手动支付 | 是第三方自动化，可研究适配 Pi；当前页面、登录、VPS 定位、验证码和稳定性均未实测，不列为官方开放资产 |

另有名为 `meituan-waimai` 的目录条目，实际 Skill 只有领券功能；部分自称“美团官方”的发布者认证主体并非美团。不能因名字含“外卖”就认定支持点餐。

补充第一方依据：支付宝[移动智能体接入文档](https://aipay.alipay.com/docs/agent-pay/mobile-agent-pay.md)要求商家服务端先创建订单、返回预下单号，Agent 再推进支付；[商家接入文档](https://aipay.alipay.com/docs/agent-pay/skillpay.md)要求商家提供下单 Skill。这些支付文档没有提供淘宝闪购的找店、菜单、购物车接口。[移动智能体支付产品](https://aipay.alipay.com/products/mobile-agent-pay.md)当前还限定企业 AI 应用定向邀请；此条件只属于该支付产品，不能推断为淘宝闪购全部消费者接口的准入规则。

[美团开放平台](https://developer.meituan.com/)明确将所述外卖 API 定义为处理商家外卖业务；京东的[AI 付 Skill](https://github.com/jd-opensource/jd-aipay-skill)与[Clawtip Skill](https://github.com/jd-opensource/jd-clawtip-payment-skill)分别面向商户支付接入和付费 Skill 支付，不提供餐厅菜单及消费者外卖业务下单接口。

## 云服务、开发和数据工具

| 软件 / 产品 | 官方开放资产 | 实际能力 | 账号、VPS 条件与费用 |
| --- | --- | --- | --- |
| 阿里云 CloudOps | [官方 MCP](https://github.com/aliyun/alibaba-cloud-ops-mcp-server) | ECS、OSS、VPC、RDS、监控和运维操作 | Python >=3.10、uv/uvx、stdio；云身份及 RAM 权限。个人云账户可用，底层资源计费 |
| 阿里云 SLS | [SLS Skills](https://github.com/aliyun/aliyun-sls-agent-skills)、[AIOps 查询 Skills](https://github.com/aliyun/alibabacloud-aiops-skills) | 日志项目、Logstore、采集、写入及查询分析 | aliyun-cli、插件和有效云身份；SLS 存储、写入、查询按产品规则计费 |
| 阿里云 DMS | [官方 MCP](https://github.com/aliyun/alibabacloud-dms-mcp-server) | 数据源元数据、SQL、NL2SQL、变更工单和审批 | Python >=3.10、uv；AK/SK/STS、登记数据源、DMS 权限；费用按管控模式和资源确定 |
| 阿里云云效 | [官方 MCP](https://github.com/aliyun/alibabacloud-devops-mcp-server) | Codeup、合并请求、项目工作项、流水线、制品和测试 | 官方远程 Streamable HTTP `https://openapi-rdc.aliyuncs.com/ai/mcp` + PAT；需要自己的组织及资源权限 |
| 腾讯 CloudBase | [官方 MCP Toolkit](https://github.com/TencentCloudBase/CloudBase-AI-Toolkit)、[官方 Skills](https://github.com/TencentCloudBase/cloudbase-skills) | 数据库、云函数、Cloud Run、存储、静态托管、日志和部署 | 国内远程 `https://tcb-api.cloud.tencent.com/mcp/v1`，OAuth 或相应云身份和环境 ID；本地 Node.js >=18.15。超额云资源计费 |
| 腾讯云 OCR | [官方 Skills](https://github.com/TencentCloud/tencentcloud-ocr-skills) | 文字、表格、证照、发票等识别，按选定 API | Python、腾讯云 SDK、SecretId/Key；开通 OCR、按接口或资源包计费 |
| 火山引擎 | [官方 MCP 集合](https://github.com/volcengine/mcp-server) | TOS、ECS、日志、数据库等云服务，按具体服务器 | 例如 TOS 使用 Python >=3.10、uv、AK/SK、stdio；资源和请求按产品计费。[MCP 市场](https://www.volcengine.com/mcp-marketplace) 也收录第三方 |
| 华为云 | [官方 Skills](https://github.com/huaweicloud/huaweicloud-skills) | ECS、存储、网络、数据库、监控等，按具体 Skill | IAM 身份及相应 KooCLI/SDK。ECS Skill 有额外工具安装和质量遥测要求，部署时需审阅具体脚本 |
| 七牛云 | [官方 MCP](https://github.com/qiniu/qiniu-mcp-server) | Kodo 文件、图片处理、CDN 刷新/预取、直播流管理 | Python >=3.12、uv/uvx、AK/SK；采用 stdio。底层存储、流量和处理计费 |
| Gitee | [OSChina 官方 MCP](https://gitee.com/oschina/mcp-gitee) | 仓库文件、Issue、PR、评论、评审和通知 | 远程 `https://api.gitee.com/mcp` + PAT；个人资源可用，组织/企业操作需要相应权限 |
| GitCode / AtomGit | [官方 OpenAPI](https://docs.gitcode.com/docs/apis/) | 仓库、Issue、PR、流水线等 | 个人 Token 与资源权限。找到自称官方的 MCP 仓库，但本轮未确认厂商归属，不列为已核实官方 MCP |
| CODING | [官方 OpenAPI](https://help.coding.net/openapi) | 项目、仓库和开发协作接口 | OAuth、个人/项目 Token，团队资源及套餐条件；本轮未确认官方 MCP 或 Skills |

MCP/Skill 的代码开放不代表底层云服务免费。VPS 可以位于其他厂商，只要具有所需接口和私网资源的网络通路。

## 如何接到 Pi

基准版本为 [Pi v1.0.0](https://github.com/earendil-works/pi/releases/tag/v1.0.0)。正式实现时固定依赖和锁文件，配置不携带真实密钥入库。

1. **MCP 路线**：SDK 在 `DefaultResourceLoader.extensionFactories` 加入 `createMcpExtension()`，执行 `await resourceLoader.reload()`，创建 session 后执行 `await session.bindExtensions({})`。默认 `codemode` 暴露需同时加入 `createCodemodeExtension()`；`deferred` 需 `createToolSearchExtension()`；`direct` 可直接向模型声明工具。按官方示例启用对应工具，避免用 `tools: [...]` 白名单意外隐藏 MCP 工具。当前支持 stdio 与 Streamable HTTP；旧式 SSE 需要替代传输或适配。
2. **Skill / CLI 路线**：发现路径包括项目 `.pi/skills/`、`.agents/skills/`，以及用户目录下的 `~/.pi/agent/skills/`、`~/.agents/skills/`，也可配置额外路径；项目资源受 project trust 控制。确保随附脚本、CLI、凭据、Linux 支持和授权流程可用，厂商给出的 Codex、Claude 或 OpenClaw 安装路径需要转换为 Pi 的配置。
3. **API 路线**：使用 coding-agent SDK 时，以 `ToolDefinition` 通过 `customTools` 或 `pi.registerTool()` 注册接口工具；若直接使用 agent-core，则采用其 `AgentTool` 接口。渠道适配器负责消息入口；两者都需要处理分页、限流、Token 刷新、错误、事件去重及结果回传。
4. **入口与工具分开**：微信/QQ 收消息的渠道适配器是用户入口，飞书/ima/地图等是执行工具，可以共享同一用户、任务和会话系统。

官方依据：[Pi MCP](https://github.com/earendil-works/pi/blob/v1.0.0/packages/coding-agent/docs/mcp.md)、[Pi Skills](https://github.com/earendil-works/pi/blob/v1.0.0/packages/coding-agent/docs/skills.md)、[Pi SDK](https://github.com/earendil-works/pi/blob/v1.0.0/packages/coding-agent/docs/sdk.md)、[官方 MCP SDK 示例](https://github.com/earendil-works/pi/blob/v1.0.0/packages/coding-agent/examples/sdk/14-codemode-mcp.ts)。

### 国内模型供应商

Pi v1.0.0 的[官方 Providers 表](https://github.com/earendil-works/pi/blob/v1.0.0/packages/coding-agent/docs/providers.md) 已列出 DeepSeek、Moonshot 中国/全球、Kimi For Coding、MiniMax 中国、Qwen Token Plan 中国、ZAI Coding Plan 中国、Ant Ling 和 Xiaomi MiMo 等接入。国内与全球端点、按量 API 与 Coding/Token Plan 应按供应商和套餐分别配置，不假定凭据通用；模型和套餐的实际使用范围仍需核验。

未内置的兼容端点可按 [models.json](https://github.com/earendil-works/pi/blob/v1.0.0/packages/coding-agent/docs/models.md) 配置。供应商接通说明可访问模型服务；工具调用、多模态和长任务表现仍需用所选模型实测，软件账号与资源仍由各连接器单独授权。

## 接入优先级

以下是实现建议，依据公开开放条件排列，不代表已经完成用户授权或接口联调。首轮可选择一个消息渠道、一个知识平台、一组地图与检索工具验证整条任务流程。

| 批次 | 候选服务 | 验收结果 |
| --- | --- | --- |
| 第一批：消息入口 | 微信或 QQ 选一个；若已使用企业微信/飞书，也可优先用其机器人 | 从手机创建任务、收到进度、完成审批、取回文件；确认后台主动通知条件 |
| 第一批：办公知识 | 飞书 CLI + Skills、腾讯文档、ima；按实际使用习惯选一到两个 | 授权后检索自己的资料、汇总并保存结果；验证资源范围、写入确认及 Token 失效处理 |
| 第一批：检索地图 | 博查或百度搜索，高德或百度地图 | 带来源的网页检索、地点路线查询；验证配额、超时与结果准确性 |
| 第二批：生活查询 | 携程问道；美团酒旅仅保留参考，等待可用外网授权路线 | 规划行程、比较查询结果、返回可用跳转；明确哪些步骤仍需到 App 完成 |
| 第二批：其他办公 | 语雀、企业微信、有道、WPS，按账户可用性选择 | MCP 传输、CLI 运行、个人/组织授权均验证后再启用 |
| 第三批：消费执行 | 瑞幸自提、滴滴（先沙箱）、美团跑腿、支付宝 Agent Pay、微信 AI 支付、京东 Clawtip | 核验平台准入及供给；展示金额与对象、用户确认后执行、查询状态，避免重试重复提交；滴滴生产须核实 Pro 与免密条件 |
| 按需：云与开发 | 云效、Gitee、CloudBase、各云厂商工具 | 为明确的个人开发/运维任务接入，限定资源与操作权限 |
| 暂不计入可直接复用 | 小红书/B站通用个人内容、淘宝/京东全品类购物、抖音未获准权限 | 取得对应官方准入或明确选择并验证社区路线后，再增加连接器 |

对个人 VPS 项目，接入速度主要取决于个人账号能否获权、授权是否能持续、Linux 运行依赖，以及实际操作范围；厂商是否有 MCP 只是其中一项。

## Skill 目录的使用原则

已检查 [skills.sh](https://skills.sh/) 和 [腾讯 SkillHub 企业专区](https://skillhub.cn/enterprise-zone)。这类目录适合发现资产，具体归属需要回到厂商仓库、官方发布页或发布者认证信息核对。

SkillHub 会同时出现目标厂商和第三方发布者。例如，描述里自称“美团官方”的红包技能，可能由个体商行发布；需要查看实际的 `publisher.certifiedName`，不能仅凭技能名判定它是美团出品。认证企业也可以发布其他平台的集成技能。

本清单只将官方证据支持的资产标为官方；本次没有安装上述业务技能或向它们配置用户凭据。
