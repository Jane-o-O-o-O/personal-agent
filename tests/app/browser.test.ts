import { createServer, type Server } from 'node:http';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createBrowserService, type BrowserServiceClient } from '../../src/server/browser/index.js';
import type { BrowserFrame } from '../../src/shared/contracts.js';
import { browserProfileLocks } from '../../vendor/browser-use/src/browser.js';

const fixture = `<!doctype html><html><head><meta charset="utf-8"><title>Browser fixture</title>
<style>body{background:#fff;color:#171717;font:18px sans-serif;margin:32px}input,button{font:inherit;padding:10px;margin:8px}h1{border-bottom:8px solid #16b8ae}output{display:block;padding:16px;background:#edf8f1}#name{display:block;width:280px}</style></head>
<body><h1>Native browser fixture</h1><form id="form"><input id="name" aria-label="Name"><input id="code" aria-label="Code"><button type="submit">Submit</button></form>
<button id="remember">Remember login</button><output id="result">Ready</output><iframe title="Fixture frame" src="/frame"></iframe>
<script>let trusted=false;document.getElementById('form').onsubmit=e=>{e.preventDefault();trusted=e.isTrusted;document.getElementById('result').textContent='Submitted: '+document.getElementById('name').value+' / '+document.getElementById('code').value};document.getElementById('remember').onclick=()=>localStorage.setItem('login-fixture','persistent');</script>
</body></html>`;

describe('real native browser', () => {
  let server: Server;
  let baseUrl: string;
  let dataDir: string;
  let browser: BrowserServiceClient;
  let takeovers = 0;

  beforeAll(async () => {
    dataDir = await mkdtemp(join(tmpdir(), 'personal-agent-browser-'));
    server = createServer((request, response) => {
      if (request.url === '/download') {
        response.writeHead(200, { 'content-type': 'text/plain', 'content-disposition': 'attachment; filename="browser-result.txt"' });
        response.end('Verified browser download');
        return;
      }
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      response.end(request.url === '/frame' ? '<!doctype html><h2>Frame contents</h2><input aria-label="Frame field">' : fixture);
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Fixture did not bind');
    baseUrl = `http://127.0.0.1:${address.port}`;
    browser = createBrowserService({ dataDir, remoteUrl: null, beforeTakeover: async () => { takeovers++; } });
    expect((await browser.status()).status).toBe('stopped');
    expect((await browser.start()).status).toBe('ready');
  });

  afterAll(async () => {
    await browser?.dispose();
    await new Promise<void>((resolve, reject) => server?.close((error) => error ? reject(error) : resolve()));
    await rm(dataDir, { recursive: true, force: true });
  });

  it('uses AX nodes, batches real Chinese input and keeps JavaScript state', async () => {
    const name = '\u4e2d\u6587\u6d4b\u8bd5';
    const result = await browser.execute(`
      await page.goto(${JSON.stringify(baseUrl)});
      var formState = await page.snapshot();
      await bu.type(formState.nodes.find(n => n.role === 'textbox' && n.name === 'Name').id, ${JSON.stringify(name)});
      await bu.type(formState.nodes.find(n => n.role === 'textbox' && n.name === 'Code').id, '314');
      await bu.click(formState.nodes.find(n => n.role === 'button' && n.name === 'Submit').id);
      var retainedValue = 42;
      console.log(await page.evaluate(() => ({ result: document.getElementById('result').textContent, trusted })));
    `, { taskId: 'browser-fixture', signal: new AbortController().signal });
    expect(result.text).toContain(name);
    expect(result.text).toContain('314');
    expect(result.text).toContain('trusted: true');
    const retained = await browser.execute('console.log(retainedValue)', { taskId: 'browser-fixture', signal: new AbortController().signal });
    expect(retained.text).toContain('42');
    const observed = await browser.observe({ taskId: 'browser-fixture' });
    expect(observed).toContain('Native browser fixture');
    expect(observed).toContain('Submitted:');
  });

  it('returns a nonempty viewport and streams changed frames independently of the model', async () => {
    const screenshot = await browser.screenshot();
    expect(screenshot.width).toBe(1440);
    expect(screenshot.height).toBe(900);
    expect(Buffer.from(screenshot.data, 'base64').length).toBeGreaterThan(5000);
    const pixels = await browser.execute(`console.log(await page.evaluate(async url => {
      const bitmap = await createImageBitmap(await (await fetch(url)).blob());
      const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d'); ctx.drawImage(bitmap, 0, 0);
      const values = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const colors = new Set(); for (let i = 0; i < values.length; i += 64) colors.add(values[i] + ',' + values[i+1] + ',' + values[i+2]);
      return {nonBlank: colors.size > 20};
    }, ${JSON.stringify(`data:image/jpeg;base64,${screenshot.data}`)}))`, { taskId: 'browser-fixture', signal: new AbortController().signal });
    expect(pixels.text).toContain('nonBlank: true');
    const frames: BrowserFrame[] = [];
    const unsubscribe = browser.subscribeFrames((frame) => frames.push(frame));
    try {
      await expect.poll(() => frames.length, { timeout: 8000 }).toBeGreaterThan(0);
      await browser.execute("await page.evaluate(() => {document.body.style.background = '#13b8b0';document.getElementById('result').textContent='Changed frame'});", { taskId: 'browser-fixture', signal: new AbortController().signal });
      await expect.poll(() => frames.some((frame) => frame.data !== screenshot.data), { timeout: 8000 }).toBe(true);
      expect((await browser.screenshot()).data).not.toBe(screenshot.data);
    } finally { unsubscribe(); }
  });

  it('operates inside same-origin frames and rejects detached nodes until observed again', async () => {
    const frame = await browser.execute(`
      var frameTree = (await page.cdp('Page.getFrameTree')).frameTree;
      var frameAx = (await page.cdp('Accessibility.getFullAXTree', {frameId: frameTree.childFrames[0].frame.id})).nodes;
      var frameField = frameAx.find(n => n.role?.value === 'textbox' && n.name?.value === 'Frame field');
      await bu.type(frameField.backendDOMNodeId, 'iframe input');
      console.log(await page.evaluate(() => document.querySelector('iframe').contentDocument.querySelector('input').value));
      var staleField = (await page.snapshot()).nodes.find(n => n.role === 'textbox' && n.name === 'Code');
      await page.evaluate(() => {var field = document.getElementById('code');field.replaceWith(field.cloneNode(true));});
    `, { taskId: 'browser-fixture', signal: new AbortController().signal });
    expect(frame.text).toContain('iframe input');
    await expect(browser.execute("await bu.type(staleField.id, 'should not act')", { taskId: 'browser-fixture', signal: new AbortController().signal })).rejects.toThrow(/detached|node|available/i);
    const fresh = await browser.execute("var freshField = (await page.snapshot()).nodes.find(n => n.role === 'textbox' && n.name === 'Code');await bu.type(freshField.id, 'fresh node');console.log(await page.evaluate(() => document.getElementById('code').value))", { taskId: 'browser-fixture', signal: new AbortController().signal });
    expect(fresh.text).toContain('fresh node');
  });

  it('saves actual downloaded files in the current task workspace', async () => {
    await browser.execute(`await page.evaluate(url => {const link=document.createElement('a');link.href=url;document.body.append(link);link.click();link.remove();}, ${JSON.stringify(`${baseUrl}/download`)})`, { taskId: 'browser-fixture', signal: new AbortController().signal });
    await expect.poll(async () => {
      try { return await readFile(join(dataDir, 'workspaces', 'browser-fixture', 'browser-result.txt'), 'utf8'); }
      catch { return ''; }
    }, { timeout: 5000 }).toBe('Verified browser download');
  });

  it('cancels an active worker, resets JavaScript state and recovers the same page', async () => {
    const controller = new AbortController();
    const run = browser.execute('await new Promise(() => {})', { taskId: 'browser-fixture', signal: controller.signal });
    const rejected = expect(run).rejects.toThrow(/cancelled|reset/i);
    await expect.poll(async () => (await browser.status()).taskId, { timeout: 5000 }).toBe('browser-fixture');
    controller.abort();
    await rejected;
    const reset = await browser.execute('console.log(typeof retainedValue); console.log(await page.info())', { taskId: 'browser-fixture', signal: new AbortController().signal });
    expect(reset.text).toContain('undefined');
    expect(reset.text).toContain(baseUrl);
  });

  it('enforces a cell deadline without the upstream observation grace period', async () => {
    const startedAt = performance.now();
    await expect(browser.execute('await new Promise(() => {})', {
      taskId: 'browser-fixture', signal: new AbortController().signal, timeoutMs: 100,
    })).rejects.toThrow(/exceeded|reset/i);
    expect(performance.now() - startedAt).toBeLessThan(2000);
    expect((await browser.observe({ taskId: 'browser-fixture' }))).toContain('Native browser fixture');
  });

  it('takes ownership only after stopping automation and rejects stale input', async () => {
    const run = browser.execute('await new Promise(() => {})', { taskId: 'browser-fixture', signal: new AbortController().signal });
    const rejected = expect(run).rejects.toThrow(/cancelled|reset/i);
    await expect.poll(async () => (await browser.status()).taskId).toBe('browser-fixture');
    const before = await browser.status();
    const human = await browser.takeover(before.generation);
    await rejected;
    expect(human.owner).toBe('user');
    expect(takeovers).toBe(1);
    await expect(browser.input({ type: 'text', text: 'stale', generation: before.generation })).rejects.toThrow(/control changed/i);
    await expect(browser.execute('console.log(1)', { taskId: 'browser-fixture', signal: new AbortController().signal })).rejects.toThrow(/user control/i);
    const navigated = await browser.navigate(baseUrl, human.generation);
    await browser.input({ type: 'click', x: 100, y: 140, generation: navigated.generation });
    await browser.input({ type: 'text', text: '\u4eba\u5de5\u8f93\u5165', generation: navigated.generation });
    const released = await browser.release(navigated.generation);
    expect(released.owner).toBe('agent');
    const value = await browser.execute("console.log(await page.evaluate(() => document.getElementById('name').value))", { taskId: 'browser-fixture', signal: new AbortController().signal });
    expect(value.text).toContain('\u4eba\u5de5\u8f93\u5165');
  });

  it('leaves confirm dialogs pending until the user explicitly decides', async () => {
    const run = browser.execute("console.log(await page.evaluate(() => confirm('Explicit user decision')))", { taskId: 'browser-fixture', signal: new AbortController().signal, timeoutMs: 15000 });
    await expect.poll(async () => (await browser.status()).dialog?.message, { timeout: 5000 }).toBe('Explicit user decision');
    const pending = await browser.status();
    await browser.handleDialog({ accept: false, generation: pending.generation });
    expect((await run).text).toContain('false');
    expect((await browser.status()).dialog).toBeUndefined();
  });

  it('keeps the login profile across a clean restart and never inherits host secrets', async () => {
    const marker = 'must-not-enter-browser-worker';
    process.env.PERSONAL_AGENT_TEST_SECRET = marker;
    try {
      const result = await browser.execute("await page.evaluate(() => {localStorage.setItem('login-fixture','persistent');document.cookie='login-cookie=persistent; Max-Age=86400; Path=/';});console.log(process.env.PERSONAL_AGENT_TEST_SECRET)", { taskId: 'browser-fixture', signal: new AbortController().signal });
      expect(result.text).toContain('undefined');
      expect(result.text).not.toContain(marker);
    } finally { delete process.env.PERSONAL_AGENT_TEST_SECRET; }
    await browser.dispose();
    const profile = join(dataDir, 'browser', 'profile');
    expect(await browserProfileLocks(profile)).toEqual({});
    await expect(readFile(join(profile, '.bu-pi.lock'), 'utf8')).rejects.toMatchObject({ code: 'ENOENT' });
    expect(JSON.parse(await readFile(join(profile, 'Default', 'Preferences'), 'utf8')).profile.exit_type).toBe('Normal');
    browser = createBrowserService({ dataDir, remoteUrl: null });
    await browser.start();
    const result = await browser.execute(`await page.goto(${JSON.stringify(baseUrl)});console.log(await page.evaluate(() => ({storage:localStorage.getItem('login-fixture'),cookie:document.cookie})));`, { taskId: 'restarted-fixture', signal: new AbortController().signal });
    expect(result.text).toContain('persistent');
    expect(result.text).toContain('login-cookie=persistent');
  });
});
