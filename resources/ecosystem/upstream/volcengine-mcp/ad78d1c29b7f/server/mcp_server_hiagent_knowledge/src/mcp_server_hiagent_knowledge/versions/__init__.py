"""HiAgent version registry.

Maps a user-facing HiAgent version string (e.g. ``"v3.1.0"``, set via the
``HIAGENT_VERSION`` environment variable) to a self-contained implementation
sub-package. Package directory names must be valid Python identifiers, so the
user-facing ``v3.1.0`` maps to the ``v3_1_0`` package.

To add a new HiAgent version: create a ``vX_Y_Z`` sub-package exposing
``create_mcp_server`` and ``load_server_config``, then register it below. The
default version (used when ``HIAGENT_VERSION`` is unset) is always the latest
registered version, so no constant needs updating when a newer version is added.
"""

from __future__ import annotations

from importlib import import_module
from types import ModuleType

# User-facing version string -> implementation sub-package name.
VERSION_PACKAGES: dict[str, str] = {
    "v3.1.0": "v3_1_0",
}

SUPPORTED_VERSIONS = tuple(VERSION_PACKAGES)


def _version_key(version: str) -> tuple[int, ...]:
    """Sort key for a ``vX.Y.Z`` version string (numeric, not lexicographic)."""

    return tuple(int(part) for part in version.lstrip("v").split("."))


# Default version = latest registered version. Adding a newer version to
# VERSION_PACKAGES automatically makes it the default; no constant to bump.
DEFAULT_VERSION = max(SUPPORTED_VERSIONS, key=_version_key)


def load_version_module(version: str) -> ModuleType:
    """Import and return the implementation sub-package for ``version``.

    Raises ``ValueError`` for an unknown version, listing supported values.
    """

    package = VERSION_PACKAGES.get(version)
    if package is None:
        raise ValueError(
            f"unsupported HIAGENT_VERSION {version!r}; "
            f"supported versions: {', '.join(SUPPORTED_VERSIONS)}"
        )
    return import_module(f"mcp_server_hiagent_knowledge.versions.{package}")
