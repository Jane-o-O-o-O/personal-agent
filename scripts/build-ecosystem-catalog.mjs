import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const lock = JSON.parse(readFileSync(resolve(root, 'resources/ecosystem/sources.lock.json'), 'utf8'));
const index = readFileSync(resolve(root, 'resources/ecosystem/INDEX.md'), 'utf8');
const partsDir = resolve(root, 'resources/ecosystem/catalog-parts');
const parts = readdirSync(partsDir).filter(name => name.endsWith('.json'))
  .flatMap(name => JSON.parse(readFileSync(resolve(partsDir, name), 'utf8')));
const byId = new Map(parts.map(part => [part.id, part]));
const byPath = new Map();
const limitations = new Map();
let inLimitations = false;
for (const line of index.split('\n')) {
  if (line === '## 接入限制') { inLimitations = true; continue; }
  if (line.startsWith('## ') && inLimitations) { inLimitations = false; }
  if (line.startsWith('| ')) {
    const cells = line.slice(1, -1).split(' | ').map(cell => cell.trim());
    const match = cells[3]?.match(/^\[文件\]\(([^)]+)\)$/);
    if (match && cells.length >= 6) byPath.set(match[1].replace(/\/$/, ''), cells);
  }
  if (inLimitations) {
    const match = line.match(/^- \*\*(.+?)\*\*：(.*)$/);
    if (match) limitations.set(match[1], match[2].trim());
  }
}
const entries = Object.entries(lock.assets).map(([id, asset]) => {
  const row = byPath.get(asset.path);
  const part = byId.get(id);
  if (!row || !part) throw new Error(`No catalog or index row for ${id}`);
  const sourceUrl = part.homepage || part.url || asset.resolvedUrl || asset.source;
  if (!sourceUrl.startsWith('https://')) throw new Error(`Source URL is not HTTPS for ${id}`);
  return {
    id, name: part.name, platform: part.platform, category: part.category,
    sourceType: part.sourceType || row[1], origin: part.origin || 'unknown',
    kind: part.kind || row[2], sourceUrl, archiveSourceUrl: asset.resolvedUrl || asset.source,
    version: asset.version || asset.revision?.slice(0, 12) || '', sha256: asset.sha256,
    access: part.access || row[5], limitations: Array.isArray(part.limitations) ? part.limitations : [limitations.get(row[0]) || ''],
    piIntegration: part.piIntegration || '', evidence: part.evidence || [],
  };
});
if (!entries.length || byPath.size !== entries.length || byId.size !== entries.length)
  throw new Error('Ecosystem asset count changed; review the catalog before regenerating.');
mkdirSync(resolve(root, 'src/server/ecosystem'), { recursive: true });
writeFileSync(resolve(root, 'src/server/ecosystem/catalog.json'), `${JSON.stringify({ schemaVersion: 1, entries }, null, 2)}\n`);
