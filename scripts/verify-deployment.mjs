import { chromium, expect } from '@playwright/test';
import WebSocket from 'ws';
import { createHash, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { chmod, mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Run before, let the operator restart app/browser, then run after. No restart is performed here.
process.umask(0o077);
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const origin = 'https://39.107.111.115:8443';
const host = 'root@39.107.111.115';
const controlSocket = '/tmp/personal-agent-ssh.sock';
const fixtureUrl = 'http://127.0.0.1:3999';
const directory = join(root, '.runtime', 'deployment-verification');
const statePath = join(directory, 'state.json');
const storagePath = join(directory, 'storage-state.json');
const screenshots = join(directory, 'screenshots');
const phase = process.argv[2];
let currentCheck = 'phase argument';
let currentPixels;
let browser;

const check = value => { if (!value) throw new Error('Verification failed'); };
const pass = (label, pixels) => console.log(`PASS ${label}${pixels ? ` pixels=${pixels.dark}/${pixels.width * pixels.height}` : ''}`);
const step = label => { currentCheck = label; currentPixels = undefined; };
const hash = value => createHash('sha256').update(value).digest('hex');

async function checkpoint(state) {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await chmod(directory, 0o700);
  await writeFile(`${statePath}.tmp`, JSON.stringify(state), { mode: 0o600 });
  await rename(`${statePath}.tmp`, statePath);
  await chmod(statePath, 0o600);
}

async function command(executable, args, input = '') {
  return await new Promise((resolve, reject) => {
    const child = spawn(executable, args, { stdio: ['pipe', 'pipe', 'pipe'], timeout: 60000 });
    let output = '';
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', chunk => { output += chunk; if (output.length > 2_000_000) child.kill(); });
    child.stderr.resume();
    child.once('error', () => reject(new Error('Remote command failed')));
    child.once('close', code => code === 0 ? resolve(output.trim()) : reject(new Error('Remote command failed')));
    child.stdin.on('error', () => {});
    child.stdin.end(input);
  });
}

const ssh = (remoteCommand, input) => command('ssh', ['-S', controlSocket, '-o', 'BatchMode=yes', host, remoteCommand], input);
async function remoteNode(container, source) {
  check(['app', 'browser'].includes(container));
  const wrapper = `try { const result = await (async () => { ${source}\n})(); process.stdout.write(JSON.stringify(result)); } catch { process.stdout.write('{"verificationError":true}'); process.exitCode = 1; }`;
  return JSON.parse(await ssh(`cd /opt/personal-agent/deploy && docker compose --env-file ../.env -f compose.yaml exec -T ${container} node --input-type=module -`, wrapper));
}

async function internal(path, body) {
  return remoteNode('app', `
    const response = await fetch(new URL(${JSON.stringify(`/internal/${path}`)}, process.env.BROWSER_SERVICE_URL), {
      method: 'POST', headers: { authorization: 'Bearer ' + process.env.BROWSER_SERVICE_TOKEN, 'content-type': 'application/json' },
      body: ${JSON.stringify(JSON.stringify(body))}, signal: AbortSignal.timeout(45000)
    });
    if (!response.ok) throw new Error('Internal verification failed');
    return await response.json();`);
}

const execute = (state, code) => internal('execute', { code, taskId: `deployment-verification-${state.marker}`, timeoutMs: 30000 });
async function fixtureHealth() {
  return remoteNode('browser', `try { return await (await fetch('${fixtureUrl}/health', { signal: AbortSignal.timeout(2000) })).json(); } catch { return { ok: false }; }`);
}
async function ensureFixture(state, copy) {
  if (copy) {
    await command('scp', ['-o', `ControlPath=${controlSocket}`, '-o', 'BatchMode=yes', join(root, 'tests/e2e/fixtures/verification-fixture.mjs'), `${host}:/opt/personal-agent/state/workspaces/verification-fixture.mjs`]);
    await ssh('chown 1000:1000 /opt/personal-agent/state/workspaces/verification-fixture.mjs && chmod 600 /opt/personal-agent/state/workspaces/verification-fixture.mjs');
  }
  const health = await fixtureHealth();
  if (health.ok) check(health.marker === state.marker);
  else await ssh(`cd /opt/personal-agent/deploy && docker compose --env-file ../.env -f compose.yaml exec -T -d browser node /shared/workspaces/verification-fixture.mjs ${state.marker}`);
  await expect.poll(async () => (await fixtureHealth()).marker, { timeout: 15000 }).toBe(state.marker);
}

async function request(page, method, path, data) {
  const response = await page.request.fetch(`${origin}/api/${path}`, { method, ...(data !== undefined ? { data } : {}) });
  check(response.ok());
  return await response.json();
}
async function navigate(page, name) {
  const menu = page.getByRole('button', { name: '打开导航', exact: true });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole('navigation', { name: '主导航' }).getByRole('button', { name, exact: true }).click();
  if (await menu.isVisible()) await expect.poll(() => page.locator('.sidebar').evaluate(element => element.getBoundingClientRect().right)).toBeLessThanOrEqual(1);
}
function monitorFrames(page) {
  let count = 0;
  page.on('websocket', socket => {
    if (!socket.url().endsWith('/api/browser/stream')) return;
    socket.on('framereceived', ({ payload }) => {
      try { if (JSON.parse(payload.toString()).type === 'frame') count++; } catch {}
    });
  });
  return () => count;
}
async function captureBrowser(page, frames) {
  const image = page.getByAltText('当前远程浏览器页面');
  step(`${phase} browser image visibility`);
  await expect(image).toBeVisible();
  step(`${phase} browser WS frame count`);
  await expect.poll(frames, { timeout: 15000 }).toBeGreaterThan(0);
  step(`${phase} browser frame dimensions`);
  await expect.poll(() => image.evaluate(element => element.naturalWidth)).toBe(1440);
  for (const width of [1440, 390, 360]) {
    step(`${phase} browser layout ${width}`);
    await page.setViewportSize({ width, height: width === 1440 ? 900 : width === 390 ? 844 : 800 });
    await page.getByRole('button', { name: '适应画面', exact: true }).click();
    await expect.poll(() => image.evaluate(element => {
      const rect = element.getBoundingClientRect();
      const viewport = element.parentElement.getBoundingClientRect();
      return rect.left >= viewport.left - 1 && rect.right <= viewport.right + 1 && rect.bottom <= viewport.bottom + 1 && rect.top >= viewport.top - 1;
    })).toBe(true);
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    step(`${phase} browser pixels ${width}`);
    let pixels;
    await expect.poll(async () => {
      pixels = await image.evaluate(element => {
        const canvas = document.createElement('canvas');
        canvas.width = element.naturalWidth; canvas.height = element.naturalHeight;
        const context = canvas.getContext('2d'); context.drawImage(element, 0, 0);
        const bytes = context.getImageData(0, 0, canvas.width, canvas.height).data;
        let dark = 0;
        for (let i = 0; i < bytes.length; i += 4) if (bytes[i] + bytes[i + 1] + bytes[i + 2] < 450) dark++;
        return { width: canvas.width, height: canvas.height, dark };
      });
      currentPixels = pixels;
      return pixels.width === 1440 && pixels.height === 900 && pixels.dark > 100;
    }, { timeout: 15000 }).toBe(true).catch(async () => {
      await page.screenshot({ path: join(screenshots, `${phase}-browser-pixel-failure-${width}.png`), fullPage: true, animations: 'disabled' }).catch(() => {});
      throw new Error('Browser frame did not become ready');
    });
    check(pixels.width === 1440 && pixels.height === 900 && pixels.dark > 100);
    await page.screenshot({ path: join(screenshots, `${phase}-browser-${width}.png`), fullPage: true, animations: 'disabled' });
    pass(`${phase} browser WS/frame/layout ${width}`, pixels);
  }
}

async function sandbox(state) {
  const result = await execute(state, `await page.goto('chrome://sandbox'); await page.waitFor(() => location.host === 'sandbox' && document.querySelectorAll('tr').length > 0); console.log(JSON.stringify(await page.evaluate(() => Object.fromEntries(Array.from(document.querySelectorAll('tr'), row => Array.from(row.querySelectorAll('th,td'), cell => cell.innerText.trim())).filter(row => row.length === 2)))));`);
  const fields = JSON.parse(result.text.trim());
  check(fields['Layer 1 Sandbox'] === 'Namespace' && fields['PID namespaces'] === 'Yes' && fields['Network namespaces'] === 'Yes' && fields['Seccomp-BPF sandbox'] === 'Yes' && fields['Seccomp-BPF sandbox supports TSYNC'] === 'Yes');
  pass(`${phase} Chromium namespace/seccomp sandbox`);
}
async function probeProfile(state, path) {
  const navigation = path === undefined ? '' : `await page.goto(${JSON.stringify(`${fixtureUrl}${path}`)}); await page.waitFor(origin => location.origin === origin && Boolean(document.getElementById('profile-marker')), ${JSON.stringify(fixtureUrl)});`;
  const result = await execute(state, `${navigation} console.log(JSON.stringify(await page.evaluate(() => ({ url: location.href, profile: document.getElementById('profile-marker')?.textContent, saved: document.getElementById('saved-name')?.textContent }))));`);
  return JSON.parse(result.text.trim());
}
async function clearFixtureTab(state) {
  const result = await execute(state, `if (await page.evaluate(origin => location.origin === origin, ${JSON.stringify(fixtureUrl)})) { await page.goto('about:blank'); console.log('fixture-cleared'); } else console.log('other-tab-preserved');`);
  check(['fixture-cleared', 'other-tab-preserved'].includes(result.text.trim()));
  pass('current fixture tab cleared; other tabs preserved');
}

async function deniedAuthentication(context) {
  const page = await context.newPage();
  for (const path of ['bootstrap', 'tasks', 'memories', 'browser']) check((await page.request.get(`${origin}/api/${path}`)).status() === 401);
  check((await page.request.post(`${origin}/api/auth/login`, { data: { password: `invalid-${randomUUID()}` } })).status() === 401);
  await new Promise((resolve, reject) => {
    const socket = new WebSocket(`${origin.replace('https:', 'wss:')}/api/browser/stream`, { origin, handshakeTimeout: 10000 });
    socket.once('unexpected-response', (_request, response) => {
      response.resume(); socket.terminate(); response.statusCode === 401 ? resolve() : reject(new Error('Authentication failed'));
    });
    socket.once('open', () => { socket.close(); reject(new Error('Authentication failed')); });
    socket.on('error', () => reject(new Error('Authentication failed')));
  });
  await page.close();
  pass('anonymous REST/WS and wrong-password rejection');
}

async function before(context, page, previousState) {
  step('before state initialization');
  const state = previousState ?? { phase: 'preparing', origin, marker: randomUUID(), createdAt: new Date().toISOString() };
  if (!previousState) {
    state.prompt = `VPS 持久化任务验收 ${state.marker}`;
    state.memory = `VPS 持久化记忆验收 ${state.marker}`;
    await checkpoint(state);
  }
  step('public TLS and workbench login');
  if (previousState) {
    await page.goto(`${origin}/#tasks/${encodeURIComponent(state.taskId)}`);
    await expect(page.getByRole('heading', { name: state.prompt, exact: true })).toBeVisible();
    check((await request(page, 'GET', 'auth/session')).authenticated);
  } else {
    await page.goto(origin);
    await page.getByLabel('访问密码').fill((await readFile(join(root, 'data/admin-password'), 'utf8')).trim());
    await page.getByRole('button', { name: '登录', exact: true }).click();
    await expect(page.getByRole('heading', { name: '新任务', exact: true })).toBeVisible();
  }
  const cookie = (await context.cookies(origin)).find(value => value.name === 'pa_session');
  check(cookie?.secure && cookie.httpOnly && cookie.expires > Date.now() / 1000);
  if (previousState) check(hash(cookie.value) === state.loginCookieHash);
  state.loginCookieHash = hash(cookie.value);
  await writeFile(storagePath, JSON.stringify(await context.storageState()), { mode: 0o600 });
  await chmod(storagePath, 0o600);
  await checkpoint(state);
  pass('trusted public TLS and real workbench login');
  step('pending task and test memory creation');
  const bootstrap = await request(page, 'GET', 'bootstrap');
  check(!bootstrap.model.configured);
  if (!previousState) {
    await page.getByLabel('消息', { exact: true }).fill(state.prompt);
    await page.getByRole('button', { name: '发送消息', exact: true }).click();
    await expect(page.getByRole('heading', { name: state.prompt, exact: true })).toBeVisible();
    state.taskId = decodeURIComponent(new URL(page.url()).hash.split('/')[1]);
    await checkpoint(state);
    state.memoryId = (await request(page, 'POST', 'memories', { content: state.memory, source: 'deployment-verification' })).id;
    await checkpoint(state);
  }
  check((await request(page, 'GET', `tasks/${state.taskId}`)).task.status === 'waiting_user');
  check((await request(page, 'GET', 'memories')).some(memory => memory.id === state.memoryId && memory.content === state.memory));
  await page.screenshot({ path: join(screenshots, 'before-workbench-desktop.png'), fullPage: true, animations: 'disabled' });
  pass('pending task and test memory persisted');
  step('remote fixture startup');
  await ensureFixture(state, true);
  step('real browser takeover/input/confirm');
  const frames = monitorFrames(page);
  await navigate(page, '浏览器');
  const start = page.getByRole('button', { name: '启动', exact: true });
  if (await start.isVisible()) await start.click();
  const release = page.getByRole('button', { name: '交回控制', exact: true });
  if (!(await release.isVisible())) {
    const takeover = page.getByRole('button', { name: '接管', exact: true });
    await expect(takeover).toBeEnabled({ timeout: 15000 }); await takeover.click();
  }
  step('browser address navigation');
  const targetUrl = `${fixtureUrl}/${state.fixtureSeeded ? '' : 'seed'}`;
  await page.getByLabel('网址', { exact: true }).fill(targetUrl);
  const navigation = page.waitForResponse(response => response.url().endsWith('/api/browser/navigate'));
  await page.getByRole('button', { name: '前往网址', exact: true }).click();
  check((await navigation).ok());
  await expect.poll(async () => {
    const current = await request(page, 'GET', 'browser');
    return current.tabs.find(tab => tab.id === current.activeTabId)?.url;
  }).toBe(`${fixtureUrl}/`);
  state.fixtureSeeded = true;
  await checkpoint(state);
  const image = page.getByAltText('当前远程浏览器页面');
  await expect(image).toBeVisible();
  await expect(page.getByLabel('浏览器输入文字', { exact: true })).toBeEnabled({ timeout: 15000 });
  step('scaled browser click and Chinese input');
  await page.getByRole('button', { name: '放大画面', exact: true }).click();
  let rect = await image.boundingBox(); check(rect);
  await image.click({ position: { x: rect.width * 80 / 1440, y: rect.height * 100 / 900 } });
  await page.getByLabel('浏览器输入文字', { exact: true }).fill('中文部署验收');
  await page.getByRole('button', { name: '输入到浏览器', exact: true }).click();
  await page.getByRole('button', { name: '适应画面', exact: true }).click();
  rect = await image.boundingBox(); check(rect);
  const previousFrame = await image.getAttribute('src');
  step('native confirm and saved form verification');
  await image.click({ position: { x: rect.width * 80 / 1440, y: rect.height * 170 / 900 } });
  await expect(page.locator('.browser-dialog')).toContainText('确认保存中文表单', { timeout: 15000 });
  await page.locator('.browser-dialog').getByRole('button', { name: '确认', exact: true }).click();
  await expect.poll(() => image.getAttribute('src'), { timeout: 15000 }).not.toBe(previousFrame);
  step('browser live frame and responsive layout');
  await captureBrowser(page, frames);
  await release.click();
  await expect(page.getByLabel('浏览器输入文字', { exact: true })).toBeDisabled();
  const observed = await internal('observe', { taskId: `deployment-verification-${state.marker}` });
  check(observed.text.includes('中文部署验收') && observed.text.includes(state.marker));
  const values = await probeProfile(state);
  check(values.url.startsWith(`${fixtureUrl}/save?`) && values.profile === state.marker && values.saved === '中文部署验收');
  pass('real takeover, scaled click, Chinese input, manual confirm and release');
  step('browser sandbox and profile checkpoint');
  await sandbox(state);
  check((await probeProfile(state, '/')).profile === state.marker);
  state.browserGeneration = (await request(page, 'GET', 'browser')).generation;
  state.phase = 'before-complete';
  await checkpoint(state);
  pass('before complete; persistent profile marker seeded once');
}

async function after(context, page, state) {
  step('persistent login session after restart');
  await page.goto(`${origin}/#tasks/${encodeURIComponent(state.taskId)}`);
  await expect(page.getByRole('heading', { name: state.prompt, exact: true })).toBeVisible();
  check((await request(page, 'GET', 'auth/session')).authenticated);
  const cookie = (await context.cookies(origin)).find(value => value.name === 'pa_session');
  check(cookie && hash(cookie.value) === state.loginCookieHash);
  pass('original login cookie and server session survived restart');
  step('task and memory persistence after restart');
  const task = await request(page, 'GET', `tasks/${state.taskId}`);
  check(task.task.prompt === state.prompt && task.task.status === 'waiting_user' && task.messages.some(message => message.role === 'user' && message.text === state.prompt));
  check((await request(page, 'GET', 'memories')).some(memory => memory.id === state.memoryId && memory.content === state.memory));
  pass('task, original message and memory survived restart');
  step('fixture and profile persistence after restart');
  await ensureFixture(state, false);
  const frames = monitorFrames(page);
  await navigate(page, '浏览器');
  const started = await request(page, 'POST', 'browser/start', {});
  check(started.generation > state.browserGeneration && started.owner === 'agent');
  check((await probeProfile(state, '/')).profile === state.marker);
  pass('browser restarted and disk profile cookie survived without reseeding');
  await captureBrowser(page, frames);
  step('post-restart sandbox');
  await sandbox(state);
  check((await probeProfile(state, '/')).profile === state.marker);
  step('verification data cleanup');
  await request(page, 'DELETE', `memories/${state.memoryId}`);
  await request(page, 'POST', `tasks/${state.taskId}/cancel`, {});
  check(!(await request(page, 'GET', 'memories')).some(memory => memory.id === state.memoryId));
  check((await request(page, 'GET', `tasks/${state.taskId}`)).task.status === 'cancelled');
  check((await probeProfile(state, '/clear')).profile === '');
  await clearFixtureTab(state);
  await remoteNode('browser', `const response = await fetch('${fixtureUrl}/shutdown', { method: 'POST', signal: AbortSignal.timeout(5000) }); if (!response.ok) throw new Error('Fixture shutdown failed'); return await response.json();`);
  await expect.poll(async () => (await fixtureHealth()).ok, { timeout: 10000 }).toBe(false);
  pass('test memory removed, task cancelled, fixture cookie cleared and process stopped');
  step('logout and credential file removal');
  await request(page, 'POST', 'auth/logout', {});
  check((await page.request.get(`${origin}/api/bootstrap`)).status() === 401);
  await rm(storagePath, { force: true });
  state.phase = 'after-complete'; state.completedAt = new Date().toISOString();
  await checkpoint(state);
  pass('logout invalidated session and temporary cookie file removed');
}

try {
  check(phase === 'before' || phase === 'after');
  await mkdir(screenshots, { recursive: true, mode: 0o700 });
  let state;
  const hasState = await stat(statePath).then(() => true, () => false);
  if (phase === 'after' || hasState) {
    step('before checkpoint validation');
    state = JSON.parse(await readFile(statePath, 'utf8'));
    check(state.origin === origin && /^[a-z0-9-]{1,80}$/i.test(state.marker));
    check(phase === 'after' ? state.phase === 'before-complete' : state.phase === 'preparing' && state.taskId && state.memoryId && state.loginCookieHash);
    check(((await stat(storagePath)).mode & 0o777) === 0o600);
  }
  step('local Chrome startup');
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...(state ? { storageState: storagePath } : {}) });
  context.setDefaultTimeout(15000);
  context.setDefaultNavigationTimeout(30000);
  if (phase === 'before') {
    step('authentication rejection');
    const anonymous = await browser.newContext();
    await deniedAuthentication(anonymous);
    await anonymous.close();
  }
  const page = await context.newPage();
  if (phase === 'before') await before(context, page, state);
  else await after(context, page, state);
} catch {
  // Playwright call logs can include filled text; never print exception objects or traces.
  console.error(`FAIL ${currentCheck}${currentPixels ? ` pixels=${currentPixels.dark}/${currentPixels.width * currentPixels.height}` : ''}`);
  process.exitCode = 1;
} finally {
  await browser?.close();
}
