import { chromium, expect } from '@playwright/test';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { createVerificationClient, internal, remoteNode, ssh, verificationDir } from './verification-http.mjs';

process.umask(0o077);
const fixtureUrl = (process.env.AGENT_VERIFY_FIXTURE_URL || 'http://127.0.0.1:4099').replace(/\/$/, '');
const taskId = `full-browser-${randomUUID()}`;
const runStamp = new Date().toISOString().replace(/[^0-9]/g, '');
const screenshots = join(verificationDir, 'screenshots');
const report = { startedAt: new Date().toISOString(), fixtureUrl, checks: [], screenshots: [], liveChanges: [], tabSwitches: [], streamTimeline: [], cleanup: {} };
let client;
let browser;
let page;
let previousState;
let testTabId;
let currentCheck = 'initialization';
let currentSubstep;
let frames = 0;
let frameBytes = 0;
let lastStreamFrame;
let lastStreamState;
let acceptedFrames;
let acceptedFrameHash;
let monitoredPages = 0;
const pageErrors = [];
const assert = (value, code = 'BROWSER_VERIFICATION_ASSERTION') => {
  if (!value) throw Object.assign(new Error(code), { verificationCode: code });
};

async function check(label, operation) {
  currentCheck = label;
  currentSubstep = undefined;
  const started = Date.now();
  const detail = await operation();
  report.checks.push({ name: label, status: 'passed', durationMs: Date.now() - started, ...(detail ? { detail } : {}) });
  console.log(`PASS ${label}`);
}

const execute = code => internal('execute', { code, taskId, timeoutMs: 30000 });
const status = () => client.request('GET', '/browser');

async function fixtureRequest(path) {
  return remoteNode('browser', `
    const response = await fetch(${JSON.stringify(`${fixtureUrl}${path}`)}, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error('Fixture request failed');
    return await response.json();`);
}

async function nativeProbe(targetId = testTabId) {
  return remoteNode('browser', `
    const { readFile } = await import('node:fs/promises');
    const { join } = await import('node:path');
    const { default: WebSocket } = await import('ws');
    const [port, endpoint] = (await readFile(join(process.env.BROWSER_DATA_DIR || 'browser-data', 'browser', 'profile', 'DevToolsActivePort'), 'utf8')).trim().split('\\n');
    const socket = new WebSocket('ws://127.0.0.1:' + port + endpoint);
    const callbacks = new Map();
    let nextId = 0;
    socket.on('message', bytes => {
      const message = JSON.parse(bytes.toString());
      if (message.id && callbacks.has(message.id)) {
        const pending = callbacks.get(message.id); callbacks.delete(message.id);
        clearTimeout(pending.timer);
        message.error ? pending.reject(new Error('Native probe failed')) : pending.resolve(message.result);
      }
    });
    await new Promise((resolve, reject) => { socket.once('open', resolve); socket.once('error', reject); });
    const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
      const id = ++nextId;
      const timer = setTimeout(() => { callbacks.delete(id); reject(new Error('Native probe timed out')); }, 5000);
      callbacks.set(id, { resolve, reject, timer });
      socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
    try {
      const targetId = ${JSON.stringify(targetId)};
      const info = await send('Target.getTargetInfo', { targetId });
      const session = await send('Target.attachToTarget', { targetId, flatten: true });
      const tree = await send('Page.getFrameTree', {}, session.sessionId);
      const dom = await send('Runtime.evaluate', { expression: '({url:location.href,title:document.title,saved:document.getElementById("saved-name")?.textContent,input:document.querySelector("input")?.value,scrollY,readyState:document.readyState,visibility:document.visibilityState,devicePixelRatio,viewport:visualViewport ? {width:visualViewport.width,height:visualViewport.height,pageLeft:visualViewport.pageLeft,pageTop:visualViewport.pageTop}:null})', returnByValue: true, userGesture: false }, session.sessionId);
      return { targetId, targetInfo: { title: info.targetInfo.title, url: info.targetInfo.url }, frameTreeUrl: tree.frameTree.frame.url, dom: dom.result.value };
    } finally { socket.close(); }
  `);
}

async function internalScreenshotProbe() {
  return remoteNode('app', `
    const started = Date.now();
    const response = await fetch(new URL('/internal/screenshot', process.env.BROWSER_SERVICE_URL), {
      headers: { authorization: 'Bearer ' + process.env.BROWSER_SERVICE_TOKEN }, signal: AbortSignal.timeout(45000)
    });
    const value = await response.json();
    return {
      durationMs: Date.now() - started, status: response.status,
      ...(response.ok ? { generation: value.generation, width: value.width, height: value.height, bytes: typeof value.data === 'string' ? Buffer.byteLength(value.data, 'base64') : 0 } : { error: { code: value.error?.code, message: value.error?.message } })
    };`);
}

async function browserStreamDiagnostics() {
  const collectedAtMs = Date.now();
  const cutoffAtMs = report.completedAt ? Date.parse(report.completedAt) : collectedAtMs;
  const output = await ssh(`docker compose --project-directory /opt/personal-agent/deploy --env-file /opt/personal-agent/.env -f /opt/personal-agent/deploy/compose.yaml logs --no-log-prefix --no-color --since '${report.startedAt}' --tail 10000 browser app`);
  const entries = [];
  const relayEntries = [];
  for (const line of output.split('\n')) {
    try {
      const value = JSON.parse(line);
      if (value.browserStream && typeof value.browserStream === 'object' && value.browserStream.at <= cutoffAtMs) entries.push(value.browserStream);
      if (value.browserRelay && typeof value.browserRelay === 'object' && value.browserRelay.at <= cutoffAtMs) relayEntries.push(value.browserRelay);
    } catch {}
  }
  return { collectedAtMs, completedAtMs: Date.now(), cutoffAtMs, entries, relayEntries };
}

function monitorFrames(target) {
  const surface = ++monitoredPages;
  target.on('pageerror', () => pageErrors.push('browser-page-error'));
  target.on('websocket', socket => {
    if (new URL(socket.url()).pathname !== '/api/browser/stream') return;
    socket.on('framereceived', ({ payload }) => {
      try {
        const message = JSON.parse(payload.toString());
        const receivedAtMs = Date.now();
        if (message.type === 'frame') {
          frames++;
          frameBytes += payload.length;
          lastStreamFrame = { generation: message.generation, width: message.width, height: message.height, ...(Number.isSafeInteger(message.sequence) ? { sequence: message.sequence } : {}), receivedAtMs };
          report.streamTimeline.push({ surface, type: 'frame', ...lastStreamFrame, bytes: typeof payload === 'string' ? Buffer.byteLength(payload) : payload.length });
        } else if (message.type === 'state') {
          lastStreamState = { generation: message.state.generation, owner: message.state.owner, activeTabId: message.state.activeTabId, receivedAtMs };
          report.streamTimeline.push({ surface, type: 'state', ...lastStreamState });
        }
      } catch {}
    });
  });
}

async function ready(target = page) {
  const image = target.getByAltText('当前远程浏览器页面');
  await expect(image).toBeVisible({ timeout: 15000 });
  await expect.poll(() => image.evaluate(element => [element.naturalWidth, element.naturalHeight]), { timeout: 15000 }).toEqual([1440, 900]);
  await expect(target.getByLabel('浏览器输入文字', { exact: true })).toBeEnabled({ timeout: 15000 });
  return image;
}

async function selectTab(tabId, path, label) {
  const timing = { tabId, label, beforeClickAtMs: Date.now(), framesBefore: frames };
  report.tabSwitches.push(timing);
  currentSubstep = `select ${label} tab`;
  try {
    await page.locator('.browser-tabs').getByTitle(`${fixtureUrl}${path}`, { exact: true }).click();
    timing.afterClickAtMs = Date.now();
    timing.clickDurationMs = timing.afterClickAtMs - timing.beforeClickAtMs;
    let state;
    await expect.poll(async () => { state = await status(); return state.activeTabId; }, { timeout: 15000 }).toBe(tabId);
    timing.activeTabConfirmedAtMs = Date.now();
    timing.generation = state.generation;
    currentSubstep = `${label} tab live frame`;
    timing.readyStartedAtMs = Date.now();
    await ready();
    timing.readyCompletedAtMs = Date.now();
    timing.status = 'passed';
    timing.selectionToReadyMs = timing.readyCompletedAtMs - timing.beforeClickAtMs;
    timing.readyDurationMs = timing.readyCompletedAtMs - timing.readyStartedAtMs;
    timing.framesAfter = frames;
    timing.lastStreamFrame = lastStreamFrame;
  } catch (error) {
    timing.failedAtMs = Date.now();
    timing.status = 'failed';
    timing.selectionToFailureMs = timing.failedAtMs - timing.beforeClickAtMs;
    if (timing.readyStartedAtMs) timing.readyDurationMs = timing.failedAtMs - timing.readyStartedAtMs;
    timing.framesAfter = frames;
    timing.lastStreamFrame = lastStreamFrame;
    throw error;
  }
}

async function navigate(path) {
  await page.getByLabel('网址', { exact: true }).fill(`${fixtureUrl}${path}`);
  const response = page.waitForResponse(value => value.url().endsWith('/api/browser/navigate'));
  await page.getByRole('button', { name: '前往网址', exact: true }).click();
  assert((await response).ok());
  await expect.poll(async () => {
    const value = await status();
    return value.tabs.find(tab => tab.id === value.activeTabId)?.url;
  }, { timeout: 15000 }).toBe(`${fixtureUrl}${path === '/seed' || path === '/clear' ? '/' : path}`);
  await ready();
}

async function clickRemote(x, y, target = page, opensDialog = false) {
  const image = await ready(target);
  const rect = await image.boundingBox();
  assert(rect);
  const response = target.waitForResponse(value => {
    if (!value.url().endsWith('/api/browser/input')) return false;
    try { return value.request().postDataJSON().type === 'click'; } catch { return false; }
  });
  await image.click({ position: { x: rect.width * x / 1440, y: rect.height * y / 900 } });
  if (opensDialog) return { completion: response };
  assert((await response).ok());
}

async function frameSnapshot(target = page) {
  return { frames, src: await target.getByAltText('当前远程浏览器页面').getAttribute('src') };
}

async function freshFrame(before, label, target = page) {
  await expect.poll(() => target.getByAltText('当前远程浏览器页面').getAttribute('src'), { timeout: 15000 }).not.toBe(before.src);
  await expect.poll(() => frames, { timeout: 15000 }).toBeGreaterThan(before.frames);
  report.liveChanges.push({ action: label, framesDelta: frames - before.frames });
}

async function textRemote(value, target = page) {
  const before = await frameSnapshot(target);
  await target.getByLabel('浏览器输入文字', { exact: true }).fill(value);
  const response = target.waitForResponse(result => {
    if (!result.url().endsWith('/api/browser/input')) return false;
    try { return result.request().postDataJSON().type === 'text'; } catch { return false; }
  });
  await target.getByRole('button', { name: '输入到浏览器', exact: true }).click();
  assert((await response).ok());
  await expect(target.getByLabel('浏览器输入文字', { exact: true })).toHaveValue('');
  await freshFrame(before, target === page ? 'desktop Chinese text' : 'mobile Chinese text', target);
}

async function screenshot(name, target = page) {
  const filename = `${name}-${runStamp}.png`;
  await target.screenshot({ path: join(screenshots, filename), fullPage: true, animations: 'disabled' });
  report.screenshots.push(`screenshots/${filename}`);
}

async function frameLayout(width, height) {
  await page.setViewportSize({ width, height });
  await page.getByRole('button', { name: '适应画面', exact: true }).click();
  const image = await ready();
  await expect.poll(() => image.evaluate(element => {
    const rect = element.getBoundingClientRect();
    const parent = element.parentElement.getBoundingClientRect();
    return rect.left >= parent.left - 1 && rect.right <= parent.right + 1 && rect.top >= parent.top - 1 && rect.bottom <= parent.bottom + 1;
  })).toBe(true);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  let pixels;
  await expect.poll(async () => {
    pixels = await image.evaluate(element => {
      const canvas = document.createElement('canvas');
      canvas.width = element.naturalWidth; canvas.height = element.naturalHeight;
      const context = canvas.getContext('2d');
      context.drawImage(element, 0, 0);
      const bytes = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let dark = 0;
      for (let index = 0; index < bytes.length; index += 4) if (bytes[index] + bytes[index + 1] + bytes[index + 2] < 450) dark++;
      return { width: canvas.width, height: canvas.height, dark };
    });
    return pixels.width === 1440 && pixels.height === 900 && pixels.dark > 100;
  }, { timeout: 15000 }).toBe(true);
  await screenshot(`live-browser-${width}`);
  return { viewport: { width, height }, pixels };
}

async function cleanup() {
  if (!client || !previousState) return;
  let value = await status();
  if (value.owner === 'user') {
    if (value.dialog) await client.request('POST', '/browser/dialog', { accept: false, generation: value.generation });
    await client.request('POST', '/browser/release', { generation: (await status()).generation });
  }
  if (testTabId) {
    await execute(`
      const verificationTargets = await tabs.list();
      const allowed = verificationTargets.filter(target => target.targetId === ${JSON.stringify(testTabId)} || (target.url.startsWith(${JSON.stringify(`${fixtureUrl}/`)}) && !${JSON.stringify(previousState.tabs.map(tab => tab.id))}.includes(target.targetId)));
      for (const target of allowed) await browser.send('Target.closeTarget', { targetId: target.targetId });
      console.log(JSON.stringify({ closed: allowed.length }));`);
  }
  value = await status();
  if (previousState.activeTabId && value.tabs.some(tab => tab.id === previousState.activeTabId)) {
    value = await client.request('POST', '/browser/takeover', { generation: value.generation });
    value = await client.request('POST', '/browser/tab', { tabId: previousState.activeTabId, generation: value.generation });
    await client.request('POST', '/browser/release', { generation: value.generation });
  }
  report.cleanup.tabsRestored = true;
  report.cleanup.owner = (await status()).owner;
}

try {
  await mkdir(screenshots, { recursive: true, mode: 0o700 });
  const previousReport = await readFile(join(verificationDir, 'browser.json'), 'utf8').then(value => JSON.parse(value), () => null);
  if (previousReport) await rename(join(verificationDir, 'browser.json'), join(verificationDir, `browser-attempt-${previousReport.startedAt.replace(/[^0-9]/g, '')}.json`));
  client = await createVerificationClient();
  await check('fixture availability and model configuration', async () => {
    const fixture = await fixtureRequest('/health');
    assert(fixture.ok);
    report.fixtureMarker = fixture.marker;
    const bootstrap = await client.request('GET', '/bootstrap');
    assert(bootstrap.model.configured);
    return { modelConfigured: true };
  });
  await check('isolated test browser tab', async () => {
    const initial = await client.request('POST', '/browser/start', {});
    assert(initial.owner === 'agent');
    previousState = initial;
    const result = await execute(`page = await tabs.open(); console.log(JSON.stringify({ targetId: page.targetId }));`);
    testTabId = JSON.parse(result.text.trim()).targetId;
    assert(testTabId && !previousState.tabs.some(tab => tab.id === testTabId));
  });
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
  await context.addCookies(client.cookies);
  context.setDefaultTimeout(15000);
  context.setDefaultNavigationTimeout(30000);
  page = await context.newPage();
  monitorFrames(page);
  await page.goto(`${client.baseUrl}/#browser`);
  await check('human takeover and address navigation', async () => {
    await page.getByRole('button', { name: '接管', exact: true }).click();
    await expect(page.getByRole('button', { name: '交回控制', exact: true })).toBeVisible();
    await navigate('/seed');
    assert((await status()).activeTabId === testTabId);
  });
  await check('stale generation and invalid pointer rejection', async () => {
    const value = await status();
    const stale = await client.rawRequest('POST', '/browser/input', { type: 'text', text: 'stale-input', generation: previousState.generation, tabId: testTabId });
    assert(stale.status() === 409);
    const invalid = await client.rawRequest('POST', '/browser/input', { type: 'click', x: 1441, y: 100, generation: value.generation, tabId: testTabId });
    assert(invalid.status() === 400);
    assert((await status()).activeTabId === testTabId);
  });
  const savedName = '中文真实操作验收';
  await check('zoomed coordinates and Chinese text input', async () => {
    await page.getByRole('button', { name: '放大画面', exact: true }).click();
    await clickRemote(80, 100);
    await textRemote(savedName);
    await page.getByRole('button', { name: '缩小画面', exact: true }).click();
    await page.getByRole('button', { name: '适应画面', exact: true }).click();
  });
  await check('native confirm cancellation and acceptance', async () => {
    currentSubstep = 'open cancellation dialog';
    const cancelled = await clickRemote(80, 170, page, true);
    await expect(page.locator('.browser-dialog')).toContainText('确认保存中文表单');
    await page.locator('.browser-dialog').getByRole('button', { name: '取消', exact: true }).click();
    currentSubstep = 'cancellation click request completed';
    assert((await cancelled.completion).ok());
    await expect(page.locator('.browser-dialog')).toHaveCount(0);
    currentSubstep = 'cancelled form URL unchanged';
    assert((await status()).tabs.find(tab => tab.id === testTabId)?.url === `${fixtureUrl}/`);
    currentSubstep = 'open acceptance dialog';
    acceptedFrames = frames;
    acceptedFrameHash = createHash('sha256').update(await page.getByAltText('当前远程浏览器页面').getAttribute('src')).digest('hex');
    const accepted = await clickRemote(80, 170, page, true);
    await expect(page.locator('.browser-dialog')).toContainText('确认保存中文表单');
    await page.locator('.browser-dialog').getByRole('button', { name: '确认', exact: true }).click();
    currentSubstep = 'acceptance click request completed';
    assert((await accepted.completion).ok());
    currentSubstep = 'Chinese saved form URL';
    await expect.poll(async () => {
      const value = await status();
      const tab = value.tabs.find(tab => tab.id === testTabId);
      report.formState = { status: value.status, owner: value.owner, testTabPresent: Boolean(tab), activeTestTab: value.activeTabId === testTabId, testTab: tab ? { url: tab.url, title: tab.title } : null, fixtureTabs: value.tabs.filter(target => target.url.startsWith(fixtureUrl)).map(target => ({ title: target.title, url: target.url })) };
      return tab && new URL(tab.url).searchParams.get('name');
    }).toBe(savedName);
    await expect(page.locator('.browser-dialog')).toHaveCount(0);
    currentSubstep = 'saved form frame updated';
    let inputRegionDark;
    await expect.poll(async () => {
      inputRegionDark = await page.getByAltText('当前远程浏览器页面').evaluate(element => {
        const canvas = document.createElement('canvas');
        canvas.width = element.naturalWidth; canvas.height = element.naturalHeight;
        const context = canvas.getContext('2d');
        context.drawImage(element, 0, 0);
        const bytes = context.getImageData(40, 80, 300, 42).data;
        let dark = 0;
        for (let index = 0; index < bytes.length; index += 4) if (bytes[index] + bytes[index + 1] + bytes[index + 2] < 450) dark++;
        return dark;
      });
      return inputRegionDark;
    }, { timeout: 15000 }).toBeLessThan(10);
    report.submittedFrame = { inputRegionDark, framesBefore: acceptedFrames, framesAfter: frames };
  });
  for (const [width, height] of [[1440, 900], [390, 844], [360, 800]]) {
    await check(`live JPEG pixels and responsive layout ${width}`, () => frameLayout(width, height));
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await check('live stream transport', async () => {
    assert(frames > 3 && frameBytes > 1000);
    return { frames, bytes: frameBytes };
  });
  await check('long page scrolling and keyboard forwarding', async () => {
    await navigate('/interaction');
    const image = await ready();
    const before = await frameSnapshot();
    await image.hover();
    await page.mouse.wheel(0, 680);
    await expect.poll(async () => (await fixtureRequest('/state')).scrollY).toBeGreaterThan(300);
    await freshFrame(before, 'desktop wheel scroll');
    await page.getByRole('button', { name: 'Esc', exact: true }).click();
    await expect.poll(async () => (await fixtureRequest('/state')).lastKey).toBe('Escape');
    await page.getByLabel('远程浏览器画面', { exact: true }).focus();
    await page.keyboard.press('Home');
    await expect.poll(async () => (await fixtureRequest('/state')).lastKey).toBe('Home');
    await page.keyboard.press('Control+Home');
    await expect.poll(async () => (await fixtureRequest('/state')).scrollY).toBe(0);
    await clickRemote(80, 100);
    await page.getByRole('button', { name: '回车', exact: true }).click();
    await expect.poll(async () => (await fixtureRequest('/state')).lastKey).toBe('Enter');
    await page.getByRole('button', { name: 'Tab', exact: true }).click();
    await expect.poll(async () => (await fixtureRequest('/state')).lastKey).toBe('Tab');
    return { scrollAndKeyboardDelivered: true };
  });
  await check('native prompt with Chinese response', async () => {
    const opened = await clickRemote(80, 170, page, true);
    await expect(page.getByLabel('网页输入请求', { exact: true })).toBeVisible();
    await page.getByLabel('网页输入请求', { exact: true }).fill('中文提示框答复');
    await page.locator('.browser-dialog').getByRole('button', { name: '确认', exact: true }).click();
    assert((await opened.completion).ok());
    await expect.poll(async () => (await fixtureRequest('/state')).promptResult).toBe('中文提示框答复');
  });
  await check('new browser tab and human tab switching', async () => {
    currentSubstep = 'open new tab';
    await clickRemote(80, 235);
    currentSubstep = 'new tab metadata';
    await expect.poll(async () => (await status()).tabs.filter(tab => tab.url === `${fixtureUrl}/second-tab`).length).toBe(1);
    const other = (await status()).tabs.find(tab => tab.url === `${fixtureUrl}/second-tab`);
    await selectTab(other.id, '/second-tab', 'second');
    await selectTab(testTabId, '/interaction', 'first');
  });
  await check('mobile touch scrolling and Chinese input', async () => {
    currentSubstep = 'mobile browser opened';
    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, ignoreHTTPSErrors: true });
    await mobile.addCookies(client.cookies);
    mobile.setDefaultTimeout(15000);
    const mobilePage = await mobile.newPage();
    monitorFrames(mobilePage);
    await mobilePage.goto(`${client.baseUrl}/#browser`);
    await mobilePage.getByRole('button', { name: '适应画面', exact: true }).click();
    const image = await ready(mobilePage);
    const rect = await image.boundingBox();
    assert(rect);
    const clickResponse = mobilePage.waitForResponse(value => {
      if (!value.url().endsWith('/api/browser/input')) return false;
      try { return value.request().postDataJSON().type === 'click'; } catch { return false; }
    });
    await mobilePage.touchscreen.tap(rect.x + rect.width * 80 / 1440, rect.y + rect.height * 100 / 900);
    assert((await clickResponse).ok());
    currentSubstep = 'mobile Chinese input delivered';
    await textRemote('手机中文验收', mobilePage);
    await expect.poll(async () => (await fixtureRequest('/state')).input).toBe('手机中文验收');
    const beforeDom = await nativeProbe();
    report.mobileTouch = { before: beforeDom.dom };
    assert(beforeDom.dom.input === '手机中文验收', 'MOBILE_DOM_INPUT_MISMATCH');
    assert(beforeDom.dom.scrollY === 0, 'MOBILE_SCROLL_START_NOT_ZERO');
    const session = await mobile.newCDPSession(mobilePage);
    const x = rect.x + rect.width * 0.6;
    const fromY = rect.y + rect.height * 0.8;
    const toY = rect.y + rect.height * 0.2;
    const before = await frameSnapshot(mobilePage);
    const scrollResponse = mobilePage.waitForResponse(value => {
      if (!value.url().endsWith('/api/browser/input')) return false;
      try { return value.request().postDataJSON().type === 'scroll'; } catch { return false; }
    });
    currentSubstep = 'native mobile swipe and scroll request';
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: fromY }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: toY }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const scrollResult = await scrollResponse;
    assert(scrollResult.ok(), 'MOBILE_SCROLL_REQUEST_FAILED');
    report.mobileTouch.scrollRequestStatus = scrollResult.status();
    currentSubstep = 'mobile current DOM scroll changed';
    await expect.poll(async () => {
      const value = await nativeProbe();
      report.mobileTouch.after = value.dom;
      return value.dom.scrollY - beforeDom.dom.scrollY;
    }, { timeout: 15000 }).toBeGreaterThan(300);
    await expect.poll(async () => (await fixtureRequest('/state')).scrollY).toBeGreaterThan(300);
    currentSubstep = 'mobile scrolled live frame';
    await freshFrame(before, 'mobile native touch scroll', mobilePage);
    await expect.poll(() => image.evaluate(element => {
      const canvas = document.createElement('canvas');
      canvas.width = element.naturalWidth; canvas.height = element.naturalHeight;
      const context = canvas.getContext('2d');
      context.drawImage(element, 0, 0);
      return [...context.getImageData(10, 20, 1, 1).data].slice(0, 3).every(channel => channel >= 250);
    }), { timeout: 15000 }).toBe(true);
    await screenshot('live-browser-mobile-touch', mobilePage);
    await session.detach();
    await mobile.close();
    await navigate('/interaction');
    await clickRemote(80, 100);
    await textRemote('手机中文验收');
    await expect.poll(async () => (await fixtureRequest('/state')).input).toBe('手机中文验收');
    return { nativeTouchForwarded: true };
  });
  await check('handoff and fresh DOM verification', async () => {
    report.handoff = { startedAtMs: Date.now() };
    currentSubstep = 'release HTTP completion';
    const releaseResponse = page.waitForResponse(value => value.url().endsWith('/api/browser/release'));
    await page.getByRole('button', { name: '交回控制', exact: true }).click();
    report.handoff.afterClickAtMs = Date.now();
    const released = await releaseResponse;
    report.handoff.responseAtMs = Date.now();
    report.handoff.responseStatus = released.status();
    assert(released.ok(), 'HANDOFF_RELEASE_HTTP_FAILED');
    currentSubstep = 'release owner and UI confirmed';
    await expect.poll(async () => (await status()).owner, { timeout: 15000 }).toBe('agent');
    await expect(page.getByRole('button', { name: '接管', exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByLabel('浏览器输入文字', { exact: true })).toBeDisabled();
    report.handoff.ownerConfirmedAtMs = Date.now();
    currentSubstep = 'fresh runtime DOM response';
    const result = await execute(`console.log(JSON.stringify(await page.evaluate(() => ({ value: document.querySelector('input')?.value, url: location.href }))));`);
    report.handoff.domResponseAtMs = Date.now();
    currentSubstep = 'fresh runtime DOM decoding';
    const current = JSON.parse(result.text.trim());
    report.handoff.dom = current;
    currentSubstep = 'fresh runtime DOM assertion';
    assert(current.value === '手机中文验收' && current.url === `${fixtureUrl}/interaction`, 'HANDOFF_DOM_MISMATCH');
    currentSubstep = 'agent ownership protects human input';
    const rejected = await client.rawRequest('POST', '/browser/input', { type: 'text', text: 'invalid-owner-input', generation: (await status()).generation, tabId: testTabId });
    assert(rejected.status() === 409, 'HANDOFF_INVALID_OWNER_NOT_REJECTED');
    report.handoff.completedAtMs = Date.now();
  });
  await check('Chromium namespace and seccomp sandbox', async () => {
    currentSubstep = 'sandbox page and fields read';
    const result = await execute(`
      await page.goto('chrome://sandbox');
      await page.waitFor(() => location.host === 'sandbox' && document.querySelectorAll('tr').length > 0);
      const verificationSandboxFields = await page.evaluate(() => Object.fromEntries(Array.from(document.querySelectorAll('tr'), row => Array.from(row.querySelectorAll('th,td'), cell => cell.innerText.trim())).filter(row => row.length === 2)));
      await page.goto(${JSON.stringify(`${fixtureUrl}/clear`)});
      console.log(JSON.stringify(verificationSandboxFields));`);
    currentSubstep = 'sandbox fields JSON decoding';
    const fields = JSON.parse(result.text.trim());
    report.sandbox = fields;
    currentSubstep = 'sandbox fields assertion';
    assert(fields['Layer 1 Sandbox'] === 'Namespace' && fields['PID namespaces'] === 'Yes' && fields['Network namespaces'] === 'Yes' && fields['Seccomp-BPF sandbox'] === 'Yes' && fields['Seccomp-BPF sandbox supports TSYNC'] === 'Yes', 'CHROMIUM_SANDBOX_FIELDS_MISMATCH');
  });
  await check('no workbench page errors', async () => { assert(pageErrors.length === 0); });
} catch (error) {
  report.failureError = { name: ['Error', 'TimeoutError', 'TypeError', 'SyntaxError'].includes(error?.name) ? error.name : 'Error', code: /^[A-Z][A-Z0-9_]{1,80}$/.test(error?.verificationCode || '') ? error.verificationCode : 'BROWSER_VERIFICATION_OPERATION_FAILED', failedAtMs: Date.now() };
  report.checks.push({ name: currentCheck, status: 'failed', ...(currentSubstep ? { substep: currentSubstep } : {}) });
  if (page && !page.isClosed()) await screenshot('live-browser-failure').catch(() => {});
  await (async () => {
    if (!client || !previousState) return;
    const value = await status();
    report.failureBrowser = { status: value.status, owner: value.owner, generation: value.generation, activeTabId: value.activeTabId, tabs: value.tabs.filter(tab => tab.id === testTabId || tab.url.startsWith(fixtureUrl)).map(tab => ({ id: tab.id, title: tab.title, url: tab.url })), lastStreamFrame, lastStreamState };
  })().catch(() => {});
  if (currentSubstep === 'second tab live frame') {
    await browserStreamDiagnostics().then(value => { report.browserStreamBeforeProbe = value; }).catch(() => { report.browserStreamDiagnosticsUnavailable = true; });
    const framesBefore = frames;
    const probeStartedAtMs = Date.now();
    await internalScreenshotProbe().then(value => { report.internalScreenshotProbe = value; }).catch(() => { report.internalScreenshotProbeUnavailable = true; });
    const probeCompletedAtMs = Date.now();
    await delay(2000);
    report.afterScreenshotProbe = {
      probeStartedAtMs, probeCompletedAtMs, observedAtMs: Date.now(), framesBefore, framesAfter: frames,
      imageVisible: await page.getByAltText('当前远程浏览器页面').isVisible(),
      lastStreamFrame, lastStreamState,
    };
    await browserStreamDiagnostics().then(value => { report.browserStreamAfterProbe = value; }).catch(() => { report.browserStreamAfterDiagnosticsUnavailable = true; });
    await nativeProbe(report.failureBrowser?.activeTabId).then(value => { report.nativeProbe = value; }).catch(() => { report.nativeProbeUnavailable = true; });
  }
  if (currentCheck === 'native confirm cancellation and acceptance' && acceptedFrameHash) {
    report.acceptedFrame = { framesBefore: acceptedFrames, framesAfter: frames, frameHashBefore: acceptedFrameHash, frameHashAfter: createHash('sha256').update(await page.getByAltText('当前远程浏览器页面').getAttribute('src')).digest('hex') };
    await nativeProbe().then(value => { report.nativeProbe = value; }).catch(() => { report.nativeProbeUnavailable = true; });
    await (async () => {
      const value = await status();
      if (value.owner === 'user' && !value.dialog) await client.request('POST', '/browser/release', { generation: value.generation });
      const result = await execute(`
        const verificationAuditPage = await tabs.get(${JSON.stringify(testTabId)});
        const verificationDom = await verificationAuditPage.evaluate(() => ({ url: location.href, title: document.title, saved: document.getElementById('saved-name')?.textContent, readyState: document.readyState }));
        const verificationTree = await verificationAuditPage.cdp('Page.getFrameTree');
        const verificationTarget = await browser.send('Target.getTargetInfo', { targetId: verificationAuditPage.targetId });
        console.log(JSON.stringify({ ...verificationDom, targetId: verificationAuditPage.targetId, frameTreeUrl: verificationTree.frameTree.frame.url, nativeTargetInfo: { title: verificationTarget.targetInfo.title, url: verificationTarget.targetInfo.url } }));`);
      report.formDom = JSON.parse(result.text.trim());
    })().catch(() => { report.formDomUnavailable = true; });
  }
  console.error(`FAIL ${currentCheck}${currentSubstep ? `: ${currentSubstep}` : ''}`);
  process.exitCode = 1;
} finally {
  await cleanup().catch(() => { report.cleanup.failed = true; process.exitCode = 1; });
  await browser?.close();
  await client?.logout().then(() => { report.cleanup.loggedOut = true; }).catch(() => { report.cleanup.logoutFailed = true; process.exitCode = 1; });
  report.completedAt = new Date().toISOString();
  await browserStreamDiagnostics().then(value => { report.browserStreamDiagnostics = value; }).catch(() => { report.browserStreamDiagnosticsUnavailable = true; });
  report.frameTransport = { frames, bytes: frameBytes };
  report.pageErrors = pageErrors;
  report.passed = !process.exitCode;
  await mkdir(verificationDir, { recursive: true, mode: 0o700 });
  await writeFile(join(verificationDir, 'browser.json'), JSON.stringify(report, null, 2), { mode: 0o600 });
}
