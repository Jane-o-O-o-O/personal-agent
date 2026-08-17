# Use lark-mcp in Docker (Alpha)

This document describes how to build and run the official lark-mcp Docker image with built-in keytar secure storage, ready to use out of the box.

[中文版本](./docker-zh.md)

## Prerequisites
- Docker Desktop installed (or any Docker runtime)
- Your Feishu/Lark application App ID and App Secret

## 1) Build the image
```bash
# Execute from project root directory
docker build -t lark-mcp:latest .
```

## 2) Quick checks
- View help
```bash
docker run --rm -it lark-mcp:latest --help
```
- Check login status (will initialize storage)
```bash
docker run --rm -it lark-mcp:latest whoami
```


## 3) MCP Client Configuration

After starting the Docker container, you need to configure your MCP client accordingly to use it.

### stdio Mode Configuration

If using the default stdio mode, add the following to your MCP client (e.g., Cursor) configuration file:

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

### streamable Mode Configuration

If using streamable (HTTP) mode, first start the container:

```bash
docker run --rm -it \
  -p 3000:3000 \
  -v lark_mcp_data:/home/node/.local/share \
  lark-mcp:latest mcp -a <your_app_id> -s <your_app_secret> -m streamable --host 0.0.0.0 -p 3000
```

Then add the following to your MCP client configuration file:

```json
{
  "mcpServers": {
    "lark-mcp": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

### User Identity Configuration (user_access_token)


> ⚠️ **Important Note**: In Docker environment, OAuth mode does not support yet. Please  use -u for user authentication.


1. **MCP client configuration**:
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



## Tips
- No password required: The container automatically initializes the secrets service, allowing keytar to securely store tokens without interaction.
- Token persistence: Suggest always mount the `lark_mcp_data` volume.
