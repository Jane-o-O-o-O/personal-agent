# Marketplace quality audit

Date: 2026-07-27  
Method: read each market’s public docs, then run automated checks + fix gaps.

## Docs consulted

| Market | Doc |
|--------|-----|
| Claude Community | https://code.claude.com/docs/en/plugins , https://claude.com/docs/plugins/submit |
| Cursor Marketplace | https://cursor.com/docs/reference/plugins |
| Codex / ChatGPT plugins | https://developers.openai.com/codex/plugins/build , https://developers.openai.com/plugins/deploy/submission |
| Grok Build | https://github.com/xai-org/plugin-marketplace (README + CONTRIBUTING) |

## Results

### 1. Claude Code — PASS

| Check | Result |
|-------|--------|
| `claude plugin validate plugin/cloudbase` | PASS |
| `claude plugin validate plugin/cloudbase-sites` | PASS |
| `.claude-plugin/marketplace.json` lists both plugins | PASS |
| Manifest paths (`commands/`, `agents/`) resolve | PASS |
| Components not nested inside `.claude-plugin/` | PASS |

Submit: public GitHub URL via Console / claude.ai forms after merge.

### 2. Cursor Marketplace — PASS (after fixes)

| Check | Result |
|-------|--------|
| Root `.cursor-plugin/marketplace.json` + owner | PASS |
| `plugin/*/.cursor-plugin/plugin.json` kebab `name` | PASS |
| `mcp.json` present | PASS |
| README present | PASS |
| Skills `name` + `description` frontmatter | PASS |
| Agents frontmatter | PASS |
| Commands `name` + `description` frontmatter | **Fixed** (was description-only) |
| `_conventions.md` auto-discovered as command | **Fixed** (moved to `docs/command-conventions.md`) |
| `logo` relative path | **Fixed** (`assets/logo.png`) |

Submit: https://cursor.com/marketplace/publish with monorepo URL.

### 3. Codex git marketplace — PASS (after fixes)

| Check | Result |
|-------|--------|
| `.agents/plugins/marketplace.json` == root `marketplace.json` | PASS |
| `policy.installation` / `authentication` / `category` | PASS |
| `source.path` `./`-prefixed | PASS |
| `.codex-plugin/plugin.json` + interface metadata | PASS |
| privacy / terms URLs | PASS |
| `interface.logo` | **Fixed** |
| Sparse docs (`.agents/plugins` + `plugin`) | PASS |

### 4. Codex Universal Plugins Directory (portal) — BLOCKED / different product

Portal requires:

- verified OpenAI org identity + Apps Management write
- **public production MCP HTTPS URL** + domain verification
- tool annotations (`readOnlyHint` / `openWorldHint` / `destructiveHint`)
- 5 positive + 3 negative test cases, logo, listing copy

Our packaging ships **local `npx @cloudbase/cloudbase-mcp`**, which is correct for Claude/Cursor/Codex **git marketplaces**, but **does not satisfy** portal MCP URL review.

Options later: host a public CloudBase MCP endpoint, or submit a skills-only portal package.

### 5. Grok Build — READY with caveats

| Check | Result |
|-------|--------|
| Content suitable for dedicated repo sync | PASS |
| Pin full 40-char SHA | Wait for merge |
| Point remote URL at monorepo root | **Do not** — root is not a plugin |
| Point at `TencentCloudBase/cloudbase-plugin` | **Recommended** (skills + `.mcp.json`) |
| Brand-scoped keywords / domains | Draft in `followup-research.md` |

## Fixes landed in this pass

1. Command frontmatter: add `name` for all four CloudBase commands  
2. Move `commands/_conventions.md` → `docs/command-conventions.md`  
3. Add `assets/logo.png` to both plugins; wire into Cursor + Codex manifests  
4. `scripts/check-plugin-quality.mjs` + CI step + `npm run check:plugin-quality`

## Commands

```bash
npm run check:plugin-marketplaces
npm run check:plugin-quality
node scripts/build-open-plugin-spec.mjs --check
claude plugin validate plugin/cloudbase
```
