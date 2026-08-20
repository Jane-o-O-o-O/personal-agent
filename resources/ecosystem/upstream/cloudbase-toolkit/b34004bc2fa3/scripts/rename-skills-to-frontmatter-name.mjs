#!/usr/bin/env node
/**
 * One-shot migration: rename skill directories to match frontmatter `name`
 * (Awesome Copilot / Agent Skills Spec: name === directory).
 *
 * Usage:
 *   node scripts/rename-skills-to-frontmatter-name.mjs
 *   node scripts/rename-skills-to-frontmatter-name.mjs --dry-run
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DRY = process.argv.includes("--dry-run");

/** @type {Record<string, string>} oldDir -> newDir */
const RENAME_MAP = {
  "auth-nodejs": "auth-nodejs-cloudbase",
  "auth-tool": "auth-tool-cloudbase",
  "auth-web": "auth-web-cloudbase",
  "auth-wechat": "auth-wechat-miniprogram",
  "http-api": "http-api-cloudbase",
  "no-sql-web-sdk": "cloudbase-document-database-web-sdk",
  "no-sql-wx-mp-sdk": "cloudbase-document-database-in-wechat-miniprogram",
  "postgresql-development": "postgresql-development-cloudbase",
  "relational-database-tool": "relational-database-mcp-cloudbase",
  "relational-database-web": "relational-database-web-cloudbase",
  "cloudbase-guidelines": "cloudbase",
};

const SKILL_TREES = [
  "config/source/skills",
  "config/.claude/skills",
  "plugin/cloudbase/skills",
];

const TEXT_ROOTS = [
  "config",
  "plugin",
  "scripts",
  "doc",
  "mcp",
  "tests",
  "specs",
  ".github",
];

const TEXT_EXTS = new Set([
  ".md",
  ".mdx",
  ".yaml",
  ".yml",
  ".json",
  ".mjs",
  ".js",
  ".ts",
  ".tsx",
  ".txt",
]);

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function moveDir(fromAbs, toAbs) {
  const relFrom = path.relative(ROOT, fromAbs);
  const relTo = path.relative(ROOT, toAbs);
  if (DRY) {
    console.log(`DRY mv ${relFrom} -> ${relTo}`);
    return;
  }
  fs.mkdirSync(path.dirname(toAbs), { recursive: true });
  // Prefer plain rename over `git mv` so similarly named files across sibling
  // skills (e.g. no-sql-*/aggregation.md) are not cross-paired by git rename detection.
  fs.renameSync(fromAbs, toAbs);
  console.log(`mv ${relFrom} -> ${relTo}`);
}

function renameSkillTrees() {
  const entries = Object.entries(RENAME_MAP).sort((a, b) => b[0].length - a[0].length);
  for (const tree of SKILL_TREES) {
    const treeAbs = path.join(ROOT, tree);
    if (!fs.existsSync(treeAbs)) {
      console.warn(`skip missing tree: ${tree}`);
      continue;
    }
    for (const [oldDir, newDir] of entries) {
      const from = path.join(treeAbs, oldDir);
      const to = path.join(treeAbs, newDir);
      if (!fs.existsSync(from)) continue;
      if (fs.existsSync(to)) {
        throw new Error(`Target already exists: ${path.relative(ROOT, to)}`);
      }
      moveDir(from, to);
    }
  }
}

/**
 * Safer skill-id rewrites. Prefer path / token contexts over bare substring replace
 * so docs.cloudbase.net/http-api/... is not corrupted.
 */
function rewriteSkillIdsInText(text) {
  const olds = Object.keys(RENAME_MAP).sort((a, b) => b.length - a.length);
  let out = text;
  let count = 0;

  for (const oldDir of olds) {
    const newDir = RENAME_MAP[oldDir];
    const o = escapeRegExp(oldDir);
    const n = newDir;

    /** @type {Array<[RegExp, string]>} */
    const patterns = [
      // Markdown / path segments
      [new RegExp(`(\\.\\./)${o}(/)`, "g"), `$1${n}$2`],
      [new RegExp(`(references/)${o}(/)`, "g"), `$1${n}$2`],
      [new RegExp(`(skills/)${o}(/)`, "g"), `$1${n}$2`],
      [new RegExp(`(rules/)${o}(/)`, "g"), `$1${n}$2`],
      [new RegExp(`(/prompts/)${o}([/"'\\s)]|$)`, "g"), `$1${n}$2`],
      [new RegExp(`(source/skills/)${o}(/|\\"|'|$)`, "g"), `$1${n}$2`],
      [new RegExp(`(\\.claude/skills/)${o}(/|\\"|'|$)`, "g"), `$1${n}$2`],
      [new RegExp(`(\\.agents/skills/)${o}(/|\\"|'|$)`, "g"), `$1${n}$2`],
      [new RegExp(`(\\.agent/rules/)${o}(/|\\"|'|$)`, "g"), `$1${n}$2`],
      [new RegExp(`(\\.cursor/rules/)${o}(/|\\"|'|$)`, "g"), `$1${n}$2`],
      [new RegExp(`(plugin/cloudbase/skills/)${o}(/|\\"|'|$)`, "g"), `$1${n}$2`],
      // CNB raw URLs
      [
        new RegExp(
          `(cloudbase-skills/-/git/raw/main/skills/cloudbase/references/)${o}(/)`,
          "g",
        ),
        `$1${n}$2`,
      ],
      // Backtick skill ids
      [new RegExp("`" + o + "`", "g"), "`" + n + "`"],
      // YAML / JSON string values that are exactly the skill id
      [new RegExp(`(:\\s*)${o}(\\s*(?:#.*)?$)`, "gm"), `$1${n}$2`],
      [new RegExp(`(-\\s+)${o}(\\s*(?:#.*)?$)`, "gm"), `$1${n}$2`],
      [new RegExp(`(")${o}(")`, "g"), `$1${n}$2`],
      [new RegExp(`(')${o}(')`, "g"), `$1${n}$2`],
      // Parenthetical lists: (auth-tool, auth-web, http-api, …)
      [new RegExp(`(\\()${o}([,)])`, "g"), `$1${n}$2`],
      [new RegExp(`(,\\s*)${o}([,)])`, "g"), `$1${n}$2`],
      // firstRead/thenRead style without quotes already covered by : value
      // Table cells / pipes
      [new RegExp(`(\\|\\s*)${o}(\\s*\\|)`, "g"), `$1${n}$2`],
      // allowlist arrays in JS: "auth-web"
      // already covered by "..."
    ];

    for (const [re, replacement] of patterns) {
      out = out.replace(re, (...args) => {
        count += 1;
        // Expand $1/$2 using match groups (args[1], args[2], ...)
        return replacement.replace(/\$(\d+)/g, (_, n) => {
          const v = args[Number(n)];
          return v === undefined ? "" : String(v);
        });
      });
    }
  }

  return { text: out, count };
}

function shouldSkipFile(rel) {
  if (rel.includes("node_modules/")) return true;
  if (rel.includes(".git/")) return true;
  if (rel.includes(".skills-repo-output/")) return true;
  if (rel.includes(".generated/")) return true;
  if (rel.endsWith("rename-skills-to-frontmatter-name.mjs")) return true;
  if (rel.endsWith("package-lock.json") || rel.endsWith("pnpm-lock.yaml")) return true;
  return false;
}

function walkFiles(dirAbs, out = []) {
  if (!fs.existsSync(dirAbs)) return out;
  for (const entry of fs.readdirSync(dirAbs, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const abs = path.join(dirAbs, entry.name);
    if (entry.isDirectory()) walkFiles(abs, out);
    else out.push(abs);
  }
  return out;
}

function rewriteTexts() {
  let filesChanged = 0;
  let replacements = 0;

  for (const root of TEXT_ROOTS) {
    const rootAbs = path.join(ROOT, root);
    for (const abs of walkFiles(rootAbs)) {
      const rel = path.relative(ROOT, abs);
      if (shouldSkipFile(rel)) continue;
      if (!TEXT_EXTS.has(path.extname(abs))) continue;

      const original = fs.readFileSync(abs, "utf8");
      const { text, count } = rewriteSkillIdsInText(original);
      if (count > 0 && text !== original) {
        filesChanged += 1;
        replacements += count;
        if (DRY) console.log(`DRY rewrite ${rel} (~${count})`);
        else fs.writeFileSync(abs, text, "utf8");
      }
    }
  }

  console.log(`Text rewrite: filesChanged=${filesChanged} replacements≈${replacements}`);
}

function patchBuildSkillsRepo() {
  const file = path.join(ROOT, "scripts/build-skills-repo.mjs");
  let text = fs.readFileSync(file, "utf8");
  // Only the skillDir constant / log for guidelines packaging
  const next = text.replace(
    /const skillDir = "cloudbase-guidelines";/g,
    'const skillDir = "cloudbase";',
  ).replace(
    /处理额外技能: cloudbase-guidelines/g,
    "处理额外技能: cloudbase",
  );
  if (next !== text) {
    if (DRY) console.log("DRY patch build-skills-repo.mjs");
    else fs.writeFileSync(file, next, "utf8");
  }
}

function main() {
  console.log(DRY ? "=== DRY RUN ===" : "=== APPLY ===");
  renameSkillTrees();
  rewriteTexts();
  patchBuildSkillsRepo();
  console.log("Done.");
}

main();
