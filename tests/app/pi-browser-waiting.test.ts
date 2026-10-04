import { afterEach, expect, it, vi } from 'vitest';
import { createServer, type ServerResponse, type Server } from 'node:http';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { createApp } from '../../src/server/app.js';
import { BrowserServiceError } from '../../src/server/browser/errors.js';
import type { AppConfig } from '../../src/server/config.js';
import type { BrowserState } from '../../src/shared/contracts.js';

let server: Server | undefined;
let directory: string | undefined;
let closeApp: (() => Promise<void>) | undefined;
afterEach(async () => {
  await closeApp?.(); closeApp = undefined;
  if (server) { server.closeAllConnections(); await new Promise<void>(resolve => server!.close(() => resolve())); server = undefined; }
  if (directory) { rmSync(directory, { recursive: true, force: true }); directory = undefined; }
  vi.restoreAllMocks();
});

const wait = async (predicate: () => boolean) => {
  const deadline = Date.now() + 15000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error('Pi browser handoff timeout');
    await new Promise(resolve => setTimeout(resolve, 10));
  }
};
const reply = (response: ServerResponse, content: string | { tool: string; args: unknown }, id: string) => {
  response.writeHead(200, { 'Content-Type': 'text/event-stream' });
  const chunk = (delta: unknown, finish_reason: string | null = null) => response.write(`data: ${JSON.stringify({ id, object: 'chat.completion.chunk', created: Math.floor(Date.now() / 1000), model: 'test-model', choices: [{ index: 0, delta, finish_reason }] })}\n\n`);
  chunk({ role: 'assistant' });
  if (typeof content === 'string') { chunk({ content }); chunk({}, 'stop'); }
  else { chunk({ tool_calls: [{ index: 0, id, type: 'function', function: { name: content.tool, arguments: JSON.stringify(content.args) } }] }); chunk({}, 'tool_calls'); }
  response.end('data: [DONE]\n\n');
};
async function fixture(respond: (payload: any, response: ServerResponse, count: number) => void) {
  const requests: any[] = [];
  server = createServer(async (request, response) => {
    let raw = ''; for await (const chunk of request) raw += chunk;
    const payload = JSON.parse(raw); requests.push(payload); respond(payload, response, requests.length);
  });
  await new Promise<void>(resolve => server!.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as { port: number };
  directory = mkdtempSync(join(tmpdir(), 'pa-pi-browser-wait-'));
  const config: AppConfig = { host: '127.0.0.1', port: 3420, dataDir: directory, password: 'test-only', encryptionKey: randomBytes(32), cookieSecure: false, publicOrigin: 'http://127.0.0.1:3420' };
  const services = await createApp(config, { background: false }); closeApp = () => services.app.close();
  services.models.update({ provider: 'custom', model: 'test-model', apiKey: 'browser-handoff-test-key', baseUrl: `http://127.0.0.1:${port}/v1`, images: true });
  return { ...services, requests };
}
const state = (owner: BrowserState['owner'], generation = 1): BrowserState => ({ status: 'ready', owner, generation, tabs: [{ id: 'fixture-tab', title: 'Fixture', url: 'https://example.com/' }], activeTabId: 'fixture-tab', viewport: { width: 1440, height: 900 } });
const humanControlError = () => new BrowserServiceError('BROWSER_NOT_OWNED', 'The browser is under user control. Release it before running the task.');

it.each([
  { tool: 'browser_observe', args: {} },
  { tool: 'browser_navigate', args: { url: 'https://example.com/' } },
  { tool: 'browser_execute', args: { code: 'await bu.state()' } },
])('waits instead of completing $tool under human control, then resumes the same Pi session with approval intact', async ({ tool, args }) => {
  const services = await fixture((_payload, response, count) => {
    if (count === 1 || count === 3) reply(response, { tool, args }, `browser-call-${count}`);
    else reply(response, count === 2 ? '已经处理好了。请先交回浏览器。' : '已核对页面并完成查询。', `browser-reply-${count}`);
  });
  let owner: BrowserState['owner'] = 'user';
  const completed: string[] = []; services.tasks.onCompleted = task => completed.push(task.status);
  vi.spyOn(services.browser, 'status').mockImplementation(async () => state(owner, owner === 'user' ? 1 : 2));
  const release = vi.spyOn(services.browser, 'release').mockImplementation(async generation => {
    expect(generation).toBe(1); owner = 'agent'; return state(owner, 2);
  });
  const observe = vi.spyOn(services.browser, 'observe').mockImplementation(async () => { if (owner === 'user') throw humanControlError(); return 'Current page: Fixture'; });
  const execute = vi.spyOn(services.browser, 'execute').mockImplementation(async () => { if (owner === 'user') throw humanControlError(); return { text: 'Current page: Fixture', images: [] }; });
  const originalPrompt = `Complete the ${tool} handoff audit.`;
  const task = services.tasks.create(originalPrompt);
  await wait(() => ['waiting_user', 'failed', 'succeeded'].includes(services.tasks.get(task.id)!.status));
  const initial = services.tasks.detail(task.id);
  expect(initial.task.status).toBe('waiting_user'); expect(initial.task.waitingReason).toBe('browser_control');
  expect(initial.task.error).toBeUndefined(); expect(initial.task.finishedAt).toBeUndefined(); expect(initial.task.result).toBeUndefined();
  expect(initial.messages.at(-1)).toMatchObject({ role: 'system', status: 'complete' });
  expect(initial.messages.at(-1)!.text).toContain('交回浏览器并继续任务');
  expect(initial.operations).toHaveLength(1); expect(initial.operations[0].status).toBe('failed');
  expect(services.approvals.list(task.id)).toEqual([]); expect(release).not.toHaveBeenCalled(); expect(completed).toEqual([]);
  expect(owner).toBe('user'); expect(services.requests).toHaveLength(2);
  if (tool === 'browser_execute') expect(execute).not.toHaveBeenCalled();
  const sessionFile = initial.task.sessionFile!;
  expect(sessionFile).toBeTruthy();

  await services.browser.release((await services.browser.status()).generation);
  await services.tasks.control(task.id, 'resume', initial.task.version);
  if (tool === 'browser_execute') {
    await wait(() => services.tasks.get(task.id)!.status === 'waiting_approval');
    expect(execute).not.toHaveBeenCalled();
    const approval = services.approvals.list(task.id).find(item => item.status === 'pending')!;
    expect(approval.parameters).toEqual(args);
    services.approvals.decide(approval.id, 'approve', approval.parametersHash, approval.version);
  }
  await wait(() => ['failed', 'succeeded'].includes(services.tasks.get(task.id)!.status));
  const resumed = services.tasks.detail(task.id);
  expect(resumed.task.status).toBe('succeeded'); expect(resumed.task.error).toBeUndefined(); expect(resumed.task.waitingReason).toBeUndefined();
  expect(resumed.task.sessionFile).toBe(sessionFile); expect(resumed.task.runCount).toBe(2);
  expect(resumed.operations.map(operation => operation.status)).toEqual(['failed', 'succeeded']);
  expect(completed).toEqual(['succeeded']); expect(release).toHaveBeenCalledTimes(1);
  expect(tool === 'browser_observe' ? observe.mock.calls.length : execute.mock.calls.length).toBe(tool === 'browser_execute' ? 1 : 2);
  const userEntries = readFileSync(sessionFile, 'utf8').trim().split('\n').map(line => JSON.parse(line)).filter(entry => entry.type === 'message' && entry.message.role === 'user');
  expect(userEntries.filter(entry => JSON.stringify(entry.message.content).includes(originalPrompt))).toHaveLength(1);
  expect(JSON.stringify(services.requests.at(-1).messages)).toContain('先核对已有结果与外部操作状态');
}, 30000);

it('keeps waiting after a successful read-only screenshot, without taking browser ownership', async () => {
  const services = await fixture((_payload, response, count) => {
    if (count === 1) reply(response, { tool: 'browser_observe', args: {} }, 'observe-denied');
    else if (count === 2) reply(response, { tool: 'browser_screenshot', args: {} }, 'screenshot-read-only');
    else reply(response, '截图可见，但仍需用户交回控制权。', 'read-only-final');
  });
  vi.spyOn(services.browser, 'observe').mockRejectedValue(humanControlError());
  vi.spyOn(services.browser, 'start').mockResolvedValue(state('user'));
  vi.spyOn(services.browser, 'screenshot').mockResolvedValue({ type: 'frame', data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7V0AAAAASUVORK5CYII=', mimeType: 'image/png', width: 1, height: 1, generation: 1 });
  const release = vi.spyOn(services.browser, 'release');
  const task = services.tasks.create('Observe the user-controlled page, optionally inspect its screenshot.');
  await wait(() => ['waiting_user', 'failed', 'succeeded'].includes(services.tasks.get(task.id)!.status));
  expect(services.tasks.get(task.id)).toMatchObject({ status: 'waiting_user', waitingReason: 'browser_control' });
  expect(services.tasks.detail(task.id).operations.map(operation => operation.status)).toEqual(['failed', 'succeeded']);
  expect(release).not.toHaveBeenCalled(); expect(services.requests).toHaveLength(3);
});

it('clears the waiting marker when a later observation succeeds after an explicit handback', async () => {
  const services = await fixture((_payload, response, count) => {
    if (count <= 2) reply(response, { tool: 'browser_observe', args: {} }, `observe-${count}`);
    else reply(response, '已在交回控制权后核对页面。', 'observe-final');
  });
  vi.spyOn(services.browser, 'observe').mockRejectedValueOnce(humanControlError()).mockResolvedValue('Fresh page state after explicit handback.');
  const task = services.tasks.create('Observe the page after the user returns control.');
  await wait(() => ['waiting_user', 'failed', 'succeeded'].includes(services.tasks.get(task.id)!.status));
  expect(services.tasks.get(task.id)).toMatchObject({ status: 'succeeded' });
  expect(services.tasks.get(task.id)!.waitingReason).toBeUndefined();
  expect(services.tasks.detail(task.id).operations.map(operation => operation.status)).toEqual(['failed', 'succeeded']);
});

it('does not replace a real provider failure with browser-control waiting', async () => {
  const services = await fixture((_payload, response, count) => {
    if (count === 1) reply(response, { tool: 'browser_observe', args: {} }, 'observe-denied');
    else { response.writeHead(401, { 'Content-Type': 'application/json' }); response.end(JSON.stringify({ error: { message: 'Synthetic provider failure', type: 'invalid_request_error' } })); }
  });
  vi.spyOn(services.browser, 'observe').mockRejectedValue(humanControlError());
  const task = services.tasks.create('Attempt a browser observation before a provider failure.');
  await wait(() => ['waiting_user', 'failed', 'succeeded'].includes(services.tasks.get(task.id)!.status));
  expect(services.tasks.get(task.id)).toMatchObject({ status: 'failed' });
  expect(services.tasks.get(task.id)!.waitingReason).toBeUndefined(); expect(services.tasks.get(task.id)!.error).toContain('Synthetic provider failure');
});

it('replaces an old ownership wait with a later real browser failure even when the model normally explains it', async () => {
  const services = await fixture((_payload, response, count) => {
    if (count <= 2) reply(response, { tool: 'browser_observe', args: {} }, `observe-${count}`);
    else reply(response, '控制权已交回，但浏览器执行服务不可用，无法继续查询。', 'executor-failure-final');
  });
  vi.spyOn(services.browser, 'observe').mockRejectedValueOnce(humanControlError())
    .mockRejectedValueOnce(new BrowserServiceError('BROWSER_EXECUTOR_UNAVAILABLE', 'Synthetic browser executor unavailable', 503));
  const completed: string[] = []; services.tasks.onCompleted = task => completed.push(task.status);
  const task = services.tasks.create('Observe again after control returns, and report any real browser service failure.');
  await wait(() => ['waiting_user', 'failed', 'succeeded'].includes(services.tasks.get(task.id)!.status));
  const detail = services.tasks.detail(task.id);
  expect(detail.task.status).toBe('failed'); expect(detail.task.waitingReason).toBeUndefined();
  expect(detail.task.error).toContain('Synthetic browser executor unavailable'); expect(detail.task.finishedAt).toBeTruthy();
  expect(detail.operations.map(operation => operation.status)).toEqual(['failed', 'failed']);
  expect(detail.messages.some(message => message.role === 'system')).toBe(false);
  expect(detail.messages.at(-1)!.text).toContain('执行服务不可用'); expect(detail.messages.at(-1)!.status).toBe('complete');
  expect(completed).toEqual(['failed']); expect(services.requests).toHaveLength(3);
});

it('clears a later executor failure only after a controlled browser tool recovers successfully', async () => {
  const services = await fixture((_payload, response, count) => {
    if (count <= 3) reply(response, { tool: 'browser_observe', args: {} }, `observe-${count}`);
    else reply(response, '浏览器服务已恢复，页面已核对。', 'executor-recovered-final');
  });
  vi.spyOn(services.browser, 'observe').mockRejectedValueOnce(humanControlError())
    .mockRejectedValueOnce(new BrowserServiceError('BROWSER_EXECUTOR_UNAVAILABLE', 'Synthetic browser executor unavailable', 503))
    .mockResolvedValueOnce('Fresh state after browser service recovery.');
  const task = services.tasks.create('Inspect the page after control and browser service recover.');
  await wait(() => ['waiting_user', 'failed', 'succeeded'].includes(services.tasks.get(task.id)!.status));
  expect(services.tasks.get(task.id)).toMatchObject({ status: 'succeeded' });
  expect(services.tasks.get(task.id)!.waitingReason).toBeUndefined(); expect(services.tasks.get(task.id)!.error).toBeUndefined();
  expect(services.tasks.detail(task.id).operations.map(operation => operation.status)).toEqual(['failed', 'failed', 'succeeded']);
});

it.each(['pause', 'cancel'] as const)('keeps user %s authoritative when the model is still explaining a browser wait', async action => {
  const services = await fixture((_payload, response, count) => {
    if (count === 1) reply(response, { tool: 'browser_observe', args: {} }, 'observe-denied');
    // Hold the second model response so pause/cancel races the pending waiting outcome.
    else { response.writeHead(200, { 'Content-Type': 'text/event-stream' }); response.write(': held\n\n'); }
  });
  vi.spyOn(services.browser, 'observe').mockRejectedValue(humanControlError());
  const task = services.tasks.create('Observe the page while the user keeps control.');
  await wait(() => services.requests.length === 2);
  await services.tasks.control(task.id, action);
  expect(services.tasks.get(task.id)).toMatchObject({ status: action === 'pause' ? 'paused' : 'cancelled' });
  expect(services.tasks.get(task.id)!.waitingReason).toBe(action === 'pause' ? 'user_pause' : undefined);
  expect(services.tasks.detail(task.id).messages.some(message => message.role === 'system')).toBe(false);
});
