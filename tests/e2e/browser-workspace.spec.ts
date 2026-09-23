import { test, expect, type Page, type WebSocketRoute } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { BrowserState } from '../../src/shared/contracts';

const baseUrl = process.env.AGENT_E2E_URL ?? 'http://127.0.0.1:3420';
const password = process.env.AGENT_E2E_PASSWORD ?? readFileSync(resolve(process.env.AGENT_E2E_PASSWORD_FILE ?? 'data/admin-password'), 'utf8').trim();
test.use({ trace: 'off', launchOptions: { channel: process.env.AGENT_E2E_BROWSER_CHANNEL ?? (process.platform === 'darwin' ? 'chrome' : undefined) } });

// Browser protocol fixtures isolate race and failure cases that cannot be reproduced reliably by a website.
// The separate workbench test still exercises actual Chromium, input coordinates and native dialogs.
async function protocolFixture(page: Page, initial: Partial<BrowserState> = {}) {
  let state: BrowserState = { status: 'stopped', owner: 'none', generation: 100, revision: 0, tabs: [], viewport: { width: 1440, height: 900 }, ...initial };
  const sockets = new Set<WebSocketRoute>();
  const requests: { path: string; body: Record<string, unknown> }[] = [];
  let sequence = 0;
  let pauseFrames = false;
  let failTakeoverOnce = false;
  let pendingInput: (() => Promise<void>) | undefined;
  let pendingNavigation: ((accept: boolean) => Promise<void>) | undefined;
  let holdInput = false;
  let holdNavigation = false;
  let failNavigationOnce = false;
  let statusReads = 0;
  let statusRelease: (() => void) | undefined;
  let holdStatus = false;
  const pixels = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="900"><rect width="1440" height="900" fill="#eef4ef"/><text x="80" y="120" font-size="40" fill="#315e44">Browser protocol fixture</text></svg>');
  const frame = (generation = state.generation) => {
    if (pauseFrames) return;
    for (const socket of sockets) socket.send(JSON.stringify({ type: 'frame', data: pixels, mimeType: 'image/svg+xml', width: 1440, height: 900, generation, sequence: ++sequence }));
  };
  const notify = () => { for (const socket of sockets) socket.send(JSON.stringify({ type: 'state', state })); frame(); };
  await page.routeWebSocket('**/api/browser/stream?ack=1', socket => {
    sockets.add(socket); socket.onClose(() => sockets.delete(socket));
    socket.send(JSON.stringify({ type: 'state', state })); frame();
  });
  await page.route('**/api/bootstrap', async route => {
    const response = await route.fetch();
    const bootstrap = await response.json();
    await route.fulfill({ response, json: { ...bootstrap, browser: state } });
  });
  await page.route('**/api/browser', async route => {
    statusReads++;
    if (holdStatus) await new Promise<void>(resolve => { statusRelease = resolve; });
    await route.fulfill({ json: state });
  });
  await page.route('**/api/browser/**', async route => {
    const path = new URL(route.request().url()).pathname.slice('/api/browser/'.length);
    const body = route.request().postDataJSON() as Record<string, unknown>;
    requests.push({ path, body });
    if (path === 'takeover' && failTakeoverOnce) {
      failTakeoverOnce = false;
      state = { ...state, generation: state.generation + 1, revision: (state.revision ?? 0) + 1 };
      notify();
      await route.fulfill({ status: 409, json: { error: { code: 'STALE_BROWSER_GENERATION', message: 'Version changed' } } });
      return;
    }
    if (path === 'input' && holdInput) {
      state = { ...state, dialog: { type: 'confirm', message: '原生确认，输入请求等待回答' }, revision: (state.revision ?? 0) + 1 };
      notify();
      await new Promise<void>(resolve => { pendingInput = async () => { await route.fulfill({ json: { ok: true } }); resolve(); }; });
      return;
    }
    if (path === 'dialog') {
      delete state.dialog; state.revision = (state.revision ?? 0) + 1;
      await pendingInput?.(); pendingInput = undefined; holdInput = false;
      await pendingNavigation?.(body.accept === true); pendingNavigation = undefined; holdNavigation = false;
      notify(); await route.fulfill({ json: { ok: true } }); return;
    }
    if (path === 'navigate' && holdNavigation) {
      state = { ...state, dialog: { type: 'beforeunload', message: '离开页面前请确认，导航请求等待回答' }, revision: (state.revision ?? 0) + 1 };
      notify();
      await new Promise<void>(resolve => {
        pendingNavigation = async accept => {
          if (!accept) {
            notify();
            await route.fulfill({ status: 409, json: { error: { code: 'BROWSER_NAVIGATION_CANCELLED', message: 'The user chose to stay on the current page.' } } });
            resolve(); return;
          }
          state = { ...state, generation: state.generation + 1, revision: (state.revision ?? 0) + 1,
            tabs: [{ id: state.activeTabId!, title: '离开确认后的页面', url: String(body.url) }] };
          notify(); await route.fulfill({ json: state }); resolve();
        };
      });
      return;
    }
    if (path === 'navigate' && failNavigationOnce) {
      failNavigationOnce = false;
      await route.fulfill({ status: 503, json: { error: { code: 'BROWSER_EXECUTOR_UNAVAILABLE', message: 'Fixture network unavailable' } } });
      return;
    }
    if (path === 'start') {
      state = { ...state, status: 'ready', owner: 'agent', generation: state.generation + 1, revision: (state.revision ?? 0) + 1,
        activeTabId: 'home', tabs: [{ id: 'home', title: '百度一下', url: 'https://www.baidu.com/' }] };
    } else if (path === 'takeover' || path === 'release') {
      state = { ...state, owner: path === 'takeover' ? 'user' : 'agent', generation: state.generation + 1, revision: (state.revision ?? 0) + 1 };
    } else if (path === 'navigate') {
      state = { ...state, generation: state.generation + 1, revision: (state.revision ?? 0) + 1,
        tabs: [{ id: state.activeTabId!, title: '导航结果', url: String(body.url) }] };
    }
    notify(); await route.fulfill({ json: state });
  });
  expect((await page.request.post(`${baseUrl}/api/auth/login`, { data: { password } })).ok()).toBe(true);
  await page.goto(`${baseUrl}/#browser`);
  await expect(page.getByRole('heading', { name: '浏览器', exact: true })).toBeVisible();
  return {
    requests, state: () => state, frame, notify,
    pauseFrames: (value: boolean) => { pauseFrames = value; },
    failTakeover: () => { failTakeoverOnce = true; },
    holdInput: () => { holdInput = true; },
    holdNavigation: () => { holdNavigation = true; },
    failNavigation: () => { failNavigationOnce = true; },
    statusReads: () => statusReads,
    holdStatus: () => { holdStatus = true; },
    releaseStatus: () => { holdStatus = false; statusRelease?.(); statusRelease = undefined; },
    replaceWithoutEvent: (value: BrowserState) => { state = value; },
    replace: (value: BrowserState) => { state = value; notify(); },
    sendState: (value: BrowserState) => { for (const socket of sockets) socket.send(JSON.stringify({ type: 'state', state: value })); },
    disconnect: () => { for (const socket of sockets) socket.close({ code: 1012, reason: 'Fixture reconnect' }); },
  };
}

test('默认自动启动百度；搜索可直接接管，重复画面和状态更新保留输入草稿', async ({ page }) => {
  const fixture = await protocolFixture(page);
  await expect(page.getByRole('button', { name: '接管', exact: true })).toBeEnabled();
  expect(fixture.requests.filter(request => request.path === 'start')).toHaveLength(1);
  await expect(page.getByLabel('网址', { exact: true })).toHaveValue('https://www.baidu.com/');
  await page.getByLabel('百度搜索', { exact: true }).fill('上海 地铁 + 天气');
  await page.getByRole('button', { name: '搜索', exact: true }).click();
  await expect(page.getByRole('button', { name: '交回控制', exact: true })).toBeEnabled();
  const destination = fixture.requests.find(request => request.path === 'navigate')!.body.url;
  expect(destination).toBe('https://www.baidu.com/s?wd=' + encodeURIComponent('上海 地铁 + 天气'));
  expect(fixture.requests.filter(request => request.path === 'takeover')).toHaveLength(1);
  await expect(page.getByLabel('浏览器输入文字', { exact: true })).toBeEnabled();
  fixture.frame(); fixture.frame();
  await expect(page.getByLabel('浏览器输入文字', { exact: true })).toBeEnabled();
  await page.getByLabel('网址', { exact: true }).fill('http://localhost:9999/my-draft');
  fixture.replace({ ...fixture.state(), revision: fixture.state().revision! + 1, tabs: [{ id: 'home', title: '更新标题', url: 'https://www.baidu.com/updated' }] });
  await expect(page.getByLabel('网址', { exact: true })).toHaveValue('http://localhost:9999/my-draft');
  await expect(page.getByLabel('百度搜索', { exact: true })).toHaveValue('上海 地铁 + 天气');
  fixture.sendState({ ...fixture.state(), revision: 0, owner: 'agent', tabs: [{ id: 'home', title: '过时标题', url: 'https://old.example' }] });
  await expect(page.getByRole('button', { name: '交回控制', exact: true })).toBeVisible();
  await expect(page.locator('.browser-tabs')).not.toContainText('过时标题');
  for (const width of [390, 360]) {
    await page.setViewportSize({ width, height: 800 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByLabel('百度搜索', { exact: true })).toBeVisible();
    await expect(page.getByAltText('当前远程浏览器页面')).toBeVisible();
  }
});

test('接管版本冲突仅重试一次；重连等待新帧，并拒绝旧代画面', async ({ page }) => {
  const fixture = await protocolFixture(page, { status: 'ready', owner: 'agent', activeTabId: 'home', tabs: [{ id: 'home', title: '现有页面', url: 'https://example.com/' }] });
  fixture.failTakeover();
  await page.getByRole('button', { name: '接管', exact: true }).click();
  await expect(page.getByLabel('浏览器输入文字', { exact: true })).toBeEnabled();
  expect(fixture.requests.filter(request => request.path === 'takeover')).toHaveLength(2);
  const stable = fixture.state();
  fixture.pauseFrames(true); fixture.disconnect();
  await expect(page.getByLabel('浏览器输入文字', { exact: true })).toBeDisabled();
  await expect(page.getByAltText('当前远程浏览器页面')).toHaveCount(0);
  await expect(page.locator('.browser-stream-label')).toHaveText('等待新画面', { timeout: 10000 });
  await expect(page.getByLabel('浏览器输入文字', { exact: true })).toBeDisabled();
  fixture.pauseFrames(false); fixture.frame(stable.generation - 1);
  await expect(page.getByAltText('当前远程浏览器页面')).toHaveCount(0);
  fixture.frame();
  await expect(page.getByLabel('浏览器输入文字', { exact: true })).toBeEnabled();
  expect(fixture.requests.filter(request => request.path === 'start')).toHaveLength(0);
});

test('原生弹窗可在触发输入HTTP未返回时回答，不等待输入链', async ({ page }) => {
  const fixture = await protocolFixture(page, { status: 'ready', owner: 'user', activeTabId: 'home', tabs: [{ id: 'home', title: '弹窗页面', url: 'https://example.com/' }] });
  await expect(page.getByLabel('浏览器输入文字', { exact: true })).toBeEnabled();
  fixture.holdInput();
  await page.getByLabel('浏览器输入文字', { exact: true }).fill('触发弹窗');
  await page.getByRole('button', { name: '输入到浏览器', exact: true }).click();
  await expect(page.locator('.browser-dialog')).toContainText('原生确认');
  await page.locator('.browser-dialog').getByRole('button', { name: '确认', exact: true }).click();
  await expect(page.locator('.browser-dialog')).toHaveCount(0);
  await expect(page.getByLabel('浏览器输入文字', { exact: true })).toHaveValue('');
  expect(fixture.requests.filter(request => request.path === 'dialog')).toHaveLength(1);
});

test('离开页面弹窗可在导航控制请求挂起时回答，保持导航请求只执行一次', async ({ page }) => {
  const fixture = await protocolFixture(page, { status: 'ready', owner: 'user', activeTabId: 'home', tabs: [{ id: 'home', title: '离开确认页面', url: 'https://example.com/' }] });
  await expect(page.getByLabel('浏览器输入文字', { exact: true })).toBeEnabled();
  fixture.holdNavigation();
  await page.getByLabel('网址', { exact: true }).fill('https://example.com/after-confirm');
  await page.getByRole('button', { name: '前往网址', exact: true }).click();
  await expect(page.locator('.browser-dialog')).toContainText('导航请求等待回答');
  await expect(page.getByRole('button', { name: '处理中', exact: true })).toBeDisabled();
  const confirm = page.locator('.browser-dialog').getByRole('button', { name: '确认', exact: true });
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await expect(page.locator('.browser-dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '交回控制', exact: true })).toBeEnabled();
  await expect(page.getByLabel('浏览器输入文字', { exact: true })).toBeEnabled();
  await expect(page.getByLabel('网址', { exact: true })).toHaveValue('https://example.com/after-confirm');
  expect(fixture.requests.filter(request => request.path === 'navigate')).toHaveLength(1);
  expect(fixture.requests.filter(request => request.path === 'dialog')).toHaveLength(1);
});

test('新代画面缺失状态事件时合并查询权威状态，恢复控制且不重放控制动作', async ({ page }) => {
  const fixture = await protocolFixture(page, { status: 'ready', owner: 'user', activeTabId: 'home', tabs: [{ id: 'home', title: '当前页面', url: 'https://example.com/' }] });
  await expect(page.getByLabel('浏览器输入文字', { exact: true })).toBeEnabled();
  const previous = fixture.state();
  const readsBefore = fixture.statusReads();
  fixture.holdStatus();
  fixture.replaceWithoutEvent({ ...previous, generation: previous.generation + 1, revision: previous.revision! + 1 });
  fixture.frame();
  await expect(page.getByLabel('浏览器输入文字', { exact: true })).toBeDisabled();
  await expect(page.getByAltText('当前远程浏览器页面')).toHaveCount(0);
  await expect.poll(() => fixture.statusReads()).toBe(readsBefore + 1);
  for (let index = 0; index < 20; index++) fixture.frame();
  // No additional status request can race the one already in flight, even under a burst of pixels.
  await page.waitForTimeout(150);
  expect(fixture.statusReads()).toBe(readsBefore + 1);
  expect(fixture.requests).toHaveLength(0);
  fixture.releaseStatus();
  await expect(page.getByLabel('浏览器输入文字', { exact: true })).toBeEnabled();
  await page.getByLabel('浏览器输入文字', { exact: true }).fill('状态恢复后的输入');
  await page.getByRole('button', { name: '输入到浏览器', exact: true }).click();
  await expect(page.getByLabel('浏览器输入文字', { exact: true })).toHaveValue('');
  expect(fixture.requests).toHaveLength(1);
  expect(fixture.requests[0].path).toBe('input');
  expect(fixture.requests[0].body.generation).toBe(previous.generation + 1);
});

test('取消离开页面保留控制且不显示失败；真正503仍报错并允许再次导航', async ({ page }) => {
  const fixture = await protocolFixture(page, { status: 'ready', owner: 'user', activeTabId: 'home', tabs: [{ id: 'home', title: '保留页面', url: 'https://example.com/' }] });
  await expect(page.getByLabel('浏览器输入文字', { exact: true })).toBeEnabled();
  const retained = fixture.state();
  const pixels = await page.getByAltText('当前远程浏览器页面').getAttribute('src');
  fixture.holdNavigation();
  await page.getByLabel('网址', { exact: true }).fill('https://example.com/cancelled');
  const cancelled = page.waitForResponse(response => response.url().endsWith('/api/browser/navigate'));
  await page.getByRole('button', { name: '前往网址', exact: true }).click();
  await expect(page.locator('.browser-dialog')).toContainText('导航请求等待回答');
  await page.locator('.browser-dialog').getByRole('button', { name: '取消', exact: true }).click();
  const response = await cancelled;
  expect(response.status()).toBe(409);
  expect((await response.json()).error.code).toBe('BROWSER_NAVIGATION_CANCELLED');
  await expect(page.locator('.browser-dialog')).toHaveCount(0);
  await expect(page.locator('.browser-error')).toHaveCount(0);
  await expect(page.getByLabel('浏览器输入文字', { exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: '交回控制', exact: true })).toBeEnabled();
  await expect(page.getByLabel('网址', { exact: true })).toHaveValue('https://example.com/');
  expect(fixture.state().owner).toBe('user');
  expect(fixture.state().generation).toBe(retained.generation);
  expect(await page.getByAltText('当前远程浏览器页面').getAttribute('src')).toBe(pixels);
  expect(fixture.requests.filter(request => request.path === 'navigate')).toHaveLength(1);

  fixture.failNavigation();
  await page.getByLabel('网址', { exact: true }).fill('https://example.com/network-failure');
  await page.getByRole('button', { name: '前往网址', exact: true }).click();
  await expect(page.locator('.browser-error')).toContainText('浏览器服务暂时无法连接');
  await expect(page.getByRole('button', { name: '交回控制', exact: true })).toBeEnabled();
  expect(fixture.requests.filter(request => request.path === 'navigate')).toHaveLength(2);
  await page.getByLabel('网址', { exact: true }).fill('https://example.com/retry');
  await page.getByRole('button', { name: '前往网址', exact: true }).click();
  await expect(page.getByLabel('网址', { exact: true })).toHaveValue('https://example.com/retry');
  await expect(page.getByLabel('浏览器输入文字', { exact: true })).toBeEnabled();
  await expect(page.locator('.browser-error')).toHaveCount(0);
  expect(fixture.requests.filter(request => request.path === 'navigate')).toHaveLength(3);
  expect(fixture.requests.filter(request => request.path === 'takeover')).toHaveLength(0);
});
