## 服务配置 mediakit api-key & endpoint
# 环境变量名
MEDIAKIT_API_KEY_ENV = "MEDIAKIT_API_KEY"
ENDPOINT_ENV = "MEDIAKIT_ENDPOINT"
LOGID_ENV = "MEDIAKIT_LOGID"
RUNTIME_ENV = "MEDIAKIT_RUNTIME"
DEFAULT_RUNTIME = "unknown"
TASK_SOURCE_ENV = "MEDIAKIT_TASK_SOURCE"
DEFAULT_TASK_SOURCE = "mcp"
# 分组&按照工具名加载
MCP_DOMAINS_ENV = "MCP_DOMAINS"
MCP_TOOLS_ENV = "MCP_TOOLS"
LOG_LEVEL_ENV = "MCP_LOG_LEVEL"

# HTTP Header 名
MEDIAKIT_API_KEY_HEADER = "x-amk-api-key"
ENDPOINT_HEADER = "x-mediakit-endpoint"
LOGID_HEADER = "x-tt-logid"
RUNTIME_HEADER = "x-amk-cli-runtime"
TASK_SOURCE_HEADER = "x-amk-task-source"
TOOL_NAME_HEADER = "x-tt-tools-name"

# 分组&按照工具名加载
MCP_DOMAINS_HEADER = "x-mcp-domains"
MCP_TOOLS_HEADER = "x-mcp-tools"

# 默认 endpoint
DEFAULT_ENDPOINT = "https://mediakit.cn-beijing.volces.com"

# 控制台入口，供缺失/错误配置时的 reference_url
AMK_CONSOLE_REFERENCE = "https://console.volcengine.com/imp/ai-mediakit/"
