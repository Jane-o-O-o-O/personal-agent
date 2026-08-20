import fs from "node:fs";
import path from "node:path";

/**
 * @typedef {{ id: string, status: 'present'|'missing'|'invalid', detail: string, paths: string[] }} EvidenceResult
 */

/**
 * @param {string} rootDir
 * @param {string[]} evidenceIds
 * @returns {EvidenceResult[]}
 */
export function checkLocalEvidence(rootDir, evidenceIds = []) {
  return evidenceIds.map((id) => runEvidenceCheck(rootDir, id));
}

/**
 * @param {string} rootDir
 * @param {string} id
 * @returns {EvidenceResult}
 */
export function runEvidenceCheck(rootDir, id) {
  const checker = EVIDENCE_CHECKS[id];
  if (!checker) {
    return {
      id,
      status: "invalid",
      detail: `Unknown local_evidence id "${id}"`,
      paths: [],
    };
  }
  return checker(rootDir);
}

/**
 * @param {string} filePath
 */
function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

/**
 * @param {string} rootDir
 * @param {string} rel
 */
function abs(rootDir, rel) {
  return path.join(rootDir, rel);
}

/**
 * @param {string} rootDir
 * @param {string} marketplaceRel
 * @param {string} pluginName
 * @param {'claude'|'codex'} kind
 * @returns {EvidenceResult}
 */
function checkMarketplaceHasPlugin(rootDir, marketplaceRel, pluginName, kind) {
  const filePath = abs(rootDir, marketplaceRel);
  if (!fs.existsSync(filePath)) {
    return {
      id: kind === "claude" ? "self_marketplace_claude" : "self_marketplace_codex",
      status: "missing",
      detail: `Missing ${marketplaceRel}`,
      paths: [marketplaceRel],
    };
  }
  try {
    const data = readJson(filePath);
    const plugins = Array.isArray(data.plugins) ? data.plugins : [];
    const found = plugins.some((p) => p && p.name === pluginName);
    if (!found) {
      return {
        id: kind === "claude" ? "self_marketplace_claude" : "self_marketplace_codex",
        status: "invalid",
        detail: `${marketplaceRel} does not list plugin "${pluginName}"`,
        paths: [marketplaceRel],
      };
    }
    return {
      id: kind === "claude" ? "self_marketplace_claude" : "self_marketplace_codex",
      status: "present",
      detail: `${marketplaceRel} lists ${pluginName}`,
      paths: [marketplaceRel],
    };
  } catch (err) {
    return {
      id: kind === "claude" ? "self_marketplace_claude" : "self_marketplace_codex",
      status: "invalid",
      detail: `Failed to parse ${marketplaceRel}: ${err.message}`,
      paths: [marketplaceRel],
    };
  }
}

/** @type {Record<string, (rootDir: string) => EvidenceResult>} */
const EVIDENCE_CHECKS = {
  self_marketplace_claude: (rootDir) =>
    checkMarketplaceHasPlugin(rootDir, ".claude-plugin/marketplace.json", "cloudbase", "claude"),

  self_marketplace_codex: (rootDir) => {
    const preferred = ".agents/plugins/marketplace.json";
    const legacy = "marketplace.json";
    if (fs.existsSync(abs(rootDir, preferred))) {
      return checkMarketplaceHasPlugin(rootDir, preferred, "cloudbase", "codex");
    }
    return checkMarketplaceHasPlugin(rootDir, legacy, "cloudbase", "codex");
  },

  open_plugin_spec_cloudbase: (rootDir) => {
    const rel = "plugin/cloudbase/.plugin/plugin.json";
    const filePath = abs(rootDir, rel);
    if (!fs.existsSync(filePath)) {
      return {
        id: "open_plugin_spec_cloudbase",
        status: "missing",
        detail: `Missing ${rel}`,
        paths: [rel],
      };
    }
    try {
      const data = readJson(filePath);
      if (!data.$schema || typeof data.$schema !== "string") {
        return {
          id: "open_plugin_spec_cloudbase",
          status: "invalid",
          detail: `${rel} missing $schema`,
          paths: [rel],
        };
      }
      return {
        id: "open_plugin_spec_cloudbase",
        status: "present",
        detail: `${rel} has $schema`,
        paths: [rel],
      };
    } catch (err) {
      return {
        id: "open_plugin_spec_cloudbase",
        status: "invalid",
        detail: `Failed to parse ${rel}: ${err.message}`,
        paths: [rel],
      };
    }
  },

  claude_plugin_manifest: (rootDir) => {
    const rel = "plugin/cloudbase/.claude-plugin/plugin.json";
    return fileExistsEvidence("claude_plugin_manifest", rootDir, rel);
  },

  codex_plugin_manifest: (rootDir) => {
    const rel = "plugin/cloudbase/.codex-plugin/plugin.json";
    return fileExistsEvidence("codex_plugin_manifest", rootDir, rel);
  },

  ops_publish_repo_docs: (rootDir) => {
    const rel = "doc/ai-agent-plugins.mdx";
    const filePath = abs(rootDir, rel);
    if (!fs.existsSync(filePath)) {
      return {
        id: "ops_publish_repo_docs",
        status: "missing",
        detail: `Missing ${rel}`,
        paths: [rel],
      };
    }
    const text = fs.readFileSync(filePath, "utf8");
    if (!text.includes("npx plugins add")) {
      return {
        id: "ops_publish_repo_docs",
        status: "invalid",
        detail: `${rel} does not mention npx plugins add`,
        paths: [rel],
      };
    }
    return {
      id: "ops_publish_repo_docs",
      status: "present",
      detail: `${rel} documents npx plugins add`,
      paths: [rel],
    };
  },

  cursor_plugin_manifest: (rootDir) => {
    const candidates = [
      "plugin/cloudbase/.cursor-plugin/plugin.json",
      ".cursor-plugin/plugin.json",
      ".cursor-plugin/marketplace.json",
    ];
    const existing = candidates.filter((rel) => fs.existsSync(abs(rootDir, rel)));
    if (existing.length === 0) {
      return {
        id: "cursor_plugin_manifest",
        status: "missing",
        detail: "No .cursor-plugin manifest found (needed for Cursor Marketplace)",
        paths: candidates,
      };
    }
    return {
      id: "cursor_plugin_manifest",
      status: "present",
      detail: `Found ${existing.join(", ")}`,
      paths: existing,
    };
  },

  mcp_registry_server_json: (rootDir) => {
    const serverRel = "mcp/server.json";
    const pkgRel = "mcp/package.json";
    const serverPath = abs(rootDir, serverRel);
    const pkgPath = abs(rootDir, pkgRel);
    if (!fs.existsSync(serverPath)) {
      return {
        id: "mcp_registry_server_json",
        status: "missing",
        detail: `Missing ${serverRel}`,
        paths: [serverRel, pkgRel],
      };
    }
    if (!fs.existsSync(pkgPath)) {
      return {
        id: "mcp_registry_server_json",
        status: "missing",
        detail: `Missing ${pkgRel}`,
        paths: [serverRel, pkgRel],
      };
    }
    try {
      const server = readJson(serverPath);
      const pkg = readJson(pkgPath);
      if (server.name !== "io.github.TencentCloudBase/cloudbase-mcp") {
        return {
          id: "mcp_registry_server_json",
          status: "invalid",
          detail: `${serverRel} name must be io.github.TencentCloudBase/cloudbase-mcp`,
          paths: [serverRel, pkgRel],
        };
      }
      if (pkg.mcpName !== server.name) {
        return {
          id: "mcp_registry_server_json",
          status: "invalid",
          detail: `${pkgRel} mcpName must match ${serverRel} name`,
          paths: [serverRel, pkgRel],
        };
      }
      const npmPkg = Array.isArray(server.packages)
        ? server.packages.find((item) => item && item.registryType === "npm")
        : null;
      if (!npmPkg || npmPkg.identifier !== "@cloudbase/cloudbase-mcp") {
        return {
          id: "mcp_registry_server_json",
          status: "invalid",
          detail: `${serverRel} must declare npm identifier @cloudbase/cloudbase-mcp`,
          paths: [serverRel, pkgRel],
        };
      }
      return {
        id: "mcp_registry_server_json",
        status: "present",
        detail: `${serverRel} matches npm mcpName ${pkg.mcpName}`,
        paths: [serverRel, pkgRel],
      };
    } catch (err) {
      return {
        id: "mcp_registry_server_json",
        status: "invalid",
        detail: `Failed to parse MCP registry metadata: ${err.message}`,
        paths: [serverRel, pkgRel],
      };
    }
  },

  trae_mcp_deeplink_docs: (rootDir) => {
    const candidates = ["doc/ide-setup/trae.mdx", "doc/ai-agent-plugins.mdx"];
    const hits = [];
    for (const rel of candidates) {
      const filePath = abs(rootDir, rel);
      if (!fs.existsSync(filePath)) continue;
      const text = fs.readFileSync(filePath, "utf8");
      if (/trae(-cn)?:\/\//i.test(text) || /mcp-import/i.test(text) || /Trae/i.test(text)) {
        hits.push(rel);
      }
    }
    if (hits.length === 0) {
      return {
        id: "trae_mcp_deeplink_docs",
        status: "missing",
        detail: "No Trae MCP deep-link / setup docs found",
        paths: candidates,
      };
    }
    return {
      id: "trae_mcp_deeplink_docs",
      status: "present",
      detail: `Trae docs present: ${hits.join(", ")}`,
      paths: hits,
    };
  },
};

/**
 * @param {string} id
 * @param {string} rootDir
 * @param {string} rel
 * @returns {EvidenceResult}
 */
function fileExistsEvidence(id, rootDir, rel) {
  if (!fs.existsSync(abs(rootDir, rel))) {
    return {
      id,
      status: "missing",
      detail: `Missing ${rel}`,
      paths: [rel],
    };
  }
  return {
    id,
    status: "present",
    detail: `${rel} exists`,
    paths: [rel],
  };
}

export const KNOWN_EVIDENCE_IDS = Object.keys(EVIDENCE_CHECKS);
