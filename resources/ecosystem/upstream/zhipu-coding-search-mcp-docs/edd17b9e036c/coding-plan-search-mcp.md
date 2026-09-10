> ## Documentation Index
> Fetch the complete documentation index at: https://docs.bigmodel.cn/llms.txt
> Use this file to discover all available pages before exploring further.

# 联网搜索 MCP

联网搜索 MCP Server 是智谱为 GLM Coding Plan 用户开发的专属 Remote MCP Server，基于模型上下文协议（Model Context Protocol）接入搜索能力，可为 Claude Code、Cline 等兼容 MCP 的客户端提供网络搜索、实时信息获取等能力。

## 功能特性

<CardGroup cols={3}>
  <Card title="网络搜索" icon={<svg style={{maskImage: "url(https://mintcdn.com/zhipu-ef7018ed/6jZAOYw-eXEZh1pv/resource/icon/globe.svg?fit=max&auto=format&n=6jZAOYw-eXEZh1pv&q=85&s=12c9d7a94bd8f6a6c5f3ef31568fdb36)", maskRepeat: "no-repeat", maskPosition: "center center",}} className={"h-6 w-6 bg-primary dark:bg-primary-light !m-0 shrink-0"}/>}>
    支持全网搜索，获取最新的网络信息和资源
  </Card>

  <Card title="实时信息" icon={<svg style={{maskImage: "url(https://mintcdn.com/zhipu-ef7018ed/6jZAOYw-eXEZh1pv/resource/icon/clock.svg?fit=max&auto=format&n=6jZAOYw-eXEZh1pv&q=85&s=01942bdb6d8270b01215f52b5fe64363)", maskRepeat: "no-repeat", maskPosition: "center center",}} className={"h-6 w-6 bg-primary dark:bg-primary-light !m-0 shrink-0"}/>}>
    获取实时更新的信息，包括新闻、股价、天气等
  </Card>

  <Card title="远程服务" icon={<svg style={{maskImage: "url(https://mintcdn.com/zhipu-ef7018ed/6jZAOYw-eXEZh1pv/resource/icon/link.svg?fit=max&auto=format&n=6jZAOYw-eXEZh1pv&q=85&s=20fe7d23601cbb2a6bf65dc78ab4ebc3)", maskRepeat: "no-repeat", maskPosition: "center center",}} className={"h-6 w-6 bg-primary dark:bg-primary-light !m-0 shrink-0"}/>}>
    基于 HTTP 协议的远程 MCP 服务，无需本地安装
  </Card>
</CardGroup>

## 支持的工具

该服务器实现了模型上下文协议，可与任何兼容 MCP 的客户端一起使用。目前提供以下工具：

* **`webSearchPrime`** - 搜索网络信息，返回结果包括网页标题、网页URL、网页摘要、网站名称、网站图标等。

## 安装与使用

### 快速开始

<Steps>
  <Step title="获取访问令牌">
    * 个人版套餐的用户，通过 [个人编程套餐 > 套餐概览](https://bigmodel.cn/coding-plan/personal/overview)，新建  API Key
    * 团队版套餐的成员，通过 [团队编程套餐 > 我的套餐](http://bigmodel.cn/coding-plan?z_plan=team)，获取  API Key（团队套餐 Key 与平台其他 API Key 不通用，使用团队额度请务必使用团队套餐 Key）
  </Step>

  <Step title="配置 MCP 服务器">
    根据您使用的客户端 **参考下方** 选择相应的配置方式
  </Step>
</Steps>

### 支持的客户端

<Tabs>
  <Tab title="Claude Code">
    <Tip>
      在 Claude Code 中使用 GLM Coding Plan 时，模型服务端已内置联网搜索 MCP，无需安装。\
      如您希望在调用其他非智谱模型时仍应用此 MCP，再按以下方式安装。
    </Tip>

    **一键安装命令**

    注意替换里面的 `YOUR_API_KEY` 为您上一步获取到的 API Key

    ```bash theme={null}
    claude mcp add -s user -t http web-search-prime https://open.bigmodel.cn/api/mcp/web_search_prime/mcp --header "Authorization: Bearer YOUR_API_KEY"
    ```

    **手动配置**

    编辑 Claude Code 的配置文件, 位于用户目录下 `.claude.json` 的 MCP 部分：

    ```json theme={null}
    {
      "mcpServers": {
        "web-search-prime": {
          "type": "http",
          "url": "https://open.bigmodel.cn/api/mcp/web_search_prime/mcp",
          "headers": {
            "Authorization": "Bearer YOUR_API_KEY"
          }
        }
      }
    }
    ```
  </Tab>

  <Tab title="Cline (VS Code)">
    在 Cline 扩展设置中添加 MCP 服务器配置：

    注意替换里面的 `YOUR_API_KEY` 为您上一步获取到的 API Key

    ```json theme={null}
    {
      "mcpServers": {
        "web-search-prime": {
          "type": "streamableHttp",
          "url": "https://open.bigmodel.cn/api/mcp/web_search_prime/mcp",
          "headers": {
            "Authorization": "Bearer YOUR_API_KEY"
          }
        }
      }
    }
    ```

    若老版本 Cline 不支持 StreamableHttp 类型的 MCP 服务器，可以使用 SSE 类型的配置：

    ```json theme={null}
    {
      "mcpServers": {
        "web-search-prime": {
          "type": "sse",
          "url": "https://open.bigmodel.cn/api/mcp/web_search_prime/sse?Authorization=YOUR_API_KEY"
        }
      }
    }
    ```
  </Tab>

  <Tab title="OpenCode">
    在 OpenCode 设置中添加 MCP 服务器配置：

    参考 [OpenCode MCP 文档](https://opencode.ai/docs/mcp-servers)

    注意替换里面的 `YOUR_API_KEY` 为您上一步获取到的 API Key

    ```json theme={null}
    {
        "$schema": "https://opencode.ai/config.json",
        "mcp": {
            "web-search-prime": {
                "type": "remote",
                "url": "https://open.bigmodel.cn/api/mcp/web_search_prime/mcp",
                "headers": {
                    "Authorization": "Bearer YOUR_API_KEY"
                }
            }
        }
    }
    ```
  </Tab>

  <Tab title="Crush">
    在 Crush 设置中添加 MCP 服务器配置：

    注意替换里面的 `YOUR_API_KEY` 为您上一步获取到的 API Key

    ```json theme={null}
    {
        "$schema": "https://charm.land/crush.json",
        "mcp": {
            "web-search-prime": {
                "type": "http",
                "url": "https://open.bigmodel.cn/api/mcp/web_search_prime/mcp",
                "headers": {
                    "Authorization": "Bearer YOUR_API_KEY"
                }
            }
        }
    }
    ```
  </Tab>

  <Tab title="Goose">
    暂时 Goose 不支持，详见 [Issue](https://github.com/block/goose/issues/6576)

    在 Goose 设置中添加 MCP 服务器配置：

    点击 `Extensions` -> `Add custom extension`

    配置 Extension Name 为 `web-search-prime`，Type 选择 `HTTP`，Endpoint 填写如下 URL：

    ```
    https://open.bigmodel.cn/api/mcp/web_search_prime/mcp
    ```

    配置 Request Headers 添加 `Authorization` : `YOUR_API_KEY`

    最后点击底部 `Add Extension` 即可，注意替换里面的 `YOUR_API_KEY` 为您上一步获取到的 API Key
  </Tab>

  <Tab title="Roo Code, Kilo Code 其它">
    对于 Roo Code, Kilo Code 等其它支持 MCP 协议的客户端，参考以下通用配置：

    注意替换里面的 `YOUR_API_KEY` 为您上一步获取到的 API Key

    ```json theme={null}
    {
      "mcpServers": {
        "web-search-prime": {
          "type": "streamable-http",
          "url": "https://open.bigmodel.cn/api/mcp/web_search_prime/mcp",
          "headers": {
            "Authorization": "Bearer YOUR_API_KEY"
          }
        }
      }
    }
    ```
  </Tab>
</Tabs>

## 使用示例

通过上一步将搜索MCP服务器安装到客户端后，您就可以在自己的Coding客户端通过对话的方式直接使用MCP了。\
您可以在对话中直接使用搜索功能：

* "帮我搜索最新的 AI 技术发展"
* "查找关于 Python 异步编程的最佳实践"

## 故障排除

<AccordionGroup>
  <Accordion title="访问令牌无效">
    **问题：** 收到访问令牌无效的错误

    **解决方案：**

    1. 确认访问令牌是否正确复制
    2. 检查访问令牌是否已激活
    3. 确认访问令牌是否有足够的余额
    4. 检查 Authorization header 格式是否正确
  </Accordion>

  <Accordion title="连接超时">
    **问题：** MCP 服务器连接超时

    **解决方案：**

    1. 检查网络连接
    2. 确认防火墙设置
    3. 验证服务器 URL 是否正确
    4. 增加超时时间设置
  </Accordion>

  <Accordion title="搜索结果为空">
    **问题：** 搜索返回空结果

    **解决方案：**

    1. 尝试使用不同的搜索关键词
    2. 检查搜索查询是否过于具体
    3. 确认网络连接正常
    4. 联系技术支持获取帮助
  </Accordion>
</AccordionGroup>

## 相关资源

* [模型上下文协议 (MCP) 官方文档](https://modelcontextprotocol.io/)
* [Claude Code MCP 配置指南](https://docs.anthropic.com/en/docs/claude-code/mcp)
* [MCP 使用额度说明](https://docs.bigmodel.cn/cn/coding-plan/overview#%E4%B8%93%E5%B1%9E-mcp)
* [GLM Coding Plan 介绍](/cn/coding-plan/overview)


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.