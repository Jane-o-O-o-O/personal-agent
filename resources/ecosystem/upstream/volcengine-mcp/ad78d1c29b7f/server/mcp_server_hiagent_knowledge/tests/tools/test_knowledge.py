from __future__ import annotations

from typing import Any

import pytest

from mcp_server_hiagent_knowledge.versions.v3_1_0.tools.knowledge import (
    KNOWN_TOOL_NAMES,
    list_document_infos,
    grep_knowledge_chunks,
    list_document_chunks,
    read_wiki_page,
    read_wiki_source_chunk,
    read_wiki_source_doc,
    search_knowledge,
    search_wiki,
)


class RecordingClient:
    def __init__(self) -> None:
        self.calls: list[dict[str, Any]] = []

    def call(self, **kwargs: Any) -> dict[str, object]:
        self.calls.append(kwargs)
        return {"ResponseMetadata": {"Action": kwargs["action"]}, "Result": {}}


# --- search_knowledge (knowledge_search) ------------------------------------


def test_search_knowledge_builds_request() -> None:
    client = RecordingClient()
    search_knowledge(
        client,
        workspace_id="ws-1",
        dataset_ids=["ds-1", "ds-2"],
        queries=["hello"],
    )
    assert client.calls[0]["body"] == {
        "WorkspaceID": "ws-1",
        "DatasetIDs": ["ds-1", "ds-2"],
        "ToolName": "knowledge_search",
        "KnowledgeSearch": {
            "Queries": ["hello"],
        },
    }


def test_search_knowledge_omits_optional_fields() -> None:
    client = RecordingClient()
    search_knowledge(client, workspace_id="ws-1", dataset_ids=["ds-1"], queries=["q"])
    assert client.calls[0]["body"]["KnowledgeSearch"] == {"Queries": ["q"]}
    assert "KnowledgeRunMode" not in client.calls[0]["body"]


@pytest.mark.parametrize(
    "kwargs",
    [
        {"workspace_id": "", "dataset_ids": ["ds-1"], "queries": ["q"]},
        {"workspace_id": "ws-1", "dataset_ids": [], "queries": ["q"]},
        {"workspace_id": "ws-1", "dataset_ids": ["ds-1"], "queries": []},
    ],
)
def test_search_knowledge_required_fields(kwargs: dict[str, Any]) -> None:
    with pytest.raises(ValueError):
        search_knowledge(RecordingClient(), **kwargs)


# --- grep_knowledge_chunks (grep_chunks) ------------------------------------


def test_grep_builds_oneof_request() -> None:
    client = RecordingClient()
    grep_knowledge_chunks(
        client,
        workspace_id="ws-1",
        dataset_ids=["ds-1"],
        pattern="err\\d+",
        queries=["error"],
        limit=5,
    )
    assert client.calls[0]["body"] == {
        "WorkspaceID": "ws-1",
        "DatasetIDs": ["ds-1"],
        "ToolName": "grep_chunks",
        "GrepChunks": {"Pattern": "err\\d+", "Queries": ["error"], "Limit": 5},
    }


def test_grep_passes_scope_fields_through() -> None:
    client = RecordingClient()
    grep_knowledge_chunks(
        client,
        workspace_id="ws-1",
        dataset_ids=["ds-1"],
        pattern="p",
        grep_type="resource_ids",
        resource_ids=["r-1", "r-2"],
    )
    assert client.calls[0]["body"]["GrepChunks"] == {
        "Pattern": "p",
        "GrepType": "resource_ids",
        "ResourceIDs": ["r-1", "r-2"],
    }


def test_grep_omits_optional_fields() -> None:
    client = RecordingClient()
    grep_knowledge_chunks(
        client, workspace_id="ws-1", dataset_ids=["ds-1"], pattern="p"
    )
    assert client.calls[0]["body"]["GrepChunks"] == {"Pattern": "p"}


@pytest.mark.parametrize(
    "kwargs",
    [
        {"workspace_id": "", "dataset_ids": ["ds-1"], "pattern": "p"},
        {"workspace_id": "ws-1", "dataset_ids": [], "pattern": "p"},
        {"workspace_id": "ws-1", "dataset_ids": ["ds-1"], "pattern": ""},
    ],
)
def test_grep_required_fields(kwargs: dict[str, Any]) -> None:
    with pytest.raises(ValueError):
        grep_knowledge_chunks(RecordingClient(), **kwargs)


# --- list_document_infos (list_doc_infos) -----------------------------------


def test_list_document_infos_request() -> None:
    client = RecordingClient()
    list_document_infos(
        client,
        workspace_id="ws-1",
        dataset_ids=["ds-1", "ds-2"],
        resource_ids={"ds-1": ["r-1", "r-2"], "ds-2": ["r-3"]},
    )
    assert client.calls[0]["body"] == {
        "WorkspaceID": "ws-1",
        "DatasetIDs": ["ds-1", "ds-2"],
        "ToolName": "list_doc_infos",
        "ListDocInfos": {"ResourceIDs": {"ds-1": ["r-1", "r-2"], "ds-2": ["r-3"]}},
    }


@pytest.mark.parametrize(
    "kwargs",
    [
        {"workspace_id": "", "dataset_ids": ["ds-1"], "resource_ids": {"ds-1": ["r"]}},
        {"workspace_id": "ws-1", "dataset_ids": [], "resource_ids": {"ds-1": ["r"]}},
        {"workspace_id": "ws-1", "dataset_ids": ["ds-1"], "resource_ids": {}},
        {"workspace_id": "ws-1", "dataset_ids": ["ds-1"], "resource_ids": {"ds-1": []}},
        {"workspace_id": "ws-1", "dataset_ids": ["ds-1"], "resource_ids": {"": ["r"]}},
    ],
)
def test_list_document_infos_required_fields(kwargs: dict[str, Any]) -> None:
    with pytest.raises(ValueError):
        list_document_infos(RecordingClient(), **kwargs)


# --- list_document_chunks (list_knowledge_chunks) ---------------------------


def test_list_document_chunks_builds_oneof_request() -> None:
    client = RecordingClient()
    list_document_chunks(
        client,
        workspace_id="ws-1",
        dataset_ids=["ds-1"],
        resource_id="res-1",
        limit=50,
        cursor_segment_id="seg-9",
    )
    assert client.calls[0]["body"] == {
        "WorkspaceID": "ws-1",
        "DatasetIDs": ["ds-1"],
        "ToolName": "list_knowledge_chunks",
        "ListKnowledgeChunks": {
            "ResourceID": "res-1",
            "Limit": 50,
            "CursorSegmentID": "seg-9",
        },
    }


def test_list_document_chunks_omits_optional_fields() -> None:
    client = RecordingClient()
    list_document_chunks(
        client, workspace_id="ws-1", dataset_ids=["ds-1"], resource_id="res-1"
    )
    assert client.calls[0]["body"]["ListKnowledgeChunks"] == {"ResourceID": "res-1"}


@pytest.mark.parametrize(
    "kwargs",
    [
        {"workspace_id": "", "dataset_ids": ["ds-1"], "resource_id": "r"},
        {"workspace_id": "ws-1", "dataset_ids": [], "resource_id": "r"},
        {"workspace_id": "ws-1", "dataset_ids": ["ds-1"], "resource_id": ""},
    ],
)
def test_list_document_chunks_required_fields(kwargs: dict[str, Any]) -> None:
    with pytest.raises(ValueError):
        list_document_chunks(RecordingClient(), **kwargs)


# --- search_wiki (wiki_search) ----------------------------------------------


def test_search_wiki_builds_oneof_request() -> None:
    client = RecordingClient()
    search_wiki(
        client, workspace_id="ws-1", dataset_ids=["ds-1"], queries=["规定"], limit=5
    )
    assert client.calls[0]["body"] == {
        "WorkspaceID": "ws-1",
        "DatasetIDs": ["ds-1"],
        "ToolName": "wiki_search",
        "WikiSearch": {"Queries": ["规定"], "Limit": 5},
    }


def test_search_wiki_omits_optional_fields() -> None:
    client = RecordingClient()
    search_wiki(client, workspace_id="ws-1", dataset_ids=["ds-1"], queries=["q"])
    assert client.calls[0]["body"]["WikiSearch"] == {"Queries": ["q"]}


@pytest.mark.parametrize(
    "kwargs",
    [
        {"workspace_id": "", "dataset_ids": ["ds-1"], "queries": ["q"]},
        {"workspace_id": "ws-1", "dataset_ids": [], "queries": ["q"]},
        {"workspace_id": "ws-1", "dataset_ids": ["ds-1"], "queries": []},
    ],
)
def test_search_wiki_required_fields(kwargs: dict[str, Any]) -> None:
    with pytest.raises(ValueError):
        search_wiki(RecordingClient(), **kwargs)


# --- read_wiki_page (wiki_read_page) ----------------------------------------


def test_read_wiki_page_request() -> None:
    client = RecordingClient()
    read_wiki_page(
        client, workspace_id="ws-1", dataset_ids=["ds-1"], slug="concept/foo"
    )
    assert client.calls[0]["body"] == {
        "WorkspaceID": "ws-1",
        "DatasetIDs": ["ds-1"],
        "ToolName": "wiki_read_page",
        "WikiReadPage": {"Slug": "concept/foo"},
    }


@pytest.mark.parametrize(
    "kwargs",
    [
        {"workspace_id": "", "dataset_ids": ["ds-1"], "slug": "s"},
        {"workspace_id": "ws-1", "dataset_ids": [], "slug": "s"},
        {"workspace_id": "ws-1", "dataset_ids": ["ds-1"], "slug": ""},
    ],
)
def test_read_wiki_page_required_fields(kwargs: dict[str, Any]) -> None:
    with pytest.raises(ValueError):
        read_wiki_page(RecordingClient(), **kwargs)


# --- read_wiki_source_chunk (wiki_read_source_chunk) ------------------------------


def test_read_wiki_source_chunk_builds_oneof_request() -> None:
    client = RecordingClient()
    read_wiki_source_chunk(
        client,
        workspace_id="ws-1",
        dataset_ids=["ds-1"],
        slug="concept/foo",
        limit=3,
        overlap=2,
        cursor_segment_id="seg-2",
    )
    assert client.calls[0]["body"] == {
        "WorkspaceID": "ws-1",
        "DatasetIDs": ["ds-1"],
        "ToolName": "wiki_read_source_chunk",
        "WikiReadSourceChunk": {
            "Slug": "concept/foo",
            "Limit": 3,
            "Overlap": 2,
            "CursorSegmentID": "seg-2",
        },
    }


def test_read_wiki_source_chunk_omits_optional_fields() -> None:
    client = RecordingClient()
    read_wiki_source_chunk(
        client, workspace_id="ws-1", dataset_ids=["ds-1"], slug="s"
    )
    assert client.calls[0]["body"]["WikiReadSourceChunk"] == {"Slug": "s"}


def test_read_wiki_source_chunk_allows_zero_overlap() -> None:
    client = RecordingClient()
    read_wiki_source_chunk(
        client, workspace_id="ws-1", dataset_ids=["ds-1"], slug="s", overlap=0
    )
    assert client.calls[0]["body"]["WikiReadSourceChunk"] == {"Slug": "s", "Overlap": 0}


@pytest.mark.parametrize(
    "kwargs",
    [
        {"workspace_id": "", "dataset_ids": ["ds-1"], "slug": "s"},
        {"workspace_id": "ws-1", "dataset_ids": [], "slug": "s"},
        {"workspace_id": "ws-1", "dataset_ids": ["ds-1"], "slug": ""},
    ],
)
def test_read_wiki_source_chunk_required_fields(kwargs: dict[str, Any]) -> None:
    with pytest.raises(ValueError):
        read_wiki_source_chunk(RecordingClient(), **kwargs)


# --- read_wiki_source_doc (dispatched via list_knowledge_chunks) ------------


def test_read_wiki_source_doc_builds_request() -> None:
    client = RecordingClient()
    read_wiki_source_doc(
        client,
        workspace_id="ws-1",
        dataset_ids=["ds-1"],
        resource_id="res-1",
        limit=5,
        cursor_segment_id="seg-2",
    )
    assert client.calls[0]["body"] == {
        "WorkspaceID": "ws-1",
        "DatasetIDs": ["ds-1"],
        "ToolName": "list_knowledge_chunks",
        "ListKnowledgeChunks": {
            "ResourceID": "res-1",
            "Limit": 5,
            "CursorSegmentID": "seg-2",
        },
    }


def test_read_wiki_source_doc_omits_optional_fields() -> None:
    client = RecordingClient()
    read_wiki_source_doc(
        client, workspace_id="ws-1", dataset_ids=["ds-1"], resource_id="res-1"
    )
    assert client.calls[0]["body"]["ListKnowledgeChunks"] == {"ResourceID": "res-1"}


@pytest.mark.parametrize(
    "kwargs",
    [
        {"workspace_id": "", "dataset_ids": ["ds-1"], "resource_id": "r"},
        {"workspace_id": "ws-1", "dataset_ids": [], "resource_id": "r"},
        {"workspace_id": "ws-1", "dataset_ids": ["ds-1"], "resource_id": ""},
    ],
)
def test_read_wiki_source_doc_required_fields(kwargs: dict[str, Any]) -> None:
    with pytest.raises(ValueError):
        read_wiki_source_doc(RecordingClient(), **kwargs)


# --- contract -----------------------------------------------------------------


def test_known_tool_names_cover_the_seven_sub_tools() -> None:
    assert set(KNOWN_TOOL_NAMES) == {
        "knowledge_search",
        "grep_chunks",
        "list_doc_infos",
        "list_knowledge_chunks",
        "wiki_search",
        "wiki_read_page",
        "wiki_read_source_chunk",
    }


def test_user_info_passed_through() -> None:
    client = RecordingClient()
    search_knowledge(
        client,
        workspace_id="ws-1",
        dataset_ids=["ds-1"],
        queries=["q"],
        user_info={"UserID": "u-1", "UserChannel": "web"},
    )
    assert client.calls[0]["body"]["UserInfo"] == {"UserID": "u-1", "UserChannel": "web"}


def test_user_info_omitted_when_absent() -> None:
    client = RecordingClient()
    read_wiki_page(client, workspace_id="ws-1", dataset_ids=["ds-1"], slug="s")
    assert "UserInfo" not in client.calls[0]["body"]


def test_all_calls_use_action_version_service() -> None:
    client = RecordingClient()
    search_knowledge(client, workspace_id="ws-1", dataset_ids=["ds-1"], queries=["q"])
    call = client.calls[0]
    assert call["action"] == "CallKnowledgeEngineTool"
    assert call["version"] == "2023-08-01"
    assert call["service"] == "app"
