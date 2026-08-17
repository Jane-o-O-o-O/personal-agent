# 飞书/Lark 开放平台开发文档检索 MCP

[![npm version](https://img.shields.io/npm/v/@larksuiteoapi/lark-mcp.svg)](https://www.npmjs.com/package/@larksuiteoapi/lark-mcp)
[![npm downloads](https://img.shields.io/npm/dm/@larksuiteoapi/lark-mcp.svg)](https://www.npmjs.com/package/@larksuiteoapi/lark-mcp)
[![Node.js Version](https://img.shields.io/node/v/@larksuiteoapi/lark-mcp.svg)](https://nodejs.org/)

中文 | [English](./README.md)

> **⚠️ Beta版本提示**：当前工具处于Beta版本阶段，功能和API可能会有变更，请密切关注版本更新。

这是飞书/Lark官方 开放平台开发文档检索 MCP（Model Context Protocol）工具，旨在帮助用户输入自身诉求后迅速检索到自己需要的开发文档，帮助开发者在AI IDE中编写与飞书集成的代码。也可搭配 [飞书/Lark OpenAPI MCP](../../README_ZH.md) 来让 AI 助手运行自动化场景

>**说明**： 开放平台开发文档检索，检索范围是 [开发文档](https://open.feishu.cn/document/home/index) 下所有的开发指南、开发教程、服务端 API、客户端 API，帮助用户迅速检索到对应的 OpenApi 或者其他开发文档，非「飞书云文档」的检索。

## 使用准备

### 安装Node.js

在使用lark-mcp工具之前，您需要先安装Node.js环境。如已安装过 Node.js，可以跳过本步骤
1. **使用Homebrew安装（推荐）**：

   ```bash
   brew install node
   ```

2. **使用官方安装包**：
   - 访问[Node.js官网](https://nodejs.org/)
   - 下载并安装LTS版本
   - 安装完成后，打开终端验证：
     ```bash
     node -v
     npm -v
     ```

#### Windows安装Node.js

1. **使用官方安装包**：

   - 访问[Node.js官网](https://nodejs.org/)
   - 下载并运行Windows安装程序（.msi文件）
   - 按照安装向导操作，完成安装
   - 安装完成后，打开命令提示符验证：
     ```bash
     node -v
     npm -v
     ```

2. **使用nvm-windows**：
   - 下载[nvm-windows](https://github.com/coreybutler/nvm-windows/releases)
   - 安装nvm-windows
   - 使用nvm安装Node.js：
     ```bash
     nvm install latest
     nvm use <版本号>
     ```

## 安装

全局安装lark-mcp工具：

```bash
npm install -g @larksuiteoapi/lark-mcp
```

## 使用指南

### 在Trae/Cursor/Claude中使用
如需在Trae/Cursor或Claude等AI工具中集成飞书/Lark功能，你可以通过下方按钮安装到对应的工具：

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-light.svg)](https://cursor.com/install-mcp?name=lark_open_doc_search&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsIkBsYXJrc3VpdGVvYXBpL2xhcmstbWNwIiwicmVjYWxsLWRldmVsb3Blci1kb2N1bWVudHMiXX0=)

[![Install MCP Server](../../assets/trae-cn.svg)](trae-cn://trae.ai-ide/mcp-import?source=lark&type=stdio&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsIkBsYXJrc3VpdGVvYXBpL2xhcmstbWNwIiwicmVjYWxsLWRldmVsb3Blci1kb2N1bWVudHMiXX0=)  [![Install MCP Server](../../assets/trae.svg)](trae://trae.ai-ide/mcp-import?source=lark&type=stdio&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsIkBsYXJrc3VpdGVvYXBpL2xhcmstbWNwIiwicmVjYWxsLWRldmVsb3Blci1kb2N1bWVudHMiXX0=)

也可以在配置文件中添加以下内容：

```json
{
  "mcpServers": {
    "lark-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@larksuiteoapi/lark-mcp",
        "recall-developer-documents",
      ]
    }
  }
}
```

### 高级配置

#### 命令行参数说明

`lark-mcp recall-developer-documents`工具提供了多种命令行参数，以便您灵活配置MCP服务：

| 参数 | 简写 | 描述 | 示例 |
|------|------|------|------|
| `--mode` | `-m` | 传输模式，可选值为stdio、streamable或sse，默认为stdio | `-m sse` |
| `--host` |  | SSE\Streamable模式下的监听主机，默认为localhost | `--host 0.0.0.0` |
| `--port` | `-p` | SSE\Streamable模式下的监听端口，默认为3000 | `-p 3000` |
| `--version` | `-V` | 显示版本号 | `-V` |
| `--help` | `-h` | 显示帮助信息 | `-h` |

#### 参数使用示例

1. **传输模式**：

    recall-developer-documents 支持两种传输模式：

    1. **stdio模式（默认/推荐）**：适用于与Cursor或Claude等AI工具集成，通过标准输入输出流进行通信。
    ```bash
    lark-mcp recall-developer-documents -m stdio
    ```

    2. **SSE模式**：提供基于Server-Sent Events的HTTP接口，适用于Web应用或需要网络接口的场景。

    ```bash
    # 默认只监听localhost
    lark-mcp recall-developer-documents -m sse -p 3000

    # 监听所有网络接口（允许远程访问）
    lark-mcp recall-developer-documents -m sse --host 0.0.0.0 -p 3000
    ```

    启动后，SSE端点将可在 `http://<host>:<port>/sse` 访问。

## 相关链接

- [飞书开放平台](https://open.feishu.cn/)
- [Lark国际版开放平台](https://open.larksuite.com/)
- [Node.js官网](https://nodejs.org/)
- [npm文档](https://docs.npmjs.com/)

## 反馈

欢迎提交Issues来帮助改进这个工具。如有问题或建议，请在GitHub仓库中提出。