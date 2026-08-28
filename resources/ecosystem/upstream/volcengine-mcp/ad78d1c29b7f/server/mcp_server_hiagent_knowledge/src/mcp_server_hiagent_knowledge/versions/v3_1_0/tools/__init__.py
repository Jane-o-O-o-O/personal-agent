"""Business-domain tool registration for HiAgent MCP Server."""

from mcp_server_hiagent_knowledge.versions.v3_1_0.tools._common import OpenAPIClient
from mcp_server_hiagent_knowledge.versions.v3_1_0.tools.dataset import (
    DATASET_TOOL_NAMES,
    register_dataset_tools,
)
from mcp_server_hiagent_knowledge.versions.v3_1_0.tools.filtering import (
    parse_tool_list,
    resolve_enabled_tools,
)
from mcp_server_hiagent_knowledge.versions.v3_1_0.tools.knowledge import (
    KNOWLEDGE_TOOL_NAMES,
    register_knowledge_tools,
)

__all__ = [
    "OpenAPIClient",
    "DATASET_TOOL_NAMES",
    "KNOWLEDGE_TOOL_NAMES",
    "parse_tool_list",
    "resolve_enabled_tools",
    "register_dataset_tools",
    "register_knowledge_tools",
]
