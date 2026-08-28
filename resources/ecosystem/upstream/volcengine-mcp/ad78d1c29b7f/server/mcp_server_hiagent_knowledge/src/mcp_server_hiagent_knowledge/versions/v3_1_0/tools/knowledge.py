"""HiAgent Knowledge Engine OpenAPI tools.

The HiAgent OpenAPI exposes knowledge-engine capabilities through a single
``CallKnowledgeEngineTool`` action whose ``ToolName`` field selects a sub-tool
and whose request carries a same-named PascalCase parameter object (e.g.
``KnowledgeSearch``, ``GrepChunks``).

This module maps each ``(ToolName, parameter-object)`` combination to a
**separate MCP tool named after the user-facing capability**, with a flat
argument schema; the handler assembles the request body with field names kept
strictly identical to the OpenAPI contract.

Capability tool  -> ToolName            -> parameter object
  search_knowledge      -> knowledge_search      -> KnowledgeSearch
  grep_knowledge_chunks -> grep_chunks           -> GrepChunks
  list_document_infos   -> list_doc_infos         -> ListDocInfos
  list_document_chunks  -> list_knowledge_chunks -> ListKnowledgeChunks
  search_wiki           -> wiki_search           -> WikiSearch
  read_wiki_page        -> wiki_read_page        -> WikiReadPage
  read_wiki_source_chunk -> wiki_read_source_chunk -> WikiReadSourceChunk
  read_wiki_source_doc  -> list_knowledge_chunks -> ListKnowledgeChunks

The two Wiki source read-back capabilities are complementary:
``read_wiki_source_chunk`` resolves a Wiki page's referenced chunks by ``slug``
(wiki_read_source_chunk), while ``read_wiki_source_doc`` reads one referenced
source document's chunks in order by ``resource_id`` (dispatched through
list_knowledge_chunks).

Every sub-tool also accepts an optional ``user_info`` (the OpenAPI ``UserInfo``
end-user identity, ``{"UserID": ..., "UserChannel": ...}``) forwarded verbatim.
The backend applies knowledge-base / document-level permission filtering to it
only when ``UserChannel`` is ``"IAM"`` (or a ``"Lark"`` identity it can map to an
IAM user) and ``UserID`` is a real user in the tenant; other channels are treated
as guest. Pass it to make retrieval honor an end user's own access rights.
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence

from fastmcp import FastMCP

from mcp_server_hiagent_knowledge.versions.v3_1_0.tools._common import (
    OPENAPI_SERVICE,
    OPENAPI_VERSION,
    OpenAPIClient,
)

# The single OpenAPI action every knowledge-engine capability dispatches through.
KNOWLEDGE_ENGINE_ACTION = "CallKnowledgeEngineTool"

# MCP tool names registered by ``register_knowledge_tools`` (single source of
# truth for tool-scope filtering). Distinct from ``KNOWN_TOOL_NAMES`` below,
# which are the raw OpenAPI ``ToolName`` values these capabilities dispatch to.
KNOWLEDGE_TOOL_NAMES = (
    "search_knowledge",
    "grep_knowledge_chunks",
    "list_document_infos",
    "list_document_chunks",
    "search_wiki",
    "read_wiki_page",
    "read_wiki_source_chunk",
    "read_wiki_source_doc",
)

# All knowledge-engine sub-tools, keyed by the OpenAPI ``ToolName`` value.
KNOWN_TOOL_NAMES = (
    "knowledge_search",
    "grep_chunks",
    "list_doc_infos",
    "list_knowledge_chunks",
    "wiki_search",
    "wiki_read_page",
    "wiki_read_source_chunk",
)


def _call_knowledge_engine(
    client: OpenAPIClient,
    *,
    workspace_id: str,
    dataset_ids: Sequence[str],
    tool_name: str,
    parameter_field: str | None = None,
    parameter_object: dict[str, object] | None = None,
    user_info: Mapping[str, object] | None = None,
) -> dict[str, object]:
    """Assemble and send a ``CallKnowledgeEngineTool`` request.

    Shared by every capability handler. ``parameter_object`` is placed under the
    PascalCase ``parameter_field`` (e.g. ``KnowledgeSearch``); callers pass the
    already-built object so field names stay strictly aligned with the OpenAPI
    contract. ``user_info`` is forwarded verbatim as the top-level ``UserInfo``
    end-user identity when provided.

    Argument *values* are not validated here: field ranges, enums and
    cross-field rules are the backend service's responsibility and are
    version-specific, so the server's ``InvalidParameter.*`` errors are passed
    through to the caller rather than duplicated locally. Only the presence of
    the fields this server must always send (``WorkspaceID`` / ``DatasetIDs`` /
    a known ``ToolName``) is asserted.
    """

    if not workspace_id:
        raise ValueError("workspace_id is required")
    if not dataset_ids:
        raise ValueError("dataset_ids must contain at least one dataset id")
    if tool_name not in KNOWN_TOOL_NAMES:
        raise ValueError(
            f"unknown tool_name {tool_name!r}; known tools: {KNOWN_TOOL_NAMES}"
        )

    body: dict[str, object] = {
        "WorkspaceID": workspace_id,
        "DatasetIDs": list(dataset_ids),
        "ToolName": tool_name,
    }
    if parameter_field is not None and parameter_object is not None:
        body[parameter_field] = parameter_object
    if user_info:
        body["UserInfo"] = dict(user_info)

    return client.call(
        action=KNOWLEDGE_ENGINE_ACTION,
        version=OPENAPI_VERSION,
        service=OPENAPI_SERVICE,
        body=body,
    )


# --- capability handlers ----------------------------------------------------

def search_knowledge(
    client: OpenAPIClient,
    *,
    workspace_id: str,
    dataset_ids: Sequence[str],
    queries: Sequence[str],
    user_info: Mapping[str, object] | None = None,
) -> dict[str, object]:
    """Semantic knowledge retrieval (CallKnowledgeEngineTool/knowledge_search)."""

    if not queries:
        raise ValueError("queries must contain at least one query")

    search: dict[str, object] = {"Queries": list(queries)}

    return _call_knowledge_engine(
        client,
        workspace_id=workspace_id,
        dataset_ids=dataset_ids,
        tool_name="knowledge_search",
        parameter_field="KnowledgeSearch",
        parameter_object=search,
        user_info=user_info,
    )


def grep_knowledge_chunks(
    client: OpenAPIClient,
    *,
    workspace_id: str,
    dataset_ids: Sequence[str],
    pattern: str,
    queries: Sequence[str] | None = None,
    limit: int | None = None,
    grep_type: str | None = None,
    resource_ids: Sequence[str] | None = None,
    user_info: Mapping[str, object] | None = None,
) -> dict[str, object]:
    """Match knowledge chunks by RE2 regex (CallKnowledgeEngineTool/grep_chunks).

    Narrows candidates through retrieval, then applies ``pattern``. Not an
    exhaustive full-dataset scan. ``grep_type`` selects the scan scope
    (``dataset_ids`` default, or ``resource_ids`` to restrict to specific
    documents named in ``resource_ids``); scope rules are enforced by the
    OpenAPI layer.
    """

    if not pattern:
        raise ValueError("pattern is required")

    grep: dict[str, object] = {"Pattern": pattern}
    if queries:
        grep["Queries"] = list(queries)
    if limit is not None:
        grep["Limit"] = limit
    if grep_type:
        grep["GrepType"] = grep_type
    if resource_ids:
        grep["ResourceIDs"] = list(resource_ids)

    return _call_knowledge_engine(
        client,
        workspace_id=workspace_id,
        dataset_ids=dataset_ids,
        tool_name="grep_chunks",
        parameter_field="GrepChunks",
        parameter_object=grep,
        user_info=user_info,
    )


def list_document_infos(
    client: OpenAPIClient,
    *,
    workspace_id: str,
    dataset_ids: Sequence[str],
    resource_ids: Mapping[str, Sequence[str]],
    user_info: Mapping[str, object] | None = None,
) -> dict[str, object]:
    """Read metadata for documents, batched by dataset
    (CallKnowledgeEngineTool/list_doc_infos).

    ``resource_ids`` maps each dataset id to the resource ids to describe; its
    keys must be within ``dataset_ids``. Returns each document's title/type/size/
    status/segment count/timestamps. Metadata only, not document content.
    """

    if not resource_ids:
        raise ValueError("resource_ids must contain at least one dataset entry")
    normalized: dict[str, list[str]] = {}
    for dataset_id, ids in resource_ids.items():
        if not dataset_id:
            raise ValueError("resource_ids keys (dataset ids) must be non-empty")
        id_list = list(ids)
        if not id_list:
            raise ValueError(
                f"resource_ids[{dataset_id!r}] must contain at least one resource id"
            )
        normalized[dataset_id] = id_list

    return _call_knowledge_engine(
        client,
        workspace_id=workspace_id,
        dataset_ids=dataset_ids,
        tool_name="list_doc_infos",
        parameter_field="ListDocInfos",
        parameter_object={"ResourceIDs": normalized},
        user_info=user_info,
    )


def list_document_chunks(
    client: OpenAPIClient,
    *,
    workspace_id: str,
    dataset_ids: Sequence[str],
    resource_id: str,
    limit: int | None = None,
    cursor_segment_id: str | None = None,
    user_info: Mapping[str, object] | None = None,
) -> dict[str, object]:
    """List one document's chunks in reading order
    (CallKnowledgeEngineTool/list_knowledge_chunks).

    Walks a single ``resource_id`` sequentially, paging with
    ``cursor_segment_id``.
    """

    if not resource_id:
        raise ValueError("resource_id is required")

    chunks: dict[str, object] = {"ResourceID": resource_id}
    if limit is not None:
        chunks["Limit"] = limit
    if cursor_segment_id:
        chunks["CursorSegmentID"] = cursor_segment_id

    return _call_knowledge_engine(
        client,
        workspace_id=workspace_id,
        dataset_ids=dataset_ids,
        tool_name="list_knowledge_chunks",
        parameter_field="ListKnowledgeChunks",
        parameter_object=chunks,
        user_info=user_info,
    )


def search_wiki(
    client: OpenAPIClient,
    *,
    workspace_id: str,
    dataset_ids: Sequence[str],
    queries: Sequence[str],
    limit: int | None = None,
    user_info: Mapping[str, object] | None = None,
) -> dict[str, object]:
    """Search generated Wiki pages (CallKnowledgeEngineTool/wiki_search).

    Returns Wiki page candidates (with ``Slug``) for navigation, not final
    evidence. Read a page with ``read_wiki_page`` / ``read_wiki_source_chunk``.
    """

    if not queries:
        raise ValueError("queries must contain at least one query")

    wiki: dict[str, object] = {"Queries": list(queries)}
    if limit is not None:
        wiki["Limit"] = limit

    return _call_knowledge_engine(
        client,
        workspace_id=workspace_id,
        dataset_ids=dataset_ids,
        tool_name="wiki_search",
        parameter_field="WikiSearch",
        parameter_object=wiki,
        user_info=user_info,
    )


def read_wiki_page(
    client: OpenAPIClient,
    *,
    workspace_id: str,
    dataset_ids: Sequence[str],
    slug: str,
    user_info: Mapping[str, object] | None = None,
) -> dict[str, object]:
    """Read one generated Wiki page by slug
    (CallKnowledgeEngineTool/wiki_read_page).

    Wiki pages are generated navigation material; read the original sources with
    ``read_wiki_source_chunk`` before answering with facts.
    """

    if not slug:
        raise ValueError("slug is required")

    return _call_knowledge_engine(
        client,
        workspace_id=workspace_id,
        dataset_ids=dataset_ids,
        tool_name="wiki_read_page",
        parameter_field="WikiReadPage",
        parameter_object={"Slug": slug},
        user_info=user_info,
    )


def read_wiki_source_chunk(
    client: OpenAPIClient,
    *,
    workspace_id: str,
    dataset_ids: Sequence[str],
    slug: str,
    limit: int | None = None,
    overlap: int | None = None,
    cursor_segment_id: str | None = None,
    user_info: Mapping[str, object] | None = None,
) -> dict[str, object]:
    """Read a Wiki page's referenced source chunks, resolved by page slug
    (CallKnowledgeEngineTool/wiki_read_source_chunk).

    Reads the chunks a Wiki page references (its ``chunk_refs``) given the page
    ``slug`` — the final evidence for facts/numbers/quotes. ``overlap`` expands
    each referenced chunk with adjacent segments for more context. Page forward
    with ``cursor_segment_id``. To instead read one referenced source document's
    chunks in order by its resource id, use ``read_wiki_source_doc``.
    """

    if not slug:
        raise ValueError("slug is required")

    src: dict[str, object] = {"Slug": slug}
    if limit is not None:
        src["Limit"] = limit
    if overlap is not None:
        src["Overlap"] = overlap
    if cursor_segment_id:
        src["CursorSegmentID"] = cursor_segment_id

    return _call_knowledge_engine(
        client,
        workspace_id=workspace_id,
        dataset_ids=dataset_ids,
        tool_name="wiki_read_source_chunk",
        parameter_field="WikiReadSourceChunk",
        parameter_object=src,
        user_info=user_info,
    )


def read_wiki_source_doc(
    client: OpenAPIClient,
    *,
    workspace_id: str,
    dataset_ids: Sequence[str],
    resource_id: str,
    limit: int | None = None,
    cursor_segment_id: str | None = None,
    user_info: Mapping[str, object] | None = None,
) -> dict[str, object]:
    """Read one Wiki source document's chunks in order, by resource id
    (dispatched through CallKnowledgeEngineTool/list_knowledge_chunks).

    Companion to ``read_wiki_source_chunk``: where that resolves a page's referenced
    chunks by ``slug``, this reads a single referenced source document
    (``resource_id``, e.g. taken from a Wiki page's ``SourceRefs``) chunk by
    chunk in reading order. It likewise dispatches through ``list_knowledge_chunks``
    and returns ``ListKnowledgeChunks``. Page forward with ``cursor_segment_id``.

    Reading a source document by ``resource_id`` is exactly ``list_document_chunks``;
    this thin wrapper reuses that implementation under a Wiki-tracing capability
    name so the paging logic lives in one place.
    """

    return list_document_chunks(
        client,
        workspace_id=workspace_id,
        dataset_ids=dataset_ids,
        resource_id=resource_id,
        limit=limit,
        cursor_segment_id=cursor_segment_id,
        user_info=user_info,
    )


def register_knowledge_tools(mcp: FastMCP, client: OpenAPIClient) -> None:
    """Register the knowledge-engine capability tools on a FastMCP server.

    Each capability of the ``CallKnowledgeEngineTool`` action is exposed as a
    distinct, capability-named MCP tool rather than one generic tool keyed by a
    raw OpenAPI ``ToolName``.
    """

    @mcp.tool(name="search_knowledge")
    def search_knowledge_tool(
        workspace_id: str,
        dataset_ids: list[str],
        queries: list[str],
        user_info: dict[str, object] | None = None,
    ) -> dict[str, object]:
        """语义检索：适合概念、解释、概览、改写类问题（"是什么"/"为什么"/"怎么做"/"总结"/"对比"），
        即答案措辞可能与提问不同的场景。返回候选分段用于导航——把它们当作"在哪找"，
        而非最终证据；回答事实前建议用 ``list_document_chunks`` 深读原文。

        用 ``list_datasets`` 获取知识库 id。常与 ``grep_knowledge_chunks``（精确锚定）配合以扩大召回。

        参数：
        - workspace_id：知识库所属的 workspace。
        - dataset_ids：要检索的知识库 id 列表，至少 1 个。
        - queries：1~5 个简短、独立的自然语言问题或概念描述；不要传原始对话或长段落。
        - user_info：可选的终端用户身份，{"UserID": ..., "UserChannel": ...}，原样透传；仅 IAM/可映射的 Lark 渠道参与权限过滤（详见模块说明）。
        """

        return search_knowledge(
            client,
            workspace_id=workspace_id,
            dataset_ids=dataset_ids,
            queries=queries,
            user_info=user_info,
        )

    @mcp.tool(name="grep_knowledge_chunks")
    def grep_knowledge_chunks_tool(
        workspace_id: str,
        dataset_ids: list[str],
        pattern: str,
        queries: list[str] | None = None,
        limit: int | None = None,
        grep_type: str | None = None,
        resource_ids: list[str] | None = None,
        user_info: dict[str, object] | None = None,
    ) -> dict[str, object]:
        """用一条 RE2 正则定位精确文本——适合标识符、固定短语、字段/API 名、版本号、错误码等
        对措辞敏感的场景。先缩小召回候选再套用正则，不保证穷举整个数据集。返回候选分段（在哪找），
        不是最终证据；回答前建议用 ``list_document_chunks`` 深读原文。

        技巧：把近义/别名打包进 ONE 条并列正则 ``alias_a|alias_b|alias_c``，不要多次调用；
        当 ``pattern`` 含正则运算符时，在 ``queries`` 里给不含运算符的可检索词以先召回候选。
        常在 ``search_knowledge`` 之前用于实体锚定。

        参数：
        - workspace_id：知识库所属的 workspace。
        - dataset_ids：要检索的知识库 id 列表，至少 1 个。
        - pattern：一条 RE2 正则（用 ``|`` 组合；不支持反向引用/前后瞻）。
        - queries：可选，1~5 个字面检索词，套用正则前先召回候选分段。
        - limit：返回的候选匹配数上限。
        - grep_type：扫描范围，``dataset_ids``（默认）或 ``resource_ids``。
        - resource_ids：限定扫描的文档/资源 id 列表；当 ``grep_type`` 为 ``resource_ids`` 时必填。
        - user_info：可选的终端用户身份，{"UserID": ..., "UserChannel": ...}，原样透传；仅 IAM/可映射的 Lark 渠道参与权限过滤（详见模块说明）。
        """

        return grep_knowledge_chunks(
            client,
            workspace_id=workspace_id,
            dataset_ids=dataset_ids,
            pattern=pattern,
            queries=queries,
            limit=limit,
            grep_type=grep_type,
            resource_ids=resource_ids,
            user_info=user_info,
        )

    @mcp.tool(name="list_document_infos")
    def list_document_infos_tool(
        workspace_id: str,
        dataset_ids: list[str],
        resource_ids: dict[str, list[str]],
        user_info: dict[str, object] | None = None,
    ) -> dict[str, object]:
        """批量读取文档元数据（标题、类型、大小、状态、分段数、时间戳）。这是用于识别或对比文档的
        "目录"，不能作为正文事实、规则、数字或引文的证据；要看正文请用 ``list_document_chunks`` 深读。

        参数：
        - workspace_id：知识库所属的 workspace。
        - dataset_ids：涉及的知识库 id 列表，至少 1 个。
        - resource_ids：知识库 id -> 该库下文档/资源 id 列表 的映射（key 必须在 ``dataset_ids`` 内），
          如 {"dataset-1": ["resource-1", "resource-2"]}；同一库的 id 合并为一次批量调用。
        - user_info：可选的终端用户身份，{"UserID": ..., "UserChannel": ...}，原样透传；仅 IAM/可映射的 Lark 渠道参与权限过滤（详见模块说明）。
        """

        return list_document_infos(
            client,
            workspace_id=workspace_id,
            dataset_ids=dataset_ids,
            resource_ids=resource_ids,
            user_info=user_info,
        )

    @mcp.tool(name="list_document_chunks")
    def list_document_chunks_tool(
        workspace_id: str,
        dataset_ids: list[str],
        resource_id: str,
        limit: int | None = None,
        cursor_segment_id: str | None = None,
        user_info: dict[str, object] | None = None,
    ) -> dict[str, object]:
        """按阅读顺序深读单个文档的原始分段——当答案依赖完整上下文而非孤立片段时，
        推荐在 ``search_knowledge`` / ``grep_knowledge_chunks`` 命中相关文档后用它接力深读。
        搜索工具告诉你"在哪"，本工具告诉你"文档到底写了什么"。

        参数：
        - workspace_id：知识库所属的 workspace。
        - dataset_ids：资源所属的知识库 id 列表，至少 1 个。
        - resource_id：要深读的文档/资源（来自前一步 search/grep 结果）。
        - limit：每页最多读取的有序分段数。
        - cursor_segment_id：续读游标；从头读时不要传。只能复用**同一文档**上一次调用返回的游标，
          不要跨文档、跨工具串用游标。
        - user_info：可选的终端用户身份，{"UserID": ..., "UserChannel": ...}，原样透传；仅 IAM/可映射的 Lark 渠道参与权限过滤（详见模块说明）。
        """

        return list_document_chunks(
            client,
            workspace_id=workspace_id,
            dataset_ids=dataset_ids,
            resource_id=resource_id,
            limit=limit,
            cursor_segment_id=cursor_segment_id,
            user_info=user_info,
        )

    @mcp.tool(name="search_wiki")
    def search_wiki_tool(
        workspace_id: str,
        dataset_ids: list[str],
        queries: list[str],
        limit: int | None = None,
        user_info: dict[str, object] | None = None,
    ) -> dict[str, object]:
        """用 BM25 关键词匹配找到入口 Wiki 页。返回页面候选（含 ``Slug``）仅用于
        导航——结果是摘要，不是证据，不能只凭搜索结果作答；建议用
        ``read_wiki_page`` 读取选中页面的正文。

        参数：
        - workspace_id：知识库所属的 workspace。
        - dataset_ids：要检索的知识库 id 列表，至少 1 个。
        - queries：1~5 个简短关键词查询；保留有区分度的实体、产品名、缩写与精确
          术语；别名或不同表述建议拆成不同查询。
        - limit：返回的 Wiki 页面候选数上限。
        - user_info：可选的终端用户身份，{"UserID": ..., "UserChannel": ...}，原样透传；仅 IAM/可映射的 Lark 渠道参与权限过滤（详见模块说明）。
        """

        return search_wiki(
            client,
            workspace_id=workspace_id,
            dataset_ids=dataset_ids,
            queries=queries,
            limit=limit,
            user_info=user_info,
        )

    @mcp.tool(name="read_wiki_page")
    def read_wiki_page_tool(
        workspace_id: str,
        dataset_ids: list[str],
        slug: str,
        user_info: dict[str, object] | None = None,
    ) -> dict[str, object]:
        """读取单个 Wiki 页面的完整内容——阅读 Wiki 材料的主力工具，适用于
        ``search_wiki`` 找到的页面、从其他页面链接过来的页面，或特殊的
        ``index`` 页（建议先读 ``index`` 获取知识库整体概览）。返回结果还会带出
        相关页面（in/out 链接），可顺着链接跳 1~2 跳补充上下文。

        Wiki 页面是生成的导航材料，非最终证据；需要精确事实、数字、规则、引文或
        代码时，建议用 ``read_wiki_source_chunk``（按本页 slug 溯源引用切片）或
        ``read_wiki_source_doc``（按被引用源文档的 resource id 顺序读原文）回溯原始出处。

        参数：
        - workspace_id：知识库所属的 workspace。
        - dataset_ids：页面所属的知识库 id 列表，至少 1 个。
        - slug：Wiki 页面 slug（来自 ``search_wiki``、相关页面或 ``index``）。
        - user_info：可选的终端用户身份，{"UserID": ..., "UserChannel": ...}，原样透传；仅 IAM/可映射的 Lark 渠道参与权限过滤（详见模块说明）。
        """

        return read_wiki_page(
            client,
            workspace_id=workspace_id,
            dataset_ids=dataset_ids,
            slug=slug,
            user_info=user_info,
        )

    @mcp.tool(name="read_wiki_source_chunk")
    def read_wiki_source_chunk_tool(
        workspace_id: str,
        dataset_ids: list[str],
        slug: str,
        limit: int | None = None,
        overlap: int | None = None,
        cursor_segment_id: str | None = None,
        user_info: dict[str, object] | None = None,
    ) -> dict[str, object]:
        """按页面 ``slug`` 解析、依 ``chunk_refs`` 顺序读取某个 Wiki 页面所引用的
        源切片——获取该 Wiki 页面所依赖证据（事实、数字、引文、代码）的推荐方式。
        设 ``overlap`` > 0 可在每个引用切片前后补充邻近上下文。若想按 resource id
        顺序通读整篇被引用源文档，建议改用 ``read_wiki_source_doc``。

        参数：
        - workspace_id：知识库所属的 workspace。
        - dataset_ids：页面所属的知识库 id 列表，至少 1 个。
        - slug：要读取来源的 Wiki 页面 slug。
        - limit：每页消费的引用锚点数上限（是锚点数，不是最终返回切片数）。
        - overlap：每个锚点前后扩展的邻近分段数（0 表示仅锚点本身）。
        - cursor_segment_id：续页游标；首次读取请省略。仅可复用同一页面上一次调用
          返回的游标。
        - user_info：可选的终端用户身份，{"UserID": ..., "UserChannel": ...}，原样透传；仅 IAM/可映射的 Lark 渠道参与权限过滤（详见模块说明）。
        """

        return read_wiki_source_chunk(
            client,
            workspace_id=workspace_id,
            dataset_ids=dataset_ids,
            slug=slug,
            limit=limit,
            overlap=overlap,
            cursor_segment_id=cursor_segment_id,
            user_info=user_info,
        )

    @mcp.tool(name="read_wiki_source_doc")
    def read_wiki_source_doc_tool(
        workspace_id: str,
        dataset_ids: list[str],
        resource_id: str,
        limit: int | None = None,
        cursor_segment_id: str | None = None,
        user_info: dict[str, object] | None = None,
    ) -> dict[str, object]:
        """按 resource id 顺序读取整篇被引用源文档的切片——当你想按原文顺序通读
        （而非只读某页面所引用的切片）时，直接读取源文档的推荐方式，例如取 Wiki
        页面 ``SourceRefs`` 中的某个 ``resource_id``。与 ``read_wiki_source_chunk``
        互补（后者按页面 slug 解析引用切片）。

        参数：
        - workspace_id：知识库所属的 workspace。
        - dataset_ids：资源所属的知识库 id 列表，至少 1 个。
        - resource_id：要读取的被引用源文档/资源 id（例如取自 Wiki 页面的 SourceRefs）。
        - limit：每页顺序返回的切片数上限。
        - cursor_segment_id：续页游标；首次读取请省略。仅可复用同一文档上一次调用
          返回的游标。
        - user_info：可选的终端用户身份，{"UserID": ..., "UserChannel": ...}，原样透传；仅 IAM/可映射的 Lark 渠道参与权限过滤（详见模块说明）。
        """

        return read_wiki_source_doc(
            client,
            workspace_id=workspace_id,
            dataset_ids=dataset_ids,
            resource_id=resource_id,
            limit=limit,
            cursor_segment_id=cursor_segment_id,
            user_info=user_info,
        )
