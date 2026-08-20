import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import {
  loadMatrix,
  validateMatrix,
  isStale,
} from "../scripts/lib/plugin-marketplace-matrix.mjs";
import {
  runEvidenceCheck,
} from "../scripts/lib/plugin-marketplace-evidence.mjs";
import {
  analyzeMatrix,
  classifyPriority,
  writeReports,
} from "../scripts/lib/plugin-marketplace-report.mjs";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const MATRIX_PATH = path.join(
  ROOT_DIR,
  "specs/plugin-marketplace-listing/markets.yaml",
);

describe("plugin marketplace listing matrix", () => {
  test("loads and validates the repo markets.yaml", () => {
    const matrix = loadMatrix(MATRIX_PATH);
    expect(matrix.version).toBe(1);
    expect(matrix.markets.length).toBeGreaterThan(20);
    const ids = matrix.markets.map((m) => m.id);
    expect(ids).toContain("claude-code-community");
    expect(ids).toContain("cursor-marketplace");
    expect(ids).toContain("trae-mcp-marketplace");
    expect(ids).toContain("workbuddy-connector");
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("rejects missing required fields and bad enums", () => {
    expect(() =>
      validateMatrix({
        version: 1,
        reviewed_stale_days: 90,
        markets: [{ id: "x" }],
      }),
    ).toThrow(/missing required field/);

    expect(() =>
      validateMatrix({
        version: 1,
        reviewed_stale_days: 90,
        markets: [
          {
            id: "dup",
            product: "P",
            region: "global",
            channel_type: "docs_config_only",
            listing_statuses: {
              official_curated: "listed",
              community_directory: "listed",
              self_marketplace: "listed",
              native_connector_or_builtin: "listed",
              open_plugin_spec: "listed",
              mcp_or_skill_registry: "listed",
              docs_only: "listed",
            },
            submit_url_or_process: "n/a",
            eligibility: "n_a",
            blockers: [],
            evidence_links: [],
            last_reviewed_at: "2026-07-27",
            owner: "t",
          },
          {
            id: "dup",
            product: "P2",
            region: "global",
            channel_type: "docs_config_only",
            listing_statuses: {
              official_curated: "listed",
              community_directory: "listed",
              self_marketplace: "listed",
              native_connector_or_builtin: "listed",
              open_plugin_spec: "listed",
              mcp_or_skill_registry: "listed",
              docs_only: "listed",
            },
            submit_url_or_process: "n/a",
            eligibility: "n_a",
            blockers: [],
            evidence_links: [],
            last_reviewed_at: "2026-07-27",
            owner: "t",
          },
        ],
      }),
    ).toThrow(/duplicate market id/);
  });

  test("isStale respects reviewed_stale_days", () => {
    expect(isStale("2026-07-27", 90, new Date("2026-07-27T12:00:00Z"))).toBe(false);
    expect(isStale("2026-01-01", 90, new Date("2026-07-27T12:00:00Z"))).toBe(true);
  });
});

describe("plugin marketplace local evidence", () => {
  test("detects existing Claude/Codex/OPS artifacts and missing Cursor manifest", () => {
    expect(runEvidenceCheck(ROOT_DIR, "self_marketplace_claude").status).toBe("present");
    expect(runEvidenceCheck(ROOT_DIR, "self_marketplace_codex").status).toBe("present");
    expect(runEvidenceCheck(ROOT_DIR, "open_plugin_spec_cloudbase").status).toBe("present");
    expect(runEvidenceCheck(ROOT_DIR, "claude_plugin_manifest").status).toBe("present");
    expect(runEvidenceCheck(ROOT_DIR, "codex_plugin_manifest").status).toBe("present");
    expect(runEvidenceCheck(ROOT_DIR, "ops_publish_repo_docs").status).toBe("present");
    expect(runEvidenceCheck(ROOT_DIR, "cursor_plugin_manifest").status).toBe("present");
    expect(runEvidenceCheck(ROOT_DIR, "trae_mcp_deeplink_docs").status).toBe("present");
  });
});

describe("plugin marketplace priority + CLI", () => {
  test("classifies packaging gap when cursor evidence missing", () => {
    const priority = classifyPriority(
      {
        channel_type: "official_curated_marketplace",
        listing_statuses: {
          official_curated: "submittable",
          community_directory: "not_applicable",
          self_marketplace: "not_applicable",
          native_connector_or_builtin: "not_applicable",
          open_plugin_spec: "listed",
          mcp_or_skill_registry: "not_applicable",
          docs_only: "listed",
        },
        eligibility: "public_github_repo_required",
        blockers: ["Missing .cursor-plugin"],
        priority_hint: null,
      },
      [{ id: "cursor_plugin_manifest", status: "missing", detail: "x", paths: [] }],
    );
    expect(priority).toBe("needs_packaging_or_manifest");
  });

  test("offline analyze writes md and json", () => {
    const matrix = loadMatrix(MATRIX_PATH);
    const report = analyzeMatrix({ matrix, rootDir: ROOT_DIR });
    expect(report.total_markets).toBe(matrix.markets.length);
    expect(report.summary.ready_to_submit).toBeGreaterThanOrEqual(1);
    expect(report.summary.listed).toBeGreaterThanOrEqual(1);
    expect(report.disclaimer).toMatch(/manual/i);

    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "pm-report-"));
    const written = writeReports(outDir, report);
    expect(fs.existsSync(written.jsonPath)).toBe(true);
    expect(fs.existsSync(written.mdPath)).toBe(true);
    expect(fs.readFileSync(written.mdPath, "utf8")).toContain("ready_to_submit");
  });

  test("official MCP registry server.json matches npm mcpName and package id", () => {
    const server = JSON.parse(
      fs.readFileSync(path.join(ROOT_DIR, "mcp/server.json"), "utf8"),
    );
    const pkg = JSON.parse(
      fs.readFileSync(path.join(ROOT_DIR, "mcp/package.json"), "utf8"),
    );
    expect(server.name).toBe("io.github.TencentCloudBase/cloudbase-mcp");
    expect(pkg.mcpName).toBe(server.name);
    expect(pkg.name).toBe("@cloudbase/cloudbase-mcp");
    expect(server.description.length).toBeLessThanOrEqual(100);
    const npmPkg = server.packages.find((item) => item.registryType === "npm");
    expect(npmPkg.identifier).toBe("@cloudbase/cloudbase-mcp");
    expect(npmPkg.transport.type).toBe("stdio");
    // Local stdio install uses interactive login; do not declare env vars that
    // make clients treat credentials/envId as install prerequisites.
    expect(npmPkg.environmentVariables).toBeUndefined();
    expect(server.repository.subfolder).toBe("mcp");
  });

  test("CLI offline mode exits 0", () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "pm-cli-"));
    const result = spawnSync(
      process.execPath,
      [
        path.join(ROOT_DIR, "scripts/analyze-plugin-marketplace.mjs"),
        "--out",
        outDir,
      ],
      { encoding: "utf8" },
    );
    expect(result.status).toBe(0);
    expect(fs.existsSync(path.join(outDir, "latest.md"))).toBe(true);
  });

  test("CLI strict mode fails when critical evidence is missing", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pm-strict-"));
    const badMatrix = path.join(tmpDir, "markets.yaml");
    fs.writeFileSync(
      badMatrix,
      `version: 1
reviewed_stale_days: 90
markets:
  - id: cursor-marketplace
    product: Cursor
    region: global
    channel_type: official_curated_marketplace
    listing_statuses:
      official_curated: submittable
      community_directory: not_applicable
      self_marketplace: not_applicable
      native_connector_or_builtin: not_applicable
      open_plugin_spec: listed
      mcp_or_skill_registry: not_applicable
      docs_only: listed
    submit_url_or_process: submit
    eligibility: public_github_repo_required
    blockers: []
    evidence_links: []
    local_evidence:
      - this_evidence_does_not_exist
    submit_checklist: []
    recommended_install_path: null
    priority_hint: null
    last_reviewed_at: "2026-07-27"
    owner: test
`,
      "utf8",
    );
    const outDir = path.join(tmpDir, "out");
    const result = spawnSync(
      process.execPath,
      [
        path.join(ROOT_DIR, "scripts/analyze-plugin-marketplace.mjs"),
        "--matrix",
        badMatrix,
        "--out",
        outDir,
        "--strict",
      ],
      { encoding: "utf8" },
    );
    expect(result.status).not.toBe(0);
  });
});
