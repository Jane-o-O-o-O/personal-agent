import json
import logging
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, Optional

import requests

from mcp_server_openviking_controlplane.common.auth import AuthProvider, BearerTokenAuth
from mcp_server_openviking_controlplane.config import (
    ACCOUNT_ID_MAX_LENGTH,
    ACCOUNT_ID_PATTERN,
    ACCOUNT_ID_RULES,
    DEFAULT_ACCOUNT_ID,
    DEFAULT_EMBEDDING_MODEL,
    DEFAULT_VLM_MODEL,
    PAY_TYPE_MAP,
    VERSION_CHOICES,
    ControlPlaneConfig,
    build_config,
)

logger = logging.getLogger(__name__)

# Headers we never replay verbatim: requests recomputes them, or a stale value
# breaks the request. We always send a freshly serialized JSON body.
_DROP_HEADERS = {"content-length", "connection", "accept-encoding"}
_AFP_PER_CNY = Decimal("500")
# A control plane that still rebuilds both model configs on every update
# rejects a metadata-only request with this message; see update_collection.
_MODEL_REPLAY_ERROR = "apikey is empty"


def _format_decimal(value: Decimal) -> str:
    """Render a decimal without scientific notation or insignificant zeroes."""
    rendered = format(value.normalize(), "f")
    return rendered.rstrip("0").rstrip(".") if "." in rendered else rendered


def enrich_usage_billing(
    usage: Dict[str, Any],
    collection: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Add unit, period, payment source and AgentPlan AFP to legacy usage data."""
    if isinstance(usage.get("EstimatedBilling"), dict):
        return usage
    estimated_cost = usage.get("EstimatedCosts")
    if estimated_cost is None:
        return usage

    billing: Dict[str, Any] = {
        "CNY": str(estimated_cost),
        "Period": "hour",
    }
    payment = (collection or {}).get("PaymentConfig")
    if isinstance(payment, dict):
        pay_type = payment.get("PayType")
        if pay_type:
            billing["PayType"] = pay_type
        agentplan = payment.get("AgentPlanConfig")
        if isinstance(agentplan, dict):
            scenario = agentplan.get("BusinessScenarios")
            if scenario:
                billing["BusinessScenarios"] = scenario
        if pay_type == "agentplan_pay":
            try:
                billing["AFP"] = _format_decimal(
                    Decimal(str(estimated_cost)) * _AFP_PER_CNY
                )
            except InvalidOperation:
                logger.warning(
                    "cannot convert EstimatedCosts=%r to AgentPlan AFP",
                    estimated_cost,
                )

    usage["EstimatedBilling"] = billing
    return usage


def build_payment_config(
    pay_type: Optional[str] = None,
    seat_id: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """Validate billing arguments and build the ``PaymentConfig`` request block.

    ``pay_type`` is the flat user-facing enum (``agentplan_personal`` /
    ``agentplan_enterprise`` / ``volc_pay``); the wire split into PayType +
    BusinessScenarios happens here. Returns None when nothing was given — the
    server then defaults the library to ``volc_pay``: Volcano pay-as-you-go,
    with charges billed directly to the Volcano account rather than deducted
    from AgentPlan AFP. The server
    only checks a SeatId is non-empty, not that it exists: a typo surfaces at
    the next hourly deduction, after which the library is disabled.
    """
    if not (pay_type or seat_id):
        return None
    if pay_type is None:  # only seat_id was given
        raise ValueError(
            "seat_id alone is ambiguous: also pass pay_type='agentplan_enterprise'"
        )
    if pay_type == "agentplan_pay":
        raise ValueError(
            "'agentplan_pay' is ambiguous here: use 'agentplan_personal' or "
            "'agentplan_enterprise' (the choice is always explicit)"
        )
    if pay_type not in PAY_TYPE_MAP:
        raise ValueError(
            f"invalid pay_type {pay_type!r}; expected one of {', '.join(PAY_TYPE_MAP)} "
            "(empty_pay is not offered: an unbound library is unusable and "
            "auto-cleaned after 30 days)"
        )

    wire_type, scenario = PAY_TYPE_MAP[pay_type]
    if wire_type == "volc_pay":
        if seat_id:
            raise ValueError("seat_id only applies to pay_type='agentplan_enterprise'")
        return {"PayType": "volc_pay"}
    if scenario == "agent_plan_enterprise" and not seat_id:
        raise ValueError(
            "pay_type='agentplan_enterprise' requires seat_id — the seat that pays; "
            "copy it from the Ark console seat-management page"
        )
    if scenario == "agent_plan_personal" and seat_id:
        raise ValueError(
            "pay_type='agentplan_personal' must not carry a seat_id "
            "(a personal plan has no seat)"
        )
    return {
        "PayType": wire_type,
        "AgentPlanConfig": {"BusinessScenarios": scenario, "SeatId": seat_id or ""},
    }


def validate_account_id(account_id: str, label: str = "account_id") -> str:
    """Validate and return an OpenViking account (data-space) identifier."""
    reason: Optional[str] = None
    if not isinstance(account_id, str):
        reason = "must be a string"
    elif not 1 <= len(account_id) <= ACCOUNT_ID_MAX_LENGTH:
        reason = f"must be between 1 and {ACCOUNT_ID_MAX_LENGTH} characters"
    elif ACCOUNT_ID_PATTERN.fullmatch(account_id) is None:
        reason = "contains unsupported characters"
    elif account_id.startswith("_"):
        reason = "must not start with '_'"
    elif account_id in {".", ".."}:
        reason = "must not be '.' or '..'"
    elif account_id.count("@") > 1:
        reason = "may contain at most one '@'"

    if reason is not None:
        raise ValueError(
            f"invalid {label} {account_id!r}; {reason}. Rules: {ACCOUNT_ID_RULES}"
        )
    return account_id


def _normalize_optional_account_id(account_id: Optional[str]) -> Optional[str]:
    """Match the backend's optional account normalization for user actions."""
    if account_id is None:
        return None
    if not isinstance(account_id, str):
        return validate_account_id(account_id)
    normalized = account_id.strip()
    if not normalized:
        return None
    return validate_account_id(normalized)


def _validate_pagination(page: int, limit: int) -> None:
    if page < 1:
        raise ValueError("page must be >= 1")
    if not 1 <= limit <= 200:
        raise ValueError("limit must be between 1 and 200")


class ControlPlaneError(RuntimeError):
    """Raised when the control plane returns an Error envelope or a non-200 status."""

    def __init__(self, code: str, message: str, request_id: str = ""):
        self.code = code
        self.message = message
        self.request_id = request_id
        suffix = f" (RequestId={request_id})" if request_id else ""
        super().__init__(f"[{code}] {message}{suffix}")


class ControlPlaneClient:
    """Shared core used by both the MCP tools (``server.py``) and the CLI (``cli.py``).

    One method per control-plane Action. Each builds the request body, attaches auth
    headers via the ``AuthProvider``, POSTs, and unwraps the TOP response envelope.
    """

    def __init__(
        self,
        config: ControlPlaneConfig,
        auth: Optional[AuthProvider] = None,
        timeout: int = 30,
    ):
        self.config = config
        self.auth = auth or BearerTokenAuth(config.api_key)
        self.timeout = timeout

    def _request(self, action: str, body: Dict[str, Any]) -> Dict[str, Any]:
        # Console proxy: Action/Version are in the path, not the query string.
        path = self.config.action_path(action)
        body_str = json.dumps(body)

        headers = {"Content-Type": "application/json"}
        headers.update(self.auth.auth_headers("POST", path, {}, body_str))
        # Caller-supplied extra headers (e.g. x-tt-env for swim-lane routing);
        # protected keys (Authorization/Content-Type) are already filtered out.
        headers.update(self.config.safe_extra_headers())
        headers = {k: v for k, v in headers.items() if k.lower() not in _DROP_HEADERS}

        url = f"{self.config.base_url}{path}"
        logger.debug("POST %s body=%s", url, body_str)
        rsp = requests.request(
            "POST", url, data=body_str, headers=headers, timeout=self.timeout
        )
        return self._unwrap(action, rsp)

    @staticmethod
    def _unwrap(action: str, rsp: requests.Response) -> Dict[str, Any]:
        try:
            payload = rsp.json()
        except ValueError:
            raise ControlPlaneError(
                "InvalidResponse",
                f"{action} returned non-JSON (HTTP {rsp.status_code}): {rsp.text[:500]}",
            )

        meta = payload.get("ResponseMetadata", {}) if isinstance(payload, dict) else {}
        error = meta.get("Error")
        if error:
            raise ControlPlaneError(
                error.get("Code", "Unknown"),
                error.get("Message", ""),
                meta.get("RequestId", ""),
            )
        if rsp.status_code != 200:
            raise ControlPlaneError(
                "HTTPError",
                f"{action} HTTP {rsp.status_code}: {rsp.text[:500]}",
                meta.get("RequestId", ""),
            )
        return payload.get("Result", {}) if isinstance(payload, dict) else {}

    # --- Actions (6 core) ---------------------------------------------------

    def list_collections(self, project: Optional[str] = None) -> Dict[str, Any]:
        body: Dict[str, Any] = {}
        proj = project if project is not None else self.config.project
        if proj:
            body["Project"] = proj
        return self._request("ListOpenVikingCollections", body)

    def _model_block(
        self, cfg: Optional[Dict[str, Any]], source: str, default_model: str
    ) -> Dict[str, Any]:
        """Build a VLM/Embedding block in the multi-credential (Credentials[]) form.

        The new control-plane create format carries credentials per-model as an
        ordered failover list. We emit one credential built from ``source`` plus
        the supplied key fields; for ``source == "agentplan"`` the model credential
        is the AgentPlan ApiKey itself, so it falls back to the configured key.
        An advanced caller may instead pass a ready-made ``Credentials`` list
        (e.g. for multi-source failover), which is passed through verbatim."""
        cfg = dict(cfg or {})
        model_name = cfg.get("ModelName") or default_model

        creds = cfg.get("Credentials")
        if creds:  # caller already supplied the failover list — pass through
            return {"ModelName": model_name, "Credentials": creds}

        api_key = cfg.get("ApiKey")
        api_key_id = cfg.get("ApiKeyID")
        if not api_key and not api_key_id and source == "agentplan":
            api_key = self.config.api_key

        cred: Dict[str, Any] = {"Source": source}
        if api_key_id:
            cred["ApiKeyID"] = api_key_id
        if api_key:
            cred["ApiKey"] = api_key
        if cfg.get("EndpointID"):  # volcengine source only
            cred["EndpointID"] = cfg["EndpointID"]
        return {"ModelName": model_name, "Credentials": [cred]}

    def create_collection(
        self,
        name: str,
        source: str = "agentplan",
        vlm: Optional[Dict[str, Any]] = None,
        embedding: Optional[Dict[str, Any]] = None,
        version: str = "developer",
        project: Optional[str] = None,
        description: Optional[str] = None,
        openviking_version: Optional[str] = None,
        pay_type: Optional[str] = None,
        seat_id: Optional[str] = None,
        extra: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        if version not in VERSION_CHOICES:
            raise ValueError(
                f"invalid version {version!r}; expected one of {', '.join(VERSION_CHOICES)}"
            )
        # Billing default: when the caller specifies nothing, bind the personal
        # AgentPlan instead of leaving PaymentConfig unset — the server-side
        # default is volc_pay, which would put the library on Volcano
        # pay-as-you-go billing without an explicit decision. A wrong personal
        # binding is visible immediately and recoverable via update; unintended
        # account billing is neither. Accounts without a personal plan must
        # pass an explicit pay_type.
        if pay_type is None and seat_id is None:
            pay_type = "agentplan_personal"
        payment = build_payment_config(pay_type, seat_id)
        # Multi-credential create format: top-level Source is omitted (each model
        # carries its source inside Credentials[]).
        body: Dict[str, Any] = {
            "Name": name,
            "Version": version,
            "VLM": self._model_block(vlm, source, DEFAULT_VLM_MODEL),
            "Embedding": self._model_block(embedding, source, DEFAULT_EMBEDDING_MODEL),
        }
        if payment is not None:
            body["PaymentConfig"] = payment
        proj = project if project is not None else self.config.project
        if proj:
            body["Project"] = proj
        if description is not None:
            body["Description"] = description
        if openviking_version:
            body["OpenvikingVersion"] = openviking_version
        if extra:
            body.update(extra)  # Feishu / GitHub / Memory, etc.
        return self._request("CreateOpenVikingCollection", body)

    def get_collection(self, resource_id: str) -> Dict[str, Any]:
        return self._request("GetOpenVikingCollection", {"ResourceID": resource_id})

    def update_collection(
        self,
        resource_id: str,
        description: Optional[str] = None,
        source: str = "agentplan",
        vlm: Optional[Dict[str, Any]] = None,
        embedding: Optional[Dict[str, Any]] = None,
        pay_type: Optional[str] = None,
        seat_id: Optional[str] = None,
        model_api_key: Optional[str] = None,
        extra: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Update a collection's mutable fields (e.g. Description, PaymentConfig).

        This is also the way to CHANGE how a library is billed (volc_pay ↔
        AgentPlan deduction, or re-bind a seat after it was unbound): pass
        pay_type / seat_id, validated by ``build_payment_config``. Omitting
        both leaves the current billing untouched.

        VLM and Embedding are sent only when explicitly supplied. This preserves
        existing multi-credential model configuration during description or billing
        updates. Passing an empty/whitespace Description is a server-side no-op.
        ``extra`` is merged verbatim for forward-compatibility.

        A control plane that still rebuilds both models on every update rejects
        such a metadata-only request with "apikey is empty": it rebuilds from the
        legacy flat ApiKey, which is blank once a collection stores an
        N-credential list. We then replay the collection's own credentials once
        and retry — see ``_replay_model_blocks``.

        ``model_api_key`` overwrites the AgentPlan model credential of BOTH
        models with the supplied key (they always share one). It is sent up
        front rather than only on retry, since replacing a stored credential is
        a deliberate act; the collection's other credentials are still replayed
        untouched. Mutually exclusive with explicit vlm / embedding blocks."""
        payment = build_payment_config(pay_type, seat_id)
        body: Dict[str, Any] = {"ResourceID": resource_id}
        if vlm is not None:
            body["VLM"] = self._model_block(vlm, source, DEFAULT_VLM_MODEL)
        if embedding is not None:
            body["Embedding"] = self._model_block(
                embedding,
                source,
                DEFAULT_EMBEDDING_MODEL,
            )
        if payment is not None:
            body["PaymentConfig"] = payment
        if description is not None:
            body["Description"] = description
        if extra:
            body.update(extra)
        if model_api_key:
            if vlm is not None or embedding is not None:
                raise ValueError(
                    "model_api_key cannot be combined with an explicit vlm / "
                    "embedding block; put the key in that block instead"
                )
            blocks = self._replay_model_blocks(resource_id, model_api_key)
            body.update(blocks)
            result = self._request("UpdateOpenVikingCollection", body)
            if isinstance(result, dict):
                result["Note"] = self._replay_note(blocks, explicit_key=True)
            return result
        try:
            return self._request("UpdateOpenVikingCollection", body)
        except ControlPlaneError as exc:
            if "VLM" in body or "Embedding" in body:
                raise  # the caller's own model credentials were rejected
            if _MODEL_REPLAY_ERROR not in exc.message.lower():
                raise
            logger.warning(
                "control plane rejected a metadata-only update with %r; "
                "replaying the collection's existing model credentials",
                exc.message,
            )
            blocks = self._replay_model_blocks(resource_id)
            body.update(blocks)
            result = self._request("UpdateOpenVikingCollection", body)
            if isinstance(result, dict):
                result["Note"] = self._replay_note(blocks, explicit_key=False)
            return result

    def _replay_model_blocks(
        self,
        resource_id: str,
        agentplan_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Rebuild VLM/Embedding request blocks from the collection's own config.

        Used to work around a control plane that rebuilds both models even for a
        metadata-only update, and to carry an explicit AgentPlan model key. The
        Get response masks every ApiKey, so a credential can be replayed only
        through its ApiKeyID — except the AgentPlan one, whose model key is
        ``agentplan_key`` or, by default, the control-plane key we already
        authenticate with (exactly how ``create_collection`` builds it)."""
        collection = self.get_collection(resource_id)
        blocks: Dict[str, Any] = {}
        for label, default_model in (
            ("VLM", DEFAULT_VLM_MODEL),
            ("Embedding", DEFAULT_EMBEDDING_MODEL),
        ):
            config = collection.get(label)
            credentials = config.get("Credentials") if isinstance(config, dict) else None
            if not credentials:
                raise ControlPlaneError(
                    "CredentialNotReplayable",
                    f"{label} has no credentials to replay; pass the model "
                    f"configuration explicitly to update this collection.",
                )
            blocks[label] = {
                "ModelName": config.get("ModelName") or default_model,
                "Credentials": [
                    self._replay_credential(cred, label, agentplan_key)
                    for cred in credentials
                ],
            }
        if agentplan_key and not self._has_agentplan_credential(blocks):
            raise ControlPlaneError(
                "CredentialNotReplayable",
                "this collection has no AgentPlan model credential to overwrite; "
                "pass the model configuration explicitly instead.",
            )
        return blocks

    def _replay_credential(
        self,
        cred: Dict[str, Any],
        label: str,
        agentplan_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Rebuild one request credential from a masked Get response entry."""
        source = str(cred.get("Source") or "").strip()
        replayed: Dict[str, Any] = {"Source": source}
        provider = str(cred.get("Provider") or "").strip()
        if provider:
            replayed["Provider"] = provider

        api_key_id = str(cred.get("ApiKeyID") or "").strip()
        if agentplan_key and source == "agentplan":  # explicit overwrite wins
            replayed["ApiKey"] = agentplan_key
        elif api_key_id:  # server-side lookup; the plaintext key never reaches us
            replayed["ApiKeyID"] = api_key_id
        elif source == "agentplan":
            replayed["ApiKey"] = self.config.api_key
        else:
            raise ControlPlaneError(
                "CredentialNotReplayable",
                f"{label} credential {source!r} carries no ApiKeyID and its "
                f"ApiKey is masked in the Get response; pass the model "
                f"configuration explicitly to update this collection.",
            )

        endpoint_id = str(cred.get("EndpointID") or "").strip()
        if source == "volcengine":  # required by the backend for this source only
            if not endpoint_id:
                raise ControlPlaneError(
                    "CredentialNotReplayable",
                    f"{label} volcengine credential has no EndpointID to replay.",
                )
            replayed["EndpointID"] = endpoint_id
        return replayed

    @staticmethod
    def _has_agentplan_credential(blocks: Dict[str, Any]) -> bool:
        return any(
            cred.get("Source") == "agentplan"
            for block in blocks.values()
            for cred in block["Credentials"]
        )

    @classmethod
    def _replay_note(cls, blocks: Dict[str, Any], explicit_key: bool) -> str:
        """Explain the replay in the result, since it rewrites stored credentials."""
        if explicit_key:
            return (
                "The AgentPlan model credential of both VLM and Embedding was "
                "overwritten with the supplied key; the collection's other "
                "credentials were replayed unchanged."
            )
        note = (
            "The control plane rebuilt both model configurations on this update, "
            "so the collection's existing credentials were replayed."
        )
        if cls._has_agentplan_credential(blocks):
            note += (
                " The AgentPlan model credential was re-set to the key this "
                "client authenticates with."
            )
        return note

    def delete_collection(self, resource_id: str) -> Dict[str, Any]:
        return self._request("DeleteOpenVikingCollection", {"ResourceID": resource_id})

    def get_usage(
        self,
        resource_id: str,
        account_id: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        body: Dict[str, Any] = {"ResourceID": resource_id}
        if account_id is not None:
            body["OpenVikingAccountID"] = validate_account_id(account_id)
        if user_id is not None:
            # A UserID without an explicit account selects the default data space.
            body["UserID"] = user_id
        result = self._request("GetOpenVikingUsage", body)
        # AgentFileNum is not meaningful here; drop it from the returned usage.
        result.pop("AgentFileNum", None)
        if account_id is not None or user_id is not None:
            # Costs and collection metadata are library-wide. Attaching them to an
            # account/user slice would be misleading, so scoped usage returns only
            # scoped counters and avoids the extra collection request.
            result.pop("EstimatedCosts", None)
            result.pop("EstimatedBilling", None)
            return result
        collection: Optional[Dict[str, Any]] = None
        try:
            collection = self.get_collection(resource_id)
        except (ControlPlaneError, requests.RequestException) as error:
            # PaymentConfig was added after the usage API. Keep usage compatible
            # with older deployments even when collection metadata is unavailable.
            logger.debug(
                "cannot load billing metadata for %s: %s",
                resource_id,
                error,
            )
        return enrich_usage_billing(result, collection)

    def get_user_access(
        self,
        resource_id: str,
        user_id: Optional[str] = None,
        account_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        # On the data-plane cluster the api-key action is registered as
        # GetOpenVikingCollectionUserAccess (the console proxy's
        # AccessOpenVikingApiKey is NOT routed here — it 404s). Returns a
        # PLAINTEXT key: {"UserID", "Role", "ApiKey"}. With no UserID the
        # backend returns the default user.
        # (ListOpenVikingCollectionUser only returns a masked key.)
        body: Dict[str, Any] = {"ResourceID": resource_id}
        if user_id is not None:
            body["UserID"] = user_id
        normalized_account_id = _normalize_optional_account_id(account_id)
        if normalized_account_id is not None:
            body["OpenVikingAccountID"] = normalized_account_id
        return self._request("GetOpenVikingCollectionUserAccess", body)

    # --- User management (enterprise-tier libraries: multi-user) -------------
    # These require the AgentPlan key to be associated with the target library;
    # operating on an unassociated library is rejected server-side. The ApiKey in
    # a List response is MASKED — fetch the plaintext key via get_user_access.

    def list_collection_users(
        self,
        resource_id: str,
        user_id: Optional[str] = None,
        role: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
        account_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        # ListOpenVikingCollectionUser: users under the library (ApiKey masked).
        _validate_pagination(page, limit)
        body: Dict[str, Any] = {
            "ResourceID": resource_id,
            "Page": page,
            "Limit": limit,
        }
        if user_id is not None:
            body["UserID"] = user_id
        if role is not None:
            body["Role"] = role
        normalized_account_id = _normalize_optional_account_id(account_id)
        if normalized_account_id is not None:
            body["OpenVikingAccountID"] = normalized_account_id
        return self._request("ListOpenVikingCollectionUser", body)

    def register_user(
        self,
        resource_id: str,
        user_id: str,
        account_id: Optional[str] = None,
        extra: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        # RegisterOpenVikingUser: create a regular "user" under the library.
        # The backend does not accept a Role parameter.
        body: Dict[str, Any] = {"ResourceID": resource_id, "UserID": user_id}
        normalized_account_id = _normalize_optional_account_id(account_id)
        if normalized_account_id is not None:
            body["OpenVikingAccountID"] = normalized_account_id
        if extra:
            body.update(extra)
        return self._request("RegisterOpenVikingUser", body)

    def update_user(
        self,
        resource_id: str,
        user_id: str,
        regenerate_key: bool = False,
        account_id: Optional[str] = None,
        extra: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        # UpdateOpenVikingUser only supports rotating the user's ApiKey.
        if not regenerate_key:
            raise ValueError(
                "nothing to update: regenerate_key=True is required to rotate the user's API Key"
            )
        body: Dict[str, Any] = {
            "ResourceID": resource_id,
            "UserID": user_id,
            "RegenerateKey": True,
        }
        normalized_account_id = _normalize_optional_account_id(account_id)
        if normalized_account_id is not None:
            body["OpenVikingAccountID"] = normalized_account_id
        if extra:
            body.update(extra)
        return self._request("UpdateOpenVikingUser", body)

    def delete_user(
        self,
        resource_id: str,
        user_id: str,
        account_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        # DeleteOpenVikingUser: remove a user from the library.
        body: Dict[str, Any] = {"ResourceID": resource_id, "UserID": user_id}
        normalized_account_id = _normalize_optional_account_id(account_id)
        if normalized_account_id is not None:
            body["OpenVikingAccountID"] = normalized_account_id
        return self._request("DeleteOpenVikingUser", body)

    # --- Account management (enterprise-tier data spaces) -------------------

    def create_account(
        self,
        resource_id: str,
        account_id: str,
        extra: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        body: Dict[str, Any] = {
            "ResourceID": resource_id,
            "OpenVikingAccountID": validate_account_id(account_id),
        }
        if extra:
            body.update(extra)
        return self._request("CreateOpenVikingAccount", body)

    def list_accounts(
        self,
        resource_id: str,
        keyword: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
    ) -> Dict[str, Any]:
        _validate_pagination(page, limit)
        body: Dict[str, Any] = {
            "ResourceID": resource_id,
            "Page": page,
            "Limit": limit,
        }
        # Keyword is a substring filter, not an account identifier.
        if keyword is not None:
            body["Keyword"] = keyword
        return self._request("ListOpenVikingAccounts", body)

    def delete_account(self, resource_id: str, account_id: str) -> Dict[str, Any]:
        account_id = validate_account_id(account_id)
        # Mirror the backend guard before a caller crosses a destructive-confirmation
        # boundary only to have the reserved default data space rejected remotely.
        if account_id == DEFAULT_ACCOUNT_ID:
            raise ValueError("the default account cannot be deleted")
        return self._request(
            "DeleteOpenVikingAccount",
            {"ResourceID": resource_id, "OpenVikingAccountID": account_id},
        )


def build_client(
    api_key: Optional[str] = None,
    endpoint: Optional[str] = None,
    project: Optional[str] = None,
    extra_headers: Optional[Dict[str, str]] = None,
) -> ControlPlaneClient:
    """Build a control-plane client from explicit args first, then the environment.

    Deliberately not cached. The MCP server resolves the caller's credential per
    request, and a client caches nothing expensive: it holds no requests.Session
    and opens no sockets until a method is called.
    """
    return ControlPlaneClient(
        build_config(
            endpoint=endpoint,
            project=project,
            api_key=api_key,
            extra_headers=extra_headers,
        )
    )
