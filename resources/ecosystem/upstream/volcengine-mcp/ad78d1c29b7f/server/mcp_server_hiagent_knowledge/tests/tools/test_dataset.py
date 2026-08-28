from __future__ import annotations

from typing import Any

import pytest

from mcp_server_hiagent_knowledge.versions.v3_1_0.tools.dataset import get_dataset, list_datasets


class RecordingClient:
    def __init__(self) -> None:
        self.calls: list[dict[str, Any]] = []

    def call(self, **kwargs: Any) -> dict[str, object]:
        self.calls.append(kwargs)
        return {"ResponseMetadata": {"Action": kwargs["action"]}, "Result": {}}


def test_list_datasets_builds_workspace_request() -> None:
    client = RecordingClient()

    list_datasets(client, workspace_id="ws-1", page_number=2, page_size=10)

    assert client.calls[0] == {
        "action": "ListDatasets",
        "version": "2023-08-01",
        "service": "app",
        "body": {
            "WorkspaceID": "ws-1",
            "PageNumber": 2,
            "PageSize": 10,
        },
    }


def test_list_datasets_defaults() -> None:
    client = RecordingClient()

    list_datasets(client, workspace_id="ws-1")

    assert client.calls[0]["body"]["PageNumber"] == 1
    assert client.calls[0]["body"]["PageSize"] == 20


def test_list_datasets_without_name_omits_filter() -> None:
    client = RecordingClient()

    list_datasets(client, workspace_id="ws-1")

    assert "Filter" not in client.calls[0]["body"]


def test_list_datasets_name_builds_fuzzy_filter() -> None:
    client = RecordingClient()

    list_datasets(client, workspace_id="ws-1", name="finance")

    assert client.calls[0]["body"]["Filter"] == {"Name": "finance"}


def test_list_datasets_empty_name_still_builds_filter() -> None:
    # Only ``None`` omits the filter; an explicit empty string is passed through
    # verbatim (consistent with the pagination args), leaving it to the backend.
    client = RecordingClient()

    list_datasets(client, workspace_id="ws-1", name="")

    assert client.calls[0]["body"]["Filter"] == {"Name": ""}


def test_list_datasets_requires_workspace() -> None:
    with pytest.raises(ValueError):
        list_datasets(RecordingClient(), workspace_id="")


@pytest.mark.parametrize(
    "page_number,page_size",
    [(0, 20), (1, 0), (1, 101)],
)
def test_list_datasets_passes_pagination_through(page_number: int, page_size: int) -> None:
    # Pagination bounds are enforced by the OpenAPI layer, not here; whatever
    # the caller passes is forwarded verbatim.
    client = RecordingClient()
    list_datasets(
        client,
        workspace_id="ws-1",
        page_number=page_number,
        page_size=page_size,
    )
    assert client.calls[0]["body"]["PageNumber"] == page_number
    assert client.calls[0]["body"]["PageSize"] == page_size


def test_get_dataset_builds_request() -> None:
    client = RecordingClient()

    get_dataset(client, workspace_id="ws-1", dataset_id="ds-1")

    assert client.calls[0] == {
        "action": "GetDataset",
        "version": "2023-08-01",
        "service": "app",
        "body": {"WorkspaceID": "ws-1", "Id": "ds-1"},
    }


@pytest.mark.parametrize("workspace_id,dataset_id", [("", "ds-1"), ("ws-1", "")])
def test_get_dataset_requires_ids(workspace_id: str, dataset_id: str) -> None:
    with pytest.raises(ValueError):
        get_dataset(RecordingClient(), workspace_id=workspace_id, dataset_id=dataset_id)
