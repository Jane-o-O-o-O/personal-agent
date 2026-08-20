#!/usr/bin/env node
/**
 * Sync config/codebuddy-plugin into the CodeBuddy marketplace CNB fork
 * and push to fork main (default). Upstream PR still needs CNB UI / repo-pr:rw.
 *
 * Usage:
 *   npm run sync:codebuddy-marketplace
 *   npm run sync:codebuddy-marketplace -- --dry-run
 *   npm run sync:codebuddy-marketplace -- --skip-skill-sync
 *   npm run sync:codebuddy-marketplace -- --branch sync/cloudbase-v2.25.0
 *
 * Env:
 *   CODEBUDDY_MARKETPLACE_FORK_URL   default https://cnb.cool/tencent/cloud/cloudbase/marketplace.git
 *   CODEBUDDY_MARKETPLACE_UPSTREAM_URL default https://cnb.cool/codebuddy/marketplace.git
 *   CODEBUDDY_MARKETPLACE_TARGET     main | branch name (default: main)
 *   CNB_TOKEN / CNB_PASSWORD         optional; otherwise git credential helper for cnb.cool
 */

import { execFileSync, spawnSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SOURCE = path.join(ROOT, "config", "codebuddy-plugin");

const DEFAULT_FORK_URL =
  "https://cnb.cool/tencent/cloud/cloudbase/marketplace.git";
const DEFAULT_UPSTREAM_URL = "https://cnb.cool/codebuddy/marketplace.git";
const DEFAULT_TARGET = "main";

const FORK_URL =
  process.env.CODEBUDDY_MARKETPLACE_FORK_URL || DEFAULT_FORK_URL;
const UPSTREAM_URL =
  process.env.CODEBUDDY_MARKETPLACE_UPSTREAM_URL || DEFAULT_UPSTREAM_URL;

function parseArgs(argv = process.argv.slice(2)) {
  const args = {
    dryRun: false,
    skipSkillSync: false,
    target: process.env.CODEBUDDY_MARKETPLACE_TARGET || DEFAULT_TARGET,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--") continue;
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--skip-skill-sync") args.skipSkillSync = true;
    else if (a === "--branch" || a === "--target") {
      args.target = argv[++i];
      if (!args.target) throw new Error(`${a} requires a value`);
    } else if (a === "--help" || a === "-h") args.help = true;
    else throw new Error(`Unknown argument: ${a}`);
  }
  return args;
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

export function assertSource(sourceDir = SOURCE) {
  const required = [
    path.join(sourceDir, ".codebuddy-plugin", "plugin.json"),
    path.join(sourceDir, "rules", "cloudbase_rules.md"),
    path.join(sourceDir, "skills", "cloudbase", "SKILL.md"),
  ];
  for (const p of required) {
    if (!fs.existsSync(p)) {
      throw new Error(`Missing required source file: ${p}`);
    }
  }
}

export function readPluginJson(sourceDir = SOURCE) {
  return JSON.parse(
    fs.readFileSync(
      path.join(sourceDir, ".codebuddy-plugin", "plugin.json"),
      "utf-8",
    ),
  );
}

/**
 * Build marketplace.json cloudbase entry from plugin.json.
 * Keeps Chinese catalog description style used by codebuddy/marketplace.
 */
export function buildMarketplaceEntry(plugin) {
  const version = plugin.version || "1.0.0";
  return {
    name: "cloudbase",
    source: "./plugins/cloudbase",
    version,
    description:
      plugin.marketplaceDescription ||
      "CloudBase AI 开发插件，提供 Web、小程序、云函数、CloudRun、数据库（NoSQL/MySQL/PostgreSQL）、云存储、AI 模型、认证、UI 设计等全栈开发能力。",
    author: plugin.author || {
      name: "Tencent CloudBase",
      url: "https://cloudbase.net",
    },
    homepage: plugin.homepage || {
      url: "https://github.com/TencentCloudBase/cloudbase-ai-toolkit",
      type: "github",
    },
    license: plugin.license || "MIT",
  };
}

export function updateMarketplaceJson(marketplaceJsonPath, plugin) {
  const data = JSON.parse(fs.readFileSync(marketplaceJsonPath, "utf-8"));
  if (!Array.isArray(data.plugins)) {
    throw new Error(`Invalid marketplace.json: missing plugins array (${marketplaceJsonPath})`);
  }
  const entry = buildMarketplaceEntry(plugin);
  const idx = data.plugins.findIndex((p) => p?.name === "cloudbase");
  if (idx >= 0) data.plugins[idx] = { ...data.plugins[idx], ...entry };
  else data.plugins.push(entry);
  fs.writeFileSync(marketplaceJsonPath, `${JSON.stringify(data, null, 2)}\n`);
  return entry;
}

/**
 * Overlay local codebuddy-plugin onto plugins/cloudbase and bump marketplace.json.
 * Preserves nothing from the previous plugins/cloudbase tree except via source
 * (source must already include rules/cloudbase_rules.md).
 */
export function applyPluginOverlay({
  sourceDir = SOURCE,
  repoDir,
  plugin = readPluginJson(sourceDir),
}) {
  assertSource(sourceDir);
  const target = path.join(repoDir, "plugins", "cloudbase");
  const marketplaceJsonPath = path.join(
    repoDir,
    ".codebuddy-plugin",
    "marketplace.json",
  );
  if (!fs.existsSync(marketplaceJsonPath)) {
    throw new Error(`Missing marketplace catalog: ${marketplaceJsonPath}`);
  }

  fs.rmSync(target, { recursive: true, force: true });
  copyDir(sourceDir, target);

  const rulesPath = path.join(target, "rules", "cloudbase_rules.md");
  if (!fs.existsSync(rulesPath)) {
    throw new Error("rules/cloudbase_rules.md missing after sync — aborting");
  }

  const entry = updateMarketplaceJson(marketplaceJsonPath, plugin);
  return { target, marketplaceJsonPath, entry };
}

function resolveCnbToken() {
  if (process.env.CNB_TOKEN) return process.env.CNB_TOKEN;
  if (process.env.CNB_PASSWORD) return process.env.CNB_PASSWORD;
  try {
    const out = execFileSync("git", ["credential", "fill"], {
      input: "protocol=https\nhost=cnb.cool\n\n",
      encoding: "utf-8",
    });
    const line = out.split("\n").find((l) => l.startsWith("password="));
    if (line) return line.slice("password=".length);
  } catch {
    // ignore
  }
  return null;
}

function authGitUrl(url, token) {
  if (!token) return url;
  const u = new URL(url);
  u.username = "cnb";
  u.password = token;
  return u.toString();
}

function runGit(args, opts = {}) {
  return execFileSync("git", args, {
    encoding: "utf-8",
    stdio: opts.stdio || ["pipe", "pipe", "pipe"],
    ...opts,
  });
}

function syncSkills() {
  console.log("Refreshing config/codebuddy-plugin skills via sync-codebuddy-plugin.ts …");
  const result = spawnSync(
    "npx",
    ["tsx", "scripts/sync-codebuddy-plugin.ts"],
    { cwd: ROOT, stdio: "inherit", shell: process.platform === "win32" },
  );
  if (result.status !== 0) {
    throw new Error("sync-codebuddy-plugin.ts failed");
  }
}

function resolveCommitIdentity() {
  const name =
    process.env.GIT_AUTHOR_NAME ||
    process.env.GIT_COMMITTER_NAME ||
    runGit(["config", "--get", "user.name"], { cwd: ROOT }).trim() ||
    "bookerzhao";
  const email =
    process.env.GIT_AUTHOR_EMAIL ||
    process.env.GIT_COMMITTER_EMAIL ||
    runGit(["config", "--get", "user.email"], { cwd: ROOT }).trim() ||
    "bookerzhao@tencent.com";
  return { name, email };
}

function printHelp() {
  console.log(`Sync CloudBase plugin into CodeBuddy marketplace CNB fork.

Usage:
  npm run sync:codebuddy-marketplace
  npm run sync:codebuddy-marketplace -- --dry-run
  npm run sync:codebuddy-marketplace -- --skip-skill-sync
  npm run sync:codebuddy-marketplace -- --branch sync/cloudbase-vX.Y.Z

Default fork: ${DEFAULT_FORK_URL}
Default target ref: ${DEFAULT_TARGET}
Upstream (manual PR): ${DEFAULT_UPSTREAM_URL}
`);
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    printHelp();
    return { dryRun: true, skipped: true };
  }

  if (!args.skipSkillSync) syncSkills();
  assertSource();
  const plugin = readPluginJson();
  console.log(`Source plugin version: ${plugin.version}`);
  console.log(`Rules present: yes`);

  const token = resolveCnbToken();
  if (!token && !args.dryRun) {
    console.warn(
      "Warning: no CNB token from env/credential helper; clone/push may fail.",
    );
  }

  const work = fs.mkdtempSync(path.join(os.tmpdir(), "codebuddy-marketplace-"));
  const repoDir = path.join(work, "marketplace");
  const forkAuthUrl = authGitUrl(FORK_URL, token);

  console.log(`Clone fork ${FORK_URL} -> ${repoDir}`);
  runGit(["clone", "--depth", "50", forkAuthUrl, repoDir], {
    stdio: "inherit",
  });
  // Avoid leaking token in remote URL in subsequent git remote -v
  runGit(["remote", "set-url", "origin", FORK_URL], { cwd: repoDir });
  if (token) {
    // Push still needs auth: set push URL with token only for this session
    runGit(["remote", "set-url", "--push", "origin", forkAuthUrl], {
      cwd: repoDir,
    });
  }

  const overlay = applyPluginOverlay({ sourceDir: SOURCE, repoDir, plugin });
  console.log(`Overlay complete -> ${overlay.target}`);
  console.log(`Catalog entry version: ${overlay.entry.version}`);

  const targetRef = args.target || DEFAULT_TARGET;
  const currentBranch = runGit(["rev-parse", "--abbrev-ref", "HEAD"], {
    cwd: repoDir,
  }).trim();

  if (targetRef !== currentBranch) {
    // Create/reset local branch for the target name from current HEAD
    try {
      runGit(["checkout", "-B", targetRef], { cwd: repoDir, stdio: "inherit" });
    } catch {
      runGit(["checkout", "-b", targetRef], { cwd: repoDir, stdio: "inherit" });
    }
  }

  runGit(
    ["add", "plugins/cloudbase", ".codebuddy-plugin/marketplace.json"],
    { cwd: repoDir, stdio: "inherit" },
  );
  const staged = runGit(["diff", "--cached", "--stat"], { cwd: repoDir }).trim();
  console.log(staged || "(no staged changes)");
  if (!staged) {
    console.log("Nothing to sync — fork already matches local payload.");
    console.log(`Upstream compare tip: ${UPSTREAM_URL.replace(/\.git$/, "")}`);
    return { dryRun: args.dryRun, noop: true, version: plugin.version };
  }

  if (args.dryRun) {
    console.log(`Dry run only. Would commit & push to fork ref: ${targetRef}`);
    console.log(`Worktree: ${repoDir}`);
    console.log(
      `After push, open upstream PR from fork:${targetRef} -> codebuddy/marketplace:main`,
    );
    return {
      dryRun: true,
      version: plugin.version,
      targetRef,
      worktree: repoDir,
    };
  }

  const { name, email } = resolveCommitIdentity();
  runGit(["config", "user.name", name], { cwd: repoDir });
  runGit(["config", "user.email", email], { cwd: repoDir });

  const message = `feat(cloudbase): sync CloudBase plugin v${plugin.version} and keep rules`;
  runGit(["commit", "-m", message], { cwd: repoDir, stdio: "inherit" });
  runGit(["push", "-u", "origin", `HEAD:${targetRef}`], {
    cwd: repoDir,
    stdio: "inherit",
  });

  const forkWeb = FORK_URL.replace(/\.git$/, "");
  const upstreamWeb = UPSTREAM_URL.replace(/\.git$/, "");
  console.log("");
  console.log("Pushed to fork.");
  console.log(`Fork: ${forkWeb}`);
  console.log(`Ref:  ${targetRef}`);
  console.log(
    `Open upstream PR: ${forkWeb}/-/compare/main...${targetRef === "main" ? "main" : targetRef}`,
  );
  console.log(
    `Target: ${upstreamWeb} (base: main). CNB UI may require selecting upstream as base.`,
  );
  console.log(
    "Note: this script does not open the upstream PR (needs repo-pr:rw / CNB UI).",
  );

  return {
    dryRun: false,
    version: plugin.version,
    targetRef,
    forkUrl: FORK_URL,
  };
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  try {
    main();
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
