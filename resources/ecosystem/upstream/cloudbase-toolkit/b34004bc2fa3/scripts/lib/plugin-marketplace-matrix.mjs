import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

export const CHANNEL_TYPES = new Set([
  "official_curated_marketplace",
  "community_plugin_directory",
  "self_hosted_marketplace",
  "native_connector_or_builtin",
  "open_plugin_spec_target",
  "mcp_registry_or_aggregator",
  "skill_registry",
  "editor_extension_marketplace",
  "deeplink_or_install_assist",
  "docs_config_only",
]);

export const STATUS_KEYS = [
  "official_curated",
  "community_directory",
  "self_marketplace",
  "native_connector_or_builtin",
  "open_plugin_spec",
  "mcp_or_skill_registry",
  "docs_only",
];

export const STATUS_VALUES = new Set([
  "listed",
  "submittable",
  "blocked",
  "not_applicable",
  "unknown",
]);

export const PRIORITY_HINTS = new Set([
  "ready_to_submit",
  "needs_packaging_or_manifest",
  "needs_partner_outreach",
  "listed",
  "not_applicable",
  "unknown",
]);

export const REQUIRED_MARKET_FIELDS = [
  "id",
  "product",
  "region",
  "channel_type",
  "listing_statuses",
  "submit_url_or_process",
  "eligibility",
  "blockers",
  "evidence_links",
  "last_reviewed_at",
  "owner",
];

/**
 * @param {string} matrixPath
 * @returns {{ version: number, reviewed_stale_days: number, markets: object[] }}
 */
export function loadMatrix(matrixPath) {
  const abs = path.resolve(matrixPath);
  if (!fs.existsSync(abs)) {
    throw new Error(`Matrix file not found: ${abs}`);
  }
  const raw = fs.readFileSync(abs, "utf8");
  const data = yaml.load(raw);
  validateMatrix(data, abs);
  return data;
}

/**
 * @param {unknown} data
 * @param {string} [source]
 */
export function validateMatrix(data, source = "matrix") {
  if (!data || typeof data !== "object") {
    throw new Error(`${source}: root must be an object`);
  }
  const root = /** @type {Record<string, unknown>} */ (data);
  if (typeof root.version !== "number") {
    throw new Error(`${source}: version must be a number`);
  }
  if (typeof root.reviewed_stale_days !== "number" || root.reviewed_stale_days <= 0) {
    throw new Error(`${source}: reviewed_stale_days must be a positive number`);
  }
  if (!Array.isArray(root.markets) || root.markets.length === 0) {
    throw new Error(`${source}: markets must be a non-empty array`);
  }

  const ids = new Set();
  for (let i = 0; i < root.markets.length; i++) {
    const market = root.markets[i];
    const label = `${source}:markets[${i}]`;
    if (!market || typeof market !== "object") {
      throw new Error(`${label} must be an object`);
    }
    const m = /** @type {Record<string, unknown>} */ (market);
    for (const field of REQUIRED_MARKET_FIELDS) {
      if (m[field] === undefined || m[field] === null) {
        throw new Error(`${label}: missing required field "${field}"`);
      }
    }
    if (typeof m.id !== "string" || !m.id.trim()) {
      throw new Error(`${label}: id must be a non-empty string`);
    }
    if (ids.has(m.id)) {
      throw new Error(`${source}: duplicate market id "${m.id}"`);
    }
    ids.add(m.id);

    if (!CHANNEL_TYPES.has(/** @type {string} */ (m.channel_type))) {
      throw new Error(`${label}: invalid channel_type "${m.channel_type}"`);
    }

    const statuses = m.listing_statuses;
    if (!statuses || typeof statuses !== "object" || Array.isArray(statuses)) {
      throw new Error(`${label}: listing_statuses must be an object`);
    }
    const statusObj = /** @type {Record<string, unknown>} */ (statuses);
    for (const key of STATUS_KEYS) {
      if (!(key in statusObj)) {
        throw new Error(`${label}: listing_statuses missing key "${key}"`);
      }
      if (!STATUS_VALUES.has(/** @type {string} */ (statusObj[key]))) {
        throw new Error(
          `${label}: listing_statuses.${key} has invalid value "${statusObj[key]}"`,
        );
      }
    }

    if (!Array.isArray(m.blockers)) {
      throw new Error(`${label}: blockers must be an array`);
    }
    if (!Array.isArray(m.evidence_links)) {
      throw new Error(`${label}: evidence_links must be an array`);
    }
    if (m.local_evidence !== undefined && !Array.isArray(m.local_evidence)) {
      throw new Error(`${label}: local_evidence must be an array when present`);
    }
    if (m.submit_checklist !== undefined && !Array.isArray(m.submit_checklist)) {
      throw new Error(`${label}: submit_checklist must be an array when present`);
    }
    if (
      m.priority_hint !== undefined &&
      m.priority_hint !== null &&
      !PRIORITY_HINTS.has(/** @type {string} */ (m.priority_hint))
    ) {
      throw new Error(`${label}: invalid priority_hint "${m.priority_hint}"`);
    }
    if (typeof m.last_reviewed_at !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(m.last_reviewed_at)) {
      throw new Error(`${label}: last_reviewed_at must be YYYY-MM-DD`);
    }
  }

  return true;
}

/**
 * @param {string} lastReviewedAt
 * @param {number} staleDays
 * @param {Date} [now]
 */
export function isStale(lastReviewedAt, staleDays, now = new Date()) {
  const reviewed = new Date(`${lastReviewedAt}T00:00:00Z`);
  if (Number.isNaN(reviewed.getTime())) return true;
  const ageMs = now.getTime() - reviewed.getTime();
  return ageMs > staleDays * 24 * 60 * 60 * 1000;
}
