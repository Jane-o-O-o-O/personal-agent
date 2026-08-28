from __future__ import annotations

from fastmcp.server.dependencies import get_http_headers


def get_inbound_headers() -> dict[str, str]:
    """读取当前 HTTP 请求的 inbound headers；stdio 或无请求时返回空 dict。"""
    return get_http_headers()
