# OpenViking 控制面 — MCP Server + CLI

OpenViking 控制面（topapi）的 MCP Server **与** CLI —— 用于管理 OV 库
（`Collection`）。两个前端共用同一套核心（`client.py`），新增一个能力即可同时被 MCP
和 CLI 使用。

覆盖 14 个库生命周期、计费、用户管理与数据空间 Action：

| Action | MCP tool | CLI 命令 |
|---|---|---|
| `ListOpenVikingCollections` | `list_collections` | `ov-cp list` |
| `CreateOpenVikingCollection` | `create_collection` ⚠️ | `ov-cp create` |
| `GetOpenVikingCollection` | `get_collection` | `ov-cp get <rid>` |
| `UpdateOpenVikingCollection` | `update_collection` | `ov-cp update <rid>` |
| `DeleteOpenVikingCollection` | `delete_collection` ⚠️ | `ov-cp delete <rid>` |
| `GetOpenVikingUsage` | `get_usage` | `ov-cp usage <rid>` |
| `GetOpenVikingCollectionUserAccess` | `get_collection_api_key` | `ov-cp api-key <rid>` |
| `ListOpenVikingCollectionUser` | `list_collection_users` | `ov-cp user list <rid>` |
| `RegisterOpenVikingUser` | `register_collection_user` | `ov-cp user register <rid> <uid>` |
| `UpdateOpenVikingUser` | `update_collection_user` | `ov-cp user update <rid> <uid>` |
| `DeleteOpenVikingUser` | `delete_collection_user` ⚠️ | `ov-cp user delete <rid> <uid>` |
| `ListOpenVikingAccounts` | `list_collection_accounts` | `ov-cp account list <rid>` |
| `CreateOpenVikingAccount` | `create_collection_account` | `ov-cp account create <rid> <account-id>` |
| `DeleteOpenVikingAccount` | `delete_collection_account` ⚠️ | `ov-cp account delete <rid> <account-id>` |

`user *` 系列管理企业版库的多用户，要求 AgentPlan key **与目标库已关联**。`user list`
返回的用户 `ApiKey` 是**掩码**，取指定用户的明文数据面 key 使用
`api-key <rid> --user-id <uid>`。新注册用户的角色固定为 `user`；`user update`
当前只支持重生 API Key。

`account *` 系列管理企业版库的数据空间：它是用户、凭证、记忆、资源、会话与技能的
一级隔离边界。已发布后端在省略 `--account-id` 时使用数据空间 `default`，因此存量用法
保持不变。所有支持数据空间的接口都在请求体中以 `OpenVikingAccountID` 传递该范围。
新建数据空间时会自动添加其 `default` 管理员用户。OpenVikingAccountID 长度为 1-64 个
字符，只能包含 ASCII 字母、数字、`_`、`.`、`@`、`-`；不能以 `_` 开头，不能等于 `.`
或 `..`，且至多包含一个 `@`。单库配额由后端配置（当前默认 100）。删除数据空间会不可逆
地级联删除其中所有内容；`default` 不可删除。将 `account list` 返回的 `CreateTime` 视为
后端不透明时间戳字符串。

## 端点

控制面 TopAPI 接口已编译进 OpenViking **数据面集群**，每个 Action 由数据面网关在如下路径提供：

```text
{endpoint}/api/openviking/{Action}
# 默认 endpoint：https://api.vikingdb.cn-beijing.volces.com/openviking
# 完整 URL 例：https://api.vikingdb.cn-beijing.volces.com/openviking/api/openviking/ListOpenVikingCollections
```

Action 在 **path** 里（不走 `?Action=&Version=` query）。请求体是该 Action 的参数（如
`{"ResourceID": "..."}`）。

> 默认 endpoint 指向**预留**的公网数据面网关（尚未对外开放）。本地/联调时用
> `--endpoint` / `VIKING_ENDPOINT` 指向一个 `kubectl port-forward`，例如
> `http://localhost:18080`。

## 鉴权

唯一方式：**Ark AgentPlan ApiKey**，作为 `Authorization: Bearer <key>` 头随每个请求发送
（后端 `authorizeControlPlaneByArk` 只认 Bearer，**不兼容 `X-API-Key`**）。鉴权是可插拔的
（`common/auth.py` → `BearerTokenAuth`），后续要换 AK/SK 签名时只需替换这一处。

> ⚠️ `create` 等写接口要求账号已**开通 AgentPlan 抵扣**，否则返回 `ProductUnordered`；
> 操作已有库时还可能要求 AgentPlan key 已与目标库关联。

### 配置

| 项 | 环境变量 | CLI 参数 | 默认 |
|---|---|---|---|
| 控制面 endpoint（base URL） | `VIKING_ENDPOINT` | `--endpoint` / `-e` | `https://api.vikingdb.cn-beijing.volces.com/openviking` |
| AgentPlan ApiKey | `AGENTPLAN_API_KEY` | `--api-key` / `-k` | —（必填） |
| 默认 project | `OPENVIKING_PROJECT` | `--project` | `default` |
| 额外请求头 | `VIKING_EXTRA_HEADERS` | `--header` / `-H`（可重复） | — |

`VIKING_EXTRA_HEADERS` 是逗号分隔的 `Key: Value` 列表；`--header` 每次带一对、可重复
（CLI 优先于环境变量）。两者合并后加到每个请求上，常用于泳道路由，例如
`-H 'x-tt-env: <swimlane>'`。`Authorization`、`Content-Type` 为受保护头，不可覆盖。

## CLI 用法

```bash
uv sync                      # 或：pip install -e .

# 把 key 用环境变量配一次，之后免传参
export AGENTPLAN_API_KEY=ark-xxxxxxxx

# 只读
uv run ov-cp list
uv run ov-cp get   <ResourceID>
uv run ov-cp usage <ResourceID>
uv run ov-cp usage <ResourceID> --account-id team-alpha
uv run ov-cp usage <ResourceID> --user-id alice  # default 数据空间内的用户
uv run ov-cp usage <ResourceID> --account-id team-alpha --user-id alice
uv run ov-cp api-key <ResourceID>
uv run ov-cp api-key <ResourceID> --user-id alice
uv run ov-cp api-key <ResourceID> --account-id team-alpha
uv run ov-cp api-key <ResourceID> --account-id team-alpha --user-id alice

# 建库（消耗付费配额；固定使用 AgentPlan 模型路径和已配置的 AgentPlan key，
#       不开放模型来源、模型参数、模型鉴权与 OpenViking 镜像版本）
uv run ov-cp create --name my_kb

# 建企业版库（容量更高，按企业版费率计费）
uv run ov-cp create --name my_kb --version enterprise

# 计费方式（--pay-type）：库由谁付钱——与 --version 正交（--version 只决定费率）。
# 不传时默认 agentplan_personal（用账号的个人版 AgentPlan 做 AFP 抵扣）；
# volc_pay（火山官网按量，费用计入火山账号账单）必须显式指定。⚠️ 企业版席位 key
# 不要依赖默认值（账号没有个人版套餐时抵扣会失败、库被停用），请显式传
# agentplan_enterprise + --seat-id。
uv run ov-cp create --name my_kb                       # 等价于 --pay-type agentplan_personal
uv run ov-cp create --name my_kb --pay-type volc_pay
uv run ov-cp create --name my_kb --version enterprise \
  --pay-type agentplan_enterprise --seat-id seat-2026xxxx
# --seat-id：付费的企业版席位，需自行从方舟控制台「席位管理」页复制——
# 服务端不校验席位是否存在，填错要到下一个小时抵扣时才暴露（届时库被停用）。

# 更新库可变字段（只改传入的字段）；也用于切换计费方式 / 换绑席位
uv run ov-cp update <ResourceID> --description "新描述"
uv run ov-cp update <ResourceID> --pay-type volc_pay
# 覆盖该库的 AgentPlan 模型凭证（VLM 与 Embedding 共用同一把 key），
# 库里其它凭证按原样重放，不受影响
uv run ov-cp update <ResourceID> --model-api-key ark-xxxxxxxx
# 不带 --model-api-key 时不会发送任何模型配置。若控制面仍在每次更新时重建模型，
# `update` 会读回该库自身的凭证重放一次，并在响应 Note 中说明；除 AgentPlan 外，
# 没有 ApiKeyID 的凭证无法重放，此时更新会被拒绝而不是猜测。

# 管理企业版库的用户（key 需与该库已关联）
uv run ov-cp user list     <ResourceID>
uv run ov-cp user list     <ResourceID> --account-id team-alpha --role user --page 1 --limit 20
uv run ov-cp user register <ResourceID> alice --account-id team-alpha
uv run ov-cp user update   <ResourceID> alice --account-id team-alpha --regenerate-key
uv run ov-cp user delete   <ResourceID> alice --account-id team-alpha --yes

# 管理企业版库的数据空间（Account）
uv run ov-cp account list   <ResourceID> --keyword team --page 1 --limit 20
uv run ov-cp account create <ResourceID> team-alpha
uv run ov-cp account delete <ResourceID> team-alpha  # 级联删除前会要求确认

# 删库（不可逆）
uv run ov-cp delete <ResourceID> --yes
```

默认的 `--output auto` 在 stdout 连接终端时使用 Rich 结构化视图：
库/用户/数据空间列表显示为表格，`get`/`usage` 显示为分区详情卡片，写操作显示精简成功卡片，
明文 API Key 则显示敏感信息警告。管道和重定向会自动保持标准 JSON：

```bash
uv run ov-cp list                     # 终端内显示 Rich 表格
uv run ov-cp list | jq '.Collections' # 标准 JSON
uv run ov-cp --json list              # 强制标准 JSON
uv run ov-cp --output json-compact list
uv run ov-cp --output pretty list     # 强制终端视图
```

库级 `usage` 保留后端原有的 `EstimatedCosts` 字段，同时新增 `EstimatedBilling`，
明确费用为每小时 CNY 估值。AgentPlan 支付的库还会返回对应的 AFP 抵扣量和
支付场景；`volc_pay` 只返回 CNY。按数据空间或用户查询时会去掉这两个库级估值。
`--user-id` 可单独使用，此时查询 `default` 数据空间。

命令行参数优先于环境变量。端点默认指向公网网关；仅在测试时（如指向 port-forward）才用
`-e` / `VIKING_ENDPOINT` 覆盖：`uv run ov-cp -e http://localhost:18080 list`。
`ov-cp --help` 不需要任何配置即可运行。

## MCP 用法（stdio / uvx / streamable HTTP）

Server 默认 **stdio** 传输，可被任意 MCP 客户端作为子进程拉起；也可以以无状态
streamable HTTP 的方式挂在网关后面。`.mcp.json` 配置：

### 从 PyPI 安装

```json
{
  "mcpServers": {
    "openviking-controlplane": {
      "command": "uvx",
      "args": [
        "--from",
        "mcp-server-openviking-controlplane>=0.3.0",
        "mcp-server-openviking-controlplane"
      ],
      "env": {
        "AGENTPLAN_API_KEY": "ark-xxxxxxxx"
      }
    }
  }
}
```

### 从源码安装

```json
{
  "mcpServers": {
    "openviking-controlplane": {
      "command": "uvx",
      "args": [
        "--from",
        "git+https://github.com/volcengine/mcp-server#subdirectory=server/mcp_server_openviking_controlplane",
        "mcp-server-openviking-controlplane"
      ],
      "env": {
        "AGENTPLAN_API_KEY": "ark-xxxxxxxx"
      }
    }
  }
}
```

本地开发可改指向你的代码检出：

```json
{
  "mcpServers": {
    "openviking-controlplane": {
      "command": "uv",
      "args": ["run", "--directory", "/abs/path/server/mcp_server_openviking_controlplane",
               "mcp-server-openviking-controlplane"],
      "env": {
        "AGENTPLAN_API_KEY": "ark-xxxxxxxx"
      }
    }
  }
}
```

### Streamable HTTP（无状态）

```bash
mcp-server-openviking-controlplane --transport streamable-http
# -> http://0.0.0.0:8000/mcp
```

默认即无状态：每个请求自带完整上下文，不依赖上一次返回的 `Mcp-Session-Id`，
因此进程可以在网关后面水平扩缩。

Server 支持 MCP 协议修订版 **2026-07-28**——即"每请求信封"修订版，通过
`server/discover` 探测而非 `initialize` 握手协商——同时仍可与要求旧握手修订版
（最低 `2024-11-05`）的客户端协商。该能力需要 mcp SDK 2.x。

| 环境变量 | 含义 | 默认值 |
|---|---|---|
| `MCP_SERVER_HOST` | HTTP 监听地址 | `0.0.0.0` |
| `MCP_SERVER_PORT` | HTTP 端口（`PORT` 仍然有效） | `8000` |
| `STREAMABLE_HTTP_PATH` | streamable HTTP 挂载路径 | `/mcp` |
| `STATLESS_HTTP` | 是否启用无状态 HTTP（`STATELESS_HTTP` 亦可） | `true` |

> 监听 `127.0.0.1` 会让 MCP SDK 自动开启 DNS-rebinding 保护，只放行 localhost 的
> `Host` 头——网关转发过来的请求会被拒。挂在网关后面时请保持 `0.0.0.0` 默认值。

#### HTTP 下的凭证来源

HTTP 传输下 AgentPlan ApiKey **按请求解析**，因此单个进程可以服务多个调用方：

| 来源 | 优先级 |
|---|---|
| `X-AgentPlan-Api-Key` 请求头 | 1（最高） |
| `Authorization: Bearer <key>` 请求头 | 2 |
| `AGENTPLAN_API_KEY` 环境变量 | 3（兜底） |

`Authorization` 只读取 `Bearer` scheme，其他 scheme 一律忽略并回落到环境变量——
这样网关若在该头上终结自己的鉴权，其凭证不会被写进调用方的库。

需要 SSE 时：`mcp-server-openviking-controlplane --transport sse`。

> ⚠️ `create_collection` / `delete_collection` 会创建/销毁**付费**资源；
> `delete_collection_account` 会不可逆地销毁数据空间及其全部内容。这些能力均已暴露为
> MCP tool，其描述会要求模型先与你确认。最终拦截依赖客户端的工具授权弹窗。
