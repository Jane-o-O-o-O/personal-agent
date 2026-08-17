# Feishu/Lark Open Platform Developer Documentation Retrieval MCP

[![npm version](https://img.shields.io/npm/v/@larksuiteoapi/lark-mcp.svg)](https://www.npmjs.com/package/@larksuiteoapi/lark-mcp)
[![npm downloads](https://img.shields.io/npm/dm/@larksuiteoapi/lark-mcp.svg)](https://www.npmjs.com/package/@larksuiteoapi/lark-mcp)
[![Node.js Version](https://img.shields.io/node/v/@larksuiteoapi/lark-mcp.svg)](https://nodejs.org/)

English | [中文](./README_ZH.md)

> **⚠️ Beta Version Notice**: This tool is currently in Beta. Features and APIs may change, so please pay close attention to version updates.

This is the Feishu/Lark official Open Platform Developer Documentation Retrieval MCP (Model Context Protocol) tool, designed to help users quickly find the documentation they need after entering their requirements. It can also be used with [Feishu/Lark OpenAPI MCP](../../README.md) to enable AI assistants to run automated scenarios.

> The scope of documentation retrieval covers all developer guides, tutorials, server-side APIs, and client-side APIs under the [Developer Documentation](https://open.feishu.cn/document/home/index) or [Lark Developer Documentation](https://open.larksuite.com/document/home/index), helping users quickly find the corresponding OpenAPI or other developer documentation. It does not search "Lark Docs" documents.

## Getting Started

### Install Node.js

Before using the lark-mcp tool, you need to install the Node.js environment. If you have already installed Node.js, you can skip this step.
1. **Install with Homebrew (Recommended):**

   ```bash
   brew install node
   ```

2. **Use the official installer:**
   - Visit the [Node.js official website](https://nodejs.org/)
   - Download and install the LTS version
   - After installation, open the terminal to verify:
     ```bash
     node -v
     npm -v
     ```

#### Install Node.js on Windows

1. **Use the official installer:**

   - Visit the [Node.js official website](https://nodejs.org/)
   - Download and run the Windows installer (.msi file)
   - Follow the installation wizard to complete the installation
   - After installation, open the command prompt to verify:
     ```bash
     node -v
     npm -v
     ```

2. **Use nvm-windows:**
   - Download [nvm-windows](https://github.com/coreybutler/nvm-windows/releases)
   - Install nvm-windows
   - Use nvm to install Node.js:
     ```bash
     nvm install latest
     nvm use <version>
     ```

## Installation

Install the lark-mcp tool globally:

```bash
npm install -g @larksuiteoapi/lark-mcp
```

## User Guide

### Use in Trae/Cursor/Claude
To integrate Lark features in AI tools such as Trae, Cursor or Claude, you can install using the button below.

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-light.svg)](https://cursor.com/install-mcp?name=lark_open_doc_search&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsIkBsYXJrc3VpdGVvYXBpL2xhcmstbWNwIiwicmVjYWxsLWRldmVsb3Blci1kb2N1bWVudHMiXX0=)

[![Install MCP Server](../../assets/trae-cn.svg)](trae-cn://trae.ai-ide/mcp-import?source=lark&type=stdio&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsIkBsYXJrc3VpdGVvYXBpL2xhcmstbWNwIiwicmVjYWxsLWRldmVsb3Blci1kb2N1bWVudHMiXX0=)  [![Install MCP Server](../../assets/trae.svg)](trae://trae.ai-ide/mcp-import?source=lark&type=stdio&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsIkBsYXJrc3VpdGVvYXBpL2xhcmstbWNwIiwicmVjYWxsLWRldmVsb3Blci1kb2N1bWVudHMiXX0=)

or you can add the following to your configuration file:

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

### Advanced Configuration

#### Command Line Arguments

The `lark-mcp recall-developer-documents` tool provides a variety of command line arguments for flexible MCP service configuration:

| Parameter | Short | Description | Example |
|------|------|------|------|
| `--mode` | `-m` | Transfer mode, options are stdio or streamable or sse, default is stdio | `-m sse` |
| `--host` |  | Listening host in SSE\Streamable mode, default is localhost | `--host 0.0.0.0` |
| `--port` | `-p` | Listening port in SSE\Streamable mode, default is 3000 | `-p 3000` |
| `--version` | `-V` | Show version number | `-V` |
| `--help` | `-h` | Show help information | `-h` |

#### Example Usage of Arguments

1. **Transfer Modes**：

    recall-developer-documents supports two transfer modes:

    1. **stdio mode (default/recommended):** Suitable for integration with AI tools such as Cursor or Claude, communicating via standard input and output streams.
      ```bash
      lark-mcp recall-developer-documents -m stdio
      ```

    2. **SSE mode:** Provides an HTTP interface based on Server-Sent Events, suitable for web applications or scenarios requiring a network interface.
      
      ```bash
      # By default, only listens on localhost
      lark-mcp recall-developer-documents -m sse -p 3000
      
      # Listen on all network interfaces (allow remote access)
      lark-mcp recall-developer-documents -m sse --host 0.0.0.0 -p 3000
      ```
      
      After starting, the SSE endpoint can be accessed at `http://<host>:<port>/sse`.

## Related Links

- [Feishu Open Platform](https://open.feishu.cn/)
- [Lark International Open Platform](https://open.larksuite.com/)
- [Node.js Official Website](https://nodejs.org/)
- [npm Documentation](https://docs.npmjs.com/)

## Feedback

You are welcome to submit Issues to help improve this tool. If you have any questions or suggestions, please raise them in the GitHub repository.
