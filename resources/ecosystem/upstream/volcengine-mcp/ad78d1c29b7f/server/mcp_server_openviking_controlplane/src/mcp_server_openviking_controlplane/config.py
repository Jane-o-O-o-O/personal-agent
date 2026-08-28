import logging
import os
import re
from dataclasses import dataclass, field
from typing import Dict, Optional

from mcp_server_openviking_controlplane.common.auth import (
    validate_header_name,
    validate_header_value,
)

logger = logging.getLogger(__name__)

# The control-plane TopAPI is compiled into the OpenViking data-plane cluster.
# Each Action is served at:  {endpoint}/api/openviking/{Action}
#   - Action/Version live in the path; there is NO ?Action=&Version= query.
#   - Auth is an Ark AgentPlan ApiKey replayed as: Authorization: Bearer <key>.
ACTION_PATH_PREFIX = "/api/openviking"

# Reserved public data-plane gateway (not open to traffic yet). The trailing
# /openviking base is the same prefix the data-plane APIs use, so the full URL
# is {endpoint}/api/openviking/{Action}. Override via VIKING_ENDPOINT / --endpoint
# while testing — e.g. a kubectl port-forward to the data pod: http://localhost:18080
DEFAULT_ENDPOINT = "https://api.vikingdb.cn-beijing.volces.com/openviking"
DEFAULT_PROJECT = "default"

# Model names for AgentPlan collections. The backend's prefix check only accepts
# these names for VLM / Embedding respectively, so they double as fixed defaults.
DEFAULT_VLM_MODEL = "doubao-seed-2.0-lite"
DEFAULT_EMBEDDING_MODEL = "doubao-embedding-vision"

# Library tier (top-level ``Version`` field). "developer" is the free/default
# tier; "enterprise" is the higher-capacity, enterprise-billed tier.
VERSION_CHOICES = ("developer", "enterprise")

# Account (data-space) identifiers are shared by account lifecycle operations
# and account-aware user/usage operations.
DEFAULT_ACCOUNT_ID = "default"
ACCOUNT_ID_MAX_LENGTH = 64
ACCOUNT_ID_PATTERN = re.compile(r"^[A-Za-z0-9_.@-]+$")
ACCOUNT_ID_RULES = (
    "must be 1-64 characters using only ASCII letters, digits, '_', '.', '@', or '-'; "
    "must not start with '_'; must not be '.' or '..'; and may contain at most "
    "one '@'"
)

# Billing (``PaymentConfig``): how a library is paid for — orthogonal to the
# ``Version`` tier, which only sets the hourly rate. One flat user-facing enum
# (the wire format splits it into PayType + AgentPlanConfig.BusinessScenarios);
# the personal/enterprise choice is always explicit, never inferred from the
# key or the seat. ``empty_pay`` exists server-side but is deliberately not
# offered: an unbound library's data plane is unusable and the library is
# auto-cleaned after 30 days.
PAY_TYPE_MAP = {
    "agentplan_personal": ("agentplan_pay", "agent_plan_personal"),
    "agentplan_enterprise": ("agentplan_pay", "agent_plan_enterprise"),
    "volc_pay": ("volc_pay", None),
}
PAY_TYPE_CHOICES = tuple(PAY_TYPE_MAP)

# Header names that extra_headers must never override: auth and content type are
# owned by the client and a stray value would break the request.
_PROTECTED_HEADERS = {"authorization", "content-type"}


def parse_extra_headers(raw: Optional[str]) -> Dict[str, str]:
    """Parse a comma-separated ``Key: Value`` header string (e.g. from
    ``VIKING_EXTRA_HEADERS``) into a dict. Tolerates spaces after the colon and
    around commas. Blank entries are skipped; the value may itself contain
    colons (only the first splits key from value)."""
    result: Dict[str, str] = {}
    if not raw:
        return result
    for item in raw.split(","):
        item = item.strip()
        if not item:
            continue
        if ":" not in item:
            logger.warning("ignoring malformed extra header (no colon): %r", item)
            continue
        key, value = item.split(":", 1)
        key = key.strip()
        if not key:
            continue
        result[key] = value.strip()
    return result


@dataclass
class ControlPlaneConfig:
    """Configuration for the OpenViking control plane MCP server / CLI."""

    api_key: str
    endpoint: str = DEFAULT_ENDPOINT
    project: str = DEFAULT_PROJECT
    extra_headers: Dict[str, str] = field(default_factory=dict)

    @property
    def base_url(self) -> str:
        return self.endpoint.rstrip("/")

    def action_path(self, action: str) -> str:
        return f"{ACTION_PATH_PREFIX}/{action}"

    def safe_extra_headers(self) -> Dict[str, str]:
        """extra_headers with protected (auth/content-type) keys dropped, so
        callers can merge them onto request headers without clobbering auth."""
        safe: Dict[str, str] = {}
        for key, value in self.extra_headers.items():
            validate_header_name(key, label="extra header name")
            validate_header_value(value, label=f"extra header {key!r}")
            if key.lower() in _PROTECTED_HEADERS:
                logger.warning("ignoring protected extra header: %s", key)
                continue
            safe[key] = value
        return safe


def build_config(
    endpoint: Optional[str] = None,
    project: Optional[str] = None,
    api_key: Optional[str] = None,
    extra_headers: Optional[Dict[str, str]] = None,
) -> ControlPlaneConfig:
    """Build a config from explicit args first, then environment fallbacks, then
    package defaults."""
    resolved_key = api_key or os.environ.get("AGENTPLAN_API_KEY")
    if not resolved_key:
        raise ValueError(
            "missing AgentPlan API key: set --api-key or the AGENTPLAN_API_KEY env var "
            "(the Ark AgentPlan ApiKey sent as 'Authorization: Bearer <key>')"
        )
    # env baseline, then merge explicit headers on top (explicit wins).
    headers = parse_extra_headers(os.environ.get("VIKING_EXTRA_HEADERS"))
    if extra_headers:
        headers.update(extra_headers)
    return ControlPlaneConfig(
        api_key=resolved_key,
        endpoint=endpoint or os.environ.get("VIKING_ENDPOINT", DEFAULT_ENDPOINT),
        project=project or os.environ.get("OPENVIKING_PROJECT", DEFAULT_PROJECT),
        extra_headers=headers,
    )
