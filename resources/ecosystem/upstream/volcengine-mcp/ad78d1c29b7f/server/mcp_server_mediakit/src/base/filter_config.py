from __future__ import annotations

import os

from .constant import (
    MCP_DOMAINS_ENV,
    MCP_DOMAINS_HEADER,
    MCP_TOOLS_ENV,
    MCP_TOOLS_HEADER,
)
from .header_utils import header_value


def _parse_csv(value: str) -> set[str]:
    if not value:
        return set()
    return {item.strip() for item in value.split(",") if item.strip()}


def resolve_filter_config(
    headers: dict[str, str] | None = None,
) -> tuple[set[str], set[str]]:
    """解析 domain / tool 过滤配置。

    各字段独立按 HTTP Header > 环境变量 > 无限制 解析。
    """
    inbound = headers or {}
    domains = _parse_csv(header_value(inbound, MCP_DOMAINS_HEADER)) or _parse_csv(
        os.environ.get(MCP_DOMAINS_ENV, "")
    )
    tools = _parse_csv(header_value(inbound, MCP_TOOLS_HEADER)) or _parse_csv(
        os.environ.get(MCP_TOOLS_ENV, "")
    )
    return domains, tools
