<!--
title: DiDi Skills 开发指南

description: 为 AI Agent 提供滴滴出行服务的 Skills 快捷接入方式

version: v1.0.0

last_updated: 2026-03-25

-->

# DiDi Skills

基于滴滴 MCP Server 封装的 Skills，为 AI Agent 提供出行服务的快捷接入方式。

---

## 概览 {#skill-概览}

DiDi Skills 是基于 DiDi MCP Server 的轻量级封装，通过预设的工作流和提示词，让 AI Agent 更便捷地处理出行相关需求。

### 能力范围

**打车服务**

| 功能 | 说明 |
|------|------|
| 实时叫车 | 地址解析 → 价格预估 → 车型选择 → 创建订单 |
| 价格预估 | 获取各车型价格对比 |
| 订单跟踪 | 查询订单状态和司机信息 |
| 查询司机位置 | 获取司机实时位置并美化展示 |
| 取消订单 | 展示订单信息并取消 |

**路线规划**

| 功能 | 说明 |
|------|------|
| 驾车路线 | 规划小客车/轿车出行方案 |
| 公交地铁 | 综合公交、地铁通勤方案 |
| 步行路线 | 规划步行出行方案 |
| 骑行路线 | 规划骑行出行方案 |

### 开源地址

- **ClawHub**: [didi-ride-skill-official](https://clawhub.ai/didi/didi-ride-skill-official)
- **GitHub**: [didi/didi-ride-skill](https://github.com/didi/didi-ride-skill)

---

## 快速开始 {#skill-快速开始}

### 前置要求

1. 已获取滴滴 MCP Key（访问 [开发者控制台](https://mcp.didichuxing.com)）
2. 已安装 clawhub：`npm install -g clawhub`

### 安装配置

**方式 1（推荐）：命令行安装**

```bash
clawhub install didi-ride-skill-official
```

**方式 2：对话安装（无命令行环境时）**

告诉 AI Agent：

```
帮我从 ClawHub 安装 didi-ride-skill-official：https://clawhub.ai/didi/didi-ride-skill-official
```

**方式 3：手动下载（以上方式均失败时）**

从 ClawHub 页面下载 skill：https://clawhub.ai/didi/didi-ride-skill-official

安装完成后，执行以下配置：

**配置 API Key**

```bash
export DIDI_MCP_KEY="YOUR_MCP_KEY"
```

或编辑配置文件 `~/.openclaw/openclaw.json`：

```json
{
  "skills": {
    "entries": {
      "didi-ride-skill": {
        "apiKey": "YOUR_MCP_KEY"
      }
    }
  }
}
```

### 验证安装

查看已安装的 Skill 列表：
```bash
clawhub list
```

显示 `didi-ride-skill` 即为安装成功。

---

## MCP 工具 {#skill-mcpTools}

Skills 底层使用以下 MCP 工具：

### 地图服务 {#skill-mcpTools-map}

| 工具 | 用途 |
|------|------|
| `maps_textsearch` | 关键词 POI 搜索，获取坐标 |
| `maps_place_around` | 周边 POI 检索 |
| `maps_regeocode` | 坐标转可读地址 |
| `maps_direction_driving` | 驾车路线规划 |
| `maps_direction_transit` | 公交/地铁路线规划 |
| `maps_direction_walking` | 步行路线规划 |
| `maps_direction_bicycling` | 骑行路线规划 |

### 打车服务 {#skill-mcpTools-car}

| 工具 | 用途 |
|------|------|
| `taxi_estimate` | 价格预估，查询可用车型 |
| `taxi_create_order` | 创建打车订单 |
| `taxi_query_order` | 查询订单状态和司机信息 |
| `taxi_cancel_order` | 取消订单 |
| `taxi_get_driver_location` | 获取司机实时位置 |
| `taxi_generate_ride_app_link` | 生成打车 App 深度链接 |

> 详细 API 说明请参考 [MCP Server 开发文档](/api)。

---

## 工作流程 {#skill-工作流程}

### 打车流程

```
用户发起打车请求
       │
       ▼
1. 地址解析 (maps_textsearch)
   解析起点和终点，获取坐标
       │
       ▼
2. 价格预估 (taxi_estimate)
   获取可用车型和价格
       │
       ▼
3. 车型选择
   用户选择车型或按偏好直发
       │
       ▼
4. 创建订单 (taxi_create_order)
   使用选定车型创建订单
       │
       ▼
5. 订单跟踪
   查询状态，获取司机信息
```

---

## 使用示例 {#skill-使用示例}

### 打车服务 {#skill-使用示例-打车服务}

**基础叫车**
```
你: 帮我叫个车从北京西站到西二旗地铁站

AI: 正在解析地址...
已找到起点：北京西站 (116.321, 39.894)
已找到终点：西二旗地铁站 (116.297, 40.053)

正在查询价格...

1. 特惠快车: 约 32 元
2. 快车: 约 34 元
3. 专车: 约 54 元

请选择车型。
```

**指定车型**
```
你: 叫个快车从家到公司

AI: 正在为您呼叫快车...
订单已创建！订单号: xxxxxxxx
```

**查询订单**
```
你: 查询订单 xxxxxxxx

AI: 订单号: xxxxxxxx
状态: 司机已接单
车牌: 京A·XXXXX
距离: 约 1.2 公里
预计到达: 3 分钟
```

**查询司机位置**
```
你: 司机现在在哪里

AI: 🚗 司机位置信息
📍 位置: 北京市朝阳区建国门外大街1号国贸附近
📏 距您: 约 1.2 公里
⏱️ 预计到达: 约 3 分钟
```

### 路线规划 {#skill-使用示例-路线规划}

**驾车路线**
```
你: 规划从望京SOHO到国贸的驾车路线

AI: 🚗 驾车路线规划
📍 路线: 望京SOHO → 国贸
📏 距离: 约 8.5 公里
⏱️ 预计: 约 25 分钟
```

**公交地铁路线**
```
你: 查一下从北京西站到西二旗的公交地铁路线

AI: 🚌 公交地铁路线
📍 路线: 北京西站 → 西二旗地铁站
⏱️ 预计: 约 55 分钟
🔄 换乘: 地铁9号线 → 地铁13号线
```

---

## 相关链接 {#skill-相关链接}

- [MCP Server 开发文档](/api) - 底层 API 详细说明
- [接入指南](/api?tap=opt) - 各平台接入教程
- [开发者控制台](https://mcp.didichuxing.com?PR_MARK_KEY=SHOW_CONTROL) - 获取 API Key
