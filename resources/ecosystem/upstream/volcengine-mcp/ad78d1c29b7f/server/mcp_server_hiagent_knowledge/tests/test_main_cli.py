from __future__ import annotations

from typing import Any

import pytest

from mcp_server_hiagent_knowledge import main as main_module


class _StubMCP:
    def run(self, *args: Any, **kwargs: Any) -> None:  # pragma: no cover - trivial
        # Stop before any real transport starts; the test only cares about how
        # the CLI resolved the tool filters passed to create_mcp_server.
        return None


@pytest.fixture
def captured(monkeypatch: pytest.MonkeyPatch) -> dict[str, Any]:
    """Patch create_mcp_server to capture the resolved filter kwargs."""

    calls: dict[str, Any] = {}

    def fake_create(**kwargs: Any) -> _StubMCP:
        calls.update(kwargs)
        return _StubMCP()

    # Both env vars start clean so tests control precedence explicitly.
    monkeypatch.delenv("HIAGENT_TOOLS", raising=False)
    monkeypatch.delenv("HIAGENT_DISABLED_TOOLS", raising=False)
    monkeypatch.setattr(
        "mcp_server_hiagent_knowledge.versions.v3_1_0.create_mcp_server",
        fake_create,
    )
    return calls


def _run(monkeypatch: pytest.MonkeyPatch, argv: list[str]) -> None:
    monkeypatch.setattr("sys.argv", ["hiagent", *argv])
    main_module.main()


def test_no_filter_flags_pass_none(
    monkeypatch: pytest.MonkeyPatch, captured: dict[str, Any]
) -> None:
    _run(monkeypatch, [])
    assert captured["enabled_tools"] is None
    assert captured["disabled_tools"] is None


def test_tools_short_flag_maps_to_allowlist(
    monkeypatch: pytest.MonkeyPatch, captured: dict[str, Any]
) -> None:
    # -t is the tool allowlist (formerly transport's short flag).
    _run(monkeypatch, ["-t", "search_wiki,read_wiki_page"])
    assert captured["enabled_tools"] == ["search_wiki", "read_wiki_page"]
    assert captured["disabled_tools"] is None


def test_disabled_tools_flag_maps_to_denylist(
    monkeypatch: pytest.MonkeyPatch, captured: dict[str, Any]
) -> None:
    _run(monkeypatch, ["--disabled-tools", "grep_knowledge_chunks"])
    assert captured["disabled_tools"] == ["grep_knowledge_chunks"]


def test_env_vars_used_when_flags_absent(
    monkeypatch: pytest.MonkeyPatch, captured: dict[str, Any]
) -> None:
    monkeypatch.setenv("HIAGENT_TOOLS", "search_wiki")
    monkeypatch.setenv("HIAGENT_DISABLED_TOOLS", "read_wiki_page")
    _run(monkeypatch, [])
    assert captured["enabled_tools"] == ["search_wiki"]
    assert captured["disabled_tools"] == ["read_wiki_page"]


def test_empty_env_var_means_all_tools(
    monkeypatch: pytest.MonkeyPatch, captured: dict[str, Any]
) -> None:
    # An empty HIAGENT_TOOLS= (visually indistinguishable from unset) must not
    # narrow the tool set to just health_check; it maps to None (all tools).
    monkeypatch.setenv("HIAGENT_TOOLS", "")
    monkeypatch.setenv("HIAGENT_DISABLED_TOOLS", "  ")
    _run(monkeypatch, [])
    assert captured["enabled_tools"] is None
    assert captured["disabled_tools"] is None


def test_cli_flag_overrides_env(
    monkeypatch: pytest.MonkeyPatch, captured: dict[str, Any]
) -> None:
    monkeypatch.setenv("HIAGENT_TOOLS", "search_wiki")
    _run(monkeypatch, ["--tools", "search_knowledge"])
    assert captured["enabled_tools"] == ["search_knowledge"]


def test_transport_no_longer_accepts_short_t(
    monkeypatch: pytest.MonkeyPatch, captured: dict[str, Any]
) -> None:
    # -t now belongs to --tools, not --transport: "-t stdio" is parsed as a tool
    # allowlist of ["stdio"], proving the short flag was reassigned.
    _run(monkeypatch, ["-t", "stdio"])
    assert captured["enabled_tools"] == ["stdio"]


def test_unknown_tool_name_exits(
    monkeypatch: pytest.MonkeyPatch, captured: dict[str, Any]
) -> None:
    # An unknown tool name from create_mcp_server becomes parser.error -> exit 2.
    def raising_create(**kwargs: Any) -> _StubMCP:
        raise ValueError("unknown tool name(s): nope")

    monkeypatch.setattr(
        "mcp_server_hiagent_knowledge.versions.v3_1_0.create_mcp_server",
        raising_create,
    )
    with pytest.raises(SystemExit):
        _run(monkeypatch, ["--tools", "nope"])
