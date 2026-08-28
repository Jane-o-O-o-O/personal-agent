import argparse
import logging
import os
from typing import Any, Dict, Optional

from mcp.server.mcpserver import MCPServer
from mcp.server.mcpserver.context import Context

from mcp_server_openviking_controlplane.client import (
    ControlPlaneClient,
    ControlPlaneError,
    build_client,
)
from mcp_server_openviking_controlplane.config import ACCOUNT_ID_RULES

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

# Create MCP server. Transport options (host, port, path, stateless) are arguments
# to run() in mcp 2.x rather than constructor settings.
mcp = MCPServer("OpenViking Control Plane MCP Server")


def _transport_options(transport: str) -> Dict[str, Any]:
    """Transport-specific keyword arguments for MCPServer.run()."""
    if transport == "stdio":
        return {}
    options: Dict[str, Any] = {
        "host": os.getenv("MCP_SERVER_HOST", "0.0.0.0"),
        "port": int(os.getenv("MCP_SERVER_PORT") or os.getenv("PORT", "8000")),
    }
    if transport == "streamable-http":
        options["streamable_http_path"] = os.getenv("STREAMABLE_HTTP_PATH", "/mcp")
        # STATLESS_HTTP is the (misspelled) name the other servers in this repo
        # already use and document; STATELESS_HTTP is accepted as a correct-spelling
        # alias so a right-spelled config is not silently ignored.
        options["stateless_http"] = (
            os.getenv("STATLESS_HTTP", os.getenv("STATELESS_HTTP", "true")).lower() == "true"
        )
    return options


_API_KEY_HEADER = "x-agentplan-api-key"


def _request_api_key(ctx: Optional[Context]) -> Optional[str]:
    """The Ark AgentPlan ApiKey carried by the request currently being served, if any.

    Returns None under stdio (Context.headers is None when the transport carries no
    request) and None when the request carries no usable credential, in which case
    the client falls back to the AGENTPLAN_API_KEY environment variable.
    """
    headers = ctx.headers if ctx is not None else None
    if not headers:
        return None

    key = (headers.get(_API_KEY_HEADER) or "").strip()
    if key:
        return key

    # Only the Bearer scheme is accepted: a gateway that puts its OWN credential in
    # Authorization must not have it used as an Ark key -- the configured key is not
    # merely replayed as a header, it is stored as the model credential of the
    # collections this server creates.
    scheme, _, rest = (headers.get("authorization") or "").strip().partition(" ")
    if scheme.lower() == "bearer" and rest.strip():
        return rest.strip()
    return None


def get_client(ctx: Optional[Context] = None) -> ControlPlaneClient:
    """Build the control-plane client for the request currently being served.

    Deliberately not cached: under stateless HTTP a module-level singleton would
    transact every request with whatever credential the process started with.
    Construction is cheap -- the client holds no requests.Session and no sockets.
    """
    return build_client(api_key=_request_api_key(ctx))


def _err(e: Exception) -> Dict[str, Any]:
    if isinstance(e, ControlPlaneError):
        return {"error": {"code": e.code, "message": e.message, "request_id": e.request_id}}
    return {"error": {"message": str(e)}}


@mcp.tool()
def list_collections(
    project: Optional[str] = None, ctx: Optional[Context] = None
) -> Dict[str, Any]:
    """List OpenViking collections (OV libraries) under the configured account.

    Args:
        project: optional project filter; defaults to the configured project
                 (OPENVIKING_PROJECT, else "default").

    Returns:
        {"Collections": [ ...CollectionInfoData... ]}
    """
    try:
        return get_client(ctx).list_collections(project=project)
    except Exception as e:
        logger.error(f"list_collections failed: {e}")
        return _err(e)


@mcp.tool()
def get_collection(
    resource_id: str, ctx: Optional[Context] = None
) -> Dict[str, Any]:
    """Get basic info of one OpenViking collection by ResourceID.

    Args:
        resource_id: target library ResourceID (the unique primary key).

    Returns:
        CollectionInfoData: Name, Creator, Project, ResourceID, Version, Source,
        Description, Status, OpenvikingVersion, VLM/Embedding (no secrets), CreateTime,
        UpdateTime (Unix seconds), etc.
    """
    try:
        return get_client(ctx).get_collection(resource_id)
    except Exception as e:
        logger.error(f"get_collection failed: {e}")
        return _err(e)


@mcp.tool()
def get_usage(
    resource_id: str,
    account_id: Optional[str] = None,
    user_id: Optional[str] = None,
    ctx: Optional[Context] = None,
) -> Dict[str, Any]:
    """Get library-wide or account/user-scoped usage and file counts.

    Args:
        resource_id: target library ResourceID.
        account_id: optional data space (account) scope; omit for whole-library
                    usage, or the default data space when user_id is supplied.
        user_id: optional user scope; supported with or without account_id.

    Returns:
        {"CurContextFileNum", "ResourcesFileNum", "UserFileNum",
         "FreshTime" (Unix seconds), "EstimatedCosts", "EstimatedBilling"}.
         For library-wide queries, EstimatedBilling adds CNY / hour plus PayType
         and, for AgentPlan payment, the equivalent AFP / hour. Scoped responses
         (when account_id and/or user_id is set) omit the library-wide
         EstimatedCosts and EstimatedBilling because they would be misleading.
    """
    try:
        return get_client(ctx).get_usage(
            resource_id,
            account_id=account_id,
            user_id=user_id,
        )
    except Exception as e:
        logger.error(f"get_usage failed: {e}")
        return _err(e)


@mcp.tool()
def get_collection_api_key(
    resource_id: str,
    user_id: Optional[str] = None,
    account_id: Optional[str] = None,
    ctx: Optional[Context] = None,
) -> Dict[str, Any]:
    """Get one user's plaintext data-plane API Key.

    Backed by the action GetOpenVikingCollectionUserAccess. When user_id is omitted,
    returns the selected data space's default-user credential; enterprise libraries
    can select a specific user. You can only query libraries associated with your
    control-plane credential; there is no cross-owner / sudo lookup. NOTE: the
    ApiKey is plaintext — handle and surface it with care.

    Args:
        resource_id: target library ResourceID.
        user_id: optional target UserID; omit for the selected data space's
                 default user.
        account_id: optional data space (account); omit for the default data space.

    Returns:
        {"UserID", "Role", "ApiKey"}
    """
    try:
        return get_client(ctx).get_user_access(
            resource_id,
            user_id=user_id,
            account_id=account_id,
        )
    except Exception as e:
        logger.error(f"get_collection_api_key failed: {e}")
        return _err(e)


@mcp.tool()
def create_collection(
    name: str,
    version: str = "developer",
    project: Optional[str] = None,
    description: Optional[str] = None,
    pay_type: Optional[str] = None,
    seat_id: Optional[str] = None,
    ctx: Optional[Context] = None,
) -> Dict[str, Any]:
    """⚠️ Creates a NEW, BILLABLE OpenViking collection (provisions a Helm release).

    CONFIRM WITH THE USER before calling — this consumes paid quota (max 20 libraries
    per account, returns QuotaExceeded beyond that). Requires the account to have
    AgentPlan deduction activated (otherwise ProductUnordered). Do NOT call
    speculatively.

    ⚠️ BILLING: if pay_type/seat_id are BOTH omitted, this client DEFAULTS the
    library to "agentplan_personal" (AFP deduction from the account's personal
    AgentPlan) — it deliberately does NOT fall through to the server default
    volc_pay, which would place the library on Volcano pay-as-you-go billing
    without an explicit decision. Accounts with no personal plan
    (e.g. enterprise seat keys) must pass pay_type="agentplan_enterprise" +
    seat_id (or "volc_pay"); otherwise the library binds a non-existent
    personal plan, deduction fails and the library is disabled. Confirm the
    intended billing with the user before creating.

    The public tool always uses the AgentPlan model path. Model source, model
    parameters, model credentials, and the OpenViking image version are intentionally
    not configurable here.

    Args:
        name: library name, regex ^[a-zA-Z][a-zA-Z0-9_]*$, length <= 64.
        version: library tier — "developer" (default) or "enterprise". Sets the
                 RATE only (enterprise: 25 AFP baseline / 200k files, then tiered
                 per 100k files beyond); billing SOURCE is pay_type, orthogonal.
        project: project name; defaults to the configured project.
        description: optional, length <= 65535.
        pay_type: how the library is billed — "agentplan_personal" (personal
                  AgentPlan AFP deduction; the default when omitted),
                  "agentplan_enterprise" (an enterprise seat's AFP pays;
                  requires seat_id), or "volc_pay" (Volcano pay-as-you-go,
                  billed to the Volcano account; must be chosen explicitly).
                  NEVER guess personal vs enterprise from the key.
        seat_id: the AgentPlan enterprise seat that pays (e.g. "seat-2026...").
                 Required with pay_type="agentplan_enterprise", forbidden
                 otherwise. The user must copy it manually from the Ark console
                 seat-management page — there is no lookup API, and the server
                 does NOT verify the seat exists: a typo only surfaces at the
                 next hourly deduction, which then disables the library.

    Returns:
        {"ResourceID": "...", "Success": true}
    """
    try:
        return get_client(ctx).create_collection(
            name=name,
            source="agentplan",
            version=version,
            project=project,
            description=description,
            pay_type=pay_type,
            seat_id=seat_id,
        )
    except Exception as e:
        logger.error(f"create_collection failed: {e}")
        return _err(e)


@mcp.tool()
def update_collection(
    resource_id: str,
    description: Optional[str] = None,
    pay_type: Optional[str] = None,
    seat_id: Optional[str] = None,
    model_api_key: Optional[str] = None,
    ctx: Optional[Context] = None,
) -> Dict[str, Any]:
    """Update mutable fields of an OpenViking collection (UpdateOpenVikingCollection).

    Requires the AgentPlan key to be associated with the target library. CONFIRM WITH
    THE USER before calling — this mutates a live library. This is also the way to
    SWITCH BILLING (volc_pay ↔ AgentPlan deduction, or re-bind a seat after it
    was unbound); omitting both pay_type and seat_id leaves billing untouched.
    Model configuration is not sent unless model_api_key is given, so description
    and billing changes preserve existing VLM/Embedding credentials. NOTE: an
    empty/whitespace description is a server-side no-op — the description can only
    be overwritten with a non-empty value.

    Args:
        resource_id: target library ResourceID.
        description: new description, length <= 65535 (non-empty to take effect).
        pay_type: new billing — "agentplan_personal" (personal AgentPlan AFP),
                  "agentplan_enterprise" (an enterprise seat's AFP; requires
                  seat_id), or "volc_pay" (Volcano pay-as-you-go, billed to the
                  Volcano account). Always an explicit user choice; NEVER guess
                  personal vs enterprise from the key.
        seat_id: the AgentPlan enterprise seat that pays. Required with
                 pay_type="agentplan_enterprise", forbidden otherwise. Copied
                 manually by the user from the Ark console seat-management page;
                 the server does NOT verify the seat exists.
        model_api_key: AgentPlan API key to write as the library's MODEL
                       credential; VLM and Embedding always share one key. Only
                       pass a key the user supplied for this purpose — it
                       REPLACES the stored model credential. Omit to leave model
                       credentials untouched.

    Returns:
        {"Success": true}, plus "Note" when model credentials were rewritten.
    """
    try:
        return get_client(ctx).update_collection(
            resource_id,
            description=description,
            pay_type=pay_type,
            seat_id=seat_id,
            model_api_key=model_api_key,
        )
    except Exception as e:
        logger.error(f"update_collection failed: {e}")
        return _err(e)


@mcp.tool()
def list_collection_users(
    resource_id: str,
    user_id: Optional[str] = None,
    role: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    account_id: Optional[str] = None,
    ctx: Optional[Context] = None,
) -> Dict[str, Any]:
    """List the users registered under one OpenViking collection.

    Backed by ListOpenVikingCollectionUser. Requires the AgentPlan key to be
    associated with the target library. NOTE: the ApiKey in each entry is MASKED;
    to get a plaintext data-plane key use get_collection_api_key.

    Args:
        resource_id: target library ResourceID.
        user_id: optional exact UserID filter.
        role: optional role filter, e.g. "admin" or "user".
        page: 1-based page number; defaults to 1.
        limit: users per page, 1 to 200; defaults to 20.
        account_id: optional data space (account); omit for the default data space.

    Returns:
        {"UserList": [ {"UserID", "Role", "ApiKey" (masked)} ], "Total": N}
    """
    try:
        return get_client(ctx).list_collection_users(
            resource_id,
            user_id=user_id,
            role=role,
            page=page,
            limit=limit,
            account_id=account_id,
        )
    except Exception as e:
        logger.error(f"list_collection_users failed: {e}")
        return _err(e)


@mcp.tool()
def register_collection_user(
    resource_id: str,
    user_id: str,
    account_id: Optional[str] = None,
    ctx: Optional[Context] = None,
) -> Dict[str, Any]:
    """Register a NEW user under an OpenViking collection (RegisterOpenVikingUser).

    Requires the AgentPlan key to be associated with the target library. CONFIRM
    WITH THE USER before calling — this creates a new credentialed regular "user".
    The backend does not support choosing another role.

    Args:
        resource_id: target library ResourceID.
        user_id: the UserID for the new user (unique within the data space).
        account_id: optional data space (account); omit for the default data space.

    Returns:
        {"Success": true}
    """
    try:
        return get_client(ctx).register_user(
            resource_id,
            user_id,
            account_id=account_id,
        )
    except Exception as e:
        logger.error(f"register_collection_user failed: {e}")
        return _err(e)


@mcp.tool()
def update_collection_user(
    resource_id: str,
    user_id: str,
    regenerate_key: bool,
    account_id: Optional[str] = None,
    ctx: Optional[Context] = None,
) -> Dict[str, Any]:
    """Update a user under an OpenViking collection (currently API Key rotation).

    Requires the AgentPlan key to be associated with the target library. CONFIRM
    WITH THE USER before calling with regenerate_key=true because the old key stops
    working. The backend currently has no role-update operation.

    Args:
        resource_id: target library ResourceID.
        user_id: the UserID to update.
        regenerate_key: true to rotate the user's data-plane API Key.
        account_id: optional data space (account); omit for the default data space.

    Returns:
        {"Success": true}
    """
    try:
        return get_client(ctx).update_user(
            resource_id,
            user_id,
            regenerate_key=regenerate_key,
            account_id=account_id,
        )
    except Exception as e:
        logger.error(f"update_collection_user failed: {e}")
        return _err(e)


@mcp.tool()
def delete_collection_user(
    resource_id: str,
    user_id: str,
    account_id: Optional[str] = None,
    ctx: Optional[Context] = None,
) -> Dict[str, Any]:
    """⚠️ Delete a user from an OpenViking collection (DeleteOpenVikingUser).

    CONFIRM WITH THE USER before calling. This revokes the user's credential and
    cannot be undone. Requires the AgentPlan key to be associated with the library.

    Args:
        resource_id: target library ResourceID.
        user_id: the UserID to delete.
        account_id: optional data space (account); omit for the default data space.

    Returns:
        {"Success": true}
    """
    try:
        return get_client(ctx).delete_user(
            resource_id,
            user_id,
            account_id=account_id,
        )
    except Exception as e:
        logger.error(f"delete_collection_user failed: {e}")
        return _err(e)


@mcp.tool()
def list_collection_accounts(
    resource_id: str,
    keyword: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    ctx: Optional[Context] = None,
) -> Dict[str, Any]:
    """List data spaces (accounts) under an enterprise-tier collection.

    Args:
        resource_id: target library ResourceID.
        keyword: optional OpenVikingAccountID substring filter.
        page: 1-based page number; defaults to 1.
        limit: data spaces per page, 1 to 200; defaults to 20.

    Returns:
        {"AccountList": [{"OpenVikingAccountID", "UserCount", "CreateTime",
         "IsDefault"}], "Total": N}
    """
    try:
        return get_client(ctx).list_accounts(
            resource_id,
            keyword=keyword,
            page=page,
            limit=limit,
        )
    except Exception as e:
        logger.error(f"list_collection_accounts failed: {e}")
        return _err(e)


@mcp.tool(
    description=(
        "Create a data space (account), an isolation boundary within a library. "
        "CONFIRM WITH THE USER before calling. The backend creates a default "
        "admin in the new data space; the per-library account limit is "
        f"backend-configured. OpenVikingAccountID {ACCOUNT_ID_RULES}."
    )
)
def create_collection_account(
    resource_id: str,
    account_id: str,
    ctx: Optional[Context] = None,
) -> Dict[str, Any]:
    """Create a data space (account), an isolation boundary within a library.

    CONFIRM WITH THE USER before calling. This enterprise-tier capability creates
    a separate boundary for users, credentials, memories, resources, sessions,
    and skills. The backend automatically creates a ``default`` admin inside the
    new data space. The per-library account limit is backend-configured.

    OpenVikingAccountID is validated locally: it must be 1-64 characters using only
    letters, digits, '_', '.', '@', or '-'; must not start with '_'; must not
    be '.' or '..'; and may contain at most one '@'.

    Args:
        resource_id: target library ResourceID.
        account_id: OpenVikingAccountID for the new data space.

    Returns:
        {"Success": true, "OpenVikingAccountID": "..."}
    """
    try:
        return get_client(ctx).create_account(resource_id, account_id)
    except Exception as e:
        logger.error(f"create_collection_account failed: {e}")
        return _err(e)


@mcp.tool()
def delete_collection_account(
    resource_id: str,
    account_id: str,
    ctx: Optional[Context] = None,
) -> Dict[str, Any]:
    """⚠️ IRREVERSIBLY delete a data space and all isolated data inside it.

    CONFIRM WITH THE USER before calling. Deletion cascades through ALL users,
    credentials, memories, resources, sessions, and skills in the data space.
    The ``default`` data space cannot be deleted; both the client and backend
    reject it.

    Args:
        resource_id: target library ResourceID.
        account_id: OpenVikingAccountID of the data space to delete.

    Returns:
        {"Success": true}
    """
    try:
        return get_client(ctx).delete_account(resource_id, account_id)
    except Exception as e:
        logger.error(f"delete_collection_account failed: {e}")
        return _err(e)


@mcp.tool()
def delete_collection(
    resource_id: str, ctx: Optional[Context] = None
) -> Dict[str, Any]:
    """⚠️ IRREVERSIBLY deletes an OpenViking collection (uninstalls its Helm release).

    CONFIRM WITH THE USER before calling. This cannot be undone; all data in the
    library is lost.

    Args:
        resource_id: target library ResourceID.

    Returns:
        {"Success": true}
    """
    try:
        return get_client(ctx).delete_collection(resource_id)
    except Exception as e:
        logger.error(f"delete_collection failed: {e}")
        return _err(e)


def main():
    """Main entry point for the OpenViking Control Plane MCP server."""
    parser = argparse.ArgumentParser(description="Run the OpenViking Control Plane MCP Server")
    parser.add_argument(
        "--transport",
        "-t",
        choices=["sse", "stdio", "streamable-http"],
        default="stdio",
        help="Transport protocol to use (sse, stdio or streamable-http)",
    )
    args = parser.parse_args()
    logger.info(f"Starting OpenViking Control Plane MCP Server with {args.transport} transport")

    try:
        mcp.run(transport=args.transport, **_transport_options(args.transport))
    except Exception as e:
        logger.error(f"Error starting OpenViking Control Plane MCP Server: {str(e)}")
        raise


if __name__ == "__main__":
    main()
