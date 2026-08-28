"""Pluggable authentication for the OpenViking control plane.

The control-plane TopAPI is served by the OpenViking data-plane cluster and
authenticated with an Ark AgentPlan ApiKey, replayed as an
``Authorization: Bearer <key>`` header on every request (``BearerTokenAuth``).
The ``AuthProvider`` protocol leaves room to plug in a different provider later
(e.g. AK/SK signing) without touching ``client.py`` or the tool/CLI layers.
"""

import re
from typing import Dict, Protocol


_HEADER_NAME_RE = re.compile(r"^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$")


def validate_header_name(name: str, *, label: str = "HTTP header name") -> None:
    """Reject names that ``requests`` cannot safely place on the wire."""
    if not _HEADER_NAME_RE.fullmatch(name):
        raise ValueError(f"{label} must contain only valid ASCII HTTP token characters")


def validate_header_value(
    value: str,
    *,
    label: str = "HTTP header value",
    ascii_only: bool = False,
) -> None:
    """Validate a value before ``requests`` reaches its Latin-1 encoder."""
    if "\r" in value or "\n" in value:
        raise ValueError(f"{label} must not contain newline characters")
    encoding = "ascii" if ascii_only else "latin-1"
    try:
        value.encode(encoding)
    except UnicodeEncodeError:
        if ascii_only:
            raise ValueError(
                f"{label} contains non-ASCII characters; replace placeholder text "
                "with the real ASCII value"
            ) from None
        raise ValueError(
            f"{label} contains characters that cannot be sent in an HTTP header"
        ) from None


class AuthProvider(Protocol):
    """Produces the auth/identity headers for a single control-plane request."""

    def auth_headers(
        self, method: str, path: str, query: Dict[str, str], body_str: str
    ) -> Dict[str, str]:
        ...


class BearerTokenAuth:
    """Authenticate with an Ark AgentPlan ApiKey via ``Authorization: Bearer``.

    The backend's control-plane auth (``authorizeControlPlaneByArk``) reads the
    key only from the ``Authorization: Bearer`` header — it does not accept
    ``X-API-Key``. The token is replayed verbatim on every request, independent
    of method/path/body. A token passed with or without the ``Bearer `` prefix
    is tolerated.
    """

    def __init__(self, token: str):
        token = (token or "").strip()
        if token.lower().startswith("bearer "):
            token = token[len("bearer "):].strip()
        validate_header_value(token, label="AgentPlan API key", ascii_only=True)
        self._token = token

    def auth_headers(
        self, method: str, path: str, query: Dict[str, str], body_str: str
    ) -> Dict[str, str]:
        return {"Authorization": f"Bearer {self._token}"}
