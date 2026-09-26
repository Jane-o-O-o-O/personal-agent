import { createDecipheriv } from 'node:crypto';
import { existsSync } from 'node:fs';
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { parseEnv } from 'node:util';
import { command, projectRoot, remoteNode, ssh, verificationDir } from './verification-http.mjs';

const phase = process.argv[2] || 'preliminary';
const reportPath = join(verificationDir, 'security.json');
const scannerPath = join(projectRoot, 'scripts', 'security-scan.py');
let localConfig;
let remoteConfig;

function localSettings() {
  const envFile = join(projectRoot, '.env');
  return readFile(envFile, 'utf8').then(parseEnv, () => ({})).then(async env => {
    const dataDir = resolve(projectRoot, process.env.DATA_DIR || env.DATA_DIR || 'data');
    const key = Buffer.from(process.env.ENCRYPTION_KEY || env.ENCRYPTION_KEY
      || (await readFile(join(dataDir, 'master-key'), 'utf8')).trim(), 'base64url');
    if (key.length !== 32) throw new Error('Verification failed');
    const database = new DatabaseSync(join(dataDir, 'agent.sqlite'), { readOnly: true });
    try {
      const row = database.prepare('SELECT value FROM settings WHERE key=?').get('integration:model');
      if (!row?.value) throw new Error('Verification failed');
      const [nonce, tag, ciphertext] = row.value.split('.');
      const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(nonce, 'base64url'));
      decipher.setAuthTag(Buffer.from(tag, 'base64url'));
      const config = JSON.parse(Buffer.concat([
        decipher.update(Buffer.from(ciphertext, 'base64url')), decipher.final(),
      ]).toString('utf8'));
      if (typeof config.apiKey !== 'string' || config.apiKey.length < 12) throw new Error('Verification failed');
      return { config, encryptedValue: row.value, dataDir };
    } finally {
      database.close();
      key.fill(0);
    }
  });
}

async function vpsSettings() {
  return remoteNode('app', `
    const {readFileSync} = await import('node:fs');
    const {join} = await import('node:path');
    const {createDecipheriv} = await import('node:crypto');
    const {DatabaseSync} = await import('node:sqlite');
    const dataDir = process.env.DATA_DIR || '/app/data';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || readFileSync(join(dataDir,'master-key'),'utf8').trim(),'base64url');
    const database = new DatabaseSync(join(dataDir,'agent.sqlite'),{readOnly:true});
    try {
      const row = database.prepare('SELECT value FROM settings WHERE key=?').get('integration:model');
      if(!row?.value || key.length!==32) throw new Error('Verification failed');
      const [nonce,tag,ciphertext] = row.value.split('.');
      const decipher = createDecipheriv('aes-256-gcm',key,Buffer.from(nonce,'base64url'));
      decipher.setAuthTag(Buffer.from(tag,'base64url'));
      const config = JSON.parse(Buffer.concat([decipher.update(Buffer.from(ciphertext,'base64url')),decipher.final()]).toString('utf8'));
      if(typeof config.apiKey!=='string' || config.apiKey.length<12) throw new Error('Verification failed');
      return {config,encryptedValue:row.value};
    } finally {database.close();key.fill(0);}
  `);
}

const shellQuote = value => `'${value.replace(/'/g, `'\\''`)}'`;
const authorized = config => ({
  configured: Boolean(config.model && config.baseUrl && config.apiKey),
  modelMatchesAuthorizedTarget: config.model === 'gpt-6-sol',
  baseUrlMatchesAuthorizedTarget: config.baseUrl?.replace(/\/$/, '') === 'https://api.jane-zz.online/v1',
  apiMatchesAuthorizedProtocol: config.api === 'openai-completions',
  images: config.images === true,
});

function scanSummary(scan) {
  const categories = Object.values(scan.categories || {});
  return {
    plaintextMatches: categories.reduce((sum, item) => sum + item.occurrences, 0)
      + (scan.database?.matchedCells || 0),
    scanErrors: categories.reduce((sum, item) => sum + item.errors, 0)
      + (scan.database?.errors || 0) + (scan.infrastructureErrors || 0),
  };
}

try {
  if (!['preliminary', 'final'].includes(phase)) throw new Error('Invalid phase');
  const startedAt = new Date().toISOString();
  localConfig = await localSettings();
  remoteConfig = await vpsSettings();
  const local = JSON.parse(await command('python3', [scannerPath], JSON.stringify({
    projectRoot, dataDir: localConfig.dataDir, apiKey: localConfig.config.apiKey, deployment: false,
  })));
  const scanner = await readFile(scannerPath, 'utf8');
  const vps = JSON.parse(await ssh(`python3 -c ${shellQuote(scanner)}`, JSON.stringify({
    projectRoot: '/opt/personal-agent', dataDir: '/opt/personal-agent/state/app',
    browserDataDir: '/opt/personal-agent/state/browser',
    workspaceDir: '/opt/personal-agent/state/workspaces',
    apiKey: remoteConfig.config.apiKey, deployment: true,
  })));
  const localAfter = await localSettings();
  const remoteAfter = await vpsSettings();
  const configuration = {
    encryptedSettingsReadable: true,
    modelEqual: localConfig.config.model === remoteConfig.config.model,
    baseUrlEqual: localConfig.config.baseUrl === remoteConfig.config.baseUrl,
    apiProtocolEqual: localConfig.config.api === remoteConfig.config.api,
    imageSupportEqual: localConfig.config.images === remoteConfig.config.images,
    currentApiKeyEqual: localConfig.config.apiKey === remoteConfig.config.apiKey,
    localAuthorizedTarget: authorized(localConfig.config),
    vpsAuthorizedTarget: authorized(remoteConfig.config),
    localModelSettingsUnchanged: localConfig.encryptedValue === localAfter.encryptedValue,
    vpsModelSettingsUnchanged: remoteConfig.encryptedValue === remoteAfter.encryptedValue,
  };
  localAfter.config.apiKey = '';
  remoteAfter.config.apiKey = '';
  const localSummary = scanSummary(local);
  const vpsSummary = scanSummary(vps);
  const passed = configuration.modelEqual && configuration.baseUrlEqual && configuration.apiProtocolEqual
    && configuration.imageSupportEqual && configuration.currentApiKeyEqual
    && configuration.localModelSettingsUnchanged && configuration.vpsModelSettingsUnchanged
    && Object.entries(configuration.localAuthorizedTarget).every(([key, value]) => key === 'images' || value)
    && Object.entries(configuration.vpsAuthorizedTarget).every(([key, value]) => key === 'images' || value)
    && localSummary.plaintextMatches === 0 && vpsSummary.plaintextMatches === 0
    && localSummary.scanErrors === 0 && vpsSummary.scanErrors === 0;
  const run = {
    phase, startedAt, finishedAt: new Date().toISOString(), passed, configuration,
    local: { ...local, summary: localSummary }, vps: { ...vps, summary: vpsSummary },
  };
  let report = { schemaVersion: 1, preliminary: [], final: null };
  if (existsSync(reportPath)) {
    const previous = JSON.parse(await readFile(reportPath, 'utf8'));
    if (previous.schemaVersion !== 1 || !Array.isArray(previous.preliminary)) throw new Error('Invalid report');
    report = previous;
  }
  if (phase === 'preliminary') report.preliminary.push(run);
  else {
    if (report.final) (report.previousFinals ||= []).push(report.final);
    report.final = run;
  }
  await mkdir(verificationDir, { recursive: true, mode: 0o700 });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
  await chmod(reportPath, 0o600);
  console.log(JSON.stringify({ phase, passed, configuration, local: localSummary, vps: vpsSummary, reportMode600: true }));
  if (!passed) process.exitCode = 1;
} catch {
  console.error(JSON.stringify({ phase, verificationError: true }));
  process.exitCode = 1;
} finally {
  if (localConfig?.config) localConfig.config.apiKey = '';
  if (remoteConfig?.config) remoteConfig.config.apiKey = '';
}
