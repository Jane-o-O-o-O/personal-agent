from __future__ import annotations

import asyncio
from typing import Any

import pytest

from mcp_server_hiagent_knowledge.versions.v3_1_0.server import create_mcp_server


class RecordingClient:
    def __init__(self) -> None:
        self.calls: list[dict[str, Any]] = []

    def call(self, **kwargs: Any) -> dict[str, object]:
        self.calls.append(kwargs)
        return {"ResponseMetadata": {"Action": kwargs["action"]}, "Result": {}}


def _tool_names(server: Any) -> set[str]:
    return {tool.name for tool in asyncio.run(server.list_tools())}


def test_server_registers_knowledge_engine_tools() -> None:
    server = create_mcp_server(client=RecordingClient())

    names = {tool.name for tool in asyncio.run(server.list_tools())}

    assert names == {
        "health_check",
        "list_datasets",
        "get_dataset",
        "search_knowledge",
        "grep_knowledge_chunks",
        "list_document_infos",
        "list_document_chunks",
        "search_wiki",
        "read_wiki_page",
        "read_wiki_source_chunk",
        "read_wiki_source_doc",
    }


def test_injected_client_is_used_without_headers() -> None:
    # With an injected client, tools must work without any request headers
    # (the provider bypasses header parsing).
    client = RecordingClient()
    server = create_mcp_server(client=client)

    async def run() -> None:
        await server.call_tool("list_datasets", {"workspace_id": "ws-1"})

    asyncio.run(run())

    assert client.calls
    assert client.calls[0]["action"] == "ListDatasets"
    assert client.calls[0]["body"]["WorkspaceID"] == "ws-1"


def test_enabled_tools_allowlist_narrows_scope() -> None:
    server = create_mcp_server(
        client=RecordingClient(),
        enabled_tools=["search_wiki", "read_wiki_page"],
    )

    # Allowlist selects the base set; health_check is always kept.
    assert _tool_names(server) == {"health_check", "search_wiki", "read_wiki_page"}


def test_disabled_tools_denylist_removes_scope() -> None:
    server = create_mcp_server(
        client=RecordingClient(),
        disabled_tools=["grep_knowledge_chunks", "search_knowledge"],
    )

    names = _tool_names(server)
    assert "grep_knowledge_chunks" not in names
    assert "search_knowledge" not in names
    assert "health_check" in names
    assert "list_datasets" in names


def test_allowlist_then_denylist_compose() -> None:
    server = create_mcp_server(
        client=RecordingClient(),
        enabled_tools=["search_wiki", "read_wiki_page", "search_knowledge"],
        disabled_tools=["search_knowledge"],
    )

    assert _tool_names(server) == {"health_check", "search_wiki", "read_wiki_page"}


def test_empty_allowlist_keeps_only_health_check() -> None:
    server = create_mcp_server(client=RecordingClient(), enabled_tools=[])

    assert _tool_names(server) == {"health_check"}


def test_allowlist_may_list_health_check_explicitly() -> None:
    # health_check is always kept; listing it explicitly must not error.
    server = create_mcp_server(client=RecordingClient(), enabled_tools=["health_check"])

    assert _tool_names(server) == {"health_check"}


def test_unknown_tool_name_raises() -> None:
    with pytest.raises(ValueError, match="unknown tool name"):
        create_mcp_server(client=RecordingClient(), enabled_tools=["does_not_exist"])
