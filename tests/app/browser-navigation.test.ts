import { createServer, type Server } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createBrowserService, type BrowserServiceClient } from '../../src/server/browser/index.js';
import type { BrowserFrame } from '../../src/shared/contracts.js';
import { CDP } from '../../vendor/browser-use/src/cdp.js';
import { Page } from '../../vendor/browser-use/src/page.js';

const savedName = '\u4e2d\u6587\u5bfc\u822a\u9a8c\u6536';
const formTitle = 'Navigation form';
const savedTitle = 'Form saved';

describe('native form navigation metadata and live frames', () => {
  let server: Server;
  let redirectServer: Server;
  let baseUrl: string;
  let redirectUrl: string;
  let directory: string;
  let browser: BrowserServiceClient;
  let connection: CDP | undefined;
  let auditConnection: CDP;
  let saved = '';

  beforeAll(async () => {
    server = createServer((request, response) => {
      const url = new URL(request.url ?? '/', 'http://localhost');
      if (url.pathname === '/cross-origin-redirect') {
        response.writeHead(302, { location: `${redirectUrl}/destination` }).end();
        return;
      }
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      if (url.pathname === '/long') {
        response.end('<!doctype html><title>Long scrolling bands</title><style>html{overflow-y:scroll;scrollbar-gutter:stable}::-webkit-scrollbar{width:15px}body{margin:0;font:24px sans-serif;color:white}section{height:900px}.green{background:#265d43}.red{background:#a33c2f}.blue{background:#315baf}</style><section class="green">Top green band</section><section class="red">Middle red band</section><section class="blue">Bottom blue band</section>');
      } else if (url.pathname === '/guard') {
        response.end('<!doctype html><title>Leave guard</title><button id="arm" style="position:absolute;left:40px;top:80px;width:160px;height:50px">Arm leave guard</button><script>document.getElementById("arm").onclick=()=>{window.onbeforeunload=event=>{event.preventDefault();event.returnValue=""};document.getElementById("arm").textContent="Guard armed"}</script>');
      } else if (url.pathname === '/saved') {
        saved = url.searchParams.get('name') ?? '';
        response.end(`<!doctype html><meta charset="utf-8"><title>${savedTitle}</title><style>body{margin:0;background:#265d43;color:#fff;font:24px sans-serif}</style><h1>Saved</h1><p id="saved-name">${saved}</p>`);
      } else {
        response.end(`<!doctype html><meta charset="utf-8"><title>${formTitle}</title><style>body{margin:0;background:#fff;color:#222}input{position:absolute;left:40px;top:80px;width:300px;height:42px}button{position:absolute;left:40px;top:150px;width:100px;height:42px}</style><form action="/saved" method="get" onsubmit="return confirm('Confirm native navigation?')"><input name="name" aria-label="Name"><button>Save</button></form><h1>Native form</h1>`);
      }
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Fixture address unavailable');
    baseUrl = `http://127.0.0.1:${address.port}`;
    redirectServer = createServer((_request, response) => {
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      response.end('<!doctype html><title>Cross-origin destination</title><h1>Redirect arrived</h1>');
    });
    await new Promise<void>(resolve => redirectServer.listen(0, '127.0.0.1', resolve));
    const redirectAddress = redirectServer.address();
    if (!redirectAddress || typeof redirectAddress === 'string') throw new Error('Redirect fixture address unavailable');
    redirectUrl = `http://127.0.0.1:${redirectAddress.port}`;
  });

  beforeEach(async () => {
    saved = '';
    connection = undefined;
    let endpoint: string | undefined;
    directory = await mkdtemp(join(tmpdir(), 'personal-agent-navigation-'));
    const connect = CDP.connect;
    vi.spyOn(CDP, 'connect').mockImplementation(async (...args) => {
      const result = await connect(...args);
      connection ??= result;
      endpoint ??= args[0];
      return result;
    });
    browser = createBrowserService({ dataDir: directory, remoteUrl: null });
    await browser.start();
    auditConnection = await connect(endpoint!, 10_000);
  });

  afterEach(async () => {
    auditConnection?.close();
    await browser?.dispose();
    vi.restoreAllMocks();
    await rm(directory, { recursive: true, force: true });
  });

  afterAll(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    redirectServer.closeAllConnections();
    await new Promise<void>((resolve, reject) => redirectServer.close(error => error ? reject(error) : resolve()));
  });

  async function openForm(path = '') {
    const result = await browser.execute(`page = await tabs.open(${JSON.stringify(`${baseUrl}${path}`)}); console.log(JSON.stringify({ targetId: page.targetId }));`, {
      taskId: 'navigation-fixture', signal: new AbortController().signal,
    });
    const { targetId } = JSON.parse(result.text.trim()) as { targetId: string };
    await expect.poll(async () => (await browser.status()).activeTabId).toBe(targetId);
    const page = await Page.attach(auditConnection, targetId);
    return { targetId, page };
  }

  async function submitForm(targetId: string) {
    const human = await browser.takeover((await browser.status()).generation);
    await browser.input({ type: 'click', x: 80, y: 100, generation: human.generation, tabId: targetId });
    await browser.input({ type: 'text', text: savedName, generation: human.generation, tabId: targetId });
    const click = browser.input({ type: 'click', x: 80, y: 170, generation: human.generation, tabId: targetId });
    const finished = expect(click).resolves.toBeUndefined();
    await expect.poll(async () => (await browser.status()).dialog?.message).toBe('Confirm native navigation?');
    await browser.handleDialog({ accept: true, generation: human.generation });
    await finished;
    await expect.poll(() => saved).toBe(savedName);
  }

  async function samplePixel(page: Page, encoded: string) {
    return page.evaluate(async value => {
      const bitmap = await createImageBitmap(await (await fetch(value)).blob());
      try {
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width; canvas.height = bitmap.height;
        const context = canvas.getContext('2d')!;
        context.drawImage(bitmap, 0, 0);
        return [...context.getImageData(60, 400, 1, 1).data];
      } finally { bitmap.close(); }
    }, encoded);
  }

  it('recovers the committed URL and title when getTargets returns an empty URL and old title', async () => {
    const { targetId, page } = await openForm();
    const send = CDP.prototype.send;
    vi.spyOn(CDP.prototype, 'send').mockImplementation((async function (this: CDP, method, params, sessionId) {
      const result = await send.call(this, method, params, sessionId);
      if (method === 'Target.getTargets' && saved) {
        const targets = result as { targetInfos: { targetId: string; url: string; title: string }[] };
        return { ...targets, targetInfos: targets.targetInfos.map(target => target.targetId === targetId ? { ...target, url: '', title: formTitle } : target) };
      }
      return result;
    }) as CDP['send']);
    await submitForm(targetId);
    await expect.poll(async () => (await page.info()).title).toBe(savedTitle);
    const committedUrl = (await page.info()).url;
    expect(new URL(committedUrl).searchParams.get('name')).toBe(savedName);
    await expect.poll(async () => {
      const state = await browser.status();
      const tab = state.tabs.find(item => item.id === targetId);
      return { activeTabId: state.activeTabId, url: tab?.url, title: tab?.title };
    }, { timeout: 8000 }).toEqual({ activeTabId: targetId, url: committedUrl, title: savedTitle });
  });

  it('refreshes the live frame after native navigation even when screencast events stop', async () => {
    const { targetId, page } = await openForm();
    const frames: BrowserFrame[] = [];
    const frameTimes = new Map<BrowserFrame, number>();
    const frameSources = new Map<string, string>();
    const command = connection!.observeCommand;
    const response = connection!.observeResponse;
    const observe = connection!.observeEvent;
    const send = connection!.send;
    const captures: { startedAt: number; sessionId?: string; targetId?: string; resolvedAt?: number; error?: string }[] = [];
    vi.spyOn(connection!, 'send').mockImplementation((async function (this: CDP, method, params, sessionId) {
      if (method !== 'Page.captureScreenshot') return send.call(this, method, params, sessionId);
      const capture = { startedAt: Date.now(), sessionId, targetId: this.targetForSession(sessionId!) } as typeof captures[number];
      captures.push(capture);
      try {
        const result = await send.call(this, method, params, sessionId);
        capture.resolvedAt = Date.now();
        return result;
      } catch (error) {
        capture.error = String(error);
        throw error;
      }
    }) as CDP['send']);
    let streamSession: string | undefined;
    connection!.observeCommand = (method, params, sessionId) => {
      if (method === 'Page.startScreencast') streamSession = sessionId;
      command?.(method, params, sessionId);
    };
    connection!.observeResponse = (method, params, result, sessionId) => {
      if (method === 'Page.captureScreenshot') frameSources.set((result as { data: string }).data, 'screenshot');
      response?.(method, params, result, sessionId);
    };
    connection!.observeEvent = (method, params, sessionId) => {
      if (method === 'Page.screencastFrame') frameSources.set((params as { data: string }).data, 'screencast');
      observe?.(method, params, sessionId);
    };
    const unsubscribe = browser.subscribeFrames(frame => { frames.push(frame); frameTimes.set(frame, Date.now()); });
    const pixelCache = new Map<string, Promise<number[]>>();
    const sample = (encoded: string) => {
      let result = pixelCache.get(encoded);
      if (result) return result;
      result = samplePixel(page, encoded);
      pixelCache.set(encoded, result);
      return result;
    };
    let pixel: number[] | undefined;
    let phase = 'initial stream and capture';
    try {
      await expect.poll(() => frames.length, { timeout: 8000 }).toBeGreaterThan(0);
      await expect.poll(() => frames.some(frame => frameSources.get(frame.data) === 'screenshot'), { timeout: 8000 }).toBe(true);
      expect(streamSession).toBeTypeOf('string');
      // Stop the native stream without dropping its ACKs or blocking Chrome painting.
      phase = 'stop native stream';
      await connection!.send('Page.stopScreencast', undefined, streamSession);
      phase = 'submit native form';
      await submitForm(targetId);
      await expect.poll(async () => (await page.info()).title).toBe(savedTitle);
      phase = 'destination green screenshot frame';
      await expect.poll(async () => {
        const frame = frames.at(-1);
        if (!frame || frameSources.get(frame.data) !== 'screenshot') return false;
        pixel = await sample(`data:image/jpeg;base64,${frame.data}`);
        return pixel[1] > pixel[0] + 15 && pixel[1] < 140;
      }, { timeout: 8000 }).toBe(true);
      // Let navigation-triggered captures settle before checking the silent-stream watchdog.
      await new Promise(resolve => setTimeout(resolve, 2000));
      for (const color of ['#a33c2f', '#315baf']) {
        phase = `watchdog ${color} screenshot frame`;
        await page.evaluate(value => { document.body.style.backgroundColor = value; }, color);
        await expect.poll(async () => {
          const frame = frames.at(-1);
          if (!frame || frameSources.get(frame.data) !== 'screenshot') return false;
          pixel = await sample(`data:image/jpeg;base64,${frame.data}`);
          return color === '#a33c2f'
            ? pixel[0] > 140 && pixel[0] > pixel[1] + 30 && pixel[2] < 100
            : pixel[2] > 130 && pixel[2] > pixel[0] + 30;
        }, { timeout: 8000 }).toBe(true);
      }
    } catch (error) {
      const inspect = async <T>(operation: () => Promise<T>) => operation().catch(failure => ({ error: String(failure) }));
      const background = await inspect(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor));
      const state = await inspect(() => browser.status());
      const lastFrames = await Promise.all(frames.slice(-5).map(async frame => ({
        at: frameTimes.get(frame), source: frameSources.get(frame.data),
        dimensions: [frame.width, frame.height], generation: frame.generation,
        pixel: await inspect(() => sample(`data:image/jpeg;base64,${frame.data}`)),
      })));
      throw new Error(`Live frame verification failed: ${JSON.stringify({ phase, targetId, pixel, background, state, frames: frames.length, lastFrames, captures })}`, { cause: error });
    } finally {
      connection!.observeCommand = command;
      connection!.observeResponse = response;
      connection!.observeEvent = observe;
      unsubscribe();
    }
  });

  it('captures a new document independently and rejects a delayed old-document screenshot', async () => {
    const { targetId, page } = await openForm();
    const human = await browser.takeover((await browser.status()).generation);
    let releaseOld!: () => void;
    const oldGate = new Promise<void>(resolve => { releaseOld = resolve; });
    let oldData: string | undefined;
    let captureCount = 0;
    const send = connection!.send;
    vi.spyOn(connection!, 'send').mockImplementation((async function (this: CDP, method, params, sessionId) {
      const capture = method === 'Page.captureScreenshot' && this.targetForSession(sessionId!) === targetId;
      if (capture) captureCount++;
      const result = await send.call(this, method, params, sessionId);
      if (capture && captureCount === 1) {
        oldData = (result as { data: string }).data;
        await oldGate;
      }
      return result;
    }) as CDP['send']);
    const oldCapture = browser.screenshot().then(frame => ({ frame, error: undefined }), error => ({ frame: undefined, error }));
    try {
      await expect.poll(() => Boolean(oldData), { timeout: 8000 }).toBe(true);
      expect(await samplePixel(page, `data:image/jpeg;base64,${oldData}`)).toEqual([255, 255, 255, 255]);
      const navigated = await browser.navigate(`${baseUrl}/saved?name=independent-document`, human.generation);
      expect(navigated.activeTabId).toBe(targetId);
      expect(navigated.generation).toBeGreaterThan(human.generation);
      const freshCapture = await browser.screenshot();
      const pixel = await samplePixel(page, `data:image/jpeg;base64,${freshCapture.data}`);
      expect(pixel[1]).toBeGreaterThan(pixel[0] + 15);
      expect(pixel[1]).toBeLessThan(140);
      expect(captureCount).toBe(2);
      expect(freshCapture.generation).toBe(navigated.generation);
      releaseOld();
      const oldResult = await oldCapture;
      expect(oldResult.error).toMatchObject({ code: 'STALE_BROWSER_SCREENSHOT' });
      expect(oldResult.frame).toBeUndefined();
    } finally {
      releaseOld();
      await oldCapture;
    }
  });

  it('commits a real redirect across two origins without waiting for the requested URL', async () => {
    const { targetId } = await openForm();
    const human = await browser.takeover((await browser.status()).generation);
    const requested = `${baseUrl}/cross-origin-redirect`;
    const finalUrl = `${redirectUrl}/destination`;
    expect(new URL(requested).origin).not.toBe(new URL(finalUrl).origin);
    const started = Date.now();
    const navigated = await browser.navigate(requested, human.generation);
    expect(Date.now() - started).toBeLessThan(5000);
    expect(navigated.generation).toBeGreaterThan(human.generation);
    expect(navigated.tabs.find(tab => tab.id === targetId)?.url).toBe(finalUrl);
    await expect(browser.input({ type: 'text', text: 'stale', tabId: targetId, generation: human.generation }))
      .rejects.toMatchObject({ code: 'STALE_BROWSER_GENERATION' });
  });

  it('treats an explicit beforeunload rejection as cancelled navigation and keeps human control', async () => {
    const { targetId, page } = await openForm('/guard');
    const human = await browser.takeover((await browser.status()).generation);
    await browser.input({ type: 'click', x: 100, y: 105, tabId: targetId, generation: human.generation });
    await expect.poll(() => page.evaluate(() => document.getElementById('arm')?.textContent)).toBe('Guard armed');
    const destination = `${baseUrl}/saved?name=after-cancel`;
    const first = browser.navigate(destination, human.generation);
    const cancelled = expect(first).rejects.toMatchObject({
      code: 'BROWSER_NAVIGATION_CANCELLED', statusCode: 409, message: '已取消离开当前网页。',
    });
    await expect.poll(async () => (await browser.status()).dialog?.type).toBe('beforeunload');
    await browser.handleDialog({ accept: false, generation: human.generation });
    await cancelled;
    const stayed = await browser.status();
    expect(stayed).toMatchObject({ status: 'ready', owner: 'user', activeTabId: targetId, generation: human.generation });
    expect(stayed.tabs.find(tab => tab.id === targetId)?.url).toBe(`${baseUrl}/guard`);
    expect((await page.info()).url).toBe(`${baseUrl}/guard`);

    const second = browser.navigate(destination, stayed.generation);
    const succeeded = expect(second).resolves.toMatchObject({ status: 'ready', owner: 'user', activeTabId: targetId });
    await expect.poll(async () => (await browser.status()).dialog?.type).toBe('beforeunload');
    await browser.handleDialog({ accept: true, generation: stayed.generation });
    await succeeded;
    expect((await browser.status()).tabs.find(tab => tab.id === targetId)?.url).toBe(destination);
  }, 30000);

  it('keeps unrelated abort errors unchanged and rolls back a failed dialog decision', async () => {
    const { targetId, page } = await openForm('/guard');
    const human = await browser.takeover((await browser.status()).generation);
    const unrelated = new Error('Navigation failed: net::ERR_ABORTED');
    const goto = vi.spyOn(Page.prototype, 'goto').mockRejectedValueOnce(unrelated);
    try {
      await expect(browser.navigate(`${baseUrl}/saved`, human.generation)).rejects.toBe(unrelated);
    } finally { goto.mockRestore(); }
    await browser.input({ type: 'click', x: 100, y: 105, tabId: targetId, generation: human.generation });
    await expect.poll(() => page.evaluate(() => document.getElementById('arm')?.textContent)).toBe('Guard armed');

    const navigation = browser.navigate(`${baseUrl}/saved?name=failed-dialog`, human.generation);
    const originalAbort = expect(navigation).rejects.toThrow(/^Navigation failed: net::ERR_ABORTED/);
    await expect.poll(async () => (await browser.status()).dialog?.type).toBe('beforeunload');
    const send = connection!.send;
    const failedSend = vi.spyOn(connection!, 'send').mockImplementation((async function (this: CDP, method, params, sessionId) {
      if (method === 'Page.handleJavaScriptDialog') throw new Error('Injected dialog transport failure');
      return send.call(this, method, params, sessionId);
    }) as CDP['send']);
    try {
      await expect(browser.handleDialog({ accept: false, generation: human.generation }))
        .rejects.toThrow('Injected dialog transport failure');
    } finally { failedSend.mockRestore(); }
    await page.cdp('Page.handleJavaScriptDialog', { accept: false });
    await originalAbort;
    const state = await browser.status();
    expect(state).toMatchObject({ status: 'ready', owner: 'user', generation: human.generation });
    expect(state.tabs.find(tab => tab.id === targetId)?.url).toBe(`${baseUrl}/guard`);
  }, 30000);

  it('keeps stopped-stream screenshots at the fixed viewport and current scroll position', async () => {
    const { targetId, page } = await openForm('/long');
    const human = await browser.takeover((await browser.status()).generation);
    const viewport = await page.evaluate(() => ({ innerWidth, visualWidth: visualViewport!.width, clientWidth: document.documentElement.clientWidth }));
    expect(viewport.innerWidth).toBe(1440);
    expect(viewport.visualWidth).toBeLessThan(1440);
    const frames: BrowserFrame[] = [];
    const captures = new Set<string>();
    const response = connection!.observeResponse;
    const command = connection!.observeCommand;
    let streamSession: string | undefined;
    connection!.observeCommand = (method, params, sessionId) => {
      if (method === 'Page.startScreencast') streamSession = sessionId;
      command?.(method, params, sessionId);
    };
    connection!.observeResponse = (method, params, result, sessionId) => {
      if (method === 'Page.captureScreenshot') captures.add((result as { data: string }).data);
      response?.(method, params, result, sessionId);
    };
    const unsubscribe = browser.subscribeFrames(frame => frames.push(frame));
    try {
      await expect.poll(() => Boolean(streamSession), { timeout: 8000 }).toBe(true);
      await expect.poll(() => frames.some(frame => captures.has(frame.data)), { timeout: 8000 }).toBe(true);
      await connection!.send('Page.stopScreencast', undefined, streamSession);
      await browser.input({ type: 'scroll', x: 60, y: 400, deltaY: 930, generation: human.generation, tabId: targetId });
      await expect.poll(() => page.evaluate(() => scrollY), { timeout: 8000 }).toBe(930);
      let evidence: { viewport: typeof viewport; scrollY: number; width: number; height: number; pixel: number[] } | undefined;
      await expect.poll(async () => {
        const fresh = frames.findLast(frame => frame.generation === human.generation && captures.has(frame.data));
        if (!fresh) return false;
        const pixel = await samplePixel(page, `data:image/jpeg;base64,${fresh.data}`);
        evidence = { viewport, scrollY: await page.evaluate(() => scrollY), width: fresh.width, height: fresh.height, pixel };
        return fresh.width === 1440 && fresh.height === 900
          && pixel[0] > 140 && pixel[0] > pixel[1] + 30 && pixel[2] < 100;
      }, { timeout: 8000 }).toBe(true).catch(error => { throw new Error(`Fixed scroll viewport failed: ${JSON.stringify(evidence)}`, { cause: error }); });
      if (process.env.AGENT_BROWSER_FRAME_EVIDENCE === '1') console.info(JSON.stringify({ kind: 'fixed-scroll-viewport', ...evidence }));
    } finally {
      connection!.observeResponse = response;
      connection!.observeCommand = command;
      unsubscribe();
    }
  });

  it('reattaches a live Chromium after CDP closes without replacing its tab', async () => {
    const { targetId, page } = await openForm();
    const human = await browser.takeover((await browser.status()).generation);
    const before = await page.info();
    connection!.close();
    const lost = await browser.status();
    expect(lost).toMatchObject({ status: 'error', owner: 'none' });
    expect(lost.generation).toBeGreaterThan(human.generation);
    await expect(browser.input({ type: 'text', text: 'must not type', generation: human.generation }))
      .rejects.toMatchObject({ code: 'STALE_BROWSER_GENERATION' });
    const recovered = await browser.start();
    expect(recovered).toMatchObject({ status: 'ready', owner: 'agent' });
    expect(recovered.generation).toBeGreaterThan(lost.generation);
    expect(recovered.activeTabId).toBe(targetId);
    expect(recovered.tabs.some(tab => tab.id === targetId)).toBe(true);
    expect((await page.info()).url).toBe(before.url);
    const taken = await browser.takeover(recovered.generation);
    expect(taken).toMatchObject({ owner: 'user', activeTabId: targetId });
    expect(taken.generation).toBeGreaterThan(recovered.generation);
  }, 30000);

  it('aborts the old worker before reconnecting and does not replay its unfinished cell', async () => {
    const { targetId, page } = await openForm();
    const run = browser.execute('await new Promise(() => {}); await page.evaluate(() => { window.__replayed = true })', {
      taskId: 'reconnect-active-fixture', signal: new AbortController().signal, timeoutMs: 30_000,
    });
    const rejected = expect(run).rejects.toThrow();
    await expect.poll(async () => (await browser.status()).taskId).toBe('reconnect-active-fixture');
    connection!.close();
    expect((await browser.status()).status).toBe('error');
    const recovered = await browser.start();
    await rejected;
    expect(recovered).toMatchObject({ status: 'ready', owner: 'agent', activeTabId: targetId });
    expect(recovered.taskId).toBeUndefined();
    expect(await page.evaluate(() => Reflect.get(window, '__replayed'))).toBeUndefined();
    const fresh = await browser.execute('console.log(await page.info())', {
      taskId: 'reconnect-fresh-fixture', signal: new AbortController().signal,
    });
    expect(fresh.text).toContain(baseUrl);
  }, 30000);

  it('rejects queued input when a real navigation changes the document during tab refresh', async () => {
    const { targetId, page } = await openForm();
    const human = await browser.takeover((await browser.status()).generation);
    let releaseRefresh!: () => void;
    const refreshGate = new Promise<void>(resolve => { releaseRefresh = resolve; });
    const send = connection!.send;
    let refreshHeld = false;
    let inputCommands = 0;
    vi.spyOn(connection!, 'send').mockImplementation((async function (this: CDP, method, params, sessionId) {
      if (method === 'Input.insertText') inputCommands++;
      const result = await send.call(this, method, params, sessionId);
      if (method === 'Target.getTargets' && !refreshHeld) {
        refreshHeld = true;
        await refreshGate;
      }
      return result;
    }) as CDP['send']);
    const queuedInput = browser.input({ type: 'text', text: 'stale text', tabId: targetId, generation: human.generation });
    try {
      await expect.poll(() => refreshHeld, { timeout: 8000 }).toBe(true);
      await page.goto(`${baseUrl}/saved?name=navigation-race`);
      await expect.poll(async () => (await browser.status()).generation, { timeout: 8000 })
        .toBeGreaterThan(human.generation);
      releaseRefresh();
      await expect(queuedInput).rejects.toMatchObject({ code: 'STALE_BROWSER_GENERATION' });
      expect(inputCommands).toBe(0);
    } finally {
      releaseRefresh();
      await queuedInput.catch(() => {});
    }
  }, 30000);
});
