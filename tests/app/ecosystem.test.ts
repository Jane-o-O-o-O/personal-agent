import { afterEach, describe, expect, it } from 'vitest';
import { createServer, type Server } from 'node:http';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../../src/server/app.js';
import { createEcosystemService } from '../../src/server/ecosystem/index.js';
import catalog from '../../src/server/ecosystem/catalog.json' with { type: 'json' };
import { createIntegrationService } from '../../src/server/integrations/index.js';
import { ModelConfigService } from '../../src/server/model-config.js';
import { AppError } from '../../src/server/errors.js';
import { SettingsStore } from '../../src/server/settings.js';
import { Store } from '../../src/server/store.js';
import type { AppConfig } from '../../src/server/config.js';

const stores: Store[] = [];
const directories: string[] = [];
const servers: Server[] = [];
const apps: Array<Awaited<ReturnType<typeof createApp>>> = [];
afterEach(async () => {
  for (const app of apps.splice(0)) await app.app.close();
  for (const server of servers.splice(0)) {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
  for (const store of stores.splice(0)) store.close();
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

function directSetup(options: { probe?: (name: string, apiKey: string) => Promise<number>; manualNames?: () => string[]; beforeMutation?: () => void } = {}) {
  const store = new Store(':memory:'); stores.push(store);
  const settings = new SettingsStore(store, randomBytes(32));
  const integrations = createIntegrationService({ store, settings, dataDir: '/unused' });
  const ecosystem = createEcosystemService({ store, settings, integrations,
    probe: options.probe ? (definition, apiKey) => options.probe!(definition.id, apiKey) : undefined,
    configuredMcpNames: options.manualNames || (() => []),
    beforeMutation: options.beforeMutation,
  });
  return { store, settings, integrations, ecosystem };
}

function appConfig(directory: string, port: number): AppConfig {
  return { host: '127.0.0.1', port: 3420, dataDir: directory, password: 'test-only', encryptionKey: randomBytes(32),
    cookieSecure: false, publicOrigin: `http://127.0.0.1:${port}` };
}

async function waitUntil(predicate: () => boolean, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error('Timed out waiting for Pi task');
    await new Promise(resolve => setTimeout(resolve, 20));
  }
}

describe('ecosystem catalog and managed activation', () => {
  it('contains every fixed asset exactly once, with platform/category/source and inaccessible archives', () => {
    const { ecosystem } = directSetup();
    const lock = JSON.parse(readFileSync('resources/ecosystem/sources.lock.json', 'utf8')) as { assets: Record<string, unknown> };
    expect(catalog.entries.map(entry => entry.id).sort()).toEqual(Object.keys(lock.assets).sort());
    const assets = ecosystem.list().filter(item => item.id.startsWith('asset-'));
    expect(assets).toHaveLength(catalog.entries.length);
    expect(new Set(assets.map(item => item.id)).size).toBe(catalog.entries.length);
    for (const entry of catalog.entries) {
      const item = assets.find(candidate => candidate.id === `asset-${entry.id}`);
      expect(item).toMatchObject({ platform: entry.platform, category: entry.category, sourceUrl: entry.sourceUrl,
        installable: false, enabled: false });
      expect(item?.limitations?.length).toBeGreaterThan(0);
    }
    for (const id of ['plan-meituan-delivery', 'plan-taobao-flash', 'plan-jd-delivery', 'plan-wps365-mcp']) {
      const item = ecosystem.list().find(candidate => candidate.id === id);
      expect(item).toMatchObject({ installable: false, status: 'reference' });
    }
  });

  it('rejects installing archived packages without running their code', async () => {
    const { ecosystem } = directSetup();
    await expect(ecosystem.install('asset-didi-ride-skill-official')).rejects.toMatchObject({ code: 'ECOSYSTEM_UNAVAILABLE' });
    await expect(ecosystem.install('plan-meituan-delivery')).rejects.toMatchObject({ code: 'ECOSYSTEM_UNAVAILABLE' });
  });

  it('requires a successful safe-tools handshake, encrypts the key, and uninstalls only managed state', async () => {
    const probes: string[] = [];
    const { ecosystem, store, integrations } = directSetup({ probe: async (name, apiKey) => { probes.push(`${name}:${apiKey}`); return 2; } });
    await expect(ecosystem.install('mcp-didi')).rejects.toMatchObject({ code: 'NEEDS_CREDENTIALS' });
    const item = await ecosystem.install('mcp-didi', { apiKey: 'didi-test-key' });
    expect(item).toMatchObject({ status: 'enabled', configuredFields: { apiKey: true }, toolCount: 2 });
    expect(probes).toEqual(['mcp-didi:didi-test-key']);
    const raw = store.get<{ value: string }>('SELECT value FROM settings WHERE key=?', 'ecosystem:mcp:mcp-didi')!.value;
    expect(raw).not.toContain('didi-test-key');
    expect(JSON.stringify(ecosystem.list())).not.toContain('didi-test-key');
    expect(JSON.stringify(store.eventsAfter(0))).not.toContain('didi-test-key');
    const managed = ecosystem.managedConfigs();
    expect(managed).toHaveLength(1);
    expect(managed[0].config).toMatchObject({ exposure: 'hidden', auth: { provider: 'personal-agent-managed-no-oauth' } });
    expect((managed[0].config as {url:string}).url).toContain('/mcp-servers-sandbox?key=');
    expect(managed[0].config.toolExposure?.maps_textsearch).toBe('direct');
    expect(managed[0].config.toolExposure?.taxi_create_order).toBeUndefined();
    expect(managed[0].config.toolExposure?.taxi_cancel_order).toBeUndefined();
    integrations.update('amap', { apiKey: 'my-amap-key' });
    expect((await ecosystem.uninstall('mcp-didi')).enabled).toBe(false);
    expect(ecosystem.managedConfigs()).toHaveLength(0);
    expect(store.get('SELECT value FROM settings WHERE key=?', 'ecosystem:mcp:mcp-didi')).toBeUndefined();
    expect(integrations.list().find(item => item.id === 'amap')?.secretFields.apiKey).toBe(true);
  });

  it('preserves a working connection when replacement credential verification fails', async () => {
    const { ecosystem } = directSetup({ probe: async (_name, apiKey) => {
      if (apiKey === 'wrong-key') throw new Error('https://mcp.didichuxing.com/mcp-servers-sandbox?key=wrong-key');
      return 1;
    } });
    await ecosystem.install('mcp-didi', { apiKey: 'working-key' });
    await expect(ecosystem.install('mcp-didi', { apiKey: 'wrong-key' })).rejects.toMatchObject({ code: 'MCP_CONNECT_FAILED' });
    expect(ecosystem.list().find(item => item.id === 'mcp-didi')?.status).toBe('enabled');
    expect((ecosystem.managedConfigs()[0].config as { url: string }).url).toContain('working-key');
  });

  it('does not commit a connection test or installation if a task starts during its probe', async () => {
    let taskActive = false;
    let delayed = false;
    let releaseProbe: ((count: number) => void) | undefined;
    const { ecosystem, store } = directSetup({
      beforeMutation: () => { if (taskActive) throw new AppError('ECOSYSTEM_TASK_ACTIVE', '任务运行中。', 409); },
      probe: async () => delayed ? new Promise<number>(resolve => { releaseProbe = resolve; }) : 1,
    });
    await ecosystem.install('mcp-didi', { apiKey: 'working-key' });
    const before = JSON.stringify(ecosystem.list());
    const cursor = store.cursor();

    delayed = true;
    const checking = ecosystem.test('mcp-didi');
    await waitUntil(() => Boolean(releaseProbe), 1000);
    taskActive = true;
    releaseProbe!(1);
    await expect(checking).rejects.toMatchObject({ code: 'ECOSYSTEM_TASK_ACTIVE' });
    expect(JSON.stringify(ecosystem.list())).toBe(before);
    expect(store.cursor()).toBe(cursor);

    taskActive = false;
    releaseProbe = undefined;
    const installing = ecosystem.install('mcp-luckin', { apiKey: 'luckin-token' });
    await waitUntil(() => Boolean(releaseProbe), 1000);
    taskActive = true;
    releaseProbe!(1);
    await expect(installing).rejects.toMatchObject({ code: 'ECOSYSTEM_TASK_ACTIVE' });
    expect(ecosystem.managedConfigs().map(item => item.name)).toEqual(['managed-didi']);
    expect(store.cursor()).toBe(cursor);

    taskActive = false;
    const testingBuiltin = ecosystem.test('connector-calendar');
    taskActive = true;
    await expect(testingBuiltin).rejects.toMatchObject({ code: 'ECOSYSTEM_TASK_ACTIVE' });
    expect(store.cursor()).toBe(cursor);
  });

  it('filters built-in tools on the next session while preserving configuration after uninstall', async () => {
    const { ecosystem, integrations } = directSetup();
    integrations.update('amap', { apiKey: 'amap-key' });
    expect(integrations.activeTools().map(tool => tool.name)).toContain('maps_route');
    await ecosystem.uninstall('connector-amap');
    expect(integrations.activeTools().map(tool => tool.name)).not.toContain('maps_route');
    expect(integrations.list().find(item => item.id === 'amap')?.secretFields.apiKey).toBe(true);
    await ecosystem.install('connector-amap');
    expect(integrations.activeTools().map(tool => tool.name)).toContain('maps_route');
  });

  it('rejects managed/manual MCP namespace collisions in either installation order', async () => {
    const manual = ['managed_didi'];
    let probes = 0;
    const { ecosystem, settings } = directSetup({ manualNames: () => manual,
      probe: async () => { probes++; return 1; } });
    await expect(ecosystem.install('mcp-didi', { apiKey: 'didi-test-key' })).rejects.toMatchObject({ code: 'MCP_NAME_CONFLICT' });
    expect(probes).toBe(0);
    manual.splice(0);
    await ecosystem.install('mcp-didi', { apiKey: 'didi-test-key' });
    const models = new ModelConfigService(settings, '/unused');
    expect(() => models.updateMcp({ servers: { mcpServers: { 'managed-didi': { url: 'https://example.com/mcp' } } } }, ecosystem.reservedMcpNames()))
      .toThrowError(/冲突/);
    expect(models.configuredMcpNames()).toEqual([]);
  });

  it('handshakes with Luckin and VariFlight using their pinned headers and only enables listed query tools', async () => {
    const seen: Array<{ path:string; authorization?:string; apiKey?:string; method:string }> = [];
    const server = createServer(async (request,response) => {
      if (request.method !== 'POST') { response.writeHead(405).end(); return; }
      let raw=''; for await (const chunk of request) raw+=chunk;
      const rpc=JSON.parse(raw);
      const path=request.url || '';
      seen.push({path,authorization:request.headers.authorization,apiKey:request.headers['x-api-key'] as string|undefined,method:rpc.method});
      if (rpc.id === undefined) { response.writeHead(202).end(); return; }
      const safe = path === '/luckin' ? 'queryShopList' : path === '/aviation' ? 'searchFlightsByNumber' : 'searchTrainTicketsByCity';
      const unsafe = path === '/luckin' ? 'createOrder' : 'surpriseMutation';
      const result=rpc.method==='initialize' ? {protocolVersion:rpc.params.protocolVersion,capabilities:{tools:{}},serverInfo:{name:'fixture',version:'1'}}:
        rpc.method==='tools/list' ? {tools:[{name:safe,inputSchema:{type:'object',properties:{}}},{name:unsafe,inputSchema:{type:'object',properties:{}}}]}:undefined;
      response.writeHead(result ? 200:400,{'Content-Type':'application/json'}).end(JSON.stringify({jsonrpc:'2.0',id:rpc.id,result}));
    });
    servers.push(server);
    await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
    const port=(server.address() as {port:number}).port;
    const store=new Store(':memory:'); stores.push(store);
    const settings=new SettingsStore(store,randomBytes(32));
    const integrations=createIntegrationService({store,settings,dataDir:'/unused'});
    const ecosystem=createEcosystemService({store,settings,integrations,endpointOverrides:{
      'mcp-luckin':`http://127.0.0.1:${port}/luckin`,
      'mcp-variflight-aviation':`http://127.0.0.1:${port}/aviation`,
      'mcp-variflight-tripmatch':`http://127.0.0.1:${port}/tripmatch`,
    }});
    expect((await ecosystem.install('mcp-luckin',{apiKey:'luckin-token'})).toolCount).toBe(1);
    expect((await ecosystem.install('mcp-variflight-aviation',{apiKey:'flight-key'})).toolCount).toBe(1);
    expect((await ecosystem.install('mcp-variflight-tripmatch',{apiKey:'train-key'})).toolCount).toBe(1);
    expect(seen.filter(item=>item.path==='/luckin').every(item=>item.authorization==='Bearer luckin-token')).toBe(true);
    expect(seen.filter(item=>item.path==='/aviation').every(item=>item.apiKey==='flight-key')).toBe(true);
    expect(seen.filter(item=>item.path==='/tripmatch').every(item=>item.apiKey==='train-key')).toBe(true);
    const configs=ecosystem.managedConfigs();
    expect(configs.find(item=>item.name==='managed-luckin')?.config.toolExposure?.createOrder).toBeUndefined();
    expect(configs.find(item=>item.name==='managed-variflight-tripmatch')?.config.toolExposure?.searchTrainTicketsByCity).toBe('direct');
    expect(JSON.stringify(ecosystem.list())).not.toMatch(/luckin-token|flight-key|train-key/);
  });
});

it('protects the catalog routes and toggles a built-in adapter through the public API', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'pa-ecosystem-api-')); directories.push(directory);
  const services = await createApp(appConfig(directory, 3420), { background: false }); apps.push(services);
  const forbidden = await services.app.inject({ method: 'GET', url: '/api/ecosystem' });
  expect(forbidden.statusCode).toBe(401);
  const login = await services.app.inject({ method: 'POST', url: '/api/auth/login', payload: { password: 'test-only' } });
  expect(login.statusCode).toBe(200);
  const cookie = String(login.headers['set-cookie']).split(';')[0];
  const headers = { cookie };
  const listed = await services.app.inject({ method: 'GET', url: '/api/ecosystem', headers });
  expect(listed.statusCode).toBe(200);
  expect(listed.json().items.filter((item: { id: string }) => item.id.startsWith('asset-'))).toHaveLength(catalog.entries.length);
  const notInstallable = await services.app.inject({ method: 'POST', url: '/api/ecosystem/plan-meituan-delivery/install', headers, payload: { config: {} } });
  expect(notInstallable.statusCode).toBe(409);
  const task = services.tasks.create('等待配置的任务');
  const row = services.store.get<{json:string}>('SELECT json FROM tasks WHERE id=?', task.id)!;
  const recorded = JSON.parse(row.json);
  services.store.run('UPDATE tasks SET json=? WHERE id=?', JSON.stringify({ ...recorded, status:'waiting_approval' }), task.id);
  const busy = await services.app.inject({ method: 'DELETE', url: '/api/ecosystem/connector-calendar', headers });
  expect(busy.statusCode).toBe(409);
  expect(busy.json().error.code).toBe('ECOSYSTEM_TASK_ACTIVE');
  const beforeTest = JSON.stringify(services.ecosystem.list());
  const beforeCursor = services.store.cursor();
  for (const id of ['connector-calendar', 'mcp-didi']) {
    const blockedTest = await services.app.inject({ method: 'POST', url: `/api/ecosystem/${id}/test`, headers });
    expect(blockedTest.statusCode).toBe(409);
    expect(blockedTest.json().error.code).toBe('ECOSYSTEM_TASK_ACTIVE');
  }
  expect(JSON.stringify(services.ecosystem.list())).toBe(beforeTest);
  expect(services.store.cursor()).toBe(beforeCursor);
  services.store.run('UPDATE tasks SET json=? WHERE id=?', JSON.stringify({ ...recorded, status:'paused' }), task.id);
  const removed = await services.app.inject({ method: 'DELETE', url: '/api/ecosystem/connector-calendar', headers });
  expect(removed.statusCode).toBe(200);
  expect(removed.json()).toMatchObject({ enabled: false, status: 'available' });
  const restored = await services.app.inject({ method: 'POST', url: '/api/ecosystem/connector-calendar/install', headers, payload: { config: {} } });
  expect(restored.statusCode).toBe(200);
  expect(restored.json()).toMatchObject({ enabled: true, status: 'enabled' });
});

it('loads managed Didi beside manual MCP, hides order calls, and removes it from the next Pi session', async () => {
  const modelRequests: any[] = [];
  const mcpMethods: string[] = [];
  let hiddenCall = false;
  let upstreamToolCalls = 0;
  const server = createServer(async (request, response) => {
    let raw = ''; for await (const chunk of request) raw += chunk;
    if (request.url?.startsWith('/mcp')) {
      if (request.method !== 'POST') { response.writeHead(405).end(); return; }
      const rpc = JSON.parse(raw); mcpMethods.push(rpc.method);
      if (rpc.id === undefined) { response.writeHead(202).end(); return; }
      if (rpc.method === 'tools/call') upstreamToolCalls++;
      const result = rpc.method === 'initialize'
        ? { protocolVersion: rpc.params.protocolVersion, capabilities: { tools: {} }, serverInfo: { name: 'didi-fixture', version: '1.0.0' } }
        : rpc.method === 'tools/list' ? { tools: [
          { name: 'maps_textsearch', description: 'Search a place', inputSchema: { type: 'object', properties: { keywords: { type: 'string' } } } },
          { name: 'taxi_create_order', description: 'Create a real order', inputSchema: { type: 'object', properties: {} } },
        ] } : undefined;
      response.writeHead(result ? 200 : 400, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ jsonrpc: '2.0', id: rpc.id, result })); return;
    }
    const body = JSON.parse(raw); modelRequests.push(body);
    response.writeHead(200, { 'Content-Type': 'text/event-stream' });
    const hasToolResult = body.messages.some((message: any) => message.role === 'tool');
    const delta = hiddenCall && !hasToolResult
      ? { role: 'assistant', tool_calls: [{ index: 0, id: 'forged-order-call', type: 'function', function: { name: 'mcp__managed_didi__taxi_create_order', arguments: '{}' } }] }
      : { role: 'assistant', content: '已连接。' };
    response.write(`data: ${JSON.stringify({ id: 'ecosystem-test', object: 'chat.completion.chunk', created: 1, model: 'test-model', choices: [{ index: 0, delta, finish_reason: null }] })}\n\n`);
    response.write(`data: ${JSON.stringify({ id: 'ecosystem-test', object: 'chat.completion.chunk', created: 1, model: 'test-model', choices: [{ index: 0, delta: {}, finish_reason: hiddenCall && !hasToolResult ? 'tool_calls' : 'stop' }] })}\n\n`);
    response.end('data: [DONE]\n\n');
  });
  servers.push(server);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as { port: number }).port;
  const directory = mkdtempSync(join(tmpdir(), 'pa-ecosystem-')); directories.push(directory);
  const services = await createApp(appConfig(directory, port), { background: false,
    ecosystemEndpointOverrides: { 'mcp-didi': `http://127.0.0.1:${port}/mcp?key=didi-test-key` } });
  apps.push(services);
  services.models.update({ provider: 'custom', model: 'test-model', apiKey: 'model-test-key', baseUrl: `http://127.0.0.1:${port}/v1` });
  services.models.updateMcp({ servers: { mcpServers: { 'fixture-manual': { url: `http://127.0.0.1:${port}/mcp` } } } });
  expect((await services.ecosystem.install('mcp-didi', { apiKey: 'didi-test-key' })).enabled).toBe(true);
  const task = services.tasks.create('请查询附近地点');
  await waitUntil(() => ['succeeded', 'failed'].includes(services.tasks.get(task.id)!.status));
  expect(services.tasks.get(task.id)?.status).toBe('succeeded');
  expect(modelRequests).toHaveLength(1);
  const toolNames = modelRequests[0].tools.map((tool: any) => tool.function.name);
  expect(toolNames).toContain('mcp__managed_didi__maps_textsearch');
  expect(toolNames).toContain('mcp__fixture_manual__maps_textsearch');
  expect(toolNames).not.toContain('mcp__managed_didi__taxi_create_order');
  expect(toolNames).not.toContain('mcp__managed_didi__taxi_cancel_order');
  expect(mcpMethods).toContain('initialize'); expect(mcpMethods).toContain('tools/list');
  const mcpFile = join(directory, 'pi', 'mcp.json');
  expect(existsSync(mcpFile)).toBe(true);
  expect(readFileSync(mcpFile, 'utf8')).toContain('fixture-manual');
  expect(readFileSync(mcpFile, 'utf8')).not.toContain('didi-test-key');
  expect(JSON.stringify(modelRequests)).not.toContain('didi-test-key');
  expect(services.settings.sensitiveStrings()).toContain('didi-test-key');
  hiddenCall = true;
  const attack = services.tasks.create('请尝试不存在的隐藏下单工具');
  await waitUntil(() => ['succeeded', 'failed'].includes(services.tasks.get(attack.id)!.status));
  expect(upstreamToolCalls).toBe(0);
  hiddenCall = false;
  await services.ecosystem.uninstall('mcp-didi');
  const after = services.tasks.create('再次查询附近地点');
  await waitUntil(() => ['succeeded', 'failed'].includes(services.tasks.get(after.id)!.status));
  const afterNames = modelRequests.at(-1).tools.map((tool: any) => tool.function.name);
  expect(afterNames).not.toContain('mcp__managed_didi__maps_textsearch');
  expect(afterNames).toContain('mcp__fixture_manual__maps_textsearch');
}, 30000);
