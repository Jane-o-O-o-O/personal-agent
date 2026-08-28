import logging
from dataclasses import dataclass
from enum import Enum
from typing import Any, Callable, Dict, List, Optional

import typer

from mcp_server_openviking_controlplane.client import (
    ControlPlaneClient,
    ControlPlaneError,
    _normalize_optional_account_id,
    validate_account_id,
)
from mcp_server_openviking_controlplane.config import (
    ACCOUNT_ID_RULES,
    DEFAULT_ACCOUNT_ID,
    build_config,
    parse_extra_headers,
)
from mcp_server_openviking_controlplane.output import OutputMode, render_result

logging.basicConfig(
    level=logging.WARNING, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

app = typer.Typer(
    help=(
        "OpenViking control plane (topapi) CLI — manage OV collections. "
        "Shares the same core (client.py) as the MCP server."
    ),
    no_args_is_help=True,
    add_completion=True,
)


class VersionOption(str, Enum):
    DEVELOPER = "developer"
    ENTERPRISE = "enterprise"


class PayTypeOption(str, Enum):
    AGENTPLAN_PERSONAL = "agentplan_personal"
    AGENTPLAN_ENTERPRISE = "agentplan_enterprise"
    VOLC_PAY = "volc_pay"


@dataclass
class CliState:
    client_factory: Callable[[], ControlPlaneClient]
    output_mode: OutputMode


def _print(ctx: typer.Context, result: Any, view: str = "auto") -> None:
    state: CliState = ctx.obj
    render_result(result, output_mode=state.output_mode, view=view)


def _fail(e: Exception) -> "typer.Exit":
    if isinstance(e, ControlPlaneError):
        suffix = f" (RequestId={e.request_id})" if e.request_id else ""
        typer.echo(f"Error [{e.code}]: {e.message}{suffix}", err=True)
    else:
        typer.echo(f"Error: {e}", err=True)
    raise typer.Exit(code=1)


def _client(ctx: typer.Context) -> ControlPlaneClient:
    """Build the shared client lazily so `--help` never needs valid config."""
    try:
        state: CliState = ctx.obj
        return state.client_factory()
    except Exception as e:
        raise _fail(e)


@app.callback()
def main_callback(
    ctx: typer.Context,
    endpoint: Optional[str] = typer.Option(
        None, "--endpoint", "-e",
        help="Control-plane base URL (overrides VIKING_ENDPOINT). "
             "For local testing point at a port-forward, e.g. http://localhost:18080",
    ),
    api_key: Optional[str] = typer.Option(
        None, "--api-key", "-k",
        help="Ark AgentPlan ApiKey, sent as 'Authorization: Bearer' (overrides AGENTPLAN_API_KEY).",
    ),
    project: Optional[str] = typer.Option(
        None, "--project", help="Default project (overrides OPENVIKING_PROJECT)."
    ),
    header: Optional[List[str]] = typer.Option(
        None, "--header", "-H",
        help="Extra request header as 'Key: Value'; repeatable. Merged over "
             "VIKING_EXTRA_HEADERS (CLI wins). E.g. -H 'x-tt-env: <swimlane>' to "
             "route into a swim-lane.",
    ),
    output: OutputMode = typer.Option(
        OutputMode.AUTO,
        "--output",
        help="Output: auto (TTY view, JSON when piped) | pretty | json | json-compact.",
    ),
    json_output: bool = typer.Option(
        False,
        "--json",
        help="Force standard JSON output (shortcut for --output json).",
    ),
):
    """Stash a client factory on the context; commands build it on demand."""

    def _factory() -> ControlPlaneClient:
        extra_headers: Dict[str, str] = {}
        for item in header or []:
            extra_headers.update(parse_extra_headers(item))
        config = build_config(
            endpoint=endpoint,
            project=project,
            api_key=api_key,
            extra_headers=extra_headers,
        )
        return ControlPlaneClient(config)

    ctx.obj = CliState(
        client_factory=_factory,
        output_mode=OutputMode.JSON if json_output else output,
    )


@app.command("list")
def list_cmd(
    ctx: typer.Context,
    project: Optional[str] = typer.Option(None, "--project", help="Filter by project."),
):
    """List collections under the account."""
    client = _client(ctx)
    try:
        _print(ctx, client.list_collections(project=project), "collections")
    except Exception as e:
        raise _fail(e)


@app.command("get")
def get_cmd(ctx: typer.Context, resource_id: str = typer.Argument(..., help="Target library ResourceID.")):
    """Get basic info of a collection."""
    client = _client(ctx)
    try:
        _print(ctx, client.get_collection(resource_id), "collection")
    except Exception as e:
        raise _fail(e)


@app.command("usage")
def usage_cmd(
    ctx: typer.Context,
    resource_id: str = typer.Argument(..., help="Target library ResourceID."),
    account_id: Optional[str] = typer.Option(
        None,
        "--account-id",
        help="Data space (account) scope; omit for whole-library usage, or the "
        "default data space when --user-id is set.",
    ),
    user_id: Optional[str] = typer.Option(
        None,
        "--user-id",
        help="User whose usage to query; may be used with or without --account-id.",
    ),
):
    """Get library-wide or account/user-scoped usage and file counts."""
    client = _client(ctx)
    try:
        _print(
            ctx,
            client.get_usage(
                resource_id,
                account_id=account_id,
                user_id=user_id,
            ),
            "usage",
        )
    except Exception as e:
        raise _fail(e)


@app.command("api-key")
def api_key_cmd(
    ctx: typer.Context,
    resource_id: str = typer.Argument(..., help="Target library ResourceID."),
    user_id: Optional[str] = typer.Option(
        None,
        "--user-id",
        help="Target UserID; omit for the selected data space's default user.",
    ),
    account_id: Optional[str] = typer.Option(
        None,
        "--account-id",
        help="Data space (account) to operate in; omit for the default data space.",
    ),
):
    """Get a user's plaintext data-plane API Key."""
    client = _client(ctx)
    try:
        _print(
            ctx,
            client.get_user_access(
                resource_id,
                user_id=user_id,
                account_id=account_id,
            ),
            "api-key",
        )
    except Exception as e:
        raise _fail(e)


@app.command("create")
def create_cmd(
    ctx: typer.Context,
    name: str = typer.Option(..., help="Library name ^[a-zA-Z][a-zA-Z0-9_]*$, <=64."),
    version: VersionOption = typer.Option(
        VersionOption.DEVELOPER,
        help="Library tier: developer (default) | enterprise "
             "(higher capacity, billed at enterprise rates).",
    ),
    project: Optional[str] = typer.Option(None, help="Project name (defaults to configured)."),
    description: Optional[str] = typer.Option(None, help="Description, <=65535 chars."),
    pay_type: Optional[PayTypeOption] = typer.Option(
        None, "--pay-type",
        help="Billing: agentplan_personal (personal AgentPlan AFP deduction; the "
             "default when omitted) | agentplan_enterprise (an enterprise seat's "
             "AFP pays; requires --seat-id) | volc_pay (Volcano pay-as-you-go, "
             "billed to the Volcano account; must be chosen explicitly). "
             "⚠️ Accounts with no personal plan (e.g. enterprise seat keys) must "
             "not rely on the default: the library would bind a non-existent "
             "personal plan, deduction fails and the library is disabled.",
    ),
    seat_id: Optional[str] = typer.Option(
        None, "--seat-id",
        help="AgentPlan enterprise seat that pays (e.g. seat-2026...); required "
             "with --pay-type agentplan_enterprise. Copy it manually from the Ark "
             "console seat-management page — the server does NOT check the seat "
             "exists; a typo only surfaces at the next hourly deduction, which "
             "then disables the library.",
    ),
):
    """Create a new collection (consumes paid quota; max 20 per account).

    Model source, model parameters, model credentials, and the OpenViking image
    version are not configurable here. Creation always uses the AgentPlan model
    path and the configured AgentPlan API key.

    ⚠️ Billing: without --pay-type the library defaults to agentplan_personal
    (AFP deduction from the account's personal AgentPlan). Enterprise seat
    keys must pass --pay-type agentplan_enterprise --seat-id seat-xxx; Volcano
    pay-as-you-go billing must be chosen explicitly with --pay-type volc_pay.
    """
    client = _client(ctx)
    if not (pay_type or seat_id):
        typer.echo(
            "note: no --pay-type — defaulting to agentplan_personal (AFP deduction "
            "from the account's personal AgentPlan). If this account has no "
            "personal plan (e.g. an enterprise seat key), deduction will fail and "
            "the library will be unusable — pass --pay-type agentplan_enterprise "
            "--seat-id ... (or volc_pay) instead.",
            err=True,
        )
    try:
        _print(
            ctx,
            client.create_collection(
                name=name,
                source="agentplan",
                version=version.value,
                project=project,
                description=description,
                pay_type=pay_type.value if pay_type else None,
                seat_id=seat_id,
            ),
            "success",
        )
    except Exception as e:
        raise _fail(e)


@app.command("update")
def update_cmd(
    ctx: typer.Context,
    resource_id: str = typer.Argument(..., help="Target library ResourceID."),
    description: Optional[str] = typer.Option(None, help="New description, <=65535 chars."),
    pay_type: Optional[PayTypeOption] = typer.Option(
        None, "--pay-type",
        help="Switch billing: agentplan_personal (personal AgentPlan AFP) | "
             "agentplan_enterprise (an enterprise seat's AFP; requires --seat-id) "
             "| volc_pay (Volcano pay-as-you-go, billed to the Volcano account). "
             "Omit to leave billing untouched.",
    ),
    seat_id: Optional[str] = typer.Option(
        None, "--seat-id",
        help="AgentPlan enterprise seat that pays; required with --pay-type "
             "agentplan_enterprise (also how to re-bind after a seat was "
             "unbound). The server does NOT check the seat exists.",
    ),
    model_api_key: Optional[str] = typer.Option(
        None, "--model-api-key",
        help="Overwrite the library's AgentPlan MODEL credential with this key "
             "(VLM and Embedding always share one). Omit to leave model "
             "credentials alone; the library's other credentials are kept "
             "either way.",
    ),
):
    """Update mutable fields of a collection (only passed fields change).

    Also switches billing: e.g. `update <RID> --pay-type agentplan_enterprise
    --seat-id seat-xxx` moves the library to AFP deduction from that seat;
    `--pay-type volc_pay` moves it back to Volcano pay-as-you-go.
    """
    client = _client(ctx)
    try:
        _print(
            ctx,
            client.update_collection(
                resource_id,
                description=description,
                pay_type=pay_type.value if pay_type else None,
                seat_id=seat_id,
                model_api_key=model_api_key,
            ),
            "success",
        )
    except Exception as e:
        raise _fail(e)


user_app = typer.Typer(
    help="Manage users under a collection (enterprise-tier libraries). "
    "All actions require the AgentPlan key to be associated with the library.",
    no_args_is_help=True,
)
app.add_typer(user_app, name="user")


@user_app.command("list")
def user_list_cmd(
    ctx: typer.Context,
    resource_id: str = typer.Argument(..., help="Target library ResourceID."),
    account_id: Optional[str] = typer.Option(
        None,
        "--account-id",
        help="Data space (account) to operate in; omit for the default data space.",
    ),
    user_id: Optional[str] = typer.Option(
        None,
        "--user-id",
        help="Filter by exact UserID.",
    ),
    role: Optional[str] = typer.Option(
        None,
        "--role",
        help="Filter by role, e.g. admin | user.",
    ),
    page: int = typer.Option(1, min=1, help="Page number (1-based)."),
    limit: int = typer.Option(20, min=1, max=200, help="Users per page."),
):
    """List users under a collection (ApiKey is masked; use `api-key` for plaintext)."""
    client = _client(ctx)
    try:
        _print(
            ctx,
            client.list_collection_users(
                resource_id,
                user_id=user_id,
                role=role,
                page=page,
                limit=limit,
                account_id=account_id,
            ),
            "users",
        )
    except Exception as e:
        raise _fail(e)


@user_app.command("register")
def user_register_cmd(
    ctx: typer.Context,
    resource_id: str = typer.Argument(..., help="Target library ResourceID."),
    user_id: str = typer.Argument(..., help="UserID for the new user (unique in data space)."),
    account_id: Optional[str] = typer.Option(
        None,
        "--account-id",
        help="Data space (account) to operate in; omit for the default data space.",
    ),
):
    """Register a new regular user under a collection."""
    client = _client(ctx)
    try:
        _print(
            ctx,
            client.register_user(resource_id, user_id, account_id=account_id),
            "success",
        )
    except Exception as e:
        raise _fail(e)


@user_app.command("update")
def user_update_cmd(
    ctx: typer.Context,
    resource_id: str = typer.Argument(..., help="Target library ResourceID."),
    user_id: str = typer.Argument(..., help="Target UserID."),
    account_id: Optional[str] = typer.Option(
        None,
        "--account-id",
        help="Data space (account) to operate in; omit for the default data space.",
    ),
    regenerate_key: bool = typer.Option(
        False,
        "--regenerate-key",
        help="Rotate the user's data-plane API Key.",
    ),
):
    """Update a user under a collection (currently API Key rotation only)."""
    if not regenerate_key:
        raise _fail(
            ValueError(
                "nothing to update: pass --regenerate-key to rotate the user's API Key"
            )
        )
    client = _client(ctx)
    try:
        _print(
            ctx,
            client.update_user(
                resource_id,
                user_id,
                regenerate_key=regenerate_key,
                account_id=account_id,
            ),
            "success",
        )
    except Exception as e:
        raise _fail(e)


@user_app.command("delete")
def user_delete_cmd(
    ctx: typer.Context,
    resource_id: str = typer.Argument(..., help="Target library ResourceID."),
    user_id: str = typer.Argument(..., help="Target UserID."),
    account_id: Optional[str] = typer.Option(
        None,
        "--account-id",
        help="Data space (account) to operate in; omit for the default data space.",
    ),
    yes: bool = typer.Option(False, "--yes", "-y", help="Skip the confirmation prompt."),
):
    """Delete a user from a collection (revokes its credential; irreversible)."""
    client = _client(ctx)
    try:
        normalized_account_id = _normalize_optional_account_id(account_id)
    except Exception as e:
        raise _fail(e)
    if not yes:
        typer.confirm(
            f"Delete user {user_id} from data space {normalized_account_id or 'default'} "
            f"in collection {resource_id} (revokes its credential)?",
            abort=True,
        )
    try:
        _print(
            ctx,
            client.delete_user(
                resource_id,
                user_id,
                account_id=normalized_account_id,
            ),
            "success",
        )
    except Exception as e:
        raise _fail(e)


account_app = typer.Typer(
    help=(
        "Manage data spaces (accounts) within an enterprise-tier collection. "
        "Omitting --account-id targets the default data space for user/API-key "
        "commands; unscoped usage remains library-wide."
    ),
    no_args_is_help=True,
)
app.add_typer(account_app, name="account")


@account_app.command("list")
def account_list_cmd(
    ctx: typer.Context,
    resource_id: str = typer.Argument(..., help="Target library ResourceID."),
    keyword: Optional[str] = typer.Option(
        None,
        "--keyword",
        help="Filter data spaces by OpenVikingAccountID substring.",
    ),
    page: int = typer.Option(1, min=1, help="Page number (1-based)."),
    limit: int = typer.Option(20, min=1, max=200, help="Data spaces per page."),
):
    """List data spaces under an enterprise-tier collection."""
    client = _client(ctx)
    try:
        _print(
            ctx,
            client.list_accounts(
                resource_id,
                keyword=keyword,
                page=page,
                limit=limit,
            ),
            "accounts",
        )
    except Exception as e:
        raise _fail(e)


@account_app.command("create")
def account_create_cmd(
    ctx: typer.Context,
    resource_id: str = typer.Argument(..., help="Target library ResourceID."),
    account_id: str = typer.Argument(
        ...,
        help=f"OpenVikingAccountID for the new data space. {ACCOUNT_ID_RULES}",
    ),
):
    """Create a data space; the backend also creates its default admin."""
    client = _client(ctx)
    try:
        _print(ctx, client.create_account(resource_id, account_id), "success")
    except Exception as e:
        raise _fail(e)


@account_app.command("delete")
def account_delete_cmd(
    ctx: typer.Context,
    resource_id: str = typer.Argument(..., help="Target library ResourceID."),
    account_id: str = typer.Argument(..., help="OpenVikingAccountID of the data space to delete."),
    yes: bool = typer.Option(False, "--yes", "-y", help="Skip the confirmation prompt."),
):
    """Delete a data space and everything isolated inside it (irreversible)."""
    client = _client(ctx)
    try:
        validated_account_id = validate_account_id(account_id)
        if validated_account_id == DEFAULT_ACCOUNT_ID:
            raise ValueError("the default account cannot be deleted")
    except Exception as e:
        raise _fail(e)
    if not yes:
        typer.confirm(
            f"Irreversibly delete data space {validated_account_id} from collection "
            f"{resource_id}? This destroys ALL of its users, credentials, "
            "memories, resources, sessions and skills.",
            abort=True,
        )
    try:
        _print(ctx, client.delete_account(resource_id, validated_account_id), "success")
    except Exception as e:
        raise _fail(e)


@app.command("delete")
def delete_cmd(
    ctx: typer.Context,
    resource_id: str = typer.Argument(..., help="Target library ResourceID."),
    yes: bool = typer.Option(False, "--yes", "-y", help="Skip the confirmation prompt."),
):
    """Delete a collection (irreversible; uninstalls its Helm release)."""
    client = _client(ctx)
    if not yes:
        typer.confirm(
            f"Irreversibly delete collection {resource_id} (uninstalls its Helm release)?",
            abort=True,
        )
    try:
        _print(ctx, client.delete_collection(resource_id), "success")
    except Exception as e:
        raise _fail(e)


def main():
    app()


if __name__ == "__main__":
    main()
