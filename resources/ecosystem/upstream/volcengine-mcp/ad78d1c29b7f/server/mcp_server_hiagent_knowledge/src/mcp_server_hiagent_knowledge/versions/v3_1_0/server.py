"""FastMCP server definition for HiAgent."""

from __future__ import annotations

from collections.abc import Iterable

from fastmcp import FastMCP

from mcp_server_hiagent_knowledge.versions.v3_1_0.client import HiAgentOpenAPIClient
from mcp_server_hiagent_knowledge.versions.v3_1_0.config import load_hiagent_config
from mcp_server_hiagent_knowledge.versions.v3_1_0.tools import (
    DATASET_TOOL_NAMES,
    KNOWLEDGE_TOOL_NAMES,
    OpenAPIClient,
    register_dataset_tools,
    register_knowledge_tools,
    resolve_enabled_tools,
)

# Every tool this server can expose, in a stable order. ``health_check`` is a
# built-in liveness probe and is always kept regardless of the tool filter.
ALWAYS_ON_TOOL_NAME = "health_check"
FILTERABLE_TOOL_NAMES = (*DATASET_TOOL_NAMES, *KNOWLEDGE_TOOL_NAMES)
ALL_TOOL_NAMES = (ALWAYS_ON_TOOL_NAME, *FILTERABLE_TOOL_NAMES)


def _remove_tool(mcp: FastMCP, name: str) -> None:
    """Remove a registered tool, tolerating FastMCP API differences across versions.

    FastMCP moved tool removal to ``mcp.local_provider.remove_tool`` in newer
    releases while keeping a deprecated ``mcp.remove_tool``; support both so the
    filter works across the ``fastmcp>=2.0.0`` range this package declares.
    """

    provider = getattr(mcp, "local_provider", None)
    if provider is not None and hasattr(provider, "remove_tool"):
        provider.remove_tool(name)
    else:
        mcp.remove_tool(name)


def create_mcp_server(
    client: OpenAPIClient | None = None,
    *,
    enabled_tools: Iterable[str] | None = None,
    disabled_tools: Iterable[str] | None = None,
) -> FastMCP:
    """Create the HiAgent Knowledge MCP server.

    Credentials are loaded from environment variables at startup (single
    identity). Passing ``client`` injects a fixed OpenAPI client (used by
    tests) instead of building one from the environment.

    Tool scope is optional: ``enabled_tools`` is an allowlist selecting the base
    set (``None`` = all tools) and ``disabled_tools`` is then subtracted from it.
    Both take exact tool names; unknown names raise ``ValueError``. ``health_check``
    is always kept. Every tool is registered first and the excluded ones are then
    removed, so filtering lives in one place instead of at each registration site.
    """

    hiagent_config = load_hiagent_config()
    openapi_client = client or HiAgentOpenAPIClient(hiagent_config)

    # ``health_check`` is always on; only the business tools are filterable.
    # Passing it as ``always_on`` lets a user list it explicitly without error.
    keep = set(
        resolve_enabled_tools(
            FILTERABLE_TOOL_NAMES,
            enabled=enabled_tools,
            disabled=disabled_tools,
            always_on=(ALWAYS_ON_TOOL_NAME,),
        )
    )

    mcp = FastMCP(
        name="hiagent-knowledge-mcp-server",
        instructions=(
            "HiAgent Knowledge MCP Server exposes a knowledge base (knowledge "
            "engine) as MCP tools. Each tool is named after the user-facing "
            "capability it provides. It offers knowledge base discovery "
            "(list_datasets, get_dataset) and the full "
            "knowledge-engine tool set (search_knowledge, grep_knowledge_chunks, "
            "list_document_infos, list_document_chunks, search_wiki, "
            "read_wiki_page, read_wiki_source_chunk, read_wiki_source_doc). "
            "The exposed tool set may be narrowed at startup via --tools / "
            "--disabled-tools. It supports stdio and "
            "streamable-http transports and AK/SK authentication only. "
            "Credentials are provided via environment variables "
            "(HIAGENT_TOP_HOST, HIAGENT_ACCESS_KEY_ID, HIAGENT_SECRET_ACCESS_KEY)."
        ),
    )

    @mcp.tool()
    def health_check() -> dict[str, object]:
        """
        检查 HiAgent Knowledge MCP Server 是否运行、以及必需的知识库 OpenAPI 配置是否齐备。
        仅返回状态与各项是否已配置的布尔值，不回显任何凭证明文。
        """

        return {
            "status": "ok",
            "auth": "aksk",
            "configured": hiagent_config.is_configured,
            "top_host_configured": bool(hiagent_config.top_host),
            "account_id_configured": bool(hiagent_config.account_id),
            "access_key_configured": bool(hiagent_config.access_key_id),
            "secret_key_configured": bool(hiagent_config.secret_access_key),
            "region": hiagent_config.region,
            "service": hiagent_config.service,
        }

    register_dataset_tools(mcp, openapi_client)
    register_knowledge_tools(mcp, openapi_client)

    # Apply the tool filter by removing the excluded business tools.
    for name in FILTERABLE_TOOL_NAMES:
        if name not in keep:
            _remove_tool(mcp, name)

    return mcp
