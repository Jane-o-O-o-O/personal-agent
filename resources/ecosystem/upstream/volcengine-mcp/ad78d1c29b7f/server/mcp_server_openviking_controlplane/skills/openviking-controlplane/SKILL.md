---
name: openviking-controlplane
description: Manage OpenViking collections (OV libraries) from the command line with `ov-cp` — list / create / get / update / usage / get the data-plane API key / delete, plus managing the users and account data spaces of an enterprise-tier library (list / create / register / update / delete), account-scoped users / API keys / usage, and configuring how a library is billed (AgentPlan AFP deduction vs Volcano pay-as-you-go, `--pay-type` / `--seat-id`). Use when the user wants to provision or inspect an OpenViking library, fetch a library's data-plane API key, do the create→get-key cold-start, manage a library's users or accounts / 数据空间, set or switch a library's billing, or otherwise drive the OpenViking control plane (topapi). Authenticates with an Ark AgentPlan ApiKey.
---

# OpenViking Control Plane (`ov-cp`)

`ov-cp` is the CLI for the OpenViking control plane (topapi). It manages OV
**collections** (libraries) and shares its core with the
`mcp-server-openviking-controlplane` MCP server, so behavior is identical.

## Setup

Install once (from the package dir): `uv sync` (or `pip install -e .`).

Configure via env vars (CLI flags `-k` / `-e` / `--project` override them):

| Env var | Meaning | Default |
|---|---|---|
| `AGENTPLAN_API_KEY` | Ark AgentPlan ApiKey (sent as `Authorization: Bearer`) | — (required) |
| `VIKING_ENDPOINT` | Control-plane base URL | `https://api.vikingdb.cn-beijing.volces.com/openviking` |
| `OPENVIKING_PROJECT` | Default project | `default` |
| `VIKING_EXTRA_HEADERS` | Extra request headers, comma-separated `Key: Value` | — |

```bash
export AGENTPLAN_API_KEY=ark-xxxxxxxx
# VIKING_ENDPOINT defaults to the public gateway — leave it unset for normal use.
```

> The default endpoint is the **reserved** public gateway (not open yet). Override
> `VIKING_ENDPOINT` (or `-e`) only for testing — e.g. point it at a `kubectl
> port-forward` of the data-plane service. The full request URL is
> `{endpoint}/api/openviking/{Action}`.

## Commands

```bash
ov-cp list                       # list collections (optionally --project X)
ov-cp get     <ResourceID>       # collection info (Status, models, version, ...)
ov-cp usage   <ResourceID>       # file counts / hourly CNY and AgentPlan AFP estimate
ov-cp usage   <ResourceID> --account-id team-alpha
ov-cp usage   <ResourceID> --user-id alice  # user in account default
ov-cp usage   <ResourceID> --account-id team-alpha --user-id alice
ov-cp api-key <ResourceID>       # default user's plaintext data-plane key
ov-cp api-key <ResourceID> --user-id alice  # selected user's plaintext key
ov-cp api-key <ResourceID> --account-id team-alpha --user-id alice
ov-cp create  --name my_kb       # create a collection (see below)
ov-cp update  <ResourceID> --description "..."   # update fields / switch billing
ov-cp update  <ResourceID> --model-api-key ark-xxx  # overwrite AgentPlan model key
ov-cp delete  <ResourceID> --yes # delete (irreversible; uninstalls the Helm release)

# users of an enterprise-tier library (key must be associated with the library):
ov-cp user list     <ResourceID>                     # users (ApiKey is masked)
ov-cp user list     <ResourceID> --role user --page 1 --limit 20
ov-cp user register <ResourceID> alice            # new users always get role=user
ov-cp user update   <ResourceID> alice --regenerate-key
ov-cp user delete   <ResourceID> alice --yes      # revoke a user's credential

# target a non-default data space with --account-id:
ov-cp user list     <ResourceID> --account-id team-alpha
ov-cp user register <ResourceID> alice --account-id team-alpha
ov-cp user update   <ResourceID> alice --account-id team-alpha --regenerate-key
ov-cp user delete   <ResourceID> alice --account-id team-alpha --yes

# data spaces (accounts) of an enterprise-tier library:
ov-cp account list   <ResourceID> --keyword team --page 1 --limit 20
ov-cp account create <ResourceID> team-alpha
ov-cp account delete <ResourceID> team-alpha  # prompts before cascading deletion
```

After `user update --regenerate-key`, fetch the replacement with
`api-key <ResourceID> --user-id <UserID>`; the update response only confirms
success and does not contain the new key. Include `--account-id <OpenVikingAccountID>` when
the user is outside account `default`.

`update --model-api-key <ark-key>` overwrites the library's AgentPlan MODEL
credential; VLM and Embedding always share one key, and the library's other
credentials are replayed unchanged. Only pass a key the user gave you for this
purpose — it REPLACES what is stored. A library with no AgentPlan model
credential is refused rather than reshaped.

Without that flag `update` sends no model configuration at all. Against a
control plane that still rebuilds both models on every update (it rejects a
metadata-only request with `apikey is empty`), `update` reads the library's own
credentials back and replays them once, reporting it in the response `Note`. A
non-AgentPlan credential stored without an ApiKeyID cannot be replayed — the
update is refused rather than guessed at.

In a terminal, output defaults to structured Rich views. Pipes and redirects
automatically receive standard JSON, so `ov-cp list | jq ...` and command
substitution remain safe. Use the global `--json`, `--output json-compact`, or
`--output pretty` flags to force a mode. Errors print `Error [Code]: Message` to
stderr with exit code 1. `ov-cp --help` and `ov-cp <cmd> --help` work without
any config.

Library-wide `usage` keeps `EstimatedCosts` for compatibility and adds
`EstimatedBilling`. That object identifies the hourly period and CNY estimate;
AgentPlan-paid collections also include the AFP amount and business scenario.
Account- or user-scoped usage omits both library-wide fields. `--user-id` may be
used alone for a user in account `default`.

## Data spaces (accounts)

Treat an account as an enterprise-tier library's first-level isolation boundary
for users, credentials, memories, resources, sessions, and skills. Treat
`default` as the released backend's default account, so omitting
`--account-id` preserves existing behavior. Every account-aware action sends the
scope as `OpenVikingAccountID`. Expect a newly created data space to
contain an automatically created `default` admin user.

Validate OpenVikingAccountID locally before sending a request; reject invalid input without
a backend request or cost. Apply all of these naming rules:

- Require 1-64 characters.
- Allow only ASCII letters, digits, `_`, `.`, `@`, and `-`; reject spaces and Chinese characters.
- Reject an ID that starts with `_`.
- Reject `.` and `..`.
- Allow at most one `@`.

Respect the backend-configured per-library account quota. Treat 100 as the current
default, not as a fixed limit. Treat `CreateTime` from `account list` as an opaque
backend timestamp string. Never delete account `default`.

Use this confirmation workflow before deleting any other data space:

1. First restate the target library ResourceID, exact OpenVikingAccountID, and full destruction scope: every user, credential, memory, resource, session, and skill in the data space. Ask the user to confirm that scope.
2. After that confirmation, require the user to repeat the exact OpenVikingAccountID.
3. Compare the repeated OpenVikingAccountID exactly with the target. Never infer an OpenVikingAccountID from a keyword or partial match in `account list`.
4. Only after both confirmations, run `ov-cp account delete <ResourceID> <OpenVikingAccountID> --yes`.

Never use `--yes` on the first deletion step. Stop if either confirmation is
missing or the repeated OpenVikingAccountID does not match exactly.

## Creating a collection

⚠️ **Billable + requires the account to have AgentPlan deduction activated** (else
`ProductUnordered`). Confirm with the user before creating. Max 20 libraries/account.

The public create command always uses the AgentPlan model path and the configured
AgentPlan key. It does not expose model source, model parameters, model credentials,
or an OpenViking image-version override.

```bash
ov-cp create --name my_kb
# enterprise tier (higher capacity, enterprise billing rates):
ov-cp create --name my_kb --version enterprise
```

`--version` is `developer` (default) or `enterprise`; any other value is rejected
locally before the request.

## Billing (`--pay-type` / `--seat-id`)

`--version` and billing are **orthogonal**: the tier sets the hourly RATE
(developer 5 AFP baseline, enterprise 25 AFP baseline), `--pay-type` sets WHO
PAYS. Both `create` and `update` take the same two flags (`update` is how you
switch billing later, or re-bind after a seat was unbound).

```bash
ov-cp create --name my_kb                                    # default: personal AFP pays
ov-cp create --name my_kb --version enterprise \
  --pay-type agentplan_enterprise --seat-id seat-2026xxxx    # that seat's AFP pays
ov-cp create --name my_kb --pay-type volc_pay                # explicit website PAYG
ov-cp update <RID> --pay-type volc_pay                       # switch billing later
```

- **Omitting `--pay-type` on create defaults to `agentplan_personal`** (AFP
  deduction from the account's personal AgentPlan) — `volc_pay` (billed to the
  Volcano account) must be an explicit choice. ⚠️ Accounts with no personal plan
  (e.g. enterprise seat keys) must not rely on the default: the library binds a
  non-existent personal plan, deduction fails and the library is disabled. The
  CLI prints a note.
- The personal/enterprise choice is otherwise explicit — never guess it from the key.
- `--seat-id` is required with `agentplan_enterprise` and forbidden otherwise.
  The user must copy it manually from the Ark console seat-management page
  (no lookup API). The server does NOT verify the seat exists — a typo only
  surfaces at the next hourly deduction, which then disables the library.
- `empty_pay` (unbound) exists server-side but is not offered: such a library is
  unusable and auto-cleaned after 30 days.

## Cold-start chain (create → use the library)

```bash
RID=$(ov-cp create --name my_kb | python3 -c 'import sys,json;print(json.load(sys.stdin)["ResourceID"])')
# Poll until provisioned; api-key times out while Status is INIT.
ov-cp get "$RID"        # wait for "Status": "READY"
ov-cp api-key "$RID"    # -> the plaintext data-plane key for the library
```

The returned `ApiKey` is the library's **data-plane** key. Use it as
`Authorization: Bearer <key>` against the library's data-plane (e.g.
`GET {endpoint}/health`, `GET {endpoint}/api/v1/system/status`,
`GET {endpoint}/api/v1/fs/ls?uri=viking://`).

## Notes

- Only `Authorization: Bearer` is accepted (no `X-API-Key`).
- `list` / `get` / `usage` are read-only; `delete` is destructive. Operations
  on an existing library may require the AgentPlan key to be associated with it.
- `get`/`usage`/`api-key`/`delete`/`update` and all `user *` take a `ResourceID`
  (e.g. `ov-xxxxxxxx`).
- `user *` manages the multiple users of an **enterprise-tier** library and needs the
  AgentPlan key to be **associated with that library** (else the backend rejects it).
  `user list` returns each user's **masked** ApiKey; for a plaintext data-plane key
  use `api-key <ResourceID> --user-id <UserID>`.
- Account operations also require the AgentPlan key to be associated with the target
  library.
- `--account-id` applies to `api-key`, `usage`, and every `user *` command; omitting
  it selects account `default`. `usage --user-id <UserID>` is valid without it.
- Scoped usage omits both `EstimatedCosts` and `EstimatedBilling`. Treat
  account-list `CreateTime` as opaque.
- Extra headers: pass `-H 'Key: Value'` (repeatable) or set `VIKING_EXTRA_HEADERS`
  to a comma-separated `Key: Value` list — e.g. `-H 'x-tt-env: <swimlane>'` for
  swim-lane routing. `Authorization` / `Content-Type` are protected and ignored.
