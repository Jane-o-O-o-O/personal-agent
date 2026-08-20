# Claude Community — submission packet

Ready to paste into https://platform.claude.com/plugins/submit  
(or Team form: https://claude.ai/admin-settings/directory/submissions/plugins/new)

Prepared: 2026-07-28

## Form fields

| Field | Value |
|-------|-------|
| Plugin / GitHub URL | `https://github.com/TencentCloudBase/CloudBase-AI-Toolkit` |
| Plugin path (if asked) | `plugin/cloudbase` |
| Plugin name | `cloudbase` |
| Display name | Tencent CloudBase |
| Publisher | Tencent CloudBase |
| Website | https://cloudbase.net |
| Docs | https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/ai-agent-plugins |
| Support / Issues | https://github.com/TencentCloudBase/CloudBase-AI-Toolkit/issues |
| License | MIT |
| Category | Developer Tools |

### Short description

```text
AI models, auth, database, cloud functions, storage, and CloudRun for Tencent CloudBase — via MCP tools and agent skills.
```

### Long description

```text
Tencent CloudBase plugin for Claude Code / Cowork. Bundle skills, slash commands, agents, hooks, and the cloudbase-mcp server so you can build and deploy full-stack apps with AI models (DeepSeek, Hunyuan), authentication, NoSQL/PostgreSQL databases, cloud functions, cloud storage, CloudRun, and WeChat Mini Program integration — without leaving the IDE.

Install from this marketplace after approval, or add the self-hosted marketplace:

  claude plugin marketplace add TencentCloudBase/CloudBase-AI-Toolkit
  claude plugin install cloudbase@tencent-cloudbase
```

### Notes for reviewers

```text
- Public repo; plugin root: plugin/cloudbase
- Marketplace manifest: .claude-plugin/marketplace.json
- Validated: claude plugin validate plugin/cloudbase
- Also ships cloudbase-sites as a second plugin in the same marketplace
- Logo: plugin/cloudbase/assets/logo.png
```

## Pre-submit checklist

- [x] `claude plugin validate plugin/cloudbase` passed (local)
- [x] Not already in `anthropics/claude-plugins-community` (checked 2026-07-28)
- [ ] Submit via Console / claude.ai form (human login required)
- [ ] After approval, verify entry in community catalog

## After submit

Update `submission-log.md` + `submission-checklist.md`, then watch:

https://github.com/anthropics/claude-plugins-community/blob/main/.claude-plugin/marketplace.json
