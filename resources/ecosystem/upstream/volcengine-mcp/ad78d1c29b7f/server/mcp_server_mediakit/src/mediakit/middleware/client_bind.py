from __future__ import annotations

from fastmcp.exceptions import ToolError
from fastmcp.server.middleware import Middleware, MiddlewareContext
from mcp.types import CallToolRequestParams

from base.client import MediakitClient
from base.context import bind_client
from mediakit.request_context import get_inbound_headers


class ClientBindMiddleware(Middleware):
    async def on_call_tool(
        self,
        context: MiddlewareContext[CallToolRequestParams],
        call_next,
    ):
        try:
            client = MediakitClient.from_request_headers(get_inbound_headers())
        except ValueError as exc:
            raise ToolError(str(exc)) from exc
        bind_client(client)
        return await call_next(context)
