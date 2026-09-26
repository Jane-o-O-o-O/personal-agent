import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createVerificationClient } from './verification-http.mjs';

const connectorIds = ['calendar', 'openmeteo', 'exchange', 'bocha', 'amap', 'qweather', 'ima'];
const outputPath = resolve(process.env.AGENT_VERIFY_INTEGRATIONS_REPORT || '.runtime/full-verification/integrations.json');
const report = {
  startedAt: new Date().toISOString(),
  baseUrl: process.env.AGENT_VERIFY_URL || 'https://39.107.111.115:8443',
  scope: 'Live connector connection checks; no credential changes, model tasks, browser actions, messages or purchases.',
  results: [],
  limitations: [
    'A connection test confirms its fixed probe only, not every tool or business workflow.',
    'Connection tests update check timestamps/status; connector configuration is never patched.',
    'Unconfigured and disabled services are observed and skipped, never counted as a live connection.',
    'Weixin is observed without starting QR authorization or sending messages.',
    'MCP connection checks initialize the server and list tools without calling any tool.',
    'Food delivery, coffee orders, rides, flight/train purchases and other archived skills are not implemented application tools.',
  ],
};

let client;
function record(id, outcome, fields = {}) {
  const result = { id, outcome, checkedAt: new Date().toISOString(), ...fields };
  report.results.push(result);
  console.log(JSON.stringify(result));
}

function publicIntegration(item) {
  return {
    id: item.id,
    name: item.name,
    status: item.status,
    enabled: item.config?.enabled !== false,
    capabilities: item.capabilities,
    credentialPresent: Object.values(item.secretFields || {}).some(Boolean),
  };
}

function assertNoExposedCredentials(integrations) {
  for (const item of integrations) {
    const privateFields = new Set([
      ...item.fields.filter(field => field.type === 'password').map(field => field.name),
      'apiKey', 'privateKey', 'botToken', 'token',
    ]);
    for (const field of privateFields) {
      assert.equal(Object.hasOwn(item.config, field), false, `Connector ${item.id} exposes ${field} in public config`);
    }
    assert.ok(Object.values(item.secretFields || {}).every(value => typeof value === 'boolean'), `Connector ${item.id} secret flags must be booleans`);
  }
}

async function checkConnector(item) {
  if (item.status === 'unconfigured') {
    record(item.id, 'credentials_missing_skip', { message: 'No configured credential or server; live connection is not verified.' });
    return;
  }
  if (item.config?.enabled === false) {
    record(item.id, 'disabled_skip', { message: 'Connector is disabled; live connection is not verified.' });
    return;
  }
  const started = performance.now();
  try {
    const result = await client.request('POST', `/api/integrations/${encodeURIComponent(item.id)}/test`, {});
    assert.equal(typeof result.ok, 'boolean', 'Connection test must return a boolean ok');
    assert.equal(typeof result.message, 'string', 'Connection test must return a message');
    const elapsedMs = Math.round(performance.now() - started);
    record(item.id, result.ok ? item.id === 'calendar' ? 'local_data_pass' : 'live_connection_pass' : 'failed', { elapsedMs, message: result.message });
  } catch {
    record(item.id, 'failed', { elapsedMs: Math.round(performance.now() - started), message: 'Connection test request or response validation failed.' });
  }
}

try {
  client = await createVerificationClient();
  report.baseUrl = client.baseUrl;
  const integrations = await client.request('GET', '/api/integrations');
  assert.ok(Array.isArray(integrations), 'Integration list must be an array');
  assertNoExposedCredentials(integrations);
  report.integrationsBefore = integrations.map(publicIntegration);
  record('public_credentials', 'public_view_pass', { count: integrations.length });
  for (const id of connectorIds) {
    const item = integrations.find(integration => integration.id === id);
    assert.ok(item, `Missing implemented connector ${id}`);
    await checkConnector(item);
  }

  const weixin = integrations.find(integration => integration.id === 'weixin');
  assert.ok(weixin, 'Missing Weixin channel');
  const login = await client.request('GET', '/api/integrations/weixin/login');
  assert.equal(typeof login.status, 'string', 'Weixin login must expose its state');
  if (weixin.status === 'unconfigured') {
    record('weixin', login.status === 'unconfigured' ? 'unconfigured_state_pass' : 'failed', { loginStatus: login.status, message: 'No account authorization; real inbound/outbound delivery is not verified.' });
  } else {
    record('weixin', 'observed_only', { loginStatus: login.status, message: 'Read-only account status; real inbound/outbound delivery is not verified.' });
  }

  const mcp = integrations.find(integration => integration.id === 'mcp');
  assert.ok(mcp, 'Missing MCP integration');
  await checkConnector(mcp);

  const after = await client.request('GET', '/api/integrations');
  assert.ok(Array.isArray(after), 'Final integration list must be an array');
  assertNoExposedCredentials(after);
  report.integrationsAfter = after.map(publicIntegration);
} catch {
  record('verification_runner', 'failed', { message: 'Verification setup, inventory or status validation failed.' });
} finally {
  if (client) {
    try { await client.logout(); report.loggedOut = true; }
    catch { report.loggedOut = false; record('logout', 'failed', { message: 'Temporary verification session logout failed.' }); }
  }
  report.finishedAt = new Date().toISOString();
  report.summary = {
    liveConnectionsPassed: report.results.filter(result => result.outcome === 'live_connection_pass').length,
    localDataPassed: report.results.filter(result => result.outcome === 'local_data_pass').length,
    missingCredentialsSkipped: report.results.filter(result => result.outcome === 'credentials_missing_skip').length,
    disabledSkipped: report.results.filter(result => result.outcome === 'disabled_skip').length,
    stateChecksPassed: report.results.filter(result => result.outcome === 'public_view_pass' || result.outcome === 'unconfigured_state_pass').length,
    failures: report.results.filter(result => result.outcome === 'failed').length,
  };
  await mkdir(dirname(outputPath), { recursive: true, mode: 0o700 });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
  console.log(JSON.stringify({ report: outputPath, ...report.summary }));
  if (report.summary.failures) process.exitCode = 1;
}
