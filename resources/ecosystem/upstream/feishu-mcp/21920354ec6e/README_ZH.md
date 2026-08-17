# 飞书/Lark OpenAPI MCP

[![npm version](https://img.shields.io/npm/v/@larksuiteoapi/lark-mcp.svg)](https://www.npmjs.com/package/@larksuiteoapi/lark-mcp)
[![npm downloads](https://img.shields.io/npm/dm/@larksuiteoapi/lark-mcp.svg)](https://www.npmjs.com/package/@larksuiteoapi/lark-mcp)
[![Node.js Version](https://img.shields.io/node/v/@larksuiteoapi/lark-mcp.svg)](https://nodejs.org/)

中文 | [English](./README.md) 

[开发文档检索 MCP](./docs/recall-mcp/README_ZH.md) 

[官方文档](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/mcp_integration/mcp_introduction)

[常见问题](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/mcp_integration/use_cases)

> **⚠️ Beta版本提示**：当前工具处于Beta版本阶段，功能和API可能会有变更，请密切关注版本更新。

飞书/Lark官方 OpenAPI MCP（Model Context Protocol）工具，旨在帮助用户快速连接飞书平台并实现 AI Agent 与飞书的高效协作。该工具将飞书开放平台的 API 接口封装为 MCP 工具，使 AI 助手能够直接调用这些接口，实现文档处理、会话管理、日历安排等多种自动化场景。

## 使用准备

### 创建应用

在使用lark-mcp工具前，您需要先创建一个飞书应用：

1. 访问[飞书开放平台](https://open.feishu.cn/)并登录
2. 点击"开发者后台"，创建一个新应用
3. 获取应用的App ID和App Secret，这将用于API认证
4. 根据您的使用场景，为应用添加所需的权限
5. 如需以用户身份调用API，请设置OAuth 2.0重定向URL为 http://localhost:3000/callback

详细的应用创建和配置指南，请参考[飞书开放平台文档 - 创建应用](https://open.feishu.cn/document/home/introduction-to-custom-app-development/self-built-application-development-process#a0a7f6b0)。

### 安装Node.js

在使用lark-mcp工具之前，您需要先安装Node.js环境。

**使用官方安装包（推荐）**：

1. 访问[Node.js官网](https://nodejs.org/)
2. 下载并安装LTS版本
3. 安装完成后，打开终端验证：

```bash
  node -v
  npm -v
```

## 快速开始

### 在Trae/Cursor中使用

如需在Trae、Cursor等AI工具中集成飞书/Lark功能，你可以通过下方按钮安装，将 `app_id` 和 `app_secret` 填入安装弹窗或客户端配置 JSON 的 `args` 中：

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-light.svg)](https://cursor.com/install-mcp?name=lark-mcp&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsIkBsYXJrc3VpdGVvYXBpL2xhcmstbWNwIiwibWNwIiwiLWEiLCJ5b3VyX2FwcF9pZCIsIi1zIiwieW91cl9hcHBfc2VjcmV0Il19)
[![Install MCP Server](./assets/trae-cn.svg)](trae-cn://trae.ai-ide/mcp-import?source=lark&type=stdio&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsIkBsYXJrc3VpdGVvYXBpL2xhcmstbWNwIiwibWNwIiwiLWEiLCJ5b3VyX2FwcF9pZCIsIi1zIiwieW91cl9hcHBfc2VjcmV0Il19)  [![Install MCP Server](./assets/trae.svg)](trae://trae.ai-ide/mcp-import?source=lark&type=stdio&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsIkBsYXJrc3VpdGVvYXBpL2xhcmstbWNwIiwibWNwIiwiLWEiLCJ5b3VyX2FwcF9pZCIsIi1zIiwieW91cl9hcHBfc2VjcmV0Il19)


也可以直接在 MCP Client 的配置文件中添加以下内容（JSON），客户端会按配置启动 `lark-mcp`：

```json
{
  "mcpServers": {
    "lark-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@larksuiteoapi/lark-mcp",
        "mcp",
        "-a",
        "<your_app_id>",
        "-s",
        "<your_app_secret>"
      ]
    }
  }
}
```

如需使用**用户身份**访问 API：
1) 在终端运行 `login`（会保存令牌，后续客户端可直接复用）。
2) 在 MCP Client 配置中加入 `--oauth`。

注意需要先在开发者后台配置应用的重定向 URL，默认是 `http://localhost:3000/callback`。

```bash
npx -y @larksuiteoapi/lark-mcp login -a cli_xxxx -s yyyyy
```

然后在 MCP Client 中启用 `--oauth`

```json
{
  "mcpServers": {
    "lark-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@larksuiteoapi/lark-mcp",
        "mcp",
        "-a", "<your_app_id>",
        "-s", "<your_app_secret>",
        "--oauth",
        "--token-mode", "user_access_token"
      ]
    }
  }
}
```

说明：在启用 `--oauth` 时，建议显式设置 `--token-mode` 为 `user_access_token`，表示以用户访问令牌调用 API，适用于访问用户资源或需要用户授权的场景（如读取个人文档、发送 IM 消息）。若保留默认 `auto`，可能在AI推理使用 `tenant_access_token`，导致权限不足或无法访问用户私有数据。

### 域名配置

根据您的使用场景，lark-mcp 支持配置不同的域名环境：

**飞书**：
- 默认使用 `https://open.feishu.cn` 域名
- 适用于飞书用户

**Lark（国际版）**：
- 使用 `https://open.larksuite.com` 域名
- 适用于国际版Lark用户

如需切换至国际版Lark，请在配置中添加 `--domain` 参数：

```json
{
  "mcpServers": {
    "lark-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@larksuiteoapi/lark-mcp",
        "mcp",
        "-a",
        "<your_app_id>",
        "-s",
        "<your_app_secret>",
        "--domain",
        "https://open.larksuite.com"
      ]
    }
  }
}
```

> **💡 提示**：确保您的应用已在对应域名环境的开放平台创建。国际版应用无法在飞书中国版使用，反之亦然。


## 自定义配置开启API

> ⚠️ **文件上传下载**：暂不支持文件的上传和下载操作

> ⚠️ **云文档编辑**：暂不支持直接编辑飞书云文档内容（仅支持导入和读取）

默认情况下，MCP 服务启用常用 API。如需启用其他工具或仅启用特定 API 或 preset，推荐在 MCP Client 配置（JSON）中通过 `-t` 指定（用逗号分隔）：

```json
{
  "mcpServers": {
    "lark-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@larksuiteoapi/lark-mcp",
        "mcp",
        "-a", "<your_app_id>",
        "-s", "<your_app_secret>",
        "-t", "im.v1.message.create,im.v1.message.list,im.v1.chat.create,preset.calendar.default"
      ]
    }
  }
}
```

关于所有预设工具集的详细信息以及每个预设包含哪些工具，请参考[预设工具集参考文档](./docs/reference/tool-presets/presets-zh.md)。

对于所有支持的飞书/Lark工具列表可以在[tools.md](./docs/reference/tool-presets/tools-zh.md)中查看。

> **⚠️ 提示**：非预设 API 没有经过兼容性测试，AI在理解使用的过程中可能效果不理想

### 在开发Agent中使用

开发者可参考在 Agent 中集成的最小示例：[`lark-samples/mcp_quick_demo`](https://github.com/larksuite/lark-samples/tree/main/mcp_quick_demo)。

另外可参考 Lark 机器人集成示例：[`lark-samples/mcp_larkbot_demo/nodejs`](https://github.com/larksuite/lark-samples/tree/main/mcp_larkbot_demo/nodejs)。

该示例展示如何将 MCP 能力集成到飞书/Lark 机器人中，通过机器人会话触发工具调用与消息收发，适用于将已有工具接入 Bot 的场景。

### 高级配置

更详细的配置选项和部署场景，请参考我们的[配置指南](./docs/usage/configuration/configuration-zh.md)。

关于所有可用命令行参数及其使用方法的详细信息，请参考[命令行参考文档](./docs/reference/cli/cli-zh.md)。

## 常见问题

- [常见问题（FAQ）](./docs/troubleshooting/faq-zh.md)
- [常见问题与使用案例](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/mcp_integration/use_cases)

## 相关链接

- [飞书开放平台](https://open.feishu.cn/)
- [开发文档：OpenAPI MCP](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/mcp_integration/mcp_introduction)
- [Lark国际版开放平台](https://open.larksuite.com/)
- [飞书开放平台API文档](https://open.feishu.cn/document/home/index)
- [Node.js官网](https://nodejs.org/)
- [npm文档](https://docs.npmjs.com/)

## 反馈

欢迎提交Issues来帮助改进这个工具。如有问题或建议，请在GitHub仓库中提出。
