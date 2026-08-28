# 云助手 MCP Server

云助手的 MCP Server 实现，可以自然语言驱动向云服务器实例发送和执行自定义命令，适用于ECS带内运维、故障排查、环境检测、软件管理等场景。目前支持Linux操作系统。

<table>
  <tr>
    <td>版本</td>
    <td>v0.1.0</td>
  </tr>
  <tr>
    <td>描述</td>
    <td>自然语言驱动向云服务器实例发送和执行自定义命令</td>
  </tr>
  <tr>
    <td>分类</td>
    <td>计算</td>
  </tr>
  <tr>
    <td>标签</td>
    <td> 命令执行、带内运维</td>
  </tr>
</table>

# Tools
本 MCP Server 产品提供以下 Tools:
## Tool 1: run_command
向目标实例发送命令，生成一条执行记录，等待执行完成，然后检索并返回执行结果。
**run_command工具提供命令执行的带内通道，执行模型生成的命令**。

- 调试所需的输入参数:

输入
```json
{
    "inputSchema": {
      "type": "object",
      "required": ["instance","region","command_content"],
      "properties": {
        "instance": {
          "description": "实例名称",
          "type": "string"
        },
        "region": {
          "description": "实例所在地域，默认cn-beijing，支持cn-shanghai、cn-guangzhou、ap-southeast-1等",
          "type": "string"
        },
        "command_content": {
          "description": "执行命令内容",
          "type": "string"
        }
      }
    },
    "name": "run_command",
    "description": "提供命令执行的带内通道，执行模型生成的命令"
}

```
输出：(命令的执行输出结果)
```json
{
    "type":"text",
    "text":"cloud_assistant_cmd.sh cloud_monitor_agent_cmd.sh "
}
```

- 最容易被唤起的 Prompt示例
```text
1. 查询cn-beijing地域下实例i-ydtoqt4pogh9l3bp82xx的操作系统信息
2. 查看实例i-ydtoqt4pogh9l3bp82xx的CPU使用情况
```

# 可适配平台  
方舟、cursor、claude desktop 或支持MCP server调用的其他终端

# 服务开通链接
服务类产品，无需开通

# 鉴权方式  
火山引擎AKSK鉴权体系

# 安装部署
## 系统依赖
- 安装 Python3.10或更高版本
- 安装uv
  - MacOS/Linux
  ```text
  curl -LsSf https://astral.sh/uv/install.sh | sh
  ```
  - Windows
  ```text
  powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
  ```

# 部署

UV
```json
{
  "mcpServers": {
    "mcp_server_cloud_assistant": {
      "command": "uv",
      "env": {
        "VOLC_ENDPOINT":"Volcengine OpenApi Endpoint",
        "VOLC_ACCESSKEY":"Your Volcengine access key",
        "VOLC_SECRETKEY":"Your Volcengine secret key"
      },
      "args": [
        "--directory",
        "/<your local path to mcp-servers>/mcp_server_cloud_assistant/src/mcp_server_cloud_assistant",
        "run",
        "mcp-server-cloud-assistant"
      ]
    }
  }
}
```
UVX
```json
{
  "mcpServers": {
    "mcp_server_cloud_assistant": {
      "command": "uvx",
      "env": {
        "VOLC_ENDPOINT":"Volcengine OpenApi Endpoint",
        "VOLC_ACCESSKEY":"Your Volcengine access key",
        "VOLC_SECRETKEY":"Your Volcengine secret key"
      },
      "args": [
        "--from",
        "git+https://github.com/volcengine/mcp-server#subdirectory=server/mcp_server_cloud_assistant",
        "mcp-server-cloud-assistant"
      ]
    }
  }
}
```

# License
volcengine/mcp-server is licensed under the [MIT License](https://github.com/volcengine/mcp-server/blob/main/LICENSE)