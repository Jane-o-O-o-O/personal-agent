# 本地生态资源索引

由 `scripts/sync_ecosystem.py` 生成。状态表示归档完整性，不表示已授权或可在 Pi 中直接运行。

| 资源 | 来源性质 | 类型 | 本地文件 | 固定版本 / 提交 | 使用条件 |
| --- | --- | --- | --- | --- | --- |
| Alibaba Cloud AIOps Skills | 官方发布 | skill-source | [文件](upstream/aliyun-aiops-skills/d22aa735c7e5/) | `d22aa735c7e5` | 云身份与所选 CLI 插件 |
| Alibaba CloudOps MCP | 官方发布 | mcp-source | [文件](upstream/aliyun-cloudops-mcp/ab1ad07332ac/) | `ab1ad07332ac` | RAM 云身份与资源权限；Python >=3.10、uv |
| Alibaba Cloud DevOps MCP | 官方发布 | mcp-source | [文件](upstream/aliyun-devops-mcp/4afff3fecd1c/) | `4afff3fecd1c` | 组织 PAT 与资源权限 |
| Alibaba Cloud DMS MCP | 官方发布 | mcp-source | [文件](upstream/aliyun-dms-mcp/f8e1ae32a52a/) | `f8e1ae32a52a` | 云身份、登记的数据源与 DMS 权限；Python、uv |
| Alibaba Cloud SLS Skills | 官方发布 | skill-source | [文件](upstream/aliyun-sls-skills/66a65f7d2c9b/) | `66a65f7d2c9b` | aliyun-cli、插件与云身份 |
| 高德公交站点线路与首末班 REST 官方文档 | 官方发布 | docs | [文件](upstream/amap-bus-inquiry-rest-docs/d6eec1951a78/) | `d6eec1951a78` | 高级服务接口；官网明确已完成个人或企业认证的用户均有每日体验配额，更多调用需按平台政策购买或申请。使用 Web 服务 Key。 |
| 高德地图 CLI Skill | 官方发布 | skill-bundle | [文件](upstream/amap-cli-skill/439c4623f36a/) | `439c4623f36a` | 使用地图时需高德 Web JS API Key；部分账号还需 JS API 安全密钥。归档不需凭据。 |
| 高德地图 GUI CLI 官方发布包 | 官方发布 | cli-package | [文件](upstream/amap-gui-cli-package/edc8e699c6f7/) | `1.0.3` | 高德 Web JS API Key（AMAP_KEY），按账号要求提供 AMAP_SECURITY_KEY。归档不需凭据。 |
| 高德地图 MCP 官方发布代码 | 官方发布 | mcp-package | [文件](upstream/amap-maps-mcp-package/a9a639dbd609/) | `0.0.8` | 高德地图 Web 服务 API Key，通过 AMAP_MAPS_API_KEY 配置。归档不需凭据。 |
| 高德地图 MCP 官方接入文档 | 官方发布 | docs | [文件](upstream/amap-mcp-getting-started/4a7989a7a1cc/) | `4a7989a7a1cc` | 文档公开；调用服务需要高德开放平台 Key。 |
| 高德公交与地铁路径规划 REST 官方文档 | 官方发布 | docs | [文件](upstream/amap-transit-rest-docs/603cb9243c57/) | `603cb9243c57` | 高德开放平台 Web 服务 Key；个人认证与相应调用配额。公开文档归档不需凭据。 |
| Baidu Maps MCP | 官方发布 | mcp-source | [文件](upstream/baidu-maps-mcp/aca9b2892411/) | `aca9b2892411` | 开发者 AK、配额及功能权限 |
| Baidu Maps CLI Skills | 官方发布 | skill-source | [文件](upstream/baidu-maps-skills/1c2a4225496b/) | `1c2a4225496b` | 地图 AK 与所选功能权限 |
| Baidu Search Skill | 官方发布 | skill-source | [文件](upstream/baidu-search-skill/fc458c27fe4c/) | `fc458c27fe4c` | BAIDU_API_KEY、服务开通与账户余额 |
| Bocha Search MCP | 官方发布 | mcp-source | [文件](upstream/bocha-search-mcp/285bf4064a33/) | `285bf4064a33` | API Key 与账户额度 |
| 彩云天气官方认证与 API 版本文档 | 官方发布 | docs | [文件](upstream/caiyun-weather-auth-docs/1eef54217f59/) | `1eef54217f59` | 公开文档；使用自己的 Token 或 App Key + App Secret 签名，凭据位置按 v2.6/v3 具体版本确定。 |
| 彩云天气官方套餐与个人开发准入文档 | 官方发布 | docs | [文件](upstream/caiyun-weather-billing-docs/5709d22ec39b/) | `5709d22ec39b` | 官方向个人开发者/小项目推荐按量购买，稳定项目可用包月；具体价格、QPS、免费赠送额度和 API 权限需登录个人管理平台核对。 |
| 彩云逐日天气与日出日落 API 正文 | 官方发布 | docs | [文件](upstream/caiyun-weather-daily-api-docs/d7b450535edc/) | `d7b450535edc` | 自己的 API 凭据；预报天数由套餐决定，超出上限按套餐上限返回。 |
| 彩云天气官方 MCP 接入文档 | 官方发布 | docs | [文件](upstream/caiyun-weather-mcp-docs/962c7ada6813/) | `962c7ada6813` | 公开文档；服务需个人注册、自己的彩云 API Key 和对应套餐权限。 |
| 彩云天气官方 MCP 源码 | 官方发布 | mcp-source | [文件](upstream/caiyun-weather-mcp-source/cbbdd7c29f46/) | `cbbdd7c29f46` | 注册彩云开发平台并申请自己的 API Key，套餐决定QPS、预报长度与接口权限；本地环境变量 CAIYUN_WEATHER_API_TOKEN。归档不需凭据。 |
| 国务院2026年节假日安排官方通知 | 官方发布 | docs | [文件](upstream/china-holiday-notice-2026/0b9d4b2b0736/) | `0b9d4b2b0736` | 公开政府通知，无需账号；只作全国假期与调休的原始依据。 |
| CloudBase Skills | 官方发布 | skill-source | [文件](upstream/cloudbase-skills/0009869f0cd8/) | `0009869f0cd8` | 云身份、环境 ID 与资源权限 |
| CloudBase AI Toolkit | 官方发布 | mcp-source | [文件](upstream/cloudbase-toolkit/b34004bc2fa3/) | `b34004bc2fa3` | 云身份或 OAuth、环境 ID 与资源权限 |
| CODING 官方完整 OpenAPI 规范 | 官方发布 | docs | [文件](upstream/coding-openapi-spec/4464a3266cbb/) | `353b949e0b60` | 公开规范归档不需账号；调用需团队上下文及 OAuth、个人访问令牌或项目令牌，相应 API 权限。 |
| 携程问道官方 AI Travel Assistant Skill | 官方发布 | skill-bundle | [文件](upstream/ctrip-wendao-skill/2dffb6a1444b/) | `1.0.1` | 通过携程官方页面申请 WENDAO_API_KEY，确认账号额度和计费。 |
| 滴滴 MCP Server 官方 API 文档 | 官方发布 | docs | [文件](upstream/didi-mcp-api/81dc99dc7ec5/) | `81dc99dc7ec5` | 公开开发文档，无需登录；接口调用需要个人 MCP Key。 |
| 滴滴出行官方 Ride Skill | 官方发布 | skill-bundle | [文件](upstream/didi-ride-skill-official/eaaaf96d4e60/) | `eaaaf96d4e60` | 已注册滴滴个人账号激活 DIDI_MCP_KEY；生产直接叫车另需 Pro 权限生效、实名认证与免密支付。 |
| 滴滴官方 Skills 开发指南 | 官方发布 | docs | [文件](upstream/didi-skills-guide/547ca43b3ac5/) | `547ca43b3ac5` | 公开文档，无需登录。 |
| DingTalk MCP 官方说明仓库 | 官方发布 | docs | [文件](upstream/dingtalk-mcp/12a87ec7c999/) | `12a87ec7c999` | 组织应用 Client ID/Secret 与资源权限 |
| DingTalk MCP 官方 npm 发布代码 | 官方发布 | mcp-package | [文件](upstream/dingtalk-mcp-package/7dd9da218e8f/) | `1.1.21` | 组织应用 Client ID/Secret 与对应资源权限；按工具场景配置机器人 Code、Access Token、Agent ID。 |
| DingTalk Stream SDK for Node.js | 官方发布 | sdk-source | [文件](upstream/dingtalk-stream-sdk/e7fe301d9afd/) | `e7fe301d9afd` | 组织应用与消息权限 |
| Feishu CLI and Skills | 官方发布 | cli-source | [文件](upstream/feishu-cli/7beffb086d7f/) | `7beffb086d7f` | 应用配置、用户 OAuth 与资源权限 |
| Lark OpenAPI MCP | 官方发布 | mcp-source | [文件](upstream/feishu-mcp/21920354ec6e/) | `21920354ec6e` | 应用与用户授权、资源权限 |
| Frankfurter参考汇率 API 后端开源代码 | 社区项目 | api-source | [文件](upstream/frankfurter-api-source/71334f73e9e6/) | `71334f73e9e6` | 公共 API 无需 Key；自托管后端需要 Ruby/容器环境、SQLite持久化与数据回填，部分上游来源的 Key 为各自独立条件。 |
| Frankfurter项目远程 MCP 接入文档 | 社区项目 | docs | [文件](upstream/frankfurter-mcp-docs/9e7b445ab54b/) | `9e7b445ab54b` | 项目提供 https://mcp.frankfurter.dev/ 远程 HTTP MCP，不要求注册或 API Key。 |
| Frankfurter v2参考汇率公开 OpenAPI | 社区项目 | docs | [文件](upstream/frankfurter-openapi/2f3e6a4012b8/) | `2f3e6a4012b8` | 公共 HTTPS JSON API，无需注册或 Key；实际网络可达性与运行状态需在目标 VPS 验证。 |
| GitCode / AtomGit 官方中文 OpenAPI 全部正文 | 官方发布 | docs | [文件](upstream/gitcode-openapi-docs/bd89ce6d8265/) | `bd89ce6d8265` | API 文档公开，归档不需账号；调用 API 需 GitCode 个人访问令牌及相应资源权限。 |
| GitCode / AtomGit 官方产品说明及反馈仓库 | 官方发布 | docs | [文件](upstream/gitcode-openapi-docs-source/91f04108c2f6/) | `91f04108c2f6` | 公开文档归档不需账号；调用 API 需 GitCode 个人访问令牌及相应仓库权限。 |
| Gitee MCP 官方完整源码 | 官方发布 | mcp-source | [文件](upstream/gitee-mcp-source/2c585e26c368/) | `2c585e26c368` | Gitee 个人访问令牌；构建本地服务器需 Go 1.23.0 或以上。归档不需令牌。 |
| 中国节假日社区 JSON / ICS 数据与抓取源码 | 社区项目 | data-source | [文件](upstream/holiday-cn-data/159faa58969f/) | `159faa58969f` | 本地数据查询无需账户和网络；年度更新需读取国务院公开通知并核对社区转换结果。 |
| Huawei Cloud Skills | 官方发布 | skill-source | [文件](upstream/huaweicloud-skills/651f29808f5f/) | `651f29808f5f` | IAM 身份、KooCLI/SDK 与资源权限 |
| 腾讯 ima 官方 Skills | 官方发布 | skill-bundle | [文件](upstream/ima-skills/7e0d07cae0f9/) | `1.1.10` | 从 ima 官方接入页取得 IMA_OPENAPI_CLIENTID 和 IMA_OPENAPI_APIKEY，限定本人授权的笔记与知识库。 |
| 快递鸟官方快递查询 API 文档（准入待核实） | 官方发布 | docs | [文件](upstream/kdniao-track-api-docs/86c68f324290/) | `86c68f324290` | 需商户 EBusinessID、AppKey、认证及相应查询产品权限；本轮未确认普通个人可完成开通的当前条件；仅供参考，未启用 |
| 快递100官方 Node.js stdio MCP 源码 | 官方发布 | mcp-source | [文件](upstream/kuaidi100-mcp-nodejs/18d2d8d5031a/) | `18d2d8d5031a` | KUAIDI100_API_KEY 必填；Node.js >=18。注册、试用额度和生产套餐以快递100平台实际开放条件为准。 |
| 快递100官方物流查询 Skill | 官方发布 | skill-bundle | [文件](upstream/kuaidi100-query-skill/f694d1e9f364/) | `f694d1e9f364` | 官方查询 Skill 声明无 Key 限额模式；正式额度与 KUAIDI100_API_KEY 需在平台确认，当前企业注册页不能证明所有个人都可取得企业权限。 |
| 快递100个人用户版官方 Skill 与 API 客户端 | 官方发布 | skill-bundle | [文件](upstream/kuaidi100-user-skill/a1099fb2bbed/) | `a1099fb2bbed` | 用户自行在微信快递100小程序『我的 → API KEY → 申请』取 KUAIDI100_USER_API_KEY；Python >=3.7 与 requests。服务端订单和物流查询需此 Key。 |
| My Coffee 瑞幸咖啡官方 Skill | 官方发布 | skill-bundle | [文件](upstream/luckin-coffee-skill/5b079e6c52bc/) | `0.8.4` | 瑞幸个人账号登录开放平台创建 Token；运行时配置 LUCKIN_MCP_TOKEN。 |
| 农历与二十四节气 TypeScript 本地计算库 | 社区项目 | library-source | [文件](upstream/lunar-typescript-calendar/f086189a0b15/) | `f086189a0b15` | 本地日期计算无需账户、Key或网络，库没有第三方运行依赖；采用固定版本并记录上游MIT许可。 |
| 美团酒旅官方 ht-ai-open CLI 发布包 | 官方发布 | cli-package | [文件](upstream/meituan-trip-cli/01aca48b4eed/) | `0.0.4` | 公开 npm 发布包，无需登录即可下载；业务调用仍需要有效 Passport 用户 Token；仅供参考，未启用 |
| 美团酒旅官方 Skill | 官方发布 | skill-bundle | [文件](upstream/meituan-trip-skill/5dfdf6eb48ed/) | `1.0.1` | 主 Skill 要求美团 Passport 用户授权与 MEITUAN_HT_TOKEN；公开包的授权依赖未满足普通 VPS 条件，须取得厂商可用的外网授权路线后启用；仅供参考，未启用 |
| Open-Meteo 官方天气 OpenAPI 规范（非国内备用） | 官方发布 | api-spec | [文件](upstream/open-meteo-forecast-openapi/512e29bca2af/) | `512e29bca2af` | 公开规范；免费API免Key仅非商业，商业需订阅客户端点。 |
| Open-Meteo 官方免费及商业服务边界 | 官方发布 | docs | [文件](upstream/open-meteo-pricing-docs/6075ce8fae66/) | `6075ce8fae66` | 公开文档；免费开放API仅非商业，600次/分钟、5000次/小时、10000次/天、300000次/月，以现行条款为准。 |
| Open-Meteo 官方 TypeScript SDK（非国内备用） | 官方发布 | sdk-source | [文件](upstream/open-meteo-typescript-sdk/0f51db2cc12c/) | `0f51db2cc12c` | 免费托管天气 API 免 Key，仅非商业；商业订阅使用自己的客户 API Key。 |
| Pi Agent Harness | 官方发布 | agent-source | [文件](upstream/pi/a13d35a742c6/) | `a13d35a742c6` | 模型供应商凭据；Node.js >=22.19 |
| Qiniu MCP Server | 官方发布 | mcp-source | [文件](upstream/qiniu-mcp/52dd33532655/) | `52dd33532655` | AK/SK、资源权限；Python >=3.12、uv |
| QQ Bot channel and Skills | 官方发布 | channel-source | [文件](upstream/qq-channel/a730701d36aa/) | `a730701d36aa` | 个人主体或快捷 Agent 接入，完成平台要求 |
| 和风天气官方 API 文档与 OpenAPI 源码 | 官方发布 | api-docs-source | [文件](upstream/qweather-api-docs-source/bdbf57c82fa7/) | `bdbf57c82fa7` | 支持个人开发者。调用需控制台创建项目、专属 API Host 和 JWT/Key；推荐 Ed25519 JWT。天气和基础服务当前共享每月前 50,000 次免费阶梯，超额继续按量计费，以控制台最新价格为准。 |
| 腾讯文档官方 Skill | 官方发布 | skill-bundle | [文件](upstream/tencent-docs/c8c8e6c05fe3/) | `1.0.41` | 从官方接入页经 QQ 或微信扫码取得 TENCENT_DOCS_TOKEN，使用本人获授权的文档资源。 |
| Tencent Cloud OCR Skills | 官方发布 | skill-source | [文件](upstream/tencentcloud-ocr-skills/5fd00ca70b61/) | `5fd00ca70b61` | 云身份、开通 OCR API 与调用额度 |
| 12306 MCP 社区查询源码参考（非官方开放 API） | 社区项目 | mcp-source | [文件](upstream/train-12306-mcp-community-reference/ff6439da6f63/) | `ff6439da6f63` | 公开源码可归档；上游为 12306 网页业务接口，不是个人开发者可申请的官方 API 服务契约。默认不启用；仅供参考，未启用 |
| 飞常准 Aviation MCP 官方源码 | 官方发布 | mcp-source | [文件](upstream/variflight-aviation-mcp-source/e1b5f73b78c5/) | `e1b5f73b78c5` | 公开个人开发者注册路径，公司和手机号可选；登录控制台创建 API Key，官网当前写明新用户 50 元体验额度。运行时按调用计费。 |
| 飞常准 MCP 官方工具表与协议配置文档资产 | 官方发布 | docs | [文件](upstream/variflight-mcp-official-docs-component/0fef264ddc95/) | `0fef264ddc95` | 公开文档无需账号；实际 MCP 需要个人开发者平台 Key 和可用额度。 |
| 飞常准个人开发者注册表单官方证据 | 官方发布 | docs | [文件](upstream/variflight-mcp-official-register-evidence/c31abc8a8344/) | `c31abc8a8344` | 公开注册表单证据无需账号。用户名、邮箱和密码必填，公司名称与手机号没有必填要求。 |
| 飞常准开放平台官方接入与个人注册文案资产 | 官方发布 | docs | [文件](upstream/variflight-mcp-official-site-text/932058ffdee6/) | `932058ffdee6` | 公开网页资产；文案显示公司和电话可选、邮箱激活后自助创建 API Key，新用户现有 50 元体验额度。 |
| 飞常准开放平台官方数据服务条款资产 | 官方发布 | docs | [文件](upstream/variflight-mcp-official-terms/9a275346de4d/) | `9a275346de4d` | 公开条款无需账号，实际注册和调用受当时条款约束。 |
| 飞常准 Tripmatch MCP 官方旧仓库参考 | 官方发布 | mcp-source | [文件](upstream/variflight-tripmatch-mcp-old-source/b10abc8e48d2/) | `b10abc8e48d2` | 公开仓库参考无需凭据；调用业务需要飞常准平台 API Key；仅供参考，未启用 |
| 飞常准 Tripmatch MCP 官方 1.1.0 发布代码 | 官方发布 | mcp-package | [文件](upstream/variflight-tripmatch-mcp-package/1d2cdc0d5c62/) | `1.1.0` | 个人开发者注册、邮箱激活、创建平台 API Key；公开注册表单公司名称可选。调用按积分计费，现有新用户体验额度以官网为准。 |
| Volcengine MCP Servers | 官方发布 | mcp-source | [文件](upstream/volcengine-mcp/ad78d1c29b7f/) | `ad78d1c29b7f` | 云身份与所选服务依赖 |
| WeCom CLI and Skills | 官方发布 | cli-source | [文件](upstream/wecom-cli/c4b9b6610c7c/) | `c4b9b6610c7c` | 企业微信账号；机器人 Bot ID/Secret 按场景配置 |
| OpenClaw Weixin Channel | 官方发布 | channel-source | [文件](upstream/weixin-channel/24de5c9eb0dd/) | `24de5c9eb0dd` | 用户扫码授权 |
| WPS 365 CLI 官方文档与安装器 | 官方发布 | docs | [文件](upstream/wps365-cli/945a1d6f8df5/) | `945a1d6f8df5` | 企业账号、自建应用与管理员审批 |
| WPS 365 CLI v0.3.6 官方 SHA-256 清单 | 官方发布 | docs | [文件](upstream/wps365-cli-checksums/15dee93f52f8/) | `v0.3.6` | 公开发布校验清单，无需登录。 |
| WPS 365 官方 Linux x86_64 CLI 发布包 | 官方发布 | cli-package | [文件](upstream/wps365-cli-linux-x86-64/68b955a8488e/) | `v0.3.6` | 企业账号、自建应用与管理员批准；配置 WPS365_CLIENT_ID/SECRET，并按业务需要进行应用身份或用户设备码授权。 |
| 有道云笔记 MCP 官方工具文档 | 官方发布 | docs | [文件](upstream/youdao-note-mcp-docs/137fc1bd9582/) | `137fc1bd9582` | 注册网易智能开发者平台取得 API Key，通过 x-api-key 请求头使用；当前仅授权注册手机号下的有道云笔记内容。 |
| Yuque MCP Server | 官方发布 | mcp-source | [文件](upstream/yuque-mcp/757a408c29cb/) | `757a408c29cb` | 个人 Token、知识库权限 |
| Yuque ecosystem Skills | 官方发布 | skill-source | [文件](upstream/yuque-skills/2959228ad3e8/) | `2959228ad3e8` | 个人 Token、知识库权限；部分 Skills 依赖 MCP |
| 智谱 Coding Plan官方联网搜索 MCP 文档 | 官方发布 | docs | [文件](upstream/zhipu-coding-search-mcp-docs/edd17b9e036c/) | `edd17b9e036c` | GLM Coding Plan 专属搜索 MCP；个人/团队编程套餐按相应入口获取 API Key。团队套餐 Key 与平台其他 Key 不通用，用途及额度需确认；仅供参考，未启用 |
| 智谱官方独立 Web Search API 定义 | 官方发布 | docs | [文件](upstream/zhipu-web-search-api-docs/14e531619b7a/) | `14e531619b7a` | 智谱平台 API Key、服务权限与额度，按当前搜索引擎价格计费；不等同 Coding Plan 套餐 Key。 |

## 接入限制

- **Alibaba Cloud AIOps Skills**：完整归档官方集合，优先选取与 SLS 分析相关的 Skills。集合还覆盖 ECS、IAM、迁移等服务；按具体 Skill 核实依赖和资源权限，归档集合不自动扩大已选择的开发范围
- **Alibaba CloudOps MCP**：stdio MCP。底层资源计费，云变更需本项目批准
- **Alibaba Cloud DevOps MCP**：官方 MCP，优先验证远程 Streamable HTTP。只操作本人有权访问的组织资源
- **Alibaba Cloud DMS MCP**：官方 MCP。查询与变更权限分开，写入与工单按项目批准策略处理
- **Alibaba Cloud SLS Skills**：官方日志查询和分析 Skills。SLS 存储、写入、查询按产品规则计费
- **高德公交站点线路与首末班 REST 官方文档**：为 Pi 实现 bus/stopname、bus/stopid、bus/linename、bus/lineid 查询工具；线路详情使用 extensions=all，解析站点、线路方向、首末班与 timedesc。公交及地铁线路查询不等于实时车辆位置或下一班到站数据。 线路 start_time/end_time 不能当成中途站到站时间；遇缺失时间、临时运营变更应保留未知状态与来源。 保存真实公开文档，不是完整服务端代码；未调用需要 Key 的业务端点。
- **高德地图 CLI Skill**：可参考 SKILL.md 为 Pi 提供地图 CLI 操作说明；配套 CLI 为 @amap-lbs/amap-gui。须适配其中读取 OpenClaw 配置的步骤。官方 ZIP 只有 SKILL.md 和 macOS 附属文件，不含 CLI 开发源码；地图容器使用 Electron，普通无图形界面的 VPS 不能直接显示地图。
- **高德地图 GUI CLI 官方发布包**：Pi 工具可在具备图形运行环境的机器调用 amap-gui，输出结构化 JSON；与归档的 amap-cli-skill 配套。这是含 SKILL.md、README、Electron dist 和地图图片资产的 npm 发布包；dist 使用混淆，不是完整开发源码。须另外安装依赖并具备 Electron 显示环境，尚未运行或验证 VPS 无头部署。
- **高德地图 MCP 官方发布代码**：可通过 Pi MCP 扩展以 stdio 接入；官方同时推荐 https://mcp.amap.com/mcp?key=... 的 Streamable HTTP 服务。npm 包包含 build/index.js、package.json、README.md，是公开发布的可读 JavaScript 代码，不是完整 TypeScript 开发仓库。调用仍依赖高德服务、Key、账户配额和服务条款。
- **高德地图 MCP 官方接入文档**：文档包含官方 Streamable HTTP 端点、stdio npm 包、AMAP_MAPS_API_KEY 和接入配置，供 Pi MCP 配置适配使用。静态 HTML 快照保存接入正文和官方配置；页面样式和图片可能仍引用线上地址，配额及最新政策需查官网。
- **高德公交与地铁路径规划 REST 官方文档**：封装 /v3/direction/transit/integrated 为 Pi HTTP 工具，提供日期、预计出发时刻、换乘策略，并保留线路与上车站首末班等真实返回字段。已归档本地高德 MCP 0.0.8 未暴露 date/time，且过滤首末班字段；需要 REST 适配器补充，不能假定远程 MCP 与旧包相同。 start_time/end_time 为线路首末班；station_start_time/station_end_time 为上车站字段，仅在实际返回时展示；不能推算任意中途站的末班到站时刻。 路径时长是行程估算，不是实时车辆/列车到站倒计时。尚未注册 Key 或发送业务查询。
- **Baidu Maps MCP**：采用常规开发者 MCP 路线。文档检索 MCP 与地图业务 MCP 分别配置
- **Baidu Maps CLI Skills**：官方 CLI Skill 作为 MCP 外的可选路线。该仓库只有 README.md 与 SKILL.md，不包含 CLI 实现源码或独立脚本；实际 CLI 运行条件按 Skill 核实，地图 MCP 源码另行归档
- **Baidu Search Skill**：加载搜索 Skill 或包装官方 HTTP API。只提取已筛选的搜索 Skill，同时保留仓库根许可证和说明
- **Bocha Search MCP**：官方 MCP 或依据源码包装 HTTP API。调用按实际套餐计费
- **彩云天气官方认证与 API 版本文档**：据此开发直接 API 客户端，避免将 MCP 的 X-Caiyun-API-Key 认证方式直接套到所有天气 HTTP API。v2.2-v2.5 已停止维护、v1 已标记 deprecated；应使用 v2.6 或 v3。文档没有赋予任何具体 API 访问权限，生产权限和商用范围仍按账号套餐条款核对。
- **彩云天气官方套餐与个人开发准入文档**：作为 Pi 天气连接器的预算、权限和请求频率依据；无需购买企业套餐即可研究普通实时和逐小时/日天气接法。不承诺固定免费额度、单价或全部接口；分钟降水和独立太阳接口为企业增值，预警不适用于免费赠送额度。公开计费页不是完整数据商用许可，商用产品上线前需核对平台条款。
- **彩云逐日天气与日出日落 API 正文**：直接 HTTP JSON 工具可保留日预报、降水概率、AQI、生活指数和 result.daily.astro 日出日落，补充官方 MCP 目前省略的字段。逐日预报文档空间分辨率9-13km，由小时数据聚合，并非单街道实测；请求路径经度在前、纬度在后，响应 location 顺序相反。不要将独立太阳 v3 企业增值接口混作本个人路线。
- **彩云天气官方 MCP 接入文档**：按官方 Streamable HTTP 端点配置 Pi MCP，使用 X-Caiyun-API-Key 请求头；本地 uvx mcp-caiyun-weather 走 stdio，不要求 OpenClaw。归档的是含接入正文的 HTML，远程天气服务不会随文档部署。官方页面的72小时/7天工具说明不替代实际套餐权限；没有申请 Key 或实测 tools/list。
- **彩云天气官方 MCP 源码**：官方 Python stdio MCP 可接 Pi；也可使用官方托管 Streamable HTTP MCP。工具包括当前天气和空气质量、逐小时、逐日、过去24小时及预警。源码 MIT 不是数据商用授权；未安装或执行。日预报请求7天但按套餐实际返回，小时参数上限360不等于账号权限。本地代码返回英文格式化文本，没有分钟降水或日出日落工具。预警须付费权限；缺失 alert 被代码视为无预警，需在项目层区分权限不足。历史工具传 begin，尚未与当前 API 文档联调。
- **国务院2026年节假日安排官方通知**：保存官方 HTML 快照，用于核对2026年度 JSON；本地工具记录来源与年度，不把通知网页称为 API。不是完整日历或政府 JSON API；其他年份需各自的已发布通知。 本通知不表示企业、学校或个人一定按此排班。
- **CloudBase Skills**：按需选择官方开发与部署 Skills。归档不执行部署或资源创建
- **CloudBase AI Toolkit**：官方 MCP Toolkit。云资源和超额调用计费，变更需本项目批准
- **CODING 官方完整 OpenAPI 规范**：OpenAPI 3.0 YAML 包含认证、Scope、请求路径和模型定义，可据此生成客户端或封装为 Pi HTTP 工具。这是官方公开 API 规范，不是 CODING 后端源码或现成 MCP 实现。文档首页为 JavaScript 页面，归档其声明的完整 YAML，避免仅保存页面壳。团队权限和接口配额仍由服务端控制。
- **携程问道官方 AI Travel Assistant Skill**：完整保存官方 SKILL.md、scripts/wendao_query.js 和分发元数据；可封装 Node.js 查询脚本为 Pi 工具，凭据通过环境变量注入。分发版本为 1.0.1，包内 SKILL.md 仍标记 1.0.0；原样记录两者。 当前范围为旅行问答、机酒火车票查询、比较与行程规划；未核实自主提交订单或付款接口。 认证发布包可公开获取，包内未声明通用开源许可证；不得因此假定可任意重新分发修改版本。 未申请 Key 或执行账号联调。
- **滴滴 MCP Server 官方 API 文档**：用于实现 MCP 传输、工具参数、返回结果和订单状态处理；开发端点为 https://mcp.didichuxing.com/mcp-servers-sandbox?key=YOUR_MCP_KEY。公开文档不是 MCP 服务端开源代码；保存抓取时的快照与来源。 生产端点与沙箱端点分开；归档过程不发送业务请求。
- **滴滴出行官方 Ride Skill**：完整保存官方 SKILL.md、references、assets 与许可证；按第一方 API 文档接 Pi Streamable HTTP MCP，首先使用 mcp-servers-sandbox 调试端点。官方 Skill 使用 OpenClaw 配置、消息和 cron 命令，需改由 Pi 项目的凭据、渠道和任务调度实现。 Skill 内 mcp-dev.didichuxing.com 等环境配置须与当前官方 API 文档交叉核对；本项目默认以官网沙箱端点为准。 Beta 返回唤端链接；生产创建订单会产生真实叫车与费用，必须确认车型、起终点和价格。 未激活账号或执行沙箱、生产联调。
- **滴滴官方 Skills 开发指南**：保存官方 GitHub 与 ClawHub 发布归属证据及出行流程参考。原安装示例依赖 OpenClaw、clawhub，归档不代表已在 Pi 中安装或运行。
- **DingTalk MCP 官方说明仓库**：参考官方接入说明，实际 MCP 实现另归档 dingtalk-mcp-package 发布包。公开仓库只有 README，无 MCP 实现源码；发布包为编译 JavaScript，用户与组织权限需要联调
- **DingTalk MCP 官方 npm 发布代码**：包内 dist/cli.js 使用 stdio MCP；后续在受控目录安装固定版本与依赖，通过 Pi MCP 启动，按 ACTIVE_PROFILES 限定需要的办公工具。公开 GitHub 仓库只有 README，不能视为 MCP 实现源码；此 npm 包包含编译 JavaScript、类型声明、Markdown 资源和工具 YAML，共 36 文件，不含完整 TypeScript src。 npm 包未包含运行时 node_modules；后续运行仍需安装 package.json 声明的依赖，归档过程不安装。 DingTalkMCPServer.js 原始实现会在 stderr 打印请求 Headers 与 Body，头部可能含访问 Token；启用前须审查并处理日志脱敏。 厂商发布代码保持原样；尚未启动 MCP 或完成组织账号联调。
- **DingTalk Stream SDK for Node.js**：参考出站长连接实现消息与事件适配器。SDK 不是完整 Pi 渠道，仍需开发会话与任务映射
- **Feishu CLI and Skills**：优先使用官方 CLI 与随附 Skills。以授权账号的实际资源与工具权限为准
- **Lark OpenAPI MCP**：按需自部署 MCP，确认所用传输。这是 CLI 之外的可选路线；不采用将逐步下线的个人托管链接
- **Frankfurter参考汇率 API 后端开源代码**：优先包装 https://api.frankfurter.dev/v2 的币种对和历史汇率工具；指定 providers=ECB 或保存 expand=providers，展示返回日期和参考汇率性质。源码可用于后续自托管。第三方项目汇集央行数据，不是中国央行或商业银行官方 API；默认汇率混合多个来源。 工作日参考价不是实时交易、现钞或刷卡结算价，数据许可需遵循各原始提供者。 公开后端源码不代表独立 mcp.frankfurter.dev 服务的完整源码；未部署自托管实例。 只读公共 API 查询已得到 CNY/USD 的2026-10-01结果，未验证所有国内 VPS 网络或所有历史区间。
- **Frankfurter项目远程 MCP 接入文档**：按照页面的远程 HTTP 配置接 Pi MCP 扩展；先验证 initialize 与 tools/list 后限定只读汇率工具。本条是项目维护方文档，项目归类community；不是央行官方 MCP。 只归档接入文档，未执行 MCP 连接或验证工具列表，不称为本地服务器源码。
- **Frankfurter v2参考汇率公开 OpenAPI**：依据 OpenAPI 结构化定义包装 rates、rate、currencies、providers、coverage；只开放参考汇率查询与金额换算。文档版本与后端发布版本独立记录；公共服务没有在本项目验证生产 SLA。 查询结果按原始数据日期展示，不填充虚假的今日实时汇率。
- **GitCode / AtomGit 官方中文 OpenAPI 全部正文**：根据本地认证、参数、响应及全部中文端点文档实现 HTTP 客户端和 Pi 工具。包括仓库、提交、文件、Issue、Pull Request、组织、用户和企业等 API；不是现成 MCP。Remote only：本条保存 sitemap 当前列出的 368 个中文 API 正文 HTML 快照及 sitemap，不是后端服务代码或原始 OpenAPI JSON。样式、动态示例切换及图片可能仍引用线上资产。入口仓库只有产品说明，不能替代本正文归档。中文正文示例使用 api.gitcode.com，生产接入需验证最新服务地址、权限和配额。
- **GitCode / AtomGit 官方产品说明及反馈仓库**：本仓库仅作为产品说明、许可和官方反馈来源保留；开发 HTTP 工具应使用另行归档的 docs.gitcode.com API 正文，不能依据本仓库实现接口。此固定提交只有产品使用 README 和用户协议等 9 个文件，不包含 OpenAPI 规范、端点正文或后端服务代码；不是官方 API 文档站源码。官网及仓库名已显示 AtomGit 品牌；接口接入需以实际服务和最新 API 文档验证。
- **Gitee MCP 官方完整源码**：可构建本地 stdio MCP 服务器后接入 Pi；也可配置官方 https://api.gitee.com/mcp，并携带 Authorization: Bearer 个人访问令牌。源码为固定提交快照，包含 main.go、go.mod、operations、文档和 MIT LICENSE。Gitee ZIP 下载对客户端 User-Agent 返回不同内容，因此通过官方 Git 获取后归档。尚未构建或执行；仓库/Issue/PR 的读写、工具白名单与令牌范围需项目层控制。
- **中国节假日社区 JSON / ICS 数据与抓取源码**：使用固定版本年度 JSON 与 JSON Schema，开发本地 is_workday、next_holiday、count_workdays 工具；保留 papers 来源，按 Asia/Shanghai 计算。社区数据不是中国政府开放 API，也不包含公司的实际排班。 days 不是全年日历；先应用调休例外，未命中日期仍需使用周末规则，相邻年份通知可能影响跨年日期。 未发布年份返回未公布，不能自动猜测放假安排；不让每次用户查询依赖 GitHub/CDN。
- **Huawei Cloud Skills**：按需选择官方云服务 Skills。具体安装脚本、质量遥测与依赖须在启用所选 Skill 前审阅
- **腾讯 ima 官方 Skills**：复用根目录及 notes、knowledge-base 的 SKILL.md 和 Node.js 脚本，或依据 references/api.md 实现 Pi API 工具；最低 Node.js 18。本次采用第一方接入页当前发布的 1.1.10；SkillHub 最新版本字段为 1.1.9，认证发布者信息来自其结构化 API。 API Key 需用户提供；实际资源范围、额度和有效期仍需账号联调。 ima_api.cjs 首次每日调用会检查版本，遇到更新可能返回 -200 并暂停原请求；未来适配时需处理。 ZIP 附带 __MACOSX、.DS_Store 和 .history 杂项，归档不执行其中任何文件。
- **快递鸟官方快递查询 API 文档（准入待核实）**：作为备用物流HTTP连接器参考，归档页给出 RequestType=8002、JSON请求、DataSign签名与HTTPS正式地址；满足准入后再封装只读查询。本条仅参考，不作为已可用的个人连接器；公开文档与免费注册不能证明账号开通全部快递和配额。 顺丰非快递鸟渠道单号按CustomerName字段传寄件人/收件人手机后四位；不同公司的字段语义不同。 旧1002即时查询资料与8002新查询产品不可混用，也不沿用旧500次描述宣称新账号配额。 保存可读官方HTML；官网语雀文档入口本轮未获取正文，未下载RAR示例或伪造官方MCP源码。
- **快递100官方 Node.js stdio MCP 源码**：Pi 支持 stdio MCP，可参考 TypeScript query_trace、estimate_time、estimate_time_with_logistic、estimate_price 工具定义；部署前在项目适配层修正协议日志并固定依赖。index.ts 连接后写普通 stdout 日志，可能干扰 MCP 帧；package.json 包含同名包自依赖，需要审查后才运行。 源码调用远程 api.kuaidi100.com/stdio，开源不等于物流数据服务免费。 phone 描述与官方查询 Skill 不完全一致，以所用 API 文档及业务响应为准。 只归档源码，未构建、安装或带 Key 运行。
- **快递100官方物流查询 Skill**：保留 SKILL.md 与 Node.js 标准库 script/kuaidi100.js；后续包装 queryTrace、autoNumber、estimatePrice、estimateTime 等 HTTPS 查询为 Pi 工具。此资源提供第一方客户端脚本，不是快递100物流后端源码。 无 Key 时脚本传字符串 null；免费额度没有明确数值或生产 SLA，未执行实际运单请求。 顺丰速运、顺丰快运、中通按 Skill 要求传 phone；不得假定所有接口仅需手机后四位。 查询脚本用 URL 参数带 Key、单号及手机号，本项目包装时需隐藏敏感 URL 并设置超时和错误处理。 包内未核实通用开源许可证；保存原始公开资产不意味着任意改写分发许可。
- **快递100个人用户版官方 Skill 与 API 客户端**：保存 SKILL.md、Python 客户端和 references；后续仅包装 queryUserOrders、trackShipment 等只读账户查询，凭据通过运行时环境注入。个人 USER_API_KEY 与企业/stdio 的 KUAIDI100_API_KEY 不能推定互换；个人 API 主机为 p.kuaidi100.com。 无 Key 模式不能读取服务器个人物流，只能使用有限接口与本地缓存。 文档当前写明每分钟10次、每天100次、每用户最多3个有效密钥，不外推至其他产品或将来套餐。 完整包包含预下单、取消和地址缓存代码；本轮只归档，不执行，不默认启用写操作，也不导入个人地址。 包内未核实通用开源许可证；OpenClaw 的配置和缓存目录要在 Pi 产品层另行实现。
- **My Coffee 瑞幸咖啡官方 Skill**：保留原始指令型 Skill，通过 Pi MCP 接入 https://gwmcp.lkcoffee.com/order/user/mcp 的 Streamable HTTP 服务；订单批准和媒体回传在产品层实现。发布包包含 SKILL.md、manifest.json、CHANGELOG.md 和 LICENSE，无独立执行脚本或 MCP 服务端源码。 仅到店自取，不支持外送；用户自行扫码付款，不能视为自动扣款。 下单前确认门店与商品，执行价格预览；位置必须来自用户，VPS 出口 IP 不代表用户位置。 许可证为 CC BY-ND 4.0，保留官方原包和署名，不分发改写版本。 未登录账号或执行真实订单联调。
- **农历与二十四节气 TypeScript 本地计算库**：只包装Solar/Lunar公农历转换、闰月与getJieQiTable/getNextJieQi/getPrevJieQi节气日期；输入按Asia/Shanghai定义，不依赖VPS默认时区。社区算法库不是官方天文接口，不代表国务院未来调休安排；工作日计算另用已发布通知和holiday-cn。 完整源码还包含民俗占卜模块，仅保存原始库，不将这些模块开放为个人Agent工具。 本轮未安装或运行；后续接入需核对闰月、跨年和接近午夜的日期边界。
- **美团酒旅官方 ht-ai-open CLI 发布包**：保留 package.json 与 dist/index.js 供审查官方 CLI 参数和输出，授权可用后再安装固定版本并封装 Pi 查询工具。这是编译后的 CLI 发布代码，不含 src 源码；未确认公开源代码仓库。 下载该 CLI 不能补齐 meituan-passport-user-auth 缺失的授权安装包或内网条件。 归档不执行 npm 安装或 CLI 业务请求。
- **美团酒旅官方 Skill**：归档主 Skill、嵌入的 meituan-passport-user-auth、scripts/auth.sh 与元数据；授权可用后通过官方 @meituan-travel/ht-ai-open CLI 封装查询工具。嵌入授权 Skill 明确写明仅支持美团内网，外网无法访问 npm registry 和授权接口；主 Skill 未提供 Developer Key 备用路线。 授权 install.sh 查找本地 mtuser-pt-passport-*.tgz，但公开 ZIP 不包含该安装包；公共 npm 的 @mtuser/pt-passport 返回 404。 可获取官方发布资产不等于已验证个人 VPS 可运行；本条仅作为参考资产归档。 查询仅使用官方业务 CLI；范围限查询、旅行规划与业务跳转，不包括外卖、跑腿或支付。 包内未声明通用开源许可证，保留发布者与原始内容。 未执行安装脚本、Passport 授权或业务查询。
- **Open-Meteo 官方天气 OpenAPI 规范（非国内备用）**：依据官方 OpenAPI3.1 构建结构化 Pi HTTP 工具：温度、体感、降水概率、风、日出日落；输入 WGS84，经纬度分别提供，使用指定时区。固定2026-09-28仓库提交的规范快照，不含服务端部署；网格精度随地区和模型变化，不能把全球模型或 CMA 字样当作中国1km覆盖保证。
- **Open-Meteo 官方免费及商业服务边界**：作为备用天气工具的预算与许可依据；区分免Key服务、订阅客户端点、CC BY4.0天气数据和代码许可证。免费 API 无SLA；大量变量、长时间、多地点/模型可能计作多个调用，不是每HTTP请求固定一次。商业服务需要订阅客户Key，国内网络和服务可用性尚未验证。
- **Open-Meteo 官方 TypeScript SDK（非国内备用）**：使用官方 fetchWeatherApi 客户端封装 Pi 工具，或直接请求官方 JSON API。中国坐标可查基础天气、逐小时/逐日、日出日落；不将社区 MCP 标为官方。SDK MIT 不代表免费托管服务可商用；数据 CC BY4.0 要求归因，服务受公平使用限制。欧洲/北美服务器，国内 VPS 可达性、延迟未联调；并非中国地面观测站实测或官方中国天气预警源。
- **Pi Agent Harness**：首版通过 coding-agent SDK 嵌入。框架源码参考，不代表项目应用已部署；pi-durable 为独立实验性组件
- **Qiniu MCP Server**：stdio MCP。底层存储、流量和处理计费
- **QQ Bot channel and Skills**：参考官方消息协议与 Skills，开发 Pi 渠道层。OpenClaw 宿主相关配置、提醒和定时功能需要适配
- **和风天气官方 API 文档与 OpenAPI 源码**：依据官方 OpenAPI 实现 Pi HTTP 工具：天气、小时/日预报、空气质量、天气预警、日出日落和中国短时降水。本次未确认官方 MCP；归档中文 API、认证、计费、许可正文和规范，不运行网站构建脚本。此 MIT 仓库为开发文档源码，不是气象服务端或天气数据的免费授权。新天气优先 weather/v1，空气质量用 airquality/v1；v7/air 已于 2026-06-01 停服，公共域名自2026年起迁移至专属 Host。API Key 将于 2027-01-01 限量。允许商用须遵守许可和来源标注，GeoAPI 地理信息不能缓存或索引；真实凭据和网络可用性尚未联调。
- **腾讯文档官方 Skill**：归档完整 SKILL.md、references、脚本和模板；在 Pi 中复用 Skill 并配置 Node.js、Bash 和 mcporter，或依据文档开发直接 MCP 工具。Token 生命周期和四个 MCP 服务的握手、工具范围仍需用户账号联调。 部分功能有会员、积分或额度要求。 公开下载地址没有版本号，归档时记录实际 ZIP 的 SHA256 和 SKILL.md 版本。 归档不执行 setup.sh、安装依赖或登录。
- **Tencent Cloud OCR Skills**：官方 Skills、Python 脚本或腾讯云 SDK。按所用 OCR 接口计费
- **12306 MCP 社区查询源码参考（非官方开放 API）**：仅研究 stdio/HTTP MCP 查询包装、站点索引、余票票价与经停站解析；个人 Agent 主路径使用有公开 Key 准入的查询服务。初始化抓取 12306 网页、站名 JS 和 Cookie，解析网站查询路径，并调用 kyfw.12306.cn/search.12306.cn 的网页端点；不能标成官方开放 MCP。 MIT 授权社区代码，不授予铁路数据自动化访问权或上游 SLA；字段、Cookie、反自动化规则可能变化。 未见应用级全局限频或显式请求超时；不作为高频监票默认实现，不绕过验证码或限流。 工具只有查询，没有已核实的购票、锁票、订单支付；只保存原样代码和 LICENSE，不安装、不启动、不发生产查询。
- **飞常准 Aviation MCP 官方源码**：Pi 优先接 https://ai.variflight.com/servers/aviation/mcp 的 Streamable HTTP，使用 X-API-Key 头；本地官方包 @variflight-ai/variflight-mcp 支持 stdio，凭据用 VARIFLIGHT_API_KEY 环境变量。实际源码覆盖航班动态、直飞/中转、逐舱位机票报价、机场天气、准点率和机尾号实时位置，不含订票、锁价、订单支付、改签或退票。 package.json 与 server 元数据为 1.1.0，README 仍写 1.0.3；固定提交原样保存。 仓库与包声明 ISC，但所查目录没有独立 LICENSE 文件；数据服务另受厂商条款约束，不应把插件许可视为数据再分发许可。 本地包请求内部数据 API 使用 X-VARIFLIGHT-KEY，远程 MCP 使用 X-API-Key，两种接法不得混淆。未创建账号、运行包或发送业务查询。
- **飞常准 MCP 官方工具表与协议配置文档资产**：保存实际工具列表、参数、积分单价、远程 URL、X-API-Key 头和 stdio 配置，配合官网文案资产理解接入。官网为 JavaScript 应用，HTML 页面壳不含正文；这是网页实际发布的只读 JS 文档组件，不是 MCP 服务端代码或可离线运行的整站。 文档旧工具参数与最新 Tripmatch npm 包存在差异，服务接入以实际 tools/list schema 为准；单价与开放政策以后续官网公示为准。 只归档公开文件，不执行前端应用或发需要凭据的业务请求。
- **飞常准个人开发者注册表单官方证据**：用来区分普通个人开发者自助 Key 路线和企业商务 API，后续取得凭据必须由用户自行注册并保管。保存官方公开页面组件，不创建账号、不提交表单、不接受条款、不生成或导出 Key。 公开自助流程存在不等于已验证用户账号能开通所有工具；实际权限以后续登录验证为准。
- **飞常准开放平台官方接入与个人注册文案资产**：保留中文开发者文档正文、产品范围、注册资格、计费说明、数据安全与隐私文案，作为选择官方 MCP 的准入证据。网页入口 JS 含运行库和页面文案，不是纯 Markdown 文档，也不是厂商后端源码；只读归档，不执行。 实际账号开通、体验余额、限流及工具权限未登录验证。
- **飞常准开放平台官方数据服务条款资产**：保存服务能力、按量计费、数据准确性及自身产品展示授权说明，区分开源插件许可与服务数据使用权。平台允许自身产品/业务调用并展示结果；未经书面许可不能转售、再分发或公开发布查询数据，不允许超出正常使用频率抓取。 如果后续向其他用户开放 Agent，需核对数据分发权限；当前个人自用方向与自主订票是不同能力。 归档不表示已接受条款或发生外部账号变更。
- **飞常准 Tripmatch MCP 官方旧仓库参考**：仅用于追溯官方旧版工具与内部 HTTP 调用，不用于首版直接安装；实际集成优先使用当前远程 MCP 或另行归档的 1.1.0 官方发布包。GitHub master 自 2025-05-29 的固定提交只含旧发布 dist 和 README，无完整 TypeScript 源码；npm 当前已为 1.1.0。 package 版本 0.0.2，内部 config/server 仍标 0.0.1；旧版火车站/城市语义和参数不应套用当前版本。 README 和 package 声明 ISC，但没有独立 LICENSE 文件。原样保留作为 reference-only。
- **飞常准 Tripmatch MCP 官方 1.1.0 发布代码**：首选 https://ai.variflight.com/servers/tripmatch/mcp 的 Streamable HTTP，X-API-Key 认证；也可将官方 stdio 包封装到 Pi MCP。1.1.0 包已提供明确的 searchTrainTicketsByStation、searchTrainTicketsByCity、searchTrainStations、机票报价及空铁中转工具。1.1.0 发布包含 dist 可读 JS、声明文件、README 和 package.json，不含完整 TypeScript 开发源码。 新包火车查询使用 from/to/date，分别支持具体站与城市；官网旧表仍写 searchTrainTickets(from_city,to_city,date)。远程 schema 以后续实际 tools/list 为准。 火车余票、票价及机票售价是查询时快照，需附查询时间；以最终售票渠道为准，不包含自动下单、锁票、出票或支付。 包声明 ISC 但未附独立 LICENSE 正文；厂商数据条款单独适用。未安装、启动或执行业务查询。
- **Volcengine MCP Servers**：按需选择官方 MCP 服务器。完整保存官方集合，实际启用的工具仍限所选资源
- **WeCom CLI and Skills**：Linux CLI 与 Skills；消息机器人长连接。需要组织账号；主动推送限最近对话过的单聊/群聊
- **OpenClaw Weixin Channel**：移植官方 HTTP/CDN 协议，开发独立 Pi 渠道适配器。现成插件依赖 OpenClaw；单聊通道；后台主动通知待账号联调
- **WPS 365 CLI 官方文档与安装器**：参考官方文档与安装器，实际 Linux x86_64 发布包另归档。公开仓库只有文档、安装器和图片，没有 CLI 实现源码；发布包为编译二进制。不据此宣称所有个人 WPS MCP 已可用
- **WPS 365 CLI v0.3.6 官方 SHA-256 清单**：固定记录官方 CLI 发布包校验值，用于后续 VPS 部署前核验。公开清单包含多平台文件；本项目当前只归档 Linux x86_64 发布包。
- **WPS 365 官方 Linux x86_64 CLI 发布包**：供后续 Linux x86_64 VPS 使用；确认校验值后安装到受控工具目录，包装官方 CLI，按场景限制命令和资源权限。tar.gz 仅包含已编译 wps365-cli 二进制，不包含 Go 实现源码；公开 GitHub 仓库目前仅有文档、安装器和图片。 官方下载 CDN 的实际 SHA-256 与 GitHub release digest、官方 checksums-sha256.txt 一致。 仅适用于 Linux x86_64 目标；不能直接用于当前 macOS 或 Linux ARM64。 CLI 首次运行会从官方 CDN 获取 spec，业务调用也需要访问 WPS 服务；归档不代表已经配置离线命令定义。 未执行安装器或二进制，未创建应用、登录或调用业务接口。
- **有道云笔记 MCP 官方工具文档**：官方远程地址 https://open.mail.163.com/api/ynote/mcp/sse 使用 legacy SSE，需兼容的 stdio/Streamable HTTP 桥接器后接入 Pi。文档含创建、目录、内容读取、搜索、剪藏、最近收藏等工具输入输出。Remote only：未核实公开的有道 MCP 服务端源码或完整官方 Skill 包；本条归档实质工具文档 HTML，不是服务端代码。Pi 当前不原生支持 legacy SSE；授权和写入操作需后续联调。
- **Yuque MCP Server**：官方 MCP。只启用已授权的个人知识库功能
- **Yuque ecosystem Skills**：按需选择个人知识库 Skills。团队版 yuque-group 暂时下线，团队统计不在当前开发范围
- **智谱 Coding Plan官方联网搜索 MCP 文档**：技术上可用 Streamable HTTP https://open.bigmodel.cn/api/mcp/web_search_prime/mcp 与 Authorization Bearer 接 Pi；工具名 webSearchPrime。普通个人产品优先独立 Web Search API。不能把专属编程套餐 MCP 当作人人已有权限的通用免费服务；产品用途、套餐和条款需另行确认。 旧SSE入口不是本项目Pi默认路线；归档仅为公开接入文档，不含MCP服务端源码。 未订阅套餐或执行带 Key MCP 联调。
- **智谱官方独立 Web Search API 定义**：直接 HTTP 包装 POST https://open.bigmodel.cn/api/paas/v4/web_search；参数和返回结构在 Markdown 内嵌 OpenAPI 中，保留标题、URL、摘要及时间。独立搜索 API 不要求使用智谱聊天模型；搜索引擎与过滤参数兼容性各不相同。 官方文档不是搜索服务端源码；当前 SDK 文档所链 GitHub 仓库返回404，未以其他 SDK 冒充可下载源码。 搜索所得天气、票价等不等于业务查询实时结果；未取得 Key 或执行付费调用。
