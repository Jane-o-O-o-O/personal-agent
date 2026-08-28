import json
from datetime import datetime
from enum import Enum
from typing import Any, Dict, Iterable, Optional

from rich import box
from rich.console import Console, Group
from rich.json import JSON
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from rich.tree import Tree


class OutputMode(str, Enum):
    AUTO = "auto"
    PRETTY = "pretty"
    JSON = "json"
    JSON_COMPACT = "json-compact"


def render_result(
    result: Any,
    *,
    output_mode: OutputMode = OutputMode.AUTO,
    view: str = "auto",
    console: Optional[Console] = None,
    is_terminal: Optional[bool] = None,
) -> None:
    """Render interactive terminal output without changing piped JSON."""
    console = console or Console()
    terminal = console.is_terminal if is_terminal is None else is_terminal
    effective_mode = output_mode
    if output_mode == OutputMode.AUTO:
        effective_mode = OutputMode.PRETTY if terminal else OutputMode.JSON

    if effective_mode in (OutputMode.JSON, OutputMode.JSON_COMPACT):
        indent = 2 if effective_mode == OutputMode.JSON else None
        separators = None if indent else (",", ":")
        print(
            json.dumps(
                result,
                indent=indent,
                ensure_ascii=False,
                separators=separators,
            ),
            file=console.file,
        )
        return

    console.print(_pretty_renderable(result, view))


def _pretty_renderable(result: Any, view: str) -> Any:
    if view == "collections" and isinstance(result, dict):
        return _collections_table(result.get("Collections"))
    if view == "users" and isinstance(result, dict):
        return _users_table(result.get("UserList"), result.get("Total"))
    if view == "accounts" and isinstance(result, dict):
        return _accounts_table(result.get("AccountList"), result.get("Total"))
    if view == "usage" and isinstance(result, dict):
        return _usage_panel(result)
    if view == "collection" and isinstance(result, dict):
        return _collection_panel(result)
    if view == "api-key" and isinstance(result, dict):
        return _api_key_panel(result)
    if view == "success" and isinstance(result, dict):
        return _success_panel(result)
    return _generic_renderable(result)


def _collections_table(rows: Any) -> Any:
    if not isinstance(rows, list):
        return _generic_renderable({"Collections": rows})
    table = Table(
        title=f"OpenViking Collections ({len(rows)})",
        box=box.ROUNDED,
        header_style="bold cyan",
        show_lines=False,
    )
    table.add_column("Name", style="bold")
    table.add_column("Resource ID", overflow="fold")
    table.add_column("Tier")
    table.add_column("Status")
    table.add_column("Payment")
    table.add_column("Project")
    for row in rows:
        if not isinstance(row, dict):
            continue
        payment = row.get("PaymentConfig")
        table.add_row(
            _text(row.get("Name")),
            _text(row.get("ResourceID")),
            _text(row.get("Version")),
            _status_text(row.get("Status")),
            _payment_label(payment),
            _text(row.get("Project")),
        )
    return table


def _users_table(rows: Any, total: Any) -> Any:
    if not isinstance(rows, list):
        return _generic_renderable({"UserList": rows, "Total": total})
    count = total if total is not None else len(rows)
    table = Table(
        title=f"Collection Users ({count})",
        box=box.ROUNDED,
        header_style="bold cyan",
    )
    table.add_column("User ID", style="bold")
    table.add_column("Role")
    table.add_column("API Key")
    for row in rows:
        if not isinstance(row, dict):
            continue
        table.add_row(
            _text(row.get("UserID")),
            _text(row.get("Role")),
            _text(row.get("ApiKey")),
        )
    return table


def _accounts_table(rows: Any, total: Any) -> Any:
    if not isinstance(rows, list):
        return _generic_renderable({"AccountList": rows, "Total": total})
    count = total if total is not None else len(rows)
    table = Table(
        title=f"Data Spaces ({count})",
        box=box.ROUNDED,
        header_style="bold cyan",
    )
    table.add_column("Account ID", style="bold")
    table.add_column("Users")
    table.add_column("Created")
    table.add_column("Default")
    for row in rows:
        if not isinstance(row, dict):
            continue
        table.add_row(
            _text(row.get("OpenVikingAccountID")),
            _text(row.get("UserCount")),
            _text(row.get("CreateTime")),
            _value(row.get("IsDefault"), "IsDefault"),
        )
    return table


def _usage_panel(result: Dict[str, Any]) -> Panel:
    files = Table.grid(padding=(0, 2))
    files.add_column(style="dim", no_wrap=True)
    files.add_column(justify="right")
    files.add_row("Total context files", _number(result.get("CurContextFileNum")))
    files.add_row("Resources", _number(result.get("ResourcesFileNum")))
    files.add_row("User files", _number(result.get("UserFileNum")))
    files.add_row("Updated", _timestamp(result.get("FreshTime")))

    billing = result.get("EstimatedBilling")
    billing_table = Table.grid(padding=(0, 2))
    billing_table.add_column(style="dim", no_wrap=True)
    billing_table.add_column()
    if isinstance(billing, dict):
        billing_table.add_row("Payment", _payment_label(billing))
        if billing.get("AFP") is not None:
            billing_table.add_row(
                "AFP deduction",
                f"{_text(billing.get('AFP'))} AFP / {_period(billing)}",
            )
        if billing.get("CNY") is not None:
            billing_table.add_row(
                "CNY equivalent",
                f"¥{_text(billing.get('CNY'))} / {_period(billing)}",
            )
    elif "EstimatedCosts" in result:
        billing_table.add_row(
            "Estimated cost",
            f"¥{_text(result.get('EstimatedCosts'))} / hour",
        )
    else:
        billing_table.add_row(
            "Estimated cost",
            Text(
                "— (reported for the whole library, not per data space)",
                style="dim",
            ),
        )

    content = Group(
        Text("Context Files", style="bold cyan"),
        files,
        Text(""),
        Text("Estimated Billing", style="bold cyan"),
        billing_table,
    )
    return Panel(content, title="OpenViking Usage", border_style="cyan")


def _collection_panel(result: Dict[str, Any]) -> Panel:
    identity_keys = (
        "Name",
        "ResourceID",
        "Status",
        "Version",
        "Project",
        "Creator",
        "Description",
    )
    runtime_keys = (
        "OpenvikingVersion",
        "OpenvikingVersionDesc",
        "CreateTime",
        "UpdateTime",
    )
    identity = _property_table(result, identity_keys)
    runtime = _property_table(result, runtime_keys)
    sections: list[Any] = [
        Text("Collection", style="bold cyan"),
        identity,
        Text(""),
        Text("Runtime", style="bold cyan"),
        runtime,
    ]
    payment = result.get("PaymentConfig")
    if isinstance(payment, dict):
        sections.extend(
            [
                Text(""),
                Text("Payment", style="bold cyan"),
                _property_table(
                    {
                        "PayType": _payment_label(payment),
                        "BusinessScenarios": _business_scenario(payment),
                        "SeatId": _seat_id(payment),
                    },
                    ("PayType", "BusinessScenarios", "SeatId"),
                ),
            ]
        )
    remaining = {
        key: value
        for key, value in result.items()
        if key not in identity_keys
        and key not in runtime_keys
        and key != "PaymentConfig"
    }
    if remaining:
        sections.extend(
            [
                Text(""),
                Text("Configuration", style="bold cyan"),
                _nested_tree(remaining),
            ]
        )
    return Panel(Group(*sections), title=_text(result.get("Name"), "Collection"))


def _api_key_panel(result: Dict[str, Any]) -> Panel:
    details = Table.grid(padding=(0, 2))
    details.add_column(style="dim", no_wrap=True)
    details.add_column(overflow="fold")
    details.add_row("User ID", _text(result.get("UserID")))
    details.add_row("Role", _text(result.get("Role")))
    details.add_row("API Key", Text(_text(result.get("ApiKey")), style="bold yellow"))
    return Panel(
        Group(
            Text("Sensitive credential — do not paste it into logs or commits.", style="bold red"),
            Text(""),
            details,
        ),
        title="Collection API Key",
        border_style="yellow",
    )


def _success_panel(result: Dict[str, Any]) -> Panel:
    details = Table.grid(padding=(0, 2))
    details.add_column(style="dim", no_wrap=True)
    details.add_column(overflow="fold")
    for key, value in result.items():
        if key == "Success":
            continue
        details.add_row(_label(key), _value(value, key))
    success = result.get("Success", True)
    title = "✓ Operation completed" if success else "Operation result"
    content: Any = details if details.row_count else Text("Success", style="bold green")
    return Panel(content, title=title, border_style="green" if success else "yellow")


def _property_table(data: Dict[str, Any], keys: Iterable[str]) -> Table:
    table = Table.grid(padding=(0, 2))
    table.add_column(style="dim", no_wrap=True)
    table.add_column(overflow="fold")
    for key in keys:
        if key not in data or data[key] in (None, "", [], {}):
            continue
        table.add_row(_label(key), _value(data[key], key))
    if not table.row_count:
        table.add_row("Details", "—")
    return table


def _generic_renderable(result: Any) -> Any:
    if isinstance(result, dict):
        if _is_flat_dict(result):
            return Panel(_property_table(result, result.keys()), border_style="cyan")
        return _nested_tree(result)
    if isinstance(result, list) and all(isinstance(item, dict) for item in result):
        return _dict_list_table(result)
    return JSON.from_data(result, ensure_ascii=False)


def _dict_list_table(rows: list[Dict[str, Any]]) -> Any:
    if not rows:
        return Panel(Text("No results", style="dim"), border_style="cyan")
    keys = list(dict.fromkeys(key for row in rows for key in row))
    if not keys or len(keys) > 8:
        return _nested_tree(rows)
    table = Table(box=box.ROUNDED, header_style="bold cyan")
    for key in keys:
        table.add_column(_label(key), overflow="fold")
    for row in rows:
        table.add_row(*(_value(row.get(key), key) for key in keys))
    return table


def _nested_tree(result: Any) -> Tree:
    tree = Tree("Result", guide_style="dim")
    _add_tree_nodes(tree, result)
    return tree


def _add_tree_nodes(tree: Tree, value: Any) -> None:
    if isinstance(value, dict):
        for key, item in value.items():
            if isinstance(item, (dict, list)):
                branch = tree.add(Text(_label(key), style="bold cyan"))
                _add_tree_nodes(branch, item)
            else:
                tree.add(Text.assemble((_label(key) + ": ", "dim"), _value(item, key)))
        return
    if isinstance(value, list):
        for index, item in enumerate(value):
            branch = tree.add(Text(f"[{index}]", style="bold cyan"))
            _add_tree_nodes(branch, item)
        return
    tree.add(_value(value))


def _is_flat_dict(value: Dict[str, Any]) -> bool:
    return all(not isinstance(item, (dict, list)) for item in value.values())


def _value(value: Any, key: str = "") -> str:
    if key in {"CreateTime", "UpdateTime", "FreshTime", "LastDeductTime"}:
        return _timestamp(value)
    if isinstance(value, bool):
        return "yes" if value else "no"
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False)
    return _text(value)


def _payment_label(payment: Any) -> str:
    if not isinstance(payment, dict):
        return "—"
    pay_type = payment.get("PayType")
    scenario = _business_scenario(payment)
    if pay_type == "agentplan_pay":
        if scenario == "agent_plan_enterprise":
            return "AgentPlan Enterprise"
        if scenario == "agent_plan_personal":
            return "AgentPlan Personal"
        return "AgentPlan"
    if pay_type == "volc_pay":
        return "Volcano PAYG"
    if pay_type == "empty_pay":
        return "Unbound"
    return _text(pay_type)


def _business_scenario(payment: Dict[str, Any]) -> str:
    scenario = payment.get("BusinessScenarios")
    if scenario:
        return _text(scenario)
    agentplan = payment.get("AgentPlanConfig")
    if isinstance(agentplan, dict):
        return _text(agentplan.get("BusinessScenarios"))
    return "—"


def _seat_id(payment: Dict[str, Any]) -> str:
    seat_id = payment.get("SeatId") or payment.get("SeatID")
    if seat_id:
        return _text(seat_id)
    agentplan = payment.get("AgentPlanConfig")
    if isinstance(agentplan, dict):
        return _text(agentplan.get("SeatId") or agentplan.get("SeatID"))
    return "—"


def _status_text(value: Any) -> Text:
    status = _text(value)
    styles = {
        "READY": "green",
        "RUNNING": "green",
        "INIT": "yellow",
        "FAILED": "red",
        "ERROR": "red",
    }
    return Text(status, style=styles.get(status.upper(), ""))


def _period(billing: Dict[str, Any]) -> str:
    period = _text(billing.get("Period"), "hour")
    return period


def _timestamp(value: Any) -> str:
    if value in (None, "", 0, "0"):
        return "—"
    try:
        return datetime.fromtimestamp(int(value)).astimezone().strftime("%Y-%m-%d %H:%M:%S %Z")
    except (TypeError, ValueError, OSError, OverflowError):
        return _text(value)


def _number(value: Any) -> str:
    try:
        return f"{int(value):,}"
    except (TypeError, ValueError):
        return _text(value)


def _label(key: Any) -> str:
    text = str(key).replace("_", " ")
    result: list[str] = []
    for index, char in enumerate(text):
        if index and char.isupper() and text[index - 1].islower():
            result.append(" ")
        result.append(char)
    return "".join(result).strip().title()


def _text(value: Any, default: str = "—") -> str:
    if value is None or value == "":
        return default
    return str(value)
