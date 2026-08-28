# OpenViking Control Plane — MCP Server + CLI

MCP server **and** CLI for the OpenViking control plane (topapi) — manage OV
libraries (`Collection`). Both front-ends share one core (`client.py`), so a tool
added once is available from MCP and the CLI alike.

Covers 14 collection lifecycle, billing, user-management, and data-space Actions:

| Action | MCP tool | CLI command |
|---|---|---|
| `ListOpenVikingCollections` | `list_collections` | `ov-cp list` |
| `CreateOpenVikingCollection` | `create_collection` ⚠️ | `ov-cp create` |
| `GetOpenVikingCollection` | `get_collection` | `ov-cp get <rid>` |
| `UpdateOpenVikingCollection` | `update_collection` | `ov-cp update <rid>` |
| `DeleteOpenVikingCollection` | `delete_collection` ⚠️ | `ov-cp delete <rid>` |
| `GetOpenVikingUsage` | `get_usage` | `ov-cp usage <rid>` |
| `GetOpenVikingCollectionUserAccess` | `get_collection_api_key` | `ov-cp api-key <rid>` |
| `ListOpenVikingCollectionUser` | `list_collection_users` | `ov-cp user list <rid>` |
| `RegisterOpenVikingUser` | `register_collection_user` | `ov-cp user register <rid> <uid>` |
| `UpdateOpenVikingUser` | `update_collection_user` | `ov-cp user update <rid> <uid>` |
| `DeleteOpenVikingUser` | `delete_collection_user` ⚠️ | `ov-cp user delete <rid> <uid>` |
| `ListOpenVikingAccounts` | `list_collection_accounts` | `ov-cp account list <rid>` |
| `CreateOpenVikingAccount` | `create_collection_account` | `ov-cp account create <rid> <account-id>` |
| `DeleteOpenVikingAccount` | `delete_collection_account` ⚠️ | `ov-cp account delete <rid> <account-id>` |

The `user *` actions manage the multiple users of an enterprise-tier library; they
require the AgentPlan key to be **associated with the target library**. A user's
`ApiKey` from `user list` is **masked** — fetch a selected user's plaintext
data-plane key via `api-key <rid> --user-id <uid>`. Newly registered users always
have role `user`; `user update` currently supports API Key rotation only.

The `account *` actions manage enterprise-tier data spaces: first-level isolation
boundaries for users, credentials, memories, resources, sessions, and skills. The
released backend uses account `default` when `--account-id` is omitted, preserving
existing behavior. Every account-aware action serializes the scope as
`OpenVikingAccountID` on the wire. Creating one automatically adds its `default`
admin user. An OpenVikingAccountID is 1-64 characters using only ASCII letters,
digits, `_`, `.`, `@`, or `-`; it cannot start with `_`, equal `.` or `..`, or
contain more than one `@`. The per-library quota is backend-configured (currently
100 by default). Deleting a data space cascades to everything inside it and is
irreversible; `default` cannot be deleted. Treat `CreateTime` from `account list`
as an opaque backend timestamp string.

## Endpoint

The control-plane TopAPI is compiled into the OpenViking **data-plane cluster**;
each Action is served by the data-plane gateway at:

```text
{endpoint}/api/openviking/{Action}
# default endpoint: https://api.vikingdb.cn-beijing.volces.com/openviking
# full URL e.g.: https://api.vikingdb.cn-beijing.volces.com/openviking/api/openviking/ListOpenVikingCollections
```

The Action lives in the **path** (no `?Action=&Version=` query). The request body
is the Action's params (e.g. `{"ResourceID": "..."}`).

> The default endpoint points at the **reserved** public data-plane gateway (not
> open to traffic yet). For local testing set `--endpoint` / `VIKING_ENDPOINT` to a
> `kubectl port-forward`, e.g. `http://localhost:18080`.

## Authentication

The only method: an **Ark AgentPlan ApiKey**, sent as an `Authorization: Bearer
<key>` header on every request (the backend's `authorizeControlPlaneByArk` reads
the key only from this header — it does **not** accept `X-API-Key`). Auth is
pluggable (`common/auth.py` → `BearerTokenAuth`); an AK/SK signer can be swapped in
later without touching the rest.

> ⚠️ Write actions like `create` require the account to have **AgentPlan deduction
> activated**, otherwise they return `ProductUnordered`. Operations on an existing
> library can additionally require the AgentPlan key to be associated with that library.

### Configuration

| Setting | Env var | CLI flag | Default |
|---|---|---|---|
| Control-plane endpoint (base URL) | `VIKING_ENDPOINT` | `--endpoint` / `-e` | `https://api.vikingdb.cn-beijing.volces.com/openviking` |
| AgentPlan ApiKey | `AGENTPLAN_API_KEY` | `--api-key` / `-k` | — (required) |
| Default project | `OPENVIKING_PROJECT` | `--project` | `default` |
| Extra request headers | `VIKING_EXTRA_HEADERS` | `--header` / `-H` (repeatable) | — |

`VIKING_EXTRA_HEADERS` is a comma-separated list of `Key: Value` pairs; `--header`
takes one pair and may be repeated (CLI wins over env). Both are merged onto every
request — useful for swim-lane routing, e.g. `-H 'x-tt-env: <swimlane>'`. The
`Authorization` and `Content-Type` headers are protected and cannot be overridden.

## CLI usage

```bash
uv sync                      # or: pip install -e .

# set the key once via env, then drop the per-command flag
export AGENTPLAN_API_KEY=ark-xxxxxxxx

# read-only
uv run ov-cp list
uv run ov-cp get   <ResourceID>
uv run ov-cp usage <ResourceID>
uv run ov-cp usage <ResourceID> --account-id team-alpha
uv run ov-cp usage <ResourceID> --user-id alice  # user in default data space
uv run ov-cp usage <ResourceID> --account-id team-alpha --user-id alice
uv run ov-cp api-key <ResourceID>
uv run ov-cp api-key <ResourceID> --user-id alice
uv run ov-cp api-key <ResourceID> --account-id team-alpha
uv run ov-cp api-key <ResourceID> --account-id team-alpha --user-id alice

# create (consumes paid quota; always uses the AgentPlan model path and the
# configured AgentPlan key; model source/parameters and image version are hidden)
uv run ov-cp create --name my_kb

# create an enterprise-tier library (higher capacity, enterprise billing rates)
uv run ov-cp create --name my_kb --version enterprise

# billing (--pay-type): who pays for the library — orthogonal to --version,
# which only sets the rate. Omitted => defaults to agentplan_personal (AFP
# deduction from the account's personal AgentPlan). volc_pay (Volcano
# pay-as-you-go, billed to the Volcano account) must be chosen explicitly.
# ⚠️ Enterprise seat keys must not rely on the default (no personal plan =>
# deduction fails and the library is disabled) — pass agentplan_enterprise
# + --seat-id.
uv run ov-cp create --name my_kb                       # = --pay-type agentplan_personal
uv run ov-cp create --name my_kb --pay-type volc_pay
uv run ov-cp create --name my_kb --version enterprise \
  --pay-type agentplan_enterprise --seat-id seat-2026xxxx
# --seat-id: the enterprise seat that pays. Copy it manually from the Ark
# console seat-management page — the server does NOT verify the seat exists;
# a typo only surfaces at the next hourly deduction, disabling the library.

# update mutable fields (only the flags you pass change);
# also switches billing (volc_pay <-> AgentPlan, or re-bind a seat)
uv run ov-cp update <ResourceID> --description "new description"
uv run ov-cp update <ResourceID> --pay-type volc_pay
# overwrite the library's AgentPlan MODEL credential (VLM and Embedding share it);
# the library's other credentials are replayed unchanged
uv run ov-cp update <ResourceID> --model-api-key ark-xxxxxxxx
# Without --model-api-key no model configuration is sent. If the control plane
# still rebuilds both models on every update, `update` replays the library's
# own credentials once and says so in the response Note; a credential with no
# ApiKeyID (other than AgentPlan) cannot be replayed and the update is refused.

# manage users of an enterprise-tier library (key must be associated with it)
uv run ov-cp user list     <ResourceID>
uv run ov-cp user list     <ResourceID> --account-id team-alpha --role user --page 1 --limit 20
uv run ov-cp user register <ResourceID> alice --account-id team-alpha
uv run ov-cp user update   <ResourceID> alice --account-id team-alpha --regenerate-key
uv run ov-cp user delete   <ResourceID> alice --account-id team-alpha --yes

# manage data spaces (accounts) in an enterprise-tier library
uv run ov-cp account list   <ResourceID> --keyword team --page 1 --limit 20
uv run ov-cp account create <ResourceID> team-alpha
uv run ov-cp account delete <ResourceID> team-alpha  # prompts before cascading deletion

# delete (irreversible)
uv run ov-cp delete <ResourceID> --yes
```

When stdout is a terminal, `--output auto` (the default) renders structured
Rich views: tables for collection/user/data-space lists, sectioned detail panels for
`get`/`usage`, compact success cards for mutations, and a warning panel for
plaintext API keys. Piping or redirecting automatically keeps standard JSON:

```bash
uv run ov-cp list                     # Rich table in a terminal
uv run ov-cp list | jq '.Collections' # standard JSON
uv run ov-cp --json list              # force standard JSON
uv run ov-cp --output json-compact list
uv run ov-cp --output pretty list     # force the terminal view
```

Library-wide `usage` preserves the backend's legacy `EstimatedCosts` field and also
returns `EstimatedBilling` with an explicit hourly period and CNY unit. For
collections paid by AgentPlan it includes the equivalent AFP deduction and payment
scenario; for `volc_pay` it reports CNY only. Account- or user-scoped usage omits
both library-wide estimates. `--user-id` may be used alone for the `default` account.

Flags override env. The endpoint defaults to the public gateway; override it only
for testing (e.g. against a port-forward) with `-e` / `VIKING_ENDPOINT` —
`uv run ov-cp -e http://localhost:18080 list`.
`ov-cp --help` works without any config.

## MCP usage (stdio / uvx / streamable HTTP)

The server defaults to **stdio** transport, so it can be launched as a subprocess by
any MCP client, and can also be served over stateless streamable HTTP behind a
gateway. Add to `.mcp.json`:

### Install from PyPI

```json
{
  "mcpServers": {
    "openviking-controlplane": {
      "command": "uvx",
      "args": [
        "--from",
        "mcp-server-openviking-controlplane>=0.3.0",
        "mcp-server-openviking-controlplane"
      ],
      "env": {
        "AGENTPLAN_API_KEY": "ark-xxxxxxxx"
      }
    }
  }
}
```

### Install from source

```json
{
  "mcpServers": {
    "openviking-controlplane": {
      "command": "uvx",
      "args": [
        "--from",
        "git+https://github.com/volcengine/mcp-server#subdirectory=server/mcp_server_openviking_controlplane",
        "mcp-server-openviking-controlplane"
      ],
      "env": {
        "AGENTPLAN_API_KEY": "ark-xxxxxxxx"
      }
    }
  }
}
```

For local development point it at your checkout instead:

```json
{
  "mcpServers": {
    "openviking-controlplane": {
      "command": "uv",
      "args": ["run", "--directory", "/abs/path/server/mcp_server_openviking_controlplane",
               "mcp-server-openviking-controlplane"],
      "env": {
        "AGENTPLAN_API_KEY": "ark-xxxxxxxx"
      }
    }
  }
}
```

### Streamable HTTP (stateless)

```bash
mcp-server-openviking-controlplane --transport streamable-http
# -> http://0.0.0.0:8000/mcp
```

Stateless is the default: every request carries its own context, so no request
depends on a prior `Mcp-Session-Id` and the process can be scaled horizontally
behind a gateway.

The server speaks MCP protocol revision **2026-07-28** — the per-request-envelope
revision, reached via `server/discover` rather than an `initialize` handshake — and
still negotiates the older handshake revisions (down to `2024-11-05`) for clients
that ask for them. This requires the mcp SDK 2.x line.

| Env var | Meaning | Default |
|---|---|---|
| `MCP_SERVER_HOST` | HTTP bind address | `0.0.0.0` |
| `MCP_SERVER_PORT` | HTTP port (`PORT` is still honoured) | `8000` |
| `STREAMABLE_HTTP_PATH` | Mount path for streamable HTTP | `/mcp` |
| `STATLESS_HTTP` | Enable stateless HTTP (`STATELESS_HTTP` also works) | `true` |

> Binding `127.0.0.1` makes the MCP SDK enable DNS-rebinding protection, which
> only allows localhost `Host` headers — a gateway-forwarded request would then be
> rejected. Keep the `0.0.0.0` default when running behind one.

#### Credentials over HTTP

Under HTTP transports the AgentPlan ApiKey is resolved **per request**, so one
process can serve several callers:

| Source | Precedence |
|---|---|
| `X-AgentPlan-Api-Key` header | 1 (highest) |
| `Authorization: Bearer <key>` header | 2 |
| `AGENTPLAN_API_KEY` env var | 3 (fallback) |

Only the `Bearer` scheme is read from `Authorization`; any other scheme is ignored
and the env var is used instead, so a gateway that terminates its own auth there
does not leak its credential into a caller's collection.

Run with SSE instead via `mcp-server-openviking-controlplane --transport sse`.

## Agent skill

A Claude Code / agent skill that documents the `ov-cp` workflow lives at
[`skills/openviking-controlplane/SKILL.md`](skills/openviking-controlplane/SKILL.md).
Symlink or copy it into your agent's skills directory (e.g. `~/.claude/skills/`) to
let an agent drive the control plane.

> ⚠️ `create_collection` / `delete_collection` create/destroy **billable** resources,
> while `delete_collection_account` irreversibly destroys a data space and all of its
> contents. These are exposed as MCP tools; their descriptions instruct the model to
> confirm with you first. Rely on your client's tool-permission prompt as the final gate.
