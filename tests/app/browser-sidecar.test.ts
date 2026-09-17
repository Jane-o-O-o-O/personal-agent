import { createServer, type Server } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createBrowserService, type BrowserServiceClient } from '../../src/server/browser/index.js';
import { createBrowserSidecar } from '../../src/server/browser/sidecar.js';
import type { BrowserFrame, BrowserState } from '../../src/shared/contracts.js';

describe('private browser sidecar', () => {
  let sidecar: Awaited<ReturnType<typeof createBrowserSidecar>>;
  let fixture: Server;
  let browser: BrowserServiceClient;
  let directory: string;
  let baseUrl: string;
  let fixtureUrl: string;
  let paused = false;
  const token = 'browser-test-token-12345678901234567890';
  const states: BrowserState[] = [];

  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), 'personal-agent-sidecar-'));
    sidecar = await createBrowserSidecar({ dataDir: join(directory, 'isolated'), workspaceDir: join(directory, 'shared-workspaces'), token });
    baseUrl = await sidecar.listen({ host: '127.0.0.1', port: 0 });
    fixture = createServer((_request, response) => {
      response.writeHead(200, { 'content-type': 'text/html' });
      response.end('<!doctype html><title>Remote browser fixture</title><h1>Remote browser fixture</h1><input aria-label="Remote field"><p>Observable real page</p><button id="confirm" onclick="document.getElementById(\'answer\').textContent=confirm(\'Native confirmation\')?\'Accepted\':\'Dismissed\'">Confirm</button><output id="answer"></output>');
    });
    await new Promise<void>((resolve) => fixture.listen(0, '127.0.0.1', resolve));
    const address = fixture.address();
    if (!address || typeof address === 'string') throw new Error('Fixture did not bind');
    fixtureUrl = `http://127.0.0.1:${address.port}`;
    browser = createBrowserService({ dataDir: join(directory, 'app'), remoteUrl: baseUrl, remoteToken: token,
      onChange: (state) => states.push(state), beforeTakeover: async () => { paused = true; } });
  });

  afterAll(async () => {
    await browser?.dispose();
    await sidecar?.close();
    await new Promise<void>((resolve, reject) => fixture?.close((error) => error ? reject(error) : resolve()));
    await rm(directory, { recursive: true, force: true });
  });

  it('authenticates private HTTP and executes only browser code through the proxy', async () => {
    const denied = await fetch(`${baseUrl}/internal/status`);
    expect(denied.status).toBe(401);
    expect((await browser.start()).status).toBe('ready');
    const result = await browser.execute(`await page.goto(${JSON.stringify(fixtureUrl)});console.log(await page.info());console.log(workspace)`, {
      taskId: 'remote-fixture', signal: new AbortController().signal,
    });
    expect(result.text).toContain('Remote browser fixture');
    expect(result.text).toContain(join(directory, 'shared-workspaces', 'remote-fixture'));
    expect((await browser.observe({ taskId: 'remote-fixture' }))).toContain('Observable real page');
  });

  it('forwards native frames and ownership changes through the authenticated websocket', async () => {
    const frames: BrowserFrame[] = [];
    const unsubscribe = browser.subscribeFrames((frame) => frames.push(frame));
    try {
      await expect.poll(() => frames.length, { timeout: 8000 }).toBeGreaterThan(0);
      expect(frames[0].width).toBe(1440);
      expect(frames[0].height).toBe(900);
      const human = await browser.takeover((await browser.status()).generation);
      expect(paused).toBe(true);
      expect(human.owner).toBe('user');
      await expect.poll(() => states.some((state) => state.owner === 'user')).toBe(true);
      await browser.release(human.generation);
    } finally { unsubscribe(); }
  });

  it('propagates HTTP cancellation to the sidecar worker and recovers without replaying', async () => {
    const controller = new AbortController();
    const run = browser.execute('await new Promise(() => {})', { taskId: 'remote-fixture', signal: controller.signal });
    const rejected = expect(run).rejects.toThrow(/cancelled/i);
    await expect.poll(async () => (await browser.status()).taskId).toBe('remote-fixture');
    controller.abort();
    await rejected;
    await expect.poll(async () => (await browser.status()).taskId, { timeout: 8000 }).toBeUndefined();
    const result = await browser.execute('console.log(await page.info())', { taskId: 'remote-fixture', signal: new AbortController().signal });
    expect(result.text).toContain(fixtureUrl);
  });

  it('resolves a native click dialog through HTTP while the click request is pending', async () => {
    const coordinates = await browser.execute("console.log(JSON.stringify(await page.evaluate(() => {const r=document.getElementById('confirm').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})))", {
      taskId: 'remote-fixture', signal: new AbortController().signal,
    });
    const point = JSON.parse(coordinates.text.trim()) as { x: number; y: number };
    const human = await browser.takeover((await browser.status()).generation);
    const click = browser.input({ generation: human.generation, type: 'click', ...point });
    const finished = expect(click).resolves.toBeUndefined();
    await expect.poll(async () => (await browser.status()).dialog?.message).toBe('Native confirmation');
    await expect(browser.handleDialog({ generation: human.generation - 1, accept: true })).rejects.toThrow(/control changed/i);
    const startedAt = performance.now();
    await browser.handleDialog({ generation: human.generation, accept: true });
    await finished;
    expect(performance.now() - startedAt).toBeLessThan(2000);
    await browser.release(human.generation);
    const result = await browser.execute("console.log(await page.evaluate(() => document.getElementById('answer').textContent))", {
      taskId: 'remote-fixture', signal: new AbortController().signal,
    });
    expect(result.text).toContain('Accepted');
  });

  it('allows explicit tab switching only after takeover and invalidates stale generations', async () => {
    await browser.execute(`var remoteTab = await tabs.open(${JSON.stringify(`${fixtureUrl}/second`)});console.log(await remoteTab.info())`, {
      taskId: 'remote-fixture', signal: new AbortController().signal,
    });
    const before = await browser.status();
    expect(before.tabs.length).toBeGreaterThan(1);
    await expect(browser.selectTab(before.tabs[0].id, before.generation)).rejects.toThrow(/Take over/i);
    const human = await browser.takeover(before.generation);
    const target = human.tabs.find((tab) => tab.id !== human.activeTabId)!;
    const selected = await browser.selectTab(target.id, human.generation);
    expect(selected.activeTabId).toBe(target.id);
    await expect(browser.input({ generation: human.generation, type: 'text', text: 'stale' })).rejects.toThrow(/control changed/i);
    await browser.release(selected.generation);
  });

  it('navigates history, reloads and manages tabs under the current human generation', async () => {
    const human = await browser.takeover((await browser.status()).generation);
    const firstUrl = `${fixtureUrl}/history-one`;
    const secondUrl = `${fixtureUrl}/history-two`;
    let current = await browser.navigate(firstUrl, human.generation);
    current = await browser.navigate(secondUrl, current.generation);
    await expect.poll(async () => (await browser.status()).tabs.find(tab => tab.id === human.activeTabId)?.url).toBe(secondUrl);
    current = await browser.history('back', current.generation);
    await expect.poll(async () => (await browser.status()).tabs.find(tab => tab.id === human.activeTabId)?.url).toBe(firstUrl);
    current = await browser.history('forward', current.generation);
    await expect.poll(async () => (await browser.status()).tabs.find(tab => tab.id === human.activeTabId)?.url).toBe(secondUrl);
    const reloaded = await browser.reload(current.generation);
    expect(reloaded.owner).toBe('user');
    expect(reloaded.generation).toBeGreaterThan(current.generation);

    const opened = await browser.newTab(`${fixtureUrl}/new`, reloaded.generation);
    expect(opened.activeTabId).toBeTruthy();
    expect(opened.activeTabId).not.toBe(human.activeTabId);
    expect(opened.generation).toBeGreaterThan(human.generation);
    await expect(browser.closeTab(opened.activeTabId!, human.generation)).rejects.toMatchObject({ code: 'STALE_BROWSER_GENERATION' });
    const closed = await browser.closeTab(opened.activeTabId!, opened.generation);
    expect(closed.tabs.some(tab => tab.id === opened.activeTabId)).toBe(false);
    await browser.release(closed.generation);
  });

  it('accepts the current stopped-state generation for a cold start takeover without pausing stale requests', async () => {
    const frames: BrowserFrame[] = [];
    const unsubscribe = browser.subscribeFrames(frame => frames.push(frame));
    try {
    await expect.poll(() => frames.length, { timeout: 8000 }).toBeGreaterThan(0);
    const beforeStop = frames.length;
    const stop = await fetch(`${baseUrl}/internal/stop`, {
      method: 'POST', headers: { authorization: `Bearer ${token}` },
    });
    expect(stop.ok).toBe(true);
    const stopped = await browser.status();
    expect(stopped).toMatchObject({ status: 'stopped', owner: 'none' });

    paused = false;
    await expect(browser.takeover(stopped.generation - 1)).rejects.toMatchObject({ code: 'STALE_BROWSER_GENERATION' });
    expect(paused).toBe(false);
    expect((await browser.status()).status).toBe('stopped');

    const human = await browser.takeover(stopped.generation);
    expect(human).toMatchObject({ status: 'ready', owner: 'user' });
    expect(human.generation).toBeGreaterThan(stopped.generation);
    expect(human.tabs.length).toBeGreaterThan(0);
    expect(paused).toBe(true);
    await expect.poll(() => frames.slice(beforeStop).some(frame => frame.generation === human.generation), { timeout: 8000 }).toBe(true);
    const repeated = await browser.takeover(human.generation);
    expect(repeated.generation).toBe(human.generation);
    const released = await browser.release(human.generation);
    expect(released.owner).toBe('agent');
    const repeatedRelease = await browser.release(released.generation);
    expect(repeatedRelease.generation).toBe(released.generation);
    } finally { unsubscribe(); }
  }, 30000);
});
