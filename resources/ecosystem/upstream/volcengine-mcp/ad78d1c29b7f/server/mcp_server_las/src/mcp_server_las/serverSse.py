import mcp.types as types 
from mcp.server.lowlevel import Server
import time

from las_service import las_search_keyword_api
from config import load_config, LASConfig

# Configure logging
import logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)
from typing import Optional, List
# Global variables
config = None
global_dataset_id = None


async def las_search_keyword(
    query: str,
    dataset_id: Optional[str] = None,
    limit: int = 100,
    start_time: Optional[int] = None,
    end_time: Optional[int] = None,
) -> List[types.TextContent]:
    """Search by keyword using the provided query from the LAS service.

    This tool allows you to search logs using various query types including full text search,
    key-value search, and SQL analysis. It provides flexible time range filtering and
    limit options to customize your search results.

    Args:
        query: Search query string. Supports three formats:
            - Full text search: e.g., "error"
            - Key-value search: e.g., "key1:error"
            - SQL analysis: e.g., "* | select count(*) as count"
        dataset_id: Optional dataset ID to search logs from. If not provided, uses the globally configured dataset.
        limit: Maximum number of logs to return (default: 100)
        start_time: Start time in milliseconds since epoch (default: 15 minutes ago)
        end_time: End time in milliseconds since epoch (default: current time)

    Returns:
        List of log entries matching the search criteria as TextContent objects.
    """
    logger.info(f"Received search_logs request with query: {query}")

    try:
        config = load_config()
        # Use current time if end_time is not provided
        if end_time is None:
            end_time = int(time.time() * 1000)

        # Use 15 minutes ago if start_time is not provided
        if start_time is None:
            start_time = end_time - (15 * 60 * 1000)  # 15 minutes in milliseconds
        if config is None:
            raise ValueError("config is None")
        dataset_id = config.dataset_id
        if not dataset_id:
            raise ValueError("Dataset ID is required")
        logger.info(
            f"Searching with query: {query} for dataset: {dataset_id}, limit: {limit}, time range: {start_time} to {end_time}"
        )

        data = {
            "DatasetId": dataset_id,
            "NextToken": "0",
            "MaxResults": "5",
            "keyword": query,
        }
        
        response = las_search_keyword_api(config.access_key_id, config.access_key_secret, data)
        items = response['Result']['Items']
        
        # Convert each item to a TextContent object
        return [
            types.TextContent(
                type="text",
                text=str(item)
            )
            for item in items
        ]
    except Exception as e:
        logger.error(f"Error in search_logs: {str(e)}")
        return [
            types.TextContent(
                type="text",
                text=str(e)
            )
        ]

## 创建SSE Server
from mcp.server.sse import SseServerTransport 
from starlette.applications import Starlette 
from starlette.routing import Mount, Route

sse = SseServerTransport("/messages/")  # 创建SSE服务器传输实例，路径为"/messages/"
app = Server("mcp-website-fetcher")  # 创建MCP服务器实例，名称为"mcp-website-fetcher"

@app.call_tool()
async def fetch_tool(
  name: str, arguments: dict
) -> list[types.TextContent | types.ImageContent | types.EmbeddedResource]:
    if name == "las_search_keyword":
        if "las_search_keyword" not in arguments:
            raise ValueError("Missing required argument 'las_search_keyword'")
        return await las_search_keyword(arguments["las_search_keyword"])
    else:
        raise ValueError(f"Unknown tool name: {name}")

@app.list_tools()
async def list_tools() -> list[types.Tool]:
    # 定义异步函数list_tools，用于列出可用的工具
    # 返回: Tool对象列表，描述可用工具
    
    return [
        types.Tool(
            name="las_search_keyword",  # 工具名称
            description="Search by keyword using the provided query from the LAS service",  # 工具描述
            inputSchema={  # 输入模式定义
                "type": "object",
                "required": ["las_search_keyword"],  # 必需参数
                "properties": {
                    "las_search_keyword": {  # las_search_keyword参数定义
                        "type": "string",
                        "description": "The keyword you want to search in las dataset",
                    }
                },
            },
        ),
    ]


async def handle_sse(request):
    # 定义异步函数handle_sse，处理SSE请求
    # 参数: request - HTTP请求对象
    
    async with sse.connect_sse(
        request.scope, request.receive, request._send
    ) as streams:
        # 建立SSE连接，获取输入输出流
        await app.run(
            streams[0], streams[1], app.create_initialization_options()
        )  # 运行MCP应用，处理SSE连接

starlette_app = Starlette(
    debug=True,  # 启用调试模式
    routes=[
        Route("/sse", endpoint=handle_sse),  # 设置/sse路由，处理函数为handle_sse
        Mount("/messages/", app=sse.handle_post_message),  # 挂载/messages/路径，处理POST消息
    ],
)  # 创建Starlette应用实例，配置路由

import uvicorn  # 导入uvicorn ASGI服务器
uvicorn.run(starlette_app, host="127.0.0.1", port=8888) 