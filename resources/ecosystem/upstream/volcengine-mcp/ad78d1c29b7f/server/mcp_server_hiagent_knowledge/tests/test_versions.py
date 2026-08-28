from __future__ import annotations

import pytest

from mcp_server_hiagent_knowledge.versions import (
    DEFAULT_VERSION,
    SUPPORTED_VERSIONS,
    VERSION_PACKAGES,
    _version_key,
    load_version_module,
)


def test_default_version_is_latest_registered() -> None:
    expected = max(SUPPORTED_VERSIONS, key=_version_key)
    assert DEFAULT_VERSION == expected


def test_version_key_orders_numerically_not_lexicographically() -> None:
    # v3.10.0 must sort after v3.9.0 (numeric), not before it (string).
    ordered = sorted(["v3.1.0", "v3.10.0", "v3.9.0", "v3.2.0"], key=_version_key)
    assert ordered == ["v3.1.0", "v3.2.0", "v3.9.0", "v3.10.0"]


def test_load_version_module_returns_impl_with_entrypoints() -> None:
    module = load_version_module(DEFAULT_VERSION)
    assert hasattr(module, "create_mcp_server")
    assert hasattr(module, "load_server_config")


def test_load_version_module_rejects_unknown_version() -> None:
    with pytest.raises(ValueError, match="unsupported HIAGENT_VERSION"):
        load_version_module("v9.9.9")


def test_registered_packages_are_importable() -> None:
    for version, package in VERSION_PACKAGES.items():
        module = load_version_module(version)
        assert module.__name__.endswith(package)
