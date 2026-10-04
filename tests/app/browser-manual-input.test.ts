import { createServer, type Server } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createBrowserService, type BrowserServiceClient } from '../../src/server/browser/index.js';
import type { BrowserInput } from '../../src/shared/contracts.js';

describe('physical browser input and live agent tab selection', () => {
  let server: Server;
  let url: string;
  let dataDir: string;
  let browser: BrowserServiceClient;
  const signal = () => new AbortController().signal;
  beforeAll(async () => {
    server = createServer((_request, response) => {
      response.writeHead(200, { 'content-type': 'text/html' });
      response.end(`<!doctype html><title>Input fixture</title><style>body{margin:0}input{position:absolute;left:40px;top:40px;width:250px;height:40px}#second{top:100px}#drag{position:absolute;left:40px;top:200px;width:100px;height:80px;background:teal}</style><input id="first"><input id="second"><div id="drag"></div><script>window.events=[];for(const type of ['keydown','keyup','mousedown','mousemove','mouseup','dblclick'])document.addEventListener(type,e=>events.push({type,key:e.key,code:e.code,shift:e.shiftKey,ctrl:e.ctrlKey,buttons:e.buttons,x:e.clientX}));document.getElementById('first').onkeyup=e=>window.suggestion=e.target.value;document.getElementById('drag').onmousedown=()=>window.dragging=true;document.onmouseup=()=>window.dragging=false;</script>`);
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Input fixture did not bind');
    url = `http://127.0.0.1:${address.port}`;
    dataDir = await mkdtemp(join(tmpdir(), 'personal-agent-input-'));
    browser = createBrowserService({ dataDir, remoteUrl: null });
    await browser.execute(`await page.goto(${JSON.stringify(url)});`, { taskId: 'input-fixture', signal: signal() });
  });
  afterAll(async () => {
    await browser?.dispose();
    server?.closeAllConnections();
    await new Promise<void>(resolve => server?.close(() => resolve()));
    await rm(dataDir, { recursive: true, force: true });
  });
  async function human() {
    if ((await browser.status()).owner === 'user') await browser.release((await browser.status()).generation);
    await browser.execute(`await page.goto(${JSON.stringify(url)});`, { taskId: 'input-fixture', signal: signal() });
    return browser.takeover((await browser.status()).generation);
  }
  async function read(expression: string) {
    await browser.release((await browser.status()).generation);
    const result = await browser.execute(`console.log(JSON.stringify(await page.evaluate(() => (${expression}))));`, { taskId: 'input-fixture', signal: signal() });
    return JSON.parse(result.text.trim());
  }
  it('sends Space and Shift+Tab using their physical key codes', async () => {
    const state = await human();
    const input = (value: Omit<BrowserInput, 'generation'>) => browser.input({ ...value, generation: state.generation });
    await input({ type: 'click', x: 80, y: 65 });
    await input({ type: 'key', key: ' ', code: 'Space', text: ' ' } as Omit<BrowserInput, 'generation'>);
    await input({ type: 'key', key: 'Tab', code: 'Tab' } as Omit<BrowserInput, 'generation'>);
    await input({ type: 'key', key: 'Tab', code: 'Tab', modifiers: 8 } as Omit<BrowserInput, 'generation'>);
    const result = await read("{value:document.getElementById('first').value,focused:document.activeElement.id,events:window.events.filter(e=>e.type==='keydown')}");
    expect(result.value).toBe(' ');
    expect(result.focused).toBe('first');
    expect(result.events).toContainEqual(expect.objectContaining({ key: ' ', code: 'Space' }));
    expect(result.events).toContainEqual(expect.objectContaining({ key: 'Tab', code: 'Tab', shift: true }));
  });
  it('delivers a pressed pointer through a drag and releases it', async () => {
    const state = await human();
    for (const value of [
      { type: 'mouse_down', x: 80, y: 240, button: 'left', buttons: 1 },
      { type: 'move', x: 330, y: 240, buttons: 1 },
      { type: 'mouse_up', x: 330, y: 240, button: 'left', buttons: 0 },
    ]) await browser.input({ ...value, generation: state.generation } as BrowserInput);
    const result = await read('{dragging:window.dragging,events:window.events}');
    expect(result.dragging).toBe(false);
    expect(result.events).toContainEqual(expect.objectContaining({ type: 'mousemove', buttons: 1, x: 330 }));
    expect(result.events).toContainEqual(expect.objectContaining({ type: 'mouseup', buttons: 0 }));
  });
  it('moves a real widget using PointerEvent capture rather than only mousemove buttons', async () => {
    const state = await human();
    await browser.release(state.generation);
    await browser.execute(`await page.evaluate(() => {
      const widget = document.createElement('div');
      widget.id = 'captured-drag'; widget.textContent = 'Drag this widget';
      widget.style.cssText = 'position:absolute;left:40px;top:330px;width:120px;height:80px;background:orange;user-select:none;touch-action:none';
      document.body.append(widget);
      window.captureAudit = { starts:0,moves:0,ends:0,left:40 };
      widget.onpointerdown = event => { event.preventDefault(); widget.setPointerCapture(event.pointerId); window.captureAudit.starts++; };
      widget.onpointermove = event => {
        if (widget.hasPointerCapture(event.pointerId) && (event.buttons & 1)) {
          widget.style.left = (event.clientX - 40) + 'px';
          window.captureAudit.moves++; window.captureAudit.left = event.clientX - 40;
        }
      };
      widget.onpointerup = event => { window.captureAudit.ends++; widget.releasePointerCapture(event.pointerId); };
    });`, { taskId: 'input-fixture', signal: signal() });
    const taken = await browser.takeover((await browser.status()).generation);
    for (const value of [
      { type: 'mouse_down', x: 80, y: 360, button: 'left', buttons: 1 },
      { type: 'move', x: 330, y: 360, buttons: 1 },
      { type: 'mouse_up', x: 330, y: 360, button: 'left', buttons: 0 },
    ]) await browser.input({ ...value, generation: taken.generation } as BrowserInput);
    const result = await read('window.captureAudit');
    expect(result.starts).toBe(1);
    expect(result.moves).toBeGreaterThan(0);
    expect(result.ends).toBe(1);
    expect(result.left).toBe(290);
  });
  it('preserves exact Chinese text and triggers keyup autocomplete, without Ctrl shortcut characters', async () => {
    const state = await human();
    await browser.input({ type: 'click', x: 80, y: 65, generation: state.generation });
    await browser.input({ type: 'text', text: '中文联想🙂', generation: state.generation });
    const before = await read("{value:document.getElementById('first').value,suggestion:window.suggestion}");
    expect(before).toEqual({ value: '中文联想🙂', suggestion: '中文联想🙂' });
    const taken = await browser.takeover((await browser.status()).generation);
    await browser.input({ type: 'key', key: 'a', code: 'KeyA', text: 'a', modifiers: 2, generation: taken.generation });
    await browser.input({ type: 'key', key: 'T', code: 'KeyT', text: 'T', modifiers: 8, generation: taken.generation });
    const after = await read("{value:document.getElementById('first').value,suggestion:window.suggestion}");
    expect(after).toEqual({ value: 'T', suggestion: 'T' });
  });
  it('delivers a real double click', async () => {
    const state = await human();
    for (const count of [1, 2]) await browser.input({ type: 'click', x: 80, y: 240, clickCount: count, generation: state.generation } as BrowserInput);
    const result = await read('window.events');
    expect(result.some((event: { type: string }) => event.type === 'dblclick')).toBe(true);
  });
  it('clears a pressed pointer on ownership change', async () => {
    const state = await human();
    await browser.input({ type: 'mouse_down', x: 80, y: 240, button: 'left', buttons: 1, generation: state.generation } as BrowserInput);
    const result = await read('window.dragging');
    expect(result).toBe(false);
  });
  it('clears a pressed pointer on tab generation change and rejects its old release', async () => {
    const state = await human();
    await browser.input({ type: 'mouse_down', x: 80, y: 240, button: 'left', buttons: 1, generation: state.generation });
    await browser.newTab(url, state.generation);
    await expect(browser.input({ type: 'mouse_up', x: 330, y: 240, button: 'left', buttons: 0, generation: state.generation })).rejects.toMatchObject({ code: 'STALE_BROWSER_GENERATION' });
    await browser.release((await browser.status()).generation);
    const result = await browser.execute(`var priorDragPage = await tabs.get(${JSON.stringify(state.activeTabId)}); console.log(JSON.stringify(await priorDragPage.evaluate(() => window.dragging)));`, { taskId: 'input-fixture', signal: signal() });
    expect(JSON.parse(result.text.trim())).toBe(false);
  });
  it('clears a pressed pointer when its next gesture is invalid', async () => {
    const state = await human();
    await browser.input({ type: 'mouse_down', x: 80, y: 240, button: 'left', buttons: 1, generation: state.generation });
    await expect(browser.input({ type: 'move', x: 5000, y: 240, buttons: 1, generation: state.generation })).rejects.toMatchObject({ code: 'INVALID_BROWSER_INPUT' });
    expect(await read('window.dragging')).toBe(false);
  });
  it('follows an agent-selected tab while its cell is still running', async () => {
    if ((await browser.status()).owner === 'user') await browser.release((await browser.status()).generation);
    const controller = new AbortController();
    const oldId = (await browser.status()).activeTabId;
    const cell = browser.execute(`page = await tabs.open(${JSON.stringify(url)}); await new Promise(() => {});`, { taskId: 'input-fixture', signal: controller.signal, timeoutMs: 15_000 });
    const rejected = expect(cell).rejects.toThrow(/cancelled|reset/i);
    try {
      await expect.poll(async () => {
        const state = await browser.status();
        return state.taskId === 'input-fixture' && state.activeTabId !== oldId;
      }, { timeout: 4000 }).toBe(true);
    } finally { controller.abort(); await rejected; }
  });
  it('follows tabs.get without waiting for input or cell completion', async () => {
    if ((await browser.status()).owner === 'user') await browser.release((await browser.status()).generation);
    const state = await browser.status();
    const other = state.tabs.find(tab => tab.id !== state.activeTabId)!;
    expect(other).toBeDefined();
    const controller = new AbortController();
    const cell = browser.execute(`page = await tabs.get(${JSON.stringify(other.id)}); await new Promise(() => {});`, { taskId: 'input-fixture', signal: controller.signal, timeoutMs: 15_000 });
    const rejected = expect(cell).rejects.toThrow(/cancelled|reset/i);
    try { await expect.poll(async () => (await browser.status()).activeTabId, { timeout: 4000 }).toBe(other.id); }
    finally { controller.abort(); await rejected; }
  });
  it('does not jump back when a cell only gets a tab and finishes', async () => {
    const state = await browser.status();
    const other = state.tabs.find(tab => tab.id !== state.activeTabId)!;
    const cell = browser.execute(`var selectedHandle = await tabs.get(${JSON.stringify(other.id)}); await new Promise(resolve => setTimeout(resolve, 500)); console.log('finished');`, { taskId: 'input-fixture', signal: signal() });
    await expect.poll(async () => (await browser.status()).activeTabId, { timeout: 3000 }).toBe(other.id);
    expect((await cell).text).toBe('finished\n');
    expect((await browser.status()).activeTabId).toBe(other.id);
  });
  it('supports Command+A sent by a macOS client without inserting its letter', async () => {
    const state = await human();
    await browser.input({ type: 'click', x: 80, y: 65, generation: state.generation });
    await browser.input({ type: 'text', text: 'select this', generation: state.generation });
    await browser.input({ type: 'key', key: 'a', code: 'KeyA', text: 'a', modifiers: 4, generation: state.generation });
    await browser.input({ type: 'key', key: 'b', code: 'KeyB', text: 'b', generation: state.generation });
    expect(await read("document.getElementById('first').value")).toBe('b');
  });
});
