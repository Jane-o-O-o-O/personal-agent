from __future__ import annotations

import logging
from collections.abc import Sequence

from fastmcp.exceptions import ToolError
from fastmcp.server.middleware import Middleware, MiddlewareContext
from fastmcp.tools.base import Tool
from mcp.types import CallToolRequestParams, ListToolsRequest

from base.filter_config import resolve_filter_config
from base.registry import get_tool_domain
from mediakit.request_context import get_inbound_headers

logger = logging.getLogger(__name__)


class ToolFilterMiddleware(Middleware):
    def _allow(self, tool_name: str, allowed_domains: set[str], allowed_tools: set[str]) -> bool:
        tool_domain = get_tool_domain(tool_name)
        if tool_domain == "shared":
            return True
        if allowed_domains and tool_domain in allowed_domains:
            return True
        if allowed_tools and tool_name in allowed_tools:
            return True
        if allowed_domains or allowed_tools:
            return False
        return True

    async def on_list_tools(
        self,
        context: MiddlewareContext[ListToolsRequest],
        call_next,
    ) -> Sequence[Tool]:
        tools = await call_next(context)
        allowed_domains, allowed_tools = resolve_filter_config(get_inbound_headers())
        if not allowed_domains and not allowed_tools:
            return tools

        filtered = [
            tool
            for tool in tools
            if self._allow(tool.name, allowed_domains, allowed_tools)
        ]
        logger.info("ToolFilterMiddleware: filtered to %s/%s tools", len(filtered), len(tools))
        return filtered

    async def on_call_tool(
        self,
        context: MiddlewareContext[CallToolRequestParams],
        call_next,
    ):
        allowed_domains, allowed_tools = resolve_filter_config(get_inbound_headers())
        if allowed_domains or allowed_tools:
            tool_name = context.message.name
            if not self._allow(tool_name, allowed_domains, allowed_tools):
                raise ToolError(
                    f"Tool '{tool_name}' is not available in the current scope"
                )
        return await call_next(context)
