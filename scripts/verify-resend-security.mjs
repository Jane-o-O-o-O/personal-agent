import { createDecipheriv, createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { chmod, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { parseEnv } from 'node:util';
import { command, projectRoot, remoteNode, ssh, verificationDir } from './verification-http.mjs';

// This check never calls Resend. API keys reach the scanners only through stdin.
const expectedFrom = 'i@jane-zz.me';
const expectedDomain = 'jane-zz.me';
const scannerPath = join(projectRoot, 'scripts', 'security-scan.py');
const reportPath = join(verificationDir, 'resend-security.json');
const remoteProject = '/opt/personal-agent';
const remoteData = '/opt/personal-agent/state/app';
const remoteBrowserData = '/opt/personal-agent/state/browser';
const remoteWorkspace = '/opt/personal-agent/state/workspaces';
const requiredCategories = [
  'databaseFiles', 'source', 'vendoredSources', 'buildArtifacts',
  'runtimeReports', 'localApplicationLogs', 'workspacesAndArtifacts',
];

process.umask(0o077);

const plainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const shellQuote = value => `'${value.replace(/'/g, `'\\''`)}'`;
const positiveCount = value => Number.isSafeInteger(value) && value >= 0 ? value : NaN;

function decryptSettings(value, encryptionKey) {
  if (typeof value !== 'string') throw new Error('Invalid encrypted settings');
  const parts = value.split('.');
  if (parts.length !== 3) throw new Error('Invalid encrypted settings');
  const [nonce, tag, ciphertext] = parts;
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey, Buffer.from(nonce, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  const saved = JSON.parse(Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64url')), decipher.final(),
  ]).toString('utf8'));
  if (!plainObject(saved) || !plainObject(saved.config)
      || typeof saved.config.apiKey !== 'string' || saved.config.apiKey.length < 12) {
    throw new Error('Resend settings are incomplete');
  }
  return saved;
}

async function localSettings() {
  let env = {};
  try { env = parseEnv(await readFile(join(projectRoot, '.env'), 'utf8')); }
  catch (error) { if (error?.code !== 'ENOENT') throw error; }
  const dataDir = resolve(projectRoot, process.env.DATA_DIR || env.DATA_DIR || 'data');
  const encodedKey = process.env.ENCRYPTION_KEY || env.ENCRYPTION_KEY
    || (await readFile(join(dataDir, 'master-key'), 'utf8')).trim();
  const encryptionKey = Buffer.from(encodedKey, 'base64url');
  if (encryptionKey.length !== 32) throw new Error('Invalid encryption key');
  const database = new DatabaseSync(join(dataDir, 'agent.sqlite'), { readOnly: true });
  try {
    const row = database.prepare('SELECT value FROM settings WHERE key=?').get('integration:resend');
    const saved = decryptSettings(row?.value, encryptionKey);
    return {
      dataDir, saved,
      encryptedHash: createHash('sha256').update(row.value).digest('hex'),
      ciphertextExcludesKey: !row.value.includes(saved.config.apiKey),
    };
  } finally {
    database.close();
    encryptionKey.fill(0);
  }
}

async function publicView(saved) {
  const { register } = await import('tsx/esm/api');
  const unregister = register();
  try {
    const [{ createIntegrationService }, { RESEND_FROM }] = await Promise.all([
      import('../src/server/integrations/index.ts'),
      import('../src/server/mail/resend.ts'),
    ]);
    const settings = { get: (name, fallback) => name === 'integration:resend' ? saved : fallback };
    const store = { publish: () => { throw new Error('Read-only verification'); } };
    const view = createIntegrationService({ store, settings, dataDir: '' }).list().find(item => item.id === 'resend');
    if (!view || !plainObject(view.config) || !plainObject(view.secretFields)) throw new Error('Missing Resend public view');
    return {
      senderFixed: RESEND_FROM === expectedFrom && view.config.from === expectedFrom,
      domainFixed: view.config.domain === expectedDomain,
      keyAbsent: !Object.hasOwn(view.config, 'apiKey') && !JSON.stringify(view).includes(saved.config.apiKey),
      keyPresenceFlag: view.secretFields.apiKey === true,
      enabled: view.config.enabled !== false,
    };
  } finally { unregister(); }
}

function remoteSettingsSource(challenge) {
  return `
    const { readFileSync } = await import('node:fs');
    const { join, resolve } = await import('node:path');
    const { pathToFileURL } = await import('node:url');
    const { createDecipheriv, createHash, createHmac } = await import('node:crypto');
    const { DatabaseSync } = await import('node:sqlite');
    const { register } = await import('tsx/esm/api');
    const dataDir = process.env.DATA_DIR || '/app/data';
    const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY || readFileSync(join(dataDir, 'master-key'), 'utf8').trim(), 'base64url');
    if (encryptionKey.length !== 32) throw new Error('Invalid encryption key');
    const database = new DatabaseSync(join(dataDir, 'agent.sqlite'), { readOnly: true });
    const unregister = register();
    try {
      const row = database.prepare('SELECT value FROM settings WHERE key=?').get('integration:resend');
      if (typeof row?.value !== 'string') throw new Error('Missing Resend settings');
      const parts = row.value.split('.');
      if (parts.length !== 3) throw new Error('Invalid Resend settings');
      const decipher = createDecipheriv('aes-256-gcm', encryptionKey, Buffer.from(parts[0], 'base64url'));
      decipher.setAuthTag(Buffer.from(parts[1], 'base64url'));
      const saved = JSON.parse(Buffer.concat([decipher.update(Buffer.from(parts[2], 'base64url')), decipher.final()]).toString('utf8'));
      const apiKey = saved?.config?.apiKey;
      if (typeof apiKey !== 'string' || apiKey.length < 12) throw new Error('Missing Resend key');
      const [{ createIntegrationService }, { RESEND_FROM }] = await Promise.all([
        import(pathToFileURL(resolve('src/server/integrations/index.ts')).href),
        import(pathToFileURL(resolve('src/server/mail/resend.ts')).href),
      ]);
      const settings = { get: (name, fallback) => name === 'integration:resend' ? saved : fallback };
      const store = { publish: () => { throw new Error('Read-only verification'); } };
      const view = createIntegrationService({ store, settings, dataDir: '' }).list().find(item => item.id === 'resend');
      if (!view || !view.config || !view.secretFields) throw new Error('Missing Resend public view');
      return {
        keyProof: createHmac('sha256', apiKey).update(${JSON.stringify(challenge)}).digest('base64url'),
        encryptedHash: createHash('sha256').update(row.value).digest('hex'),
        ciphertextExcludesKey: !row.value.includes(apiKey),
        publicView: {
          senderFixed: RESEND_FROM === ${JSON.stringify(expectedFrom)} && view.config.from === ${JSON.stringify(expectedFrom)},
          domainFixed: view.config.domain === ${JSON.stringify(expectedDomain)},
          keyAbsent: !Object.hasOwn(view.config, 'apiKey') && !JSON.stringify(view).includes(apiKey),
          keyPresenceFlag: view.secretFields.apiKey === true,
          enabled: view.config.enabled !== false,
        },
      };
    } finally { unregister(); database.close(); encryptionKey.fill(0); }
  `;
}

function remoteScannerSource() {
  return `
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const { createDecipheriv } = await import('node:crypto');
    const { DatabaseSync } = await import('node:sqlite');
    const dataDir = process.env.DATA_DIR || '/app/data';
    const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY || readFileSync(join(dataDir, 'master-key'), 'utf8').trim(), 'base64url');
    const database = new DatabaseSync(join(dataDir, 'agent.sqlite'), { readOnly: true });
    try {
      if (encryptionKey.length !== 32) throw new Error('Invalid encryption key');
      const row = database.prepare('SELECT value FROM settings WHERE key=?').get('integration:resend');
      const parts = row?.value?.split('.');
      if (!parts || parts.length !== 3) throw new Error('Missing Resend settings');
      const decipher = createDecipheriv('aes-256-gcm', encryptionKey, Buffer.from(parts[0], 'base64url'));
      decipher.setAuthTag(Buffer.from(parts[1], 'base64url'));
      const saved = JSON.parse(Buffer.concat([decipher.update(Buffer.from(parts[2], 'base64url')), decipher.final()]).toString('utf8'));
      const apiKey = saved?.config?.apiKey;
      if (typeof apiKey !== 'string' || apiKey.length < 12) throw new Error('Missing Resend key');
      process.stdout.write(JSON.stringify({
        projectRoot: ${JSON.stringify(remoteProject)}, dataDir: ${JSON.stringify(remoteData)},
        browserDataDir: ${JSON.stringify(remoteBrowserData)}, workspaceDir: ${JSON.stringify(remoteWorkspace)},
        deployment: true, apiKey,
      }));
    } catch { process.exitCode = 1; }
    finally { database.close(); encryptionKey.fill(0); }
  `;
}

function scanSummary(scan, deployment) {
  if (!plainObject(scan) || scan.readOnly !== true || scan.keyProvidedThroughStdin !== true
      || !plainObject(scan.categories) || !plainObject(scan.database)) throw new Error('Invalid scan result');
  const names = deployment ? [
    ...requiredCategories, 'appContainerSources', 'browserContainerSources',
    'appContainerLogs', 'browserContainerLogs',
  ] : requiredCategories;
  for (const name of names) if (!plainObject(scan.categories[name])) throw new Error('Incomplete scan result');
  const categories = Object.fromEntries(Object.entries(scan.categories).map(([name, item]) => [name, {
    present: item.present === true,
    filesScanned: positiveCount(item.filesScanned),
    bytesScanned: positiveCount(item.bytesScanned),
    matchedFiles: positiveCount(item.matchedFiles),
    occurrences: positiveCount(item.occurrences),
    errors: positiveCount(item.errors),
  }]));
  const database = {
    present: scan.database.present === true,
    readOnly: scan.database.readOnly === true,
    tablesScanned: positiveCount(scan.database.tablesScanned),
    rowsScanned: positiveCount(scan.database.rowsScanned),
    matchedCells: positiveCount(scan.database.matchedCells),
    errors: positiveCount(scan.database.errors),
  };
  const totals = {
    plaintextMatches: Object.values(categories).reduce((sum, item) => sum + item.occurrences, database.matchedCells),
    scanErrors: Object.values(categories).reduce((sum, item) => sum + item.errors, database.errors + positiveCount(scan.infrastructureErrors)),
  };
  if (!Number.isFinite(totals.plaintextMatches) || !Number.isFinite(totals.scanErrors)) throw new Error('Invalid scan counts');
  return { database, categories, totals, readOnly: true, keyProvidedThroughStdin: true };
}

async function scanRemote(scanner) {
  // The decrypted key is emitted only into this VPS-local pipe, never over SSH stdout.
  const pipeline = `cd ${remoteProject}/deploy && docker compose --env-file ../.env -f compose.yaml exec -T app node --input-type=module - | python3 -c ${shellQuote(scanner)}`;
  const output = await ssh(`bash -o pipefail -c ${shellQuote(pipeline)}`, remoteScannerSource());
  return scanSummary(JSON.parse(output), true);
}

async function saveReport(report, apiKey) {
  const serialized = `${JSON.stringify(report, null, 2)}\n`;
  if (apiKey && serialized.includes(apiKey)) throw new Error('Secret appeared in report');
  await mkdir(verificationDir, { recursive: true, mode: 0o700 });
  await chmod(verificationDir, 0o700);
  const temporary = `${reportPath}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, serialized, { mode: 0o600, flag: 'wx' });
    await rename(temporary, reportPath);
    await chmod(reportPath, 0o600);
  } finally { await rm(temporary, { force: true }); }
}

const report = {
  schemaVersion: 1,
  startedAt: new Date().toISOString(),
  scope: 'Read-only Resend settings, public-view and exact-key plaintext scans; no email sent.',
  configuration: null,
  local: null,
  vps: null,
  passed: false,
};
let local;
try {
  local = await localSettings();
  const challenge = randomBytes(32).toString('base64url');
  const remote = await remoteNode('app', remoteSettingsSource(challenge));
  if (!plainObject(remote) || typeof remote.keyProof !== 'string'
      || !/^[a-f0-9]{64}$/.test(remote.encryptedHash || '') || !plainObject(remote.publicView)) {
    throw new Error('Invalid remote settings result');
  }
  const localProof = createHmac('sha256', local.saved.config.apiKey).update(challenge).digest('base64url');
  const keyEqual = localProof.length === remote.keyProof.length
    && timingSafeEqual(Buffer.from(localProof), Buffer.from(remote.keyProof));
  const localView = await publicView(local.saved);
  const scanner = await readFile(scannerPath, 'utf8');
  const [localScan, remoteScan] = await Promise.all([
    command('python3', [scannerPath], JSON.stringify({
      projectRoot, dataDir: local.dataDir, apiKey: local.saved.config.apiKey, deployment: false,
    })).then(value => scanSummary(JSON.parse(value), false)),
    scanRemote(scanner),
  ]);
  report.local = localScan;
  report.vps = remoteScan;
  const localAfter = await localSettings();
  const remoteAfter = await remoteNode('app', remoteSettingsSource(challenge));
  report.configuration = {
    encryptedSettingsReadable: true,
    currentApiKeyEqual: keyEqual,
    localCiphertextExcludesKey: local.ciphertextExcludesKey,
    vpsCiphertextExcludesKey: remote.ciphertextExcludesKey === true,
    localSettingsUnchanged: local.encryptedHash === localAfter.encryptedHash,
    vpsSettingsUnchanged: remote.encryptedHash === remoteAfter.encryptedHash,
    localPublicView: localView,
    vpsPublicView: remote.publicView,
    publicEnabledEqual: localView.enabled === remote.publicView.enabled,
  };
  localAfter.saved.config.apiKey = '';
  if (remoteAfter.keyProof !== remote.keyProof) report.configuration.vpsSettingsUnchanged = false;
  const viewChecks = [localView, remote.publicView].every(view => view.senderFixed === true
    && view.domainFixed === true && view.keyAbsent === true && view.keyPresenceFlag === true);
  report.passed = keyEqual && viewChecks && report.configuration.publicEnabledEqual
    && report.configuration.localCiphertextExcludesKey && report.configuration.vpsCiphertextExcludesKey
    && report.configuration.localSettingsUnchanged && report.configuration.vpsSettingsUnchanged
    && localScan.database.present && remoteScan.database.present
    && localScan.database.readOnly && remoteScan.database.readOnly
    && localScan.totals.plaintextMatches === 0 && remoteScan.totals.plaintextMatches === 0
    && localScan.totals.scanErrors === 0 && remoteScan.totals.scanErrors === 0;
} catch {
  report.verificationError = true;
} finally {
  report.finishedAt = new Date().toISOString();
  try { await saveReport(report, local?.saved?.config?.apiKey); }
  catch { console.error(JSON.stringify({ verificationError: true, reportSaved: false })); process.exitCode = 1; }
  if (!process.exitCode) {
    console.log(JSON.stringify({
      passed: report.passed,
      configuration: report.configuration,
      local: report.local?.totals ?? null,
      vps: report.vps?.totals ?? null,
      verificationError: report.verificationError === true,
      report: reportPath,
    }));
    if (!report.passed) process.exitCode = 1;
  }
  if (local?.saved?.config) local.saved.config.apiKey = '';
}
