import { createServer, type Server } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createBrowserService, type BrowserServiceClient } from '../../src/server/browser/index.js';
import type { BrowserFrame } from '../../src/shared/contracts.js';
import { CDP } from '../../vendor/browser-use/src/cdp.js';
import { Page } from '../../vendor/browser-use/src/page.js';

function gate() {
  let open!: () => void;
  const promise = new Promise<void>(resolve => { open = resolve; });
  return { promise, open };
}

describe('browser frames preserve their original control generation', () => {
  let server: Server;
  let baseUrl: string;
  let directory: string;
  let browser: BrowserServiceClient;
  let connection: CDP | undefined;

  beforeAll(async () => {
    server = createServer((request, response) => {
      const old = request.url === '/old';
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      response.end(`<!doctype html><title>${old ? 'Old green tab' : 'New red tab'}</title><style>body{margin:0;background:${old ? '#265d43' : '#a33c2f'};color:#fff;font:24px sans-serif}</style><h1>${old ? 'Old page' : 'New page'}</h1>`);
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Fixture address unavailable');
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  beforeEach(async () => {
    connection = undefined;
    directory = await mkdtemp(join(tmpdir(), 'personal-agent-frame-generation-'));
    const connect = CDP.connect;
    vi.spyOn(CDP, 'connect').mockImplementation(async (...args) => {
      const result = await connect(...args);
      connection ??= result;
      return result;
    });
    browser = createBrowserService({ dataDir: directory, remoteUrl: null });
    await browser.start();
  });

  afterEach(async () => {
    await browser?.dispose();
    vi.restoreAllMocks();
    await rm(directory, { recursive: true, force: true });
  });

  afterAll(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  });

  async function openTabs() {
    const result = await browser.execute(`page = await tabs.open(${JSON.stringify(`${baseUrl}/old`)}); var otherGenerationPage = await tabs.open(${JSON.stringify(`${baseUrl}/new`)}); console.log(JSON.stringify({ oldId: page.targetId, newId: otherGenerationPage.targetId }));`, {
      taskId: 'frame-generation-fixture', signal: new AbortController().signal,
    });
    const ids = JSON.parse(result.text.trim()) as { oldId: string; newId: string };
    const human = await browser.takeover((await browser.status()).generation);
    const old = await browser.selectTab(ids.oldId, human.generation);
    const audit = await Page.attach(connection!, ids.oldId);
    return { ...ids, old, audit };
  }

  async function sample(page: Page, data: string) {
    return page.evaluate(async value => {
      const bitmap = await createImageBitmap(await (await fetch(value)).blob());
      try {
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width; canvas.height = bitmap.height;
        const context = canvas.getContext('2d')!;
        context.drawImage(bitmap, 0, 0);
        return [...context.getImageData(60, 400, 1, 1).data];
      } finally { bitmap.close(); }
    }, `data:image/jpeg;base64,${data}`);
  }

  it('does not give a pending old-tab screenshot the newly selected tab generation', async () => {
    const { old, oldId, newId, audit } = await openTabs();
    const releaseOld = gate();
    const releaseNew = gate();
    const send = connection!.send;
    let capturedData: string | undefined;
    let newCapturedData: string | undefined;
    let holdOld = true;
    let newCaptures = 0;
    vi.spyOn(connection!, 'send').mockImplementation((async function (this: CDP, method, params, sessionId) {
      const target = method === 'Page.captureScreenshot' ? this.targetForSession(sessionId!) : undefined;
      if (target === newId) newCaptures++;
      const result = await send.call(this, method, params, sessionId);
      if (target === oldId && holdOld) {
        holdOld = false;
        capturedData = (result as { data: string }).data;
        await releaseOld.promise;
      } else if (target === newId && newCaptures === 2) {
        newCapturedData = (result as { data: string }).data;
        await releaseNew.promise;
      }
      return result;
    }) as CDP['send']);
    const pending = browser.screenshot().then(frame => ({ frame, error: undefined }), error => ({ frame: undefined, error }));
    let pendingNew: Promise<BrowserFrame> | undefined;
    try {
      await expect.poll(() => Boolean(capturedData), { timeout: 8000 }).toBe(true);
      expect(capturedData).toBeTypeOf('string');
      const pixel = await sample(audit, capturedData!);
      expect(pixel[1]).toBeGreaterThan(pixel[0] + 15);
      const selected = await browser.selectTab(newId, old.generation);
      expect(selected.generation).toBeGreaterThan(old.generation);
      expect(selected.activeTabId).toBe(newId);
      const firstNew = await browser.screenshot();
      expect(firstNew.generation).toBe(selected.generation);
      const newPixel = await sample(audit, firstNew.data);
      expect(newPixel[0]).toBeGreaterThan(140);
      expect(newPixel[0]).toBeGreaterThan(newPixel[1] + 30);
      expect(newPixel[2]).toBeLessThan(100);
      expect(newCaptures).toBe(1);

      // An old completion must not clear a newer capture still in flight.
      pendingNew = browser.screenshot();
      await expect.poll(() => Boolean(newCapturedData), { timeout: 8000 }).toBe(true);
      releaseOld.open();
      const result = await pending;
      if (result.error) {
        expect(result.error).toMatchObject({ code: 'STALE_BROWSER_GENERATION' });
      } else {
        expect(result.frame!.data).toBe(capturedData);
        expect(result.frame!.generation).toBe(old.generation);
        expect(result.frame!.generation).not.toBe(selected.generation);
      }
      const sharedNew = browser.screenshot();
      releaseNew.open();
      const [secondNew, sameNew] = await Promise.all([pendingNew, sharedNew]);
      expect(newCaptures).toBe(2);
      expect(secondNew.data).toBe(newCapturedData);
      expect(sameNew.data).toBe(newCapturedData);
      expect(secondNew.generation).toBe(selected.generation);
      expect(sameNew.generation).toBe(selected.generation);
    } finally {
      releaseOld.open();
      releaseNew.open();
      await pending;
      await pendingNew?.catch(() => {});
    }
  });

  it('still delivers real native frames after the current document screenshot establishes authority', async () => {
    const { old, oldId, audit } = await openTabs();
    const native = new Set<string>();
    const frames: BrowserFrame[] = [];
    const observe = connection!.observeEvent;
    connection!.observeEvent = (method, params, sessionId) => {
      if (method === 'Page.screencastFrame' && sessionId && connection!.targetForSession(sessionId) === oldId)
        native.add((params as { data: string }).data);
      observe?.(method, params, sessionId);
    };
    const unsubscribe = browser.subscribeFrames(frame => frames.push(frame));
    try {
      await expect.poll(() => frames.some(frame => frame.generation === old.generation), { timeout: 8000 }).toBe(true);
      let paint = 0;
      await expect.poll(async () => {
        await audit.evaluate(value => { document.body.textContent = `Native paint ${value}`; }, ++paint);
        return frames.some(frame => frame.generation === old.generation && native.has(frame.data));
      }, { timeout: 8000 }).toBe(true);
    } finally {
      connection!.observeEvent = observe;
      unsubscribe();
    }
  });

  it('does not relabel an old-session native frame while the tab stream is switching', async () => {
    const { old, oldId, newId, audit } = await openTabs();
    const releaseStop = gate();
    const frames: BrowserFrame[] = [];
    const observe = connection!.observeEvent;
    const send = connection!.send;
    let held: { method: string; params: { data: string }; sessionId: string } | undefined;
    let stopPending = false;
    let streamStarted = false;
    let delivered = false;
    connection!.observeEvent = (method, params, sessionId) => {
      if (!held && method === 'Page.screencastFrame' && sessionId && connection!.targetForSession(sessionId) === oldId) {
        held = { method, params: params as { data: string }, sessionId };
        return;
      }
      observe?.(method, params, sessionId);
    };
    vi.spyOn(connection!, 'send').mockImplementation((async function (this: CDP, method, params, sessionId) {
      const result = await send.call(this, method, params, sessionId);
      if (method === 'Page.stopScreencast' && held && sessionId === held.sessionId) {
        stopPending = true;
        await releaseStop.promise;
      }
      if (method === 'Page.startScreencast' && this.targetForSession(sessionId!) === oldId) streamStarted = true;
      return result;
    }) as CDP['send']);
    const unsubscribe = browser.subscribeFrames(frame => frames.push(frame));
    try {
      await expect.poll(() => streamStarted, { timeout: 8000 }).toBe(true);
      let paint = 0;
      await expect.poll(async () => {
        if (!held) await audit.evaluate(value => { document.body.textContent = `Old page paint ${value}`; document.body.style.backgroundColor = value % 2 ? '#31734f' : '#265d43'; }, ++paint);
        return Boolean(held);
      }, { timeout: 8000 }).toBe(true);
      const selected = await browser.selectTab(newId, old.generation);
      await expect.poll(() => stopPending).toBe(true);
      expect(selected.activeTabId).toBe(newId);
      await expect.poll(async () => {
        const fresh = frames.findLast(frame => frame.generation === selected.generation);
        if (!fresh) return false;
        const pixel = await sample(audit, fresh.data);
        return pixel[0] > 140 && pixel[0] > pixel[1] + 30 && pixel[2] < 100;
      }, { timeout: 3000 }).toBe(true);
      const before = frames.length;
      // Deliver the in-flight event once; its normal handler sends its ACK.
      observe?.(held!.method, held!.params, held!.sessionId);
      delivered = true;
      expect(frames.slice(before).some(frame => frame.data === held!.params.data && frame.generation === selected.generation)).toBe(false);
    } finally {
      if (held && !delivered) observe?.(held.method, held.params, held.sessionId);
      releaseStop.open();
      connection!.observeEvent = observe;
      unsubscribe();
    }
  });

  it('ACKs but never relabels a delayed old-document native frame after same-tab navigation', async () => {
    const { old, oldId, audit } = await openTabs();
    const frames: BrowserFrame[] = [];
    const observe = connection!.observeEvent;
    const send = connection!.send;
    let held: { method: string; params: { data: string; sessionId: number; metadata: { timestamp?: number } }; sessionId: string } | undefined;
    let acknowledged = false;
    connection!.observeEvent = (method, params, sessionId) => {
      if (!held && method === 'Page.screencastFrame' && sessionId && connection!.targetForSession(sessionId) === oldId) {
        held = { method, params: params as { data: string; sessionId: number; metadata: { timestamp?: number } }, sessionId };
        return;
      }
      observe?.(method, params, sessionId);
    };
    vi.spyOn(connection!, 'send').mockImplementation((async function (this: CDP, method, params, sessionId) {
      if (method === 'Page.screencastFrameAck' && held && sessionId === held.sessionId &&
          (params as { sessionId: number }).sessionId === held.params.sessionId) acknowledged = true;
      return send.call(this, method, params, sessionId);
    }) as CDP['send']);
    const unsubscribe = browser.subscribeFrames(frame => frames.push(frame));
    try {
      let paint = 0;
      await expect.poll(async () => {
        if (!held) await audit.evaluate(value => { document.body.textContent = `Old paint ${value}`; }, ++paint);
        return Boolean(held);
      }, { timeout: 8000 }).toBe(true);
      const navigated = await browser.navigate(`${baseUrl}/new`, old.generation);
      expect(navigated.activeTabId).toBe(oldId);
      expect(navigated.generation).toBeGreaterThan(old.generation);
      await expect.poll(async () => {
        const frame = frames.findLast(value => value.generation === navigated.generation);
        if (!frame) return false;
        const pixel = await sample(audit, frame.data);
        return pixel[0] > 140 && pixel[0] > pixel[1] + 30;
      }, { timeout: 8000 }).toBe(true);
      const before = frames.length;
      observe?.(held!.method, held!.params, held!.sessionId);
      await expect.poll(() => acknowledged).toBe(true);
      expect(frames.slice(before).some(frame => frame.generation === navigated.generation && frame.data === held!.params.data)).toBe(false);
      await expect(browser.input({ type: 'text', text: 'stale', generation: old.generation, tabId: oldId }))
        .rejects.toMatchObject({ code: 'STALE_BROWSER_GENERATION' });
    } finally {
      if (held && !acknowledged) observe?.(held.method, held.params, held.sessionId);
      connection!.observeEvent = observe;
      unsubscribe();
    }
  });

  it('delivers a real new-tab screenshot while its native stream startup is delayed', async () => {
    const { old, oldId, newId, audit } = await openTabs();
    const releaseStart = gate();
    const frames: BrowserFrame[] = [];
    const captures = new Set<string>();
    const send = connection!.send;
    let oldStreamStarted = false;
    let newStartPending = false;
    let evidence: { oldGeneration: number; generation: number; width: number; height: number; pixel: number[] } | undefined;
    vi.spyOn(connection!, 'send').mockImplementation((async function (this: CDP, method, params, sessionId) {
      const target = this.targetForSession(sessionId!);
      if (method === 'Page.startScreencast' && target === newId) {
        newStartPending = true;
        // No new native frames exist until this request is actually sent.
        await releaseStart.promise;
      }
      const result = await send.call(this, method, params, sessionId);
      if (method === 'Page.startScreencast' && target === oldId) oldStreamStarted = true;
      if (method === 'Page.captureScreenshot' && target === newId) captures.add((result as { data: string }).data);
      return result;
    }) as CDP['send']);
    const unsubscribe = browser.subscribeFrames(frame => frames.push(frame));
    try {
      await expect.poll(() => oldStreamStarted, { timeout: 8000 }).toBe(true);
      const selected = await browser.selectTab(newId, old.generation);
      await expect.poll(() => newStartPending).toBe(true);
      await expect.poll(async () => {
        const fresh = frames.findLast(frame => frame.generation === selected.generation && captures.has(frame.data));
        if (!fresh) return false;
        const pixel = await sample(audit, fresh.data);
        evidence = { oldGeneration: old.generation, generation: fresh.generation, width: fresh.width, height: fresh.height, pixel };
        return fresh.width === 1440 && fresh.height === 900
          && pixel[0] > 140 && pixel[0] > pixel[1] + 30 && pixel[2] < 100;
      }, { timeout: 3000 }).toBe(true);
      if (process.env.AGENT_BROWSER_FRAME_EVIDENCE === '1') console.info(JSON.stringify({ kind: 'delayed-native-start', startStillGated: newStartPending, ...evidence }));
    } finally {
      releaseStart.open();
      unsubscribe();
    }
  });
});
