import fs from "fs";
import os from "os";
import path from "path";
import { expect, test } from "vitest";
import {
  applyPluginOverlay,
  assertSource,
  buildMarketplaceEntry,
  readPluginJson,
  updateMarketplaceJson,
} from "../scripts/sync-codebuddy-marketplace.mjs";

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

test("buildMarketplaceEntry maps plugin.json into catalog fields", () => {
  const entry = buildMarketplaceEntry({
    version: "2.25.0",
    author: { name: "Tencent CloudBase", url: "https://cloudbase.net" },
    homepage: {
      url: "https://github.com/TencentCloudBase/cloudbase-ai-toolkit",
      type: "github",
    },
    license: "MIT",
  });

  expect(entry.name).toBe("cloudbase");
  expect(entry.source).toBe("./plugins/cloudbase");
  expect(entry.version).toBe("2.25.0");
  expect(entry.description).toContain("CloudBase");
  expect(entry.license).toBe("MIT");
});

test("updateMarketplaceJson upserts cloudbase entry", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "cb-marketplace-json-"));
  const marketplaceJsonPath = path.join(temp, "marketplace.json");
  writeJson(marketplaceJsonPath, {
    name: "codebuddy-marketplace",
    plugins: [
      {
        name: "other",
        source: "./plugins/other",
        version: "1.0.0",
      },
      {
        name: "cloudbase",
        source: "./plugins/cloudbase",
        version: "1.0.0",
        description: "old",
      },
    ],
  });

  const entry = updateMarketplaceJson(marketplaceJsonPath, {
    version: "2.25.0",
    description: "ignored for catalog Chinese blurb",
  });
  const data = JSON.parse(fs.readFileSync(marketplaceJsonPath, "utf8"));

  expect(entry.version).toBe("2.25.0");
  expect(data.plugins).toHaveLength(2);
  expect(data.plugins[1].name).toBe("cloudbase");
  expect(data.plugins[1].version).toBe("2.25.0");
  expect(data.plugins[1].description).toContain("CloudBase AI");
});

test("applyPluginOverlay copies payload, keeps rules, updates catalog", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "cb-marketplace-overlay-"));
  const sourceDir = path.join(temp, "source");
  const repoDir = path.join(temp, "repo");

  writeJson(path.join(sourceDir, ".codebuddy-plugin", "plugin.json"), {
    name: "cloudbase",
    version: "2.25.0",
    description: "test",
    license: "MIT",
  });
  fs.mkdirSync(path.join(sourceDir, "rules"), { recursive: true });
  fs.writeFileSync(
    path.join(sourceDir, "rules", "cloudbase_rules.md"),
    "# rules\n",
  );
  fs.mkdirSync(path.join(sourceDir, "skills", "cloudbase"), { recursive: true });
  fs.writeFileSync(
    path.join(sourceDir, "skills", "cloudbase", "SKILL.md"),
    "---\nname: cloudbase\n---\n",
  );

  // Stale upstream tree that must be replaced
  fs.mkdirSync(path.join(repoDir, "plugins", "cloudbase", "old"), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(repoDir, "plugins", "cloudbase", "old", "gone.txt"),
    "stale\n",
  );
  writeJson(path.join(repoDir, ".codebuddy-plugin", "marketplace.json"), {
    name: "codebuddy-marketplace",
    plugins: [
      {
        name: "cloudbase",
        source: "./plugins/cloudbase",
        version: "1.0.0",
      },
    ],
  });

  assertSource(sourceDir);
  const plugin = readPluginJson(sourceDir);
  const result = applyPluginOverlay({ sourceDir, repoDir, plugin });

  expect(result.entry.version).toBe("2.25.0");
  expect(
    fs.existsSync(path.join(repoDir, "plugins", "cloudbase", "rules", "cloudbase_rules.md")),
  ).toBe(true);
  expect(
    fs.existsSync(path.join(repoDir, "plugins", "cloudbase", "skills", "cloudbase", "SKILL.md")),
  ).toBe(true);
  expect(
    fs.existsSync(path.join(repoDir, "plugins", "cloudbase", "old", "gone.txt")),
  ).toBe(false);

  const catalog = JSON.parse(
    fs.readFileSync(
      path.join(repoDir, ".codebuddy-plugin", "marketplace.json"),
      "utf8",
    ),
  );
  expect(catalog.plugins[0].version).toBe("2.25.0");
});
