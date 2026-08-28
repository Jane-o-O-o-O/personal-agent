"""HiAgent Dataset (knowledge base) OpenAPI tools.

These are dependency tools for the knowledge engine: they let callers discover
the ``DatasetIDs`` (and default retrieval parameters) required by the
knowledge-engine capability tools (``search_knowledge`` / ``list_document_chunks``).
"""

from __future__ import annotations

from fastmcp import FastMCP

from mcp_server_hiagent_knowledge.versions.v3_1_0.tools._common import (
    OPENAPI_SERVICE,
    OPENAPI_VERSION,
    OpenAPIClient,
)

# Tool names registered by ``register_dataset_tools`` (single source of truth for
# tool-scope filtering).
DATASET_TOOL_NAMES = ("list_datasets", "get_dataset")


def list_datasets(
    client: OpenAPIClient,
    *,
    workspace_id: str,
    name: str | None = None,
    page_number: int = 1,
    page_size: int = 20,
) -> dict[str, object]:
    """List datasets (knowledge bases) in a workspace.

    When ``name`` is provided, it is forwarded as the ``Filter.Name`` fuzzy search
    (the backend matches it against dataset name/description); when omitted
    (``None``) no filter is sent and all datasets are listed page by page. Like
    the pagination args, the value is passed through verbatim — an empty string
    is forwarded as ``Filter.Name`` and left for the backend to interpret.
    """

    if not workspace_id:
        raise ValueError("workspace_id is required")
    body: dict[str, object] = {
        "WorkspaceID": workspace_id,
        "PageNumber": page_number,
        "PageSize": page_size,
    }
    if name is not None:
        body["Filter"] = {"Name": name}
    return client.call(
        action="ListDatasets",
        version=OPENAPI_VERSION,
        service=OPENAPI_SERVICE,
        body=body,
    )


def get_dataset(
    client: OpenAPIClient,
    *,
    workspace_id: str,
    dataset_id: str,
) -> dict[str, object]:
    """Get one dataset, including default retrieval parameters."""

    if not workspace_id:
        raise ValueError("workspace_id is required")
    if not dataset_id:
        raise ValueError("dataset_id is required")
    return client.call(
        action="GetDataset",
        version=OPENAPI_VERSION,
        service=OPENAPI_SERVICE,
        body={"WorkspaceID": workspace_id, "Id": dataset_id},
    )


def register_dataset_tools(mcp: FastMCP, client: OpenAPIClient) -> None:
    """Register dataset tools on a FastMCP server."""

    @mcp.tool(name="list_datasets")
    def list_datasets_tool(
        workspace_id: str,
        name: str | None = None,
        page_number: int = 1,
        page_size: int = 20,
    ) -> dict[str, object]:
        """列出某个 workspace 下的 HiAgent 知识库（dataset），供调用方获取知识引擎所需的 DatasetIDs。

        传入 ``name`` 可按名称模糊搜索知识库（后端对知识库名称/描述做模糊匹配）；不传则分页列出全部。

        参数：
        - workspace_id：要列出知识库的 workspace。
        - name：可选，按名称模糊搜索的关键词。
        - page_number：页码（默认 1）。
        - page_size：每页数量（默认 20）。
        """

        return list_datasets(
            client,
            workspace_id=workspace_id,
            name=name,
            page_number=page_number,
            page_size=page_size,
        )

    @mcp.tool(name="get_dataset")
    def get_dataset_tool(
        workspace_id: str,
        dataset_id: str,
    ) -> dict[str, object]:
        """获取单个 HiAgent 知识库的详情，含其默认检索参数。"""

        return get_dataset(
            client,
            workspace_id=workspace_id,
            dataset_id=dataset_id,
        )
