# 可开发能力清单

整理日期：2026-10-02。适用范围：个人使用、独立 VPS、以 Pi 为执行核心的 Agent。

入选标准：远程业务服务有已核实的第一方接口或执行资产、明确的账号授权路线，以及可在 Pi/Linux 上实现的接入方案；本地日期数据与算法库有可审查的源码、来源和许可。开发范围以每行列出的具体功能为准。账号授权、费用和明确的申请条件列为前置条件；本清单尚未完成用户账号联调。社区与国际备用服务单独列明。

完整来源保留在 [生态调研记录](domestic-ecosystem.md)，新增日常查询的具体入口、费用和数据边界见 [日常查询接口清单](daily-query-apis.md)，本文件作为开发范围的主清单。

已取得的源码、Skills、发布包、数据和 API 文档见 [本地资源索引](../resources/ecosystem/INDEX.md)，目前合计 78 项资产。归档状态仅代表文件完整性，实际运行还需要依赖安装、账号授权和 Pi 适配。

## 个人账号可开发的连接器

| 平台 | 开发功能 | 采用的接入路线 | 前置条件与边界 |
| --- | --- | --- | --- |
| [微信](https://github.com/Tencent/openclaw-weixin/blob/main/docs/protocol_zh_CN.md) | 首版消息入口：与 Agent 对话、提交任务、查询状态；逐步增加媒体 | 按官方公开协议实现 Pi 渠道适配器，见 [接入方案](weixin-channel.md) | 扫码授权；官方插件依赖 OpenClaw，不能直接装到 Pi。后台通知条件在联调中验证，范围限官方消息通道 |
| [QQ](https://bot.q.qq.com/wiki/agent-qqbot/) | 机器人消息入口、任务结果回传 | 官方 Agent/机器人 API，自己实现 Pi 渠道层 | 个人主体或快捷接入，按所选路径取得消息权限和完成平台要求 |
| [飞书](https://github.com/larksuite/cli) | 文档、表格、多维表格、消息、日历、任务等授权内操作 | 官方 CLI + Skills；可选自部署 MCP | 应用配置、用户 OAuth、资源权限；默认采用 CLI 路线 |
| [腾讯文档](https://docs.qq.com/scenario/open-claw.html?nlc=1) | 文档、表格、幻灯片及文件管理 | 官方 Skill + mcporter，或验证后直连其 MCP | QQ/微信扫码 Token；Node.js、Bash；部分能力有会员/额度要求 |
| [腾讯 ima](https://ima.qq.com/agent-interface) | 笔记搜索/读写、知识库检索、文件与网页导入 | 官方 Skill 的 Node.js 脚本或直接 API 工具 | Client ID + API Key，限定本人授权的笔记与知识库 |
| [语雀](https://github.com/yuque/yuque-mcp-server) | 个人知识库和文档读取、搜索、写入 | 官方 MCP，配合个人知识库 Skills | 个人 Token 和知识库权限；采用当前可用的个人功能 |
| [有道云笔记](https://mopen.163.com/doc/) | 查询授权账号下的笔记 | 官方 SSE MCP，桥接到 Pi 支持的传输 | 平台 API Key、对应注册手机号；需实现或配置 SSE 桥接 |
| [高德地图](https://lbs.amap.com/api/mcp-server/gettingstarted) | 地点搜索、路线、公交地铁换乘，公交线路/站点和首末班查询 | 官方 MCP + 公交 REST | Web 服务 Key 与配额；公交资料是高级服务，认证个人有体验配额。线路首末班不代替中途站时间；未核实实时到站 |
| [百度地图](https://github.com/baidu-maps/mcp) | 地点、路线及地图查询 | 官方 MCP 的常规开发者 AK 路线 | 开发者 AK、配额及所用功能权限 |
| [博查](https://github.com/BochaAI/bocha-search-mcp) | 国内网页搜索、时效过滤、带来源的检索结果 | 官方 MCP 或直接 API | API Key、账户额度 |
| [百度搜索](https://github.com/baidubce/skills/blob/develop/skills/baidu-search/SKILL.md) | 网页检索和来源收集 | 官方 Skill 或直接 HTTP API | API Key、服务开通、账户余额 |
| [智谱搜索](https://docs.bigmodel.cn/cn/guide/tools/web-search) | 独立网页检索、域名及时间过滤 | 官方 Web Search HTTP API | 平台 API Key、服务权限和余额；编程套餐 MCP 单独分级，不混用 Key |
| [和风天气](https://dev.qweather.com/) | 实况、小时/日预报、短时降水、空气质量、预警、日出日落 | 官方 OpenAPI + Pi HTTP 工具 | 个人开发者、专属 Host，推荐 JWT；优先新 v1 路线，按价格组共享免费阶梯并计费，遵守来源标注 |
| [彩云天气](https://docs.caiyunapp.com/weather-api/mcp.html) | 实况、小时/日预报；直接日预报 API 取得日出日落 | 官方 HTTP/stdio MCP 或 API | 开发者 Key 与对应套餐；分钟降水和独立太阳 v3 限企业，预警需付费权限 |
| [飞常准](https://ai.variflight.com/docs/tripmatch) | 火车站、火车时刻与余票、机票报价、航班动态、空铁中转 | 官方 Tripmatch / Aviation HTTP MCP，或 stdio 包 | 个人自助注册和 Key，按积分计费；最新 Tripmatch 支持具体站与城市两种查询，票价/余票为查询快照，不含出票付款 |
| [快递100](https://github.com/kuaidi100-api/kuaidi100-user-skill) | 物流轨迹、个人授权订单查询、时效估算 | 官方个人 Skill / 查询 Skill，封装只读 Pi 工具 | 小程序个人用户 Key 与平台 Key 分开；部分运单需手机号验证。原始 Node MCP 需适配日志及依赖后部署 |
| [瑞幸咖啡](https://open.lkcoffee.com/mcp) | 查门店、选商品和规格、预览优惠、创建自提订单、查取餐码、取消订单 | 官方 Streamable HTTP MCP + My Coffee Skill | 个人账号 Token；到店自取，用户扫码付款 |
| [滴滴出行](https://mcp.didichuxing.com/api.md) | 价格预估、叫车、查单、司机位置、取消 | 官方 Streamable HTTP MCP；先开发沙箱流程 | 个人 MCP Key；生产直接叫车须 Pro 权限生效、实名认证和免密支付 |
| [携程问道](https://www.ctrip.com/wendao/openclaw) | 旅行问答、行程规划、机酒火车票查询与比较 | 官方 Skill、Node.js API 调用 | `WENDAO_API_KEY` 与对应额度；当前开发范围为查询和规划 |
| [腾讯云 OCR](https://github.com/TencentCloud/tencentcloud-ocr-skills) | 图片文字、表格、证照、发票识别 | 官方 Skills、脚本或腾讯云 SDK | 开通所用 OCR API、云身份与调用额度 |

消息入口与执行工具可以组合。例如，从微信发送需求，由搜索和知识库工具处理，再将文档成果回传同一会话。每个消息平台的媒体展示、通知窗口和文件限制分别联调。

## 本地查询与国际备用

| 资源 | 开发功能 | 来源与条件 |
| --- | --- | --- |
| [holiday-cn](https://github.com/NateScarlet/holiday-cn) + 国务院通知 | 工作日、调休、节假日和工作日数量 | MIT 社区年度数据，按官方通知核对，不是政府 API；无 Key，未知年份返回未公布，不推断公司排班 |
| [lunar-typescript](https://github.com/6tail/lunar-typescript) | 公农历转换、闰月和二十四节气 | MIT 社区本地算法库；无 Key、不联网，明确中国时区；不推算未来调休 |
| [Frankfurter v2](https://frankfurter.dev/) | 人民币和外币参考汇率、历史换算 | 国际第三方央行数据服务，公共 API 无 Key，另有项目 MCP 和开源后端；显示日期和来源，不当作实时交易价 |
| [Open-Meteo](https://open-meteo.com/) | 基础天气、小时/日预报、日出日落备用 | 非国内服务，官方 SDK/API；免 Key 托管服务仅非商业且有限额，商业需订阅，VPS 网络待验证 |

## 已归档但暂不启用

美团酒旅的官方 Skill `1.0.1` 和 CLI `0.0.4` 已保存为参考资产。下载后的实物核验发现：主 Skill 要求 Passport 用户授权，嵌入授权 Skill 明确限定美团内网，公开 ZIP 还缺少安装器要求的 `mtuser-pt-passport-*.tgz`。主 Skill 未提供公开 Developer Key 备用路线，因此从普通个人 VPS 可开发主清单中移出；取得可用的外网授权方案后再评估。公开业务 CLI 本身不能补齐授权条件。

证据见 [官方认证发布包](https://api.skillhub.cn/api/v1/download?slug=meituan-trip&namespace=org-tzvk0vz3&version=1.0.1) 与 [本地资源清单](../resources/ecosystem/catalog-parts/life.json)。这项修正只针对本次酒旅 Skill 路线，不代表美团所有开放接口都不可用。

本轮新增的社区 12306 MCP、旧 Tripmatch GitHub 包、快递鸟和智谱 Coding Plan 搜索 MCP 也只作为参考。分别因非官方网页接口、版本落后、个人准入未落实或产品用途尚待确认，不放入开发主路径。来源与依据见 [日常查询接口清单](daily-query-apis.md)。

## 有组织账号时可开发

| 平台 | 开发功能 | 明确的接入路线和条件 |
| --- | --- | --- |
| [企业微信](https://github.com/WecomTeam/wecom-cli) | 消息入口，文档、日程、待办、智能表格等办公操作 | 企业微信账号、官方 Linux CLI + Skills；机器人使用长连接和 Bot 凭据。主动推送限最近对话过的单聊/群聊 |
| [钉钉](https://github.com/open-dingtalk/dingtalk-mcp) | 机器人入口、事件、授权内办公工具 | 组织应用 Client ID/Secret 和权限；官方 MCP + Stream SDK |
| [WPS 365](https://open.wps.cn/documents/app-integration-dev/mcp-server/introduction) | 授权范围内的云文档、表格、日历等办公功能 | 已归档官方 Linux CLI；官方远程 MCP 另有[对接指南](https://open.wps.cn/documents/app-integration-dev/mcp-server/use-guide)。需企业试用、自建应用凭据、对应权限、用户授权与管理员批准；当前项目未接通或实测账号 |

## 按需开发的云和代码连接器

这些项目已有明确接口，按实际持有的资源选择接入，沿用平台资源权限和计费规则。

| 平台 / 产品 | 开发范围 | 接入路线 |
| --- | --- | --- |
| [Gitee](https://gitee.com/oschina/mcp-gitee) | 仓库、文件、Issue、PR 和通知 | 官方 MCP + 个人 PAT |
| [阿里云云效](https://github.com/aliyun/alibabacloud-devops-mcp-server) | Codeup、工作项、流水线、制品和测试 | 官方 MCP + 组织 PAT/资源权限 |
| [CloudBase](https://github.com/TencentCloudBase/CloudBase-AI-Toolkit) | 数据库、云函数、存储、托管、日志和部署 | 官方 MCP/Skills + 云身份和环境 ID |
| 阿里云 [CloudOps](https://github.com/aliyun/alibaba-cloud-ops-mcp-server)、[SLS](https://github.com/aliyun/aliyun-sls-agent-skills)、[DMS](https://github.com/aliyun/alibabacloud-dms-mcp-server) | 云资源管理、日志查询、数据库查询及授权内变更 | 对应官方 MCP/Skills/CLI，配置 RAM/IAM 权限和目标资源 |
| [火山引擎](https://github.com/volcengine/mcp-server)、[华为云](https://github.com/huaweicloud/huaweicloud-skills)、[七牛云](https://github.com/qiniu/qiniu-mcp-server) | 官方工具覆盖的存储、计算、网络、监控等资源操作 | 各自已核实的 MCP/Skills，按具体工具配置 SDK/CLI 和云身份 |
| [GitCode / AtomGit](https://docs.gitcode.com/docs/apis/)、[CODING](https://help.coding.net/openapi) | 仓库、Issue、PR、项目和开发协作 | 官方 API + 自写 Pi 工具，使用个人/项目 Token 或 OAuth |

## Agent 自身需要开发的功能

- Pi SDK 会话和模型接入；显式加载与初始化官方 MCP 扩展，按所选工具曝光方式加载 codemode / tool search。国内模型按官方已支持的供应商配置，并验证所选模型的工具调用表现。
- 网页工作台：任务、执行状态、批准请求、成果和连接器授权状态。
- 持久化目标与后台任务：调度、暂停、取消、重试、重启恢复和结果通知。
- 个人记忆：有来源的偏好和资料，支持查看、纠错、删除。
- 执行权限与审计：动作、对象、金额和参数绑定批准，保存外部操作回执，处理重复提交。
- VPS 持久化文件、受控命令/浏览器执行环境、凭据管理和数据备份。

这些是本项目在 Pi 上实现的功能，具体设计见 [Muse 与 Pi 项目方案](muse-and-pi.md)。

## 首版建议

已选微信作为首版消息入口。先完成微信文字收发与 Pi SDK 会话，再实现网页工作台和持久化后台任务，接入一家搜索服务、一家地图服务、和风天气与实际使用的知识平台。日期工具可本地实现，票务与快递在个人 Key 到位后加入；执行功能增加瑞幸自提，并完成滴滴沙箱流程，生产叫车在账号条件满足后启用。

首版组合：微信 + 博查/百度/智谱中一家搜索服务 + 高德或百度地图 + 和风天气 + 本地日历 + 飞书/腾讯文档/ima 中实际使用的平台。后续加入飞常准、快递100、瑞幸自提与滴滴沙箱；QQ 等渠道保留为可选连接器。

每个连接器完成授权和联调后，按真实可用功能启用。开发清单中的接口和账号路线已核实，具体账号的额度、资源范围和生产操作结果仍以联调为准。
