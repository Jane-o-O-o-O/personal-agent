from __future__ import annotations

import pytest

from mcp_server_hiagent_knowledge.versions.v3_1_0.tools.filtering import (
    parse_tool_list,
    resolve_enabled_tools,
)

ALL = ("a", "b", "c", "d")


def test_parse_tool_list_none_when_unset() -> None:
    assert parse_tool_list(None) is None


def test_parse_tool_list_splits_and_trims() -> None:
    assert parse_tool_list(" a, b ,c") == ["a", "b", "c"]


def test_parse_tool_list_blank_value_is_none() -> None:
    # An empty / all-blank value (e.g. HIAGENT_TOOLS=) carries no tool names, so
    # it maps to None ("no restriction" = all tools), not an empty selection.
    assert parse_tool_list("") is None
    assert parse_tool_list(" , ,") is None


def test_resolve_none_allowlist_keeps_all() -> None:
    assert resolve_enabled_tools(ALL) == ["a", "b", "c", "d"]


def test_resolve_allowlist_selects_base_set_in_original_order() -> None:
    # Order follows all_tools, not the allowlist argument order.
    assert resolve_enabled_tools(ALL, enabled=["c", "a"]) == ["a", "c"]


def test_resolve_empty_allowlist_selects_nothing() -> None:
    assert resolve_enabled_tools(ALL, enabled=[]) == []


def test_resolve_denylist_subtracts() -> None:
    assert resolve_enabled_tools(ALL, disabled=["b", "d"]) == ["a", "c"]


def test_resolve_allowlist_then_denylist() -> None:
    assert resolve_enabled_tools(ALL, enabled=["a", "b", "c"], disabled=["b"]) == [
        "a",
        "c",
    ]


def test_resolve_unknown_enabled_raises() -> None:
    with pytest.raises(ValueError, match="unknown tool name"):
        resolve_enabled_tools(ALL, enabled=["a", "zzz"])


def test_resolve_unknown_disabled_raises() -> None:
    with pytest.raises(ValueError, match="unknown tool name"):
        resolve_enabled_tools(ALL, disabled=["zzz"])


def test_resolve_unknown_error_lists_all_offenders() -> None:
    with pytest.raises(ValueError) as excinfo:
        resolve_enabled_tools(ALL, enabled=["x"], disabled=["y"])
    message = str(excinfo.value)
    assert "x" in message and "y" in message


def test_resolve_always_on_name_is_accepted_not_unknown() -> None:
    # An always-on name is valid input but is filtered out of the base set
    # (the server keeps it separately).
    assert resolve_enabled_tools(ALL, enabled=["keepme"], always_on=["keepme"]) == []


def test_resolve_always_on_accepted_in_denylist() -> None:
    # Listing an always-on name in the denylist must not raise (the server keeps
    # it regardless); it simply has no effect on the filterable base set.
    assert resolve_enabled_tools(ALL, disabled=["keepme"], always_on=["keepme"]) == [
        "a",
        "b",
        "c",
        "d",
    ]


def test_resolve_unknown_error_mentions_always_on() -> None:
    with pytest.raises(ValueError) as excinfo:
        resolve_enabled_tools(ALL, enabled=["zzz"], always_on=["keepme"])
    message = str(excinfo.value)
    assert "always kept" in message and "keepme" in message
