from __future__ import annotations

import pytest

from mcp_server_hiagent_knowledge.versions.v3_1_0.config import (
    DEFAULT_ACCOUNT_ID,
    DEFAULT_REGION,
    load_hiagent_config,
    load_server_config,
)


def test_load_hiagent_config_uses_platform_api_defaults(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("HIAGENT_TOP_HOST", "http://hiagent.example.com:30040/")
    monkeypatch.setenv("HIAGENT_ACCESS_KEY_ID", "ak")
    monkeypatch.setenv("HIAGENT_SECRET_ACCESS_KEY", "sk")
    monkeypatch.delenv("HIAGENT_ACCOUNT_ID", raising=False)
    monkeypatch.delenv("HIAGENT_REGION", raising=False)

    config = load_hiagent_config()

    assert config.top_host == "http://hiagent.example.com:30040"
    assert config.account_id == DEFAULT_ACCOUNT_ID
    assert config.access_key_id == "ak"
    assert config.secret_access_key == "sk"
    assert config.region == DEFAULT_REGION
    assert config.is_configured is True


def test_load_hiagent_config_reports_missing_required_values(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.delenv("HIAGENT_TOP_HOST", raising=False)
    monkeypatch.delenv("HIAGENT_ACCESS_KEY_ID", raising=False)
    monkeypatch.delenv("HIAGENT_SECRET_ACCESS_KEY", raising=False)

    config = load_hiagent_config()

    assert config.is_configured is False


def test_load_server_config_rejects_invalid_port(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("MCP_SERVER_PORT", "not-a-port")

    with pytest.raises(ValueError, match="MCP_SERVER_PORT"):
        load_server_config()


def test_load_server_config_stateless_http_defaults_true(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.delenv("STATELESS_HTTP", raising=False)

    assert load_server_config().stateless_http is True


def test_load_server_config_stateless_http_env_override(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("STATELESS_HTTP", "false")

    assert load_server_config().stateless_http is False


