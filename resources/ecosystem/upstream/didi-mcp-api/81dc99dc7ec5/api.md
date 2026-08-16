<!--
title: DiDi MCP Server 开发者文档

description: 面向开发者和 AI Agent 的滴滴出行 MCP Server 完整接入指南，提供网约车与地图服务能力

version: v1.1.2

last_updated: 2026-03-25

base_url: https://mcp.didichuxing.com

-->

# DiDi MCP Server

为你的 AI Agent 接入滴滴出行的网约车与地图服务能力。

---

## 概览

DiDi MCP Server 基于 [Model Context Protocol](https://modelcontextprotocol.io) 标准，通过 Streamable HTTP 协议向 AI Agent 暴露滴滴出行的核心能力。工具由 Agent 框架在运行时自动发现和调用，开发者只需完成接入配置即可。

### 能力范围

**网约车服务**

| 工具 | 描述 |
|------|------|
| `taxi_estimate` | 查询可用车型与价格预估，获取下单所需的 traceId |
| `taxi_generate_ride_app_link` | 生成跳转打车 App 的深度链接，由用户在 App 内完成下单（滴滴出行 App 版本7.1.2及以上） |
| `taxi_create_order` | 直接通过 API 创建订单，无需打开 App |
| `taxi_query_order` | 查询订单状态、司机信息和行程进度 |
| `taxi_cancel_order` | 取消打车订单 |
| `taxi_get_driver_location` | 获取司机实时位置坐标 |

**地图服务**

| 工具 | 描述 |
|------|------|
| `maps_textsearch` | 关键词搜索 POI，获取坐标——**所有需要坐标操作的前置步骤** |
| `maps_regeocode` | 坐标转可读地址（逆地理编码）|
| `maps_place_around` | 周边 POI 检索 |
| `maps_direction_driving` | 驾车路线规划 |
| `maps_direction_transit` | 公交 / 地铁路线规划 |
| `maps_direction_walking` | 步行路线规划 |
| `maps_direction_bicycling` | 骑行路线规划 |

### 环境与端点

| 环境 | 端点 | 说明 |
|------|------|------|
| **生产** | `https://mcp.didichuxing.com/mcp-servers?key=YOUR_MCP_KEY` | 产生真实订单与费用 |
| **调试** | `https://mcp.didichuxing.com/mcp-servers-sandbox?key=YOUR_MCP_KEY` | Mock 数据，不产生真实订单 |

> 建议开发阶段始终使用调试环境。详见 [调试模式](#调试模式)。

---

## 快速开始

### 第一步：获取 API Key

1. 使用已注册的滴滴个人账号登录[开发者控制台](https://mcp.didichuxing.com)
   > 新手机号需先在滴滴出行 App 或小程序完成注册
2. 在控制台激活个人 MCP Key

### 第二步：验证连通性

将 `YOUR_MCP_KEY` 替换为你的 MCP Key，发送以下请求获取工具列表，收到包含工具定义的 JSON 响应即表示接入成功：

```bash
curl -X POST "https://mcp.didichuxing.com/mcp-servers?key=YOUR_MCP_KEY" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1,
    "params": { "_meta": { "progressToken": 1 } }
  }'
```

### 第三步：在 Agent 中配置

在你的 Agent 框架中添加以下 MCP Server 配置，框架会自动完成工具发现和调用：

- **URL**：`https://mcp.didichuxing.com/mcp-servers?key=YOUR_MCP_KEY`
- **Type**：`streamable_http`

---

## 协议规范

- **传输协议**：`Streamable HTTP`
- **消息格式**：`JSON-RPC 2.0`
- **Content-Type**：`application/json; charset=utf-8`

### 响应结构

工具响应分两类结构，Agent 框架会自动处理调用和解析，开发者在设计 Agent 行为时需了解字段语义：

**打车工具**（`taxi_*`）返回双通道响应：

| 字段 | 用途 |
|------|------|
| `content[0].text` | 自然语言描述，供 LLM 直接阅读和向用户展示 |
| `structuredContent` | 结构化数据，供 Agent 程序化提取关键字段（如 `traceId`、`orderId`）|

**地图工具**（`maps_*`）仅返回 `content[0].text`，值为 JSON 字符串，需解析后使用，无 `structuredContent`。

---

## 核心约束

**Agent 在调用工具前必须遵守以下约束**，否则将触发参数校验错误或业务异常。

### 约束 1：数字参数必须用字符串传递

所有经纬度参数必须加引号，传入字符串类型，否则触发错误码 `-32010`：

```
❌  "from_lat": 39.916527
✅  "from_lat": "39.916527"
```

### 约束 2：坐标必须通过工具获取，不得假设

所有经纬度坐标必须先通过 `maps_textsearch` 实时获取，不能使用模型训练数据中的记忆坐标：

```
用户："从国贸到三里屯"
  → 必须调用 maps_textsearch("国贸", "北京市")   获取起点坐标
  → 必须调用 maps_textsearch("三里屯", "北京市") 获取终点坐标
  → 再调用 taxi_estimate 或路线规划工具
```

### 约束 3：坐标格式为「经度,纬度」

所有工具的坐标格式统一为 `lng,lat`（经度在前，纬度在后）：

```
✅  "116.397128,39.916527"  （lng,lat）
❌  "39.916527,116.397128"  （lat,lng）
```

### 约束 4：下单前必须获取用户确认

`taxi_create_order` 调用后立即产生真实订单，调用前必须向用户展示车型和价格并等待明确确认，**禁止自动下单**。

---

## 工具参考

### 网约车服务

---

#### `taxi_estimate` — 车型预估

查询当前可用车型与价格预估。**下单前必须先调用此工具**，返回的 `traceId` 是创建订单的必要参数。

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `from_lng` | string | ✅ | 出发经度，必须来自 `maps_textsearch` 返回值 |
| `from_lat` | string | ✅ | 出发纬度，必须来自 `maps_textsearch` 返回值 |
| `from_name` | string | ✅ | 出发地名称 |
| `to_lng` | string | ✅ | 目的经度，必须来自 `maps_textsearch` 返回值 |
| `to_lat` | string | ✅ | 目的纬度，必须来自 `maps_textsearch` 返回值 |
| `to_name` | string | ✅ | 目的地名称 |

> ⚠️ 所有坐标参数均为字符串类型。

**关键返回字段**

| 字段路径 | 类型 | 说明 |
|---------|------|------|
| `structuredContent.traceId` | string | **预估流程 ID，创建订单时作为 `estimate_trace_id` 传入** |
| `structuredContent.items[].productName` | string | 车型名称，如 `"快车"` |
| `structuredContent.items[].productCategory` | string | 车型标识，创建订单时作为 `product_category` 传入 |
| `structuredContent.items[].priceText` | string | 预估价格（元）|

> ⚠️ `traceId` 有时效性，获取后应立即进入用户确认流程并下单，避免过期（过期后需重新调用 `taxi_estimate`）。

**字段名对照**

| 返回字段 | 下单时对应参数 |
|---------|--------------|
| `traceId` | `estimate_trace_id` |
| `productCategory` | `product_category` |

**Agent 建议提示词**

> 帮我看看从望京 SOHO 打车到国贸大概多少钱
>
> 现在叫专车去机场要多少钱

---

#### `taxi_create_order` — 创建订单

直接通过 API 创建打车订单，系统自动完成发单流程。**调用后立即产生真实订单，请谨慎调用。**

> ⚠️ **调用前必须满足以下两个条件：**
> 1. 已调用 `taxi_estimate` 并获取有效的 `traceId`（`traceId` 有时效性，过期需重新预估）
> 2. 已向用户展示车型和价格，并收到明确确认，**禁止自动下单**

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `product_category` | string | ✅ | 车型标识，来自 `taxi_estimate` 返回的 `productCategory`，呼叫多种车型时用英文逗号分隔 |
| `estimate_trace_id` | string | ✅ | 预估流程 ID，来自 `taxi_estimate` 返回的 `traceId` |
| `caller_car_phone` | string | — | 叫车人手机号，不传则使用账号本身手机号 |

**关键返回字段**

| 字段路径 | 类型 | 说明 |
|---------|------|------|
| `structuredContent.orderId` | string | **订单 ID，后续查询和管理订单的必要参数** |
| `structuredContent.status` | string | 订单初始状态 |
| `structuredContent.from.name` | string | 起点名称 |
| `structuredContent.to.name` | string | 终点名称 |
| `structuredContent.phoneNumberSuffix` | string | 账号手机号尾号 |

**Agent 建议提示词**

> 确认下单快车
>
> 好的，帮我叫专车吧

---

#### `taxi_query_order` — 查询订单状态

查询订单当前状态、司机信息和行程进度。生产环境中需循环轮询直至终止状态。

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `order_id` | string | — | 订单 ID，来自 `taxi_create_order` 返回的 `orderId`；不传则查询当前账号下未完成的订单 |

**订单状态与轮询策略**

以下为 Agent 需处理的主要状态，实际状态码不限于此：

| `statusCode` | `statusText` | 建议轮询间隔 | Agent 行动 |
|-------------|-------------|------------|-----------|
| `0` | 匹配中 | 30 秒 | 继续轮询，提示用户等待 |
| `1` | 司机已接单 | 30 秒 | 展示司机姓名、车型、车牌、联系电话 |
| `2` | 司机已到达 | 60 秒 | 提醒用户上车 |
| `4` | 行程中 | 60 秒 | 展示剩余距离（`map.distanceKm`）和预计时间（`map.eta`）|
| `5` | 行程完成 | 停止 | 引导用户评价 |
| 其他 | 终止状态 | 停止 | 结束服务 |

**司机接单时（statusCode: 1）的关键返回字段**

| 字段路径 | 类型 | 说明 |
|---------|------|------|
| `structuredContent.driver.name` | string | 司机称呼 |
| `structuredContent.driver.phone` | string | 司机联系电话 |
| `structuredContent.driver.carModel` | string | 车型描述，如 `"黑·奥迪·A6"` |
| `structuredContent.driver.carPlate` | string | 车牌号 |
| `structuredContent.map.distanceKm` | string | 司机距接驾点距离（公里）|
| `structuredContent.map.eta` | string | 预计到达分钟数 |

**Agent 建议提示词**

> 查一下我的订单到哪了
>
> 司机来了吗，还需要等多久

---

#### `taxi_cancel_order` — 取消订单

取消指定订单。**行程中及完单后不支持取消。**

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `order_id` | string | ✅ | 订单 ID |
| `reason` | string | — | 取消原因 |

**关键返回字段**

| 字段路径 | 类型 | 说明 |
|---------|------|------|
| `structuredContent.success` | boolean | `true` 表示取消成功 |

**Agent 建议提示词**

> 我不打车了，帮我取消订单
>
> 取消刚才的订单

---

#### `taxi_get_driver_location` — 获取司机位置

获取司机当前实时经纬度。**仅在有进行中订单时有效。**

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `order_id` | string | ✅ | 订单 ID |

**关键返回字段**

| 字段路径 | 类型 | 说明 |
|---------|------|------|
| `structuredContent.longitude` | number | 司机当前经度（数字类型，非字符串）|
| `structuredContent.latitude` | number | 司机当前纬度（数字类型，非字符串）|

> 建议获取坐标后调用 `maps_regeocode` 转换为可读地址展示给用户。

**Agent 建议提示词**

> 司机现在在哪
>
> 帮我看看司机离我还有多远

---

#### `taxi_generate_ride_app_link` — 生成打车链接

生成跳转到滴滴 App 的深度链接，用户点击后在 App 内完成下单操作。适用于不需要全程 API 托管下单的场景。需要滴滴出行 App 7.1.2 及以上版本。

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `from_lng` | string | ✅ | 出发经度 |
| `from_lat` | string | ✅ | 出发纬度 |
| `to_lng` | string | ✅ | 目的经度 |
| `to_lat` | string | ✅ | 目的纬度 |
| `product_category` | string | — | 车型品类标识，来自 `taxi_estimate`，仅当用户明确指定时传递，多个车型用英文逗号分隔 |

**Agent 建议提示词**

> 生成一个从北京西站到国贸的打车链接
>
> 我想自己在 App 里下单，帮我生成一下链接

---

### 地图服务

---

#### `maps_textsearch` — 地点搜索

根据关键词和城市搜索 POI，返回名称、地址和坐标。**是所有需要坐标操作的必要前置步骤。**

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `keywords` | string | ✅ | 搜索关键词，如 `"北京西站"` |
| `city` | string | ✅ | 城市名称，使用完整格式，如 `"北京市"` |
| `location` | string | — | 参考坐标（lng,lat），用于结果排序 |

**关键返回字段**

`content[0].text` 为 JSON 数组字符串，解析后每个元素包含：

| 字段 | 类型 | 说明 |
|------|------|------|
| `display_name` | string | POI 名称 |
| `address` | string | 详细地址 |
| `address_all` | string | 完整地址（含 POI 名称） |
| `city` | string | 所在城市 |
| `location.lng` | number | 经度 |
| `location.lat` | number | 纬度 |

**Agent 建议提示词**

> 搜索"望京 SOHO"的位置，获取坐标

**注意事项**
- 多结果时默认取第一个，或询问用户确认

---

#### `maps_regeocode` — 逆地理编码

将经纬度坐标转换为可读的地址描述。常用于将司机位置转化为人类可理解的地址。

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `location` | string | ✅ | 坐标，格式 `lng,lat`，如 `"116.397128,39.916527"` |

**Agent 建议提示词**

> 把坐标 116.397128,39.916527 转换成地址告诉我

---

#### `maps_place_around` — 周边搜索

搜索指定坐标周边的 POI，适用于「附近有没有…」类场景。

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `keywords` | string | ✅ | 搜索关键词，如 `"咖啡"` `"停车场"` |
| `location` | string | ✅ | 中心坐标，格式 `lng,lat` |
| `max_distance` | string | — | 搜索半径，单位米，如 `"500"` |

**Agent 建议提示词**

> 找一下我附近 1 公里内的加油站
>
> 北京西站周边有哪些酒店

---

#### `maps_direction_driving` — 驾车路线

规划驾车通行方案，返回路线、时间和距离。

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `origin` | string | ✅ | 起点，格式 `lng,lat` |
| `destination` | string | ✅ | 终点，格式 `lng,lat` |

**Agent 建议提示词**

> 开车从北京西站到国贸要多久
>
> 帮我规划一下从公司驾车回家的路线

---

#### `maps_direction_transit` — 公交 / 地铁路线

规划综合公交、地铁通行方案。

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `origin` | string | ✅ | 起点，格式 `lng,lat` |
| `destination` | string | ✅ | 终点，格式 `lng,lat` |
| `city` | string | ✅ | 城市名称，完整格式，如 `"北京市"` |

**Agent 建议提示词**

> 坐地铁从望京 SOHO 去三里屯怎么走
>
> 从北京西站到首都机场坐公交怎么去

---

#### `maps_direction_walking` — 步行路线

规划步行通行方案，返回路线和步行时间。

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `origin` | string | ✅ | 起点，格式 `lng,lat` |
| `destination` | string | ✅ | 终点，格式 `lng,lat` |

**Agent 建议提示词**

> 从酒店步行到最近的地铁站要走多久

---

#### `maps_direction_bicycling` — 骑行路线

规划骑行通行方案，适用于单车出行场景。

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `origin` | string | ✅ | 起点，格式 `lng,lat` |
| `destination` | string | ✅ | 终点，格式 `lng,lat` |

**Agent 建议提示词**

> 骑共享单车从公司到地铁站需要多少分钟

---

## 工作流程

### 完整叫车流程

**用户："帮我叫个车去国贸"**

1. **地址解析** — `maps_textsearch`
   分别搜索起点和「国贸」的坐标
   > ⚠️ 未提供起点时，必须先询问用户，不得推测

2. **价格预估** — `taxi_estimate`
   传入起终点坐标，获取可用车型和价格，保存返回的 `traceId`

3. **用户确认**
   向用户展示车型列表与价格，等待明确选择
   > ⚠️ 必须等用户明确回复，禁止自动下单

4. **创建订单** — `taxi_create_order`
   传入 `product_category` 和 `estimate_trace_id`（即 `traceId`），保存返回的 `orderId`

5. **状态跟踪** — `taxi_query_order`
   传入 `orderId`，按状态表建议的间隔轮询，直至终止状态

### 路线规划流程

**用户："怎么从北京西站去首都机场？"**

先调用 `maps_textsearch` × 2 获取起终点坐标，再根据用户出行意图选择工具：

| 出行方式 | 工具 |
|---------|------|
| 驾车 | `maps_direction_driving` |
| 公交 / 地铁 | `maps_direction_transit`（需要 `city` 参数）|
| 步行 | `maps_direction_walking` |
| 骑行 | `maps_direction_bicycling` |

### 对话参考示例

> **用户：** 帮我叫个车去国贸
>
> **Agent：** 请问您现在在哪里？
>
> **用户：** 望京 SOHO
>
> **Agent：** *(调用 `maps_textsearch("望京SOHO", "北京市")`、`maps_textsearch("国贸", "北京市")`、`taxi_estimate(...)`)*
>
> 价格预估（望京 SOHO → 国贸）
>
> | 车型 | 预估费用 |
> |------|---------|
> | 特惠快车 | 约 73 元 |
> | 快车 | 约 75 元 |
> | 专车 | 约 132 元 |
> | 豪华车 | 约 316 元 |
>
> 请选择车型：
>
> **用户：** 快车
>
> **Agent：** *(调用 `taxi_create_order(product_category="1", estimate_trace_id="...")`)*
>
> 订单已创建
> - 订单号：qoxxxxxxxxiD
> - 路线：望京 SOHO → 国贸
> - 车型：快车 · 约 75 元
> - 账号尾号：1155
>
> 正在为您匹配司机，我会及时更新状态…

### 位置信息处理规则

| 场景 | Agent 行动 |
|------|-----------|
| 用户未提供起点 | 必须询问当前位置，禁止使用历史记忆或推测补全 |
| 用户拒绝提供位置 | 告知无法满足需求，不得继续尝试 |

---

## 调试模式

调试环境提供完整的 Pro 功能体验，返回 Mock 数据，不产生真实订单，不影响真实账户。

**调试端点：** `https://mcp.didichuxing.com/mcp-servers-sandbox?key=YOUR_MCP_KEY`

> ℹ️ 使用调试环境时，需将配置文件中的端点 URL 替换为上述调试端点（添加 `-sandbox` 后缀）。

### 各工具调试行为

| 工具 | 调试环境返回 |
|------|------------|
| `taxi_estimate` | 测试车型与模拟价格 |
| `taxi_generate_ride_app_link` | 固定路线链接（北京西站 → 西二旗地铁站，快车）|
| `taxi_create_order` | 固定路线订单（北京西站 → 西二旗地铁站，快车）|
| `taxi_cancel_order` | 固定返回取消成功 |
| `taxi_get_driver_location` | 模拟位置（北京银座和谐广场）|

### `taxi_query_order` 调试序列

调试环境按**查询次数**依次返回不同状态，用于模拟完整订单生命周期，创建新订单后计数自动重置：

| 查询次数 | 返回状态 |
|---------|---------|
| 第 1 次 | 匹配中（statusCode: 0）|
| 第 2 次 | 司机已接单（statusCode: 1）|
| 第 3 次 | 司机已到达（statusCode: 2）|
| 第 4 次 | 行程中（statusCode: 4）|
| 第 5 次 | 行程完成（statusCode: 5）|

---

## 错误处理

### 错误码参考

| 错误码 | 含义 | 处理建议 |
|--------|------|---------|
| `-32001` | 触发限流 | 等待后重试，建议指数退避 |
| `-32002` | 鉴权失败 | 检查 API Key 是否正确配置 |
| `-32010` | 参数验证失败 | 检查数字参数是否使用字符串格式 |
| `-32011` | 订单不存在 | 确认 `order_id` 是否正确 |
| `-32021` | 预估结果已过期 | 重新调用 `taxi_estimate` |
| `-32030` | 不支持该订单类型 | 检查 `product_category` 参数 |
| `-32031` | 订单未支付 | 提示用户完成支付后重试 |
| `-32040` | 订单已取消 | 无需重复操作 |
| `-32041` | 订单无法取消 | 当前订单状态不允许取消 |
| `-32050` | 服务内部错误 | 稍后重试或联系客服 |
| `-32060` | 支付失败 | 提示用户更换支付方式 |

---

## 版本日志

| 版本 | 发布时间 | 更新内容 |
|------|---------|---------|
| v1.1.4 | 2026-05-14 | 优化 MCP KEY 申请流程 |
| v1.1.2 | 2026-03-25 | 更新文档 |
| v1.1.0 | 2025-12-01 | 工具返回新增 `structuredContent` 结构化数据，内容展示优化 |
| v1.0.6 | 2025-10-15 | 新增地图类工具，提供完整出行规划能力 |
| v1.0.4 | 2025-08-29 | 上线调试模式（Sandbox 环境）|
| v1.0.2 | 2025-08-18 | Pro 版本发布，提供订单全生命周期管理能力 |
| v1.0.0 | 2025-08-01 | 首次发布，提供网约车预估与生成打车链接 |
