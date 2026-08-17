# 在 Docker 中使用 lark-mcp (Alpha)

本文档将介绍如何构建并运行官方 lark-mcp Docker 镜像，内置 keytar 安全存储，开箱即用。

[English Version](./docker.md)

## 前置条件
- 已安装 Docker Desktop（或任意 Docker 运行时）
- 拥有你的飞书/Lark 应用 App ID 和 App Secret

## 1）构建镜像
```bash
# 在项目根目录执行
docker build -t lark-mcp:latest .
```

## 2）快速检查
- 查看帮助
```bash
docker run --rm -it lark-mcp:latest --help
```
- 查看登录状态（会初始化存储）
```bash
docker run --rm -it lark-mcp:latest whoami
```


## 3）MCP 客户端配置

启动Docker容器后，还需要在MCP客户端中进行相应配置才能使用。

### stdio 模式配置

如果使用默认的stdio模式，在MCP客户端（如Cursor）配置文件中添加：

```json
{
  "mcpServers": {
    "lark-mcp": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "-v", "lark_mcp_data:/home/node/.local/share",
        "lark-mcp:latest", "mcp",
        "-a", "your_app_id",
        "-s", "your_app_secret"
      ]
    }
  }
}
```

### streamable 模式配置

如果使用streamable（HTTP）模式，需要先启动容器：

```bash
docker run --rm -it \
  -p 3000:3000 \
  -v lark_mcp_data:/home/node/.local/share \
  lark-mcp:latest mcp -a <your_app_id> -s <your_app_secret> -m streamable --host 0.0.0.0 -p 3000
```

然后在MCP客户端配置文件中添加：

```json
{
  "mcpServers": {
    "lark-mcp": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

### 用户身份配置（user_access_token）

> ⚠️ **重要提示**：在Docker环境中，暂不支持 OAuth，请手动传入 user_access_token 进行用户身份验证。

```json
{
  "mcpServers": {
    "lark-mcp": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "-v", "lark_mcp_data:/home/node/.local/share",
        "lark-mcp:latest", "mcp",
        "-a", "your_app_id",
        "-s", "your_app_secret",
        "-u", "your_user_access_token",
         "--token-mode", "user_access_token"
      ]
    }
  }
}
```

## 提示
- 无需输入密码：容器内已自动初始化 secrets 服务，keytar 无需交互即可安全存储令牌。
- 持久化令牌：建议始终挂载 `lark_mcp_data` 数据卷。
