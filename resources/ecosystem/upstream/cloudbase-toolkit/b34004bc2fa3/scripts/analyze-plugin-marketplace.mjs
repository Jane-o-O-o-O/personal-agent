#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadMatrix } from "./lib/plugin-marketplace-matrix.mjs";
import { analyzeMatrix, writeReports } from "./lib/plugin-marketplace-report.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const opts = {
    matrix: path.join(ROOT_DIR, "specs/plugin-marketplace-listing/markets.yaml"),
    out: path.join(ROOT_DIR, "specs/plugin-marketplace-listing/reports"),
    strict: false,
    online: false,
    jsonOnly: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--matrix") opts.matrix = path.resolve(argv[++i]);
    else if (arg === "--out") opts.out = path.resolve(argv[++i]);
    else if (arg === "--strict") opts.strict = true;
    else if (arg === "--online") opts.online = true;
    else if (arg === "--json-only") opts.jsonOnly = true;
    else if (arg === "--help" || arg === "-h") opts.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return opts;
}

/**
 * @param {string[]} urls
 */
async function probeUrls(urls) {
  const results = [];
  for (const url of urls) {
    if (!/^https?:\/\//i.test(url)) {
      results.push({ url, status: "skipped_non_http" });
      continue;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal: controller.signal,
      });
      results.push({ url, status: `http_${res.status}` });
    } catch (err) {
      results.push({ url, status: `skipped_error:${err.name || "Error"}` });
    } finally {
      clearTimeout(timer);
    }
  }
  return results;
}

function printHelp() {
  console.log(`Usage: node scripts/analyze-plugin-marketplace.mjs [options]

Options:
  --matrix <path>   Path to markets.yaml
  --out <dir>       Output directory for latest.md / latest.json
  --strict          Exit 1 on missing/invalid required local evidence
  --online          Probe http(s) evidence_links / submit URLs
  --json-only       Write JSON only
  -h, --help        Show help
`);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    printHelp();
    return;
  }

  const matrix = loadMatrix(opts.matrix);

  let onlineResults = [];
  if (opts.online) {
    const urls = new Set();
    for (const market of matrix.markets) {
      for (const link of market.evidence_links || []) {
        if (/^https?:\/\//i.test(link)) urls.add(link);
      }
      const processText = String(market.submit_url_or_process || "");
      for (const match of processText.match(/https?:\/\/[^\s)]+/g) || []) {
        urls.add(match.replace(/[.,]$/, ""));
      }
    }
    onlineResults = await probeUrls([...urls]);
  }

  const report = analyzeMatrix({
    matrix,
    rootDir: ROOT_DIR,
    onlineResults,
  });

  const written = writeReports(opts.out, report, { jsonOnly: opts.jsonOnly });
  console.log(`Wrote ${written.jsonPath}`);
  if (written.mdPath) console.log(`Wrote ${written.mdPath}`);
  console.log(
    `Summary: ${PRIORITY_SUMMARY(report.summary)} (total ${report.total_markets})`,
  );

  if (opts.strict) {
    const criticalMissing = report.markets.filter((m) => {
      if (!["ready_to_submit", "needs_packaging_or_manifest", "listed"].includes(m.priority)) {
        return false;
      }
      return (m.local_evidence || []).some(
        (e) => e.status === "missing" || e.status === "invalid",
      );
    });
    if (criticalMissing.length > 0) {
      console.error(
        `Strict mode: ${criticalMissing.length} market(s) have missing/invalid local evidence: ${criticalMissing.map((m) => m.id).join(", ")}`,
      );
      process.exitCode = 1;
    }
  }
}

function PRIORITY_SUMMARY(summary) {
  return Object.entries(summary)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
