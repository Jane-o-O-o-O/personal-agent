# cursor.directory — submission packet

Ready to paste into https://cursor.directory/plugins/new  
(Sign in with GitHub / Google required.)

Prepared: 2026-07-28

## Why this repo URL

cursor.directory auto-detects Open Plugin components from a **public GitHub repo**, especially a root `.mcp.json`.

| Candidate | Root `.mcp.json` | Recommendation |
|-----------|------------------|----------------|
| `TencentCloudBase/cloudbase-plugin` | Yes | **Use this** |
| `TencentCloudBase/CloudBase-AI-Toolkit` | No (MCP under `plugin/cloudbase/mcp.json`) | Avoid for directory auto-detect |

## Form fields

| Field | Value |
|-------|-------|
| GitHub repo URL | `https://github.com/TencentCloudBase/cloudbase-plugin` |
| Expected auto-detect | MCP from `.mcp.json`; skills under `skills/*/SKILL.md`; Open Plugin `.plugin/plugin.json` |

### Notes for reviewers (if a notes field exists)

```text
Tencent CloudBase Open Plugin: MCP (`npx @cloudbase/cloudbase-mcp@latest`) + agent skills.
Synced from TencentCloudBase/CloudBase-AI-Toolkit (plugin/cloudbase Open Plugin artifacts).
Official Cursor Marketplace publisher application already submitted separately for the monorepo.
```

## Pre-submit checklist

- [x] `cloudbase-plugin` public + root `.mcp.json` present
- [x] Not found in cursor.directory search for `cloudbase` (checked 2026-07-28)
- [x] Human submits at https://cursor.directory/plugins/new (2026-07-28)
- [x] Plugin page live: https://cursor.directory/plugins/cloudbase (status: being verified)
- [ ] After verification clears: update `markets.yaml` `community_directory` → `listed`

## After submit

Update `submission-log.md` + checklist, then watch:

https://cursor.directory/?q=cloudbase
