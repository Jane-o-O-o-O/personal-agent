import fs from "node:fs";
import path from "node:path";
import { isStale } from "./plugin-marketplace-matrix.mjs";
import { checkLocalEvidence } from "./plugin-marketplace-evidence.mjs";

export const PRIORITY_GROUPS = [
  "ready_to_submit",
  "needs_packaging_or_manifest",
  "needs_partner_outreach",
  "listed",
  "not_applicable",
  "unknown",
];

/**
 * @param {object} market
 * @param {import('./plugin-marketplace-evidence.mjs').EvidenceResult[]} evidence
 */
export function classifyPriority(market, evidence) {
  if (market.priority_hint) {
    return market.priority_hint;
  }

  const statuses = market.listing_statuses || {};
  const statusValues = Object.values(statuses);
  const hasListedStore = ["official_curated", "community_directory", "self_marketplace", "native_connector_or_builtin", "open_plugin_spec", "mcp_or_skill_registry"].some(
    (key) => statuses[key] === "listed",
  );
  const hasSubmittable = statusValues.includes("submittable");
  const hasBlocked = statusValues.includes("blocked") || (market.blockers && market.blockers.length > 0);
  const evidenceBad = evidence.some((e) => e.status === "missing" || e.status === "invalid");
  const eligibility = String(market.eligibility || "");

  if (
    market.channel_type === "docs_config_only" ||
    market.channel_type === "editor_extension_marketplace"
  ) {
    return "not_applicable";
  }

  if (market.channel_type === "deeplink_or_install_assist" && statuses.docs_only === "listed") {
    return "listed";
  }

  if (hasListedStore && !hasSubmittable) {
    return "listed";
  }

  if (
    /partner|outreach|anthropic_discretion|unknown_or_partner/i.test(eligibility) &&
    !hasSubmittable
  ) {
    return "needs_partner_outreach";
  }

  if (hasSubmittable) {
    if (evidenceBad || hasBlocked) {
      return "needs_packaging_or_manifest";
    }
    return "ready_to_submit";
  }

  if (
    /partner|outreach/i.test(eligibility) ||
    statusValues.every((v) => v === "unknown" || v === "not_applicable")
  ) {
    const onlyUnknown = statusValues.some((v) => v === "unknown");
    if (onlyUnknown || /partner|outreach/i.test(eligibility)) {
      return "needs_partner_outreach";
    }
  }

  if (hasListedStore) {
    return "listed";
  }

  return "unknown";
}

/**
 * @param {object} options
 * @param {object} options.matrix
 * @param {string} options.rootDir
 * @param {Date} [options.now]
 * @param {Array<{url: string, status: string}>} [options.onlineResults]
 */
export function analyzeMatrix({ matrix, rootDir, now = new Date(), onlineResults = [] }) {
  const markets = matrix.markets.map((market) => {
    const evidence = checkLocalEvidence(rootDir, market.local_evidence || []);
    const priority = classifyPriority(market, evidence);
    const stale = isStale(market.last_reviewed_at, matrix.reviewed_stale_days, now);
    const checklist = Array.isArray(market.submit_checklist) ? market.submit_checklist : [];
    const materials = checklist.map((item) => {
      const text = String(item);
      const allPresent = evidence.length > 0 && evidence.every((e) => e.status === "present");
      return {
        item: text,
        status: allPresent ? "repo_ready_or_external" : "manual_or_external",
      };
    });

    return {
      id: market.id,
      product: market.product,
      region: market.region,
      channel_type: market.channel_type,
      listing_statuses: market.listing_statuses,
      eligibility: market.eligibility,
      blockers: market.blockers || [],
      evidence_links: market.evidence_links || [],
      submit_url_or_process: market.submit_url_or_process,
      recommended_install_path: market.recommended_install_path || null,
      last_reviewed_at: market.last_reviewed_at,
      owner: market.owner,
      local_evidence: evidence,
      submit_checklist: checklist,
      materials,
      priority,
      stale,
      manual_submit_only: true,
    };
  });

  /** @type {Record<string, typeof markets>} */
  const groups = Object.fromEntries(PRIORITY_GROUPS.map((g) => [g, []]));
  for (const m of markets) {
    const key = PRIORITY_GROUPS.includes(m.priority) ? m.priority : "unknown";
    groups[key].push(m);
  }

  const summary = Object.fromEntries(
    PRIORITY_GROUPS.map((g) => [g, groups[g].length]),
  );

  return {
    generated_at: now.toISOString(),
    matrix_version: matrix.version,
    reviewed_stale_days: matrix.reviewed_stale_days,
    total_markets: markets.length,
    summary,
    stale_ids: markets.filter((m) => m.stale).map((m) => m.id),
    online: onlineResults,
    disclaimer:
      "This report does not auto-submit to any marketplace. All submissions are manual.",
    groups,
    markets,
  };
}

/**
 * @param {ReturnType<typeof analyzeMatrix>} report
 */
export function renderMarkdown(report) {
  const lines = [];
  lines.push("# CloudBase Plugin Marketplace Analysis");
  lines.push("");
  lines.push(`Generated: ${report.generated_at}`);
  lines.push("");
  lines.push(`> ${report.disclaimer}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`Total markets: **${report.total_markets}**`);
  lines.push("");
  lines.push("| Priority | Count |");
  lines.push("|----------|------:|");
  for (const g of PRIORITY_GROUPS) {
    lines.push(`| ${g} | ${report.summary[g]} |`);
  }
  lines.push("");

  if (report.stale_ids.length > 0) {
    lines.push("## Stale reviews");
    lines.push("");
    lines.push(
      `Entries older than ${report.reviewed_stale_days} days: ${report.stale_ids.map((id) => `\`${id}\``).join(", ")}`,
    );
    lines.push("");
  } else {
    lines.push("## Stale reviews");
    lines.push("");
    lines.push("None.");
    lines.push("");
  }

  for (const g of PRIORITY_GROUPS) {
    const items = report.groups[g];
    lines.push(`## ${g}`);
    lines.push("");
    if (items.length === 0) {
      lines.push("_None_");
      lines.push("");
      continue;
    }
    for (const m of items) {
      lines.push(`### ${m.id} — ${m.product}`);
      lines.push("");
      lines.push(`- Region: ${m.region}`);
      lines.push(`- Channel: \`${m.channel_type}\``);
      lines.push(`- Eligibility: \`${m.eligibility}\``);
      lines.push(`- Last reviewed: ${m.last_reviewed_at}${m.stale ? " (**stale**)" : ""}`);
      lines.push(`- Manual submit only: yes`);
      lines.push("");
      lines.push("Statuses:");
      lines.push("");
      for (const [k, v] of Object.entries(m.listing_statuses)) {
        lines.push(`- \`${k}\`: ${v}`);
      }
      lines.push("");
      if (m.blockers.length) {
        lines.push("Blockers:");
        lines.push("");
        for (const b of m.blockers) lines.push(`- ${b}`);
        lines.push("");
      }
      if (m.local_evidence.length) {
        lines.push("Local evidence:");
        lines.push("");
        for (const e of m.local_evidence) {
          lines.push(`- \`${e.id}\`: **${e.status}** — ${e.detail}`);
        }
        lines.push("");
      }
      if (m.submit_checklist.length) {
        lines.push("Submit checklist:");
        lines.push("");
        for (const item of m.submit_checklist) lines.push(`- [ ] ${item}`);
        lines.push("");
      }
      lines.push("Process:");
      lines.push("");
      lines.push("```");
      lines.push(String(m.submit_url_or_process).trim());
      lines.push("```");
      lines.push("");
      if (m.evidence_links.length) {
        lines.push("Evidence:");
        lines.push("");
        for (const link of m.evidence_links) lines.push(`- ${link}`);
        lines.push("");
      }
      if (m.recommended_install_path) {
        lines.push(`Recommended install docs: \`${m.recommended_install_path}\``);
        lines.push("");
      }
    }
  }

  if (report.online && report.online.length) {
    lines.push("## Online probe results");
    lines.push("");
    for (const row of report.online) {
      lines.push(`- ${row.url}: ${row.status}`);
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

/**
 * @param {string} outDir
 * @param {ReturnType<typeof analyzeMatrix>} report
 * @param {{ jsonOnly?: boolean }} [opts]
 */
export function writeReports(outDir, report, opts = {}) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "latest.json");
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  const paths = { jsonPath, mdPath: null };
  if (!opts.jsonOnly) {
    const mdPath = path.join(outDir, "latest.md");
    fs.writeFileSync(mdPath, renderMarkdown(report), "utf8");
    paths.mdPath = mdPath;
  }
  return paths;
}
