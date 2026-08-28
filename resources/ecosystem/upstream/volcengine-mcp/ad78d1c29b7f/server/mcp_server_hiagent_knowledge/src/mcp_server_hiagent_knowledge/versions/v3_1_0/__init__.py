"""HiAgent OpenAPI compatibility implementation for HiAgent version v3.1.0.

Each supported HiAgent version is a self-contained sub-package under
``mcp_server_hiagent_knowledge.versions``. If a future HiAgent OpenAPI changes request or
response shapes, add a new ``vX_Y_Z`` package and register it in
``mcp_server_hiagent_knowledge.versions`` without touching this one.
"""

from __future__ import annotations

from mcp_server_hiagent_knowledge.versions.v3_1_0.config import load_server_config
from mcp_server_hiagent_knowledge.versions.v3_1_0.server import create_mcp_server
from mcp_server_hiagent_knowledge.versions.v3_1_0.tools import parse_tool_list

__all__ = ["create_mcp_server", "load_server_config", "parse_tool_list"]
