import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createServer } from 'node:http';

const baseUrl = process.env.AGENT_E2E_URL ?? 'http://127.0.0.1:3420';
const password = process.env.AGENT_E2E_PASSWORD ?? readFileSync(resolve(process.env.AGENT_E2E_PASSWORD_FILE ?? 'data/admin-password'), 'utf8').trim();
const screenshotDir = process.env.AGENT_E2E_SCREENSHOTS ?? '.runtime/screenshots';
test.use({ trace: 'off', launchOptions: { channel: process.env.AGENT_E2E_BROWSER_CHANNEL ?? (process.platform === 'darwin' ? 'chrome' : undefined) } });

async function login(page: Page) {
  await page.goto(baseUrl);
  await page.getByLabel('访问密码').fill(password);
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await expect(page.getByRole('heading', { name: '新任务', exact: true })).toBeVisible();
}
async function navigate(page: Page, label: string) {
  const menu = page.getByRole('button', { name: '打开导航', exact: true });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole('navigation', { name: '主导航' }).getByRole('button', { name: label, exact: true }).click();
  if (await menu.isVisible()) await expect.poll(() => page.locator('.sidebar').evaluate(element => element.getBoundingClientRect().right)).toBeLessThanOrEqual(1);
}

test('任务保存、刷新、追加、暂停和取消使用真实后台状态', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await login(page);
  const bootstrap = await (await page.request.get(`${baseUrl}/api/bootstrap`)).json();
  test.skip(bootstrap.model.configured, '本场景验收模型未配置状态');
  const prompt = `工作台持久任务验收 ${Date.now()}`;
  await page.getByLabel('消息', { exact: true }).fill(prompt);
  await page.getByRole('button', { name: '发送消息', exact: true }).click();
  await expect(page.getByRole('heading', { name: prompt, exact: true })).toBeVisible();
  await expect(page.locator('.task-heading .status')).toHaveText('待处理');
  await page.reload();
  await expect(page.locator('.message-user').first()).toContainText(prompt);
  await page.getByLabel('消息', { exact: true }).fill('追加一条实际消息');
  await page.getByRole('button', { name: '发送消息', exact: true }).click();
  await expect(page.locator('.message-user')).toHaveCount(2);
  const taskId = decodeURIComponent(new URL(page.url()).hash.split('/')[1]);
  const detail = await (await page.request.get(`${baseUrl}/api/tasks/${taskId}`)).json();
  expect(detail.messages.filter((message: { role: string }) => message.role === 'user')).toHaveLength(2);
  await page.getByRole('button', { name: '恢复任务', exact: true }).click();
  await expect(page.locator('.task-heading .status')).toHaveText('待处理');
  await page.getByRole('button', { name: '取消任务', exact: true }).click();
  await expect(page.locator('.task-heading .status')).toHaveText('已取消');
  await page.screenshot({ path: `${screenshotDir}/workbench-desktop.png`, fullPage: true, animations: 'disabled' });
  expect(errors).toEqual([]);
});

test('记忆和目标可创建、编辑、暂停并删除', async ({ page }) => {
  await login(page);
  await navigate(page, '记忆');
  const text = `工作台记忆验收 ${Date.now()}`;
  await page.getByRole('button', { name: '添加记忆', exact: true }).click();
  await page.getByRole('dialog').getByLabel('内容', { exact: true }).fill(text);
  await page.getByRole('dialog').getByRole('button', { name: '保存', exact: true }).click();
  const memory = page.locator('.memory-row').filter({ hasText: text });
  await expect(memory).toBeVisible();
  await memory.getByRole('button', { name: '编辑记忆', exact: true }).click();
  await page.getByRole('dialog').getByLabel('内容', { exact: true }).fill(`${text} 已修正`);
  await page.getByRole('dialog').getByRole('button', { name: '保存', exact: true }).click();
  await expect(memory).toContainText('已修正');
  page.once('dialog', dialog => dialog.accept());
  await memory.getByRole('button', { name: '删除记忆', exact: true }).click();
  await expect(memory).toHaveCount(0);

  await navigate(page, '目标');
  const title = `工作台目标验收 ${Date.now()}`;
  await page.getByRole('button', { name: '新建目标', exact: true }).click();
  await page.getByRole('dialog').getByLabel('名称', { exact: true }).fill(title);
  await page.getByRole('dialog').getByLabel('任务内容', { exact: true }).fill('查询当天日期');
  await page.getByRole('dialog').getByLabel('启用', { exact: true }).uncheck();
  await page.getByRole('dialog').getByRole('button', { name: '保存', exact: true }).click();
  const goal = page.locator('.goal-row').filter({ hasText: title });
  await expect(goal).toContainText('已暂停');
  await goal.getByRole('button', { name: '恢复目标', exact: true }).click();
  await expect(goal).toContainText('运行中');
  await goal.getByRole('button', { name: '暂停目标', exact: true }).click();
  await expect(goal).toContainText('已暂停');
  await goal.getByRole('button', { name: '编辑目标', exact: true }).click();
  await page.getByRole('dialog').getByLabel('任务内容', { exact: true }).fill('查询日期与节气');
  await page.getByRole('dialog').getByRole('button', { name: '保存', exact: true }).click();
  await expect(goal).toContainText('日期与节气');
  page.once('dialog', dialog => dialog.accept());
  await goal.getByRole('button', { name: '删除目标', exact: true }).click();
  await expect(goal).toHaveCount(0);
});

test('SSE 断线后补发实际状态，表单失败保持输入并显示错误', async ({ page, context }) => {
  await login(page);
  await context.setOffline(true);
  const prompt = `工作台断线恢复验收 ${Date.now()}`;
  const response = await page.request.post(`${baseUrl}/api/tasks`, { data: { prompt, clientRequestId: crypto.randomUUID() } });
  expect(response.ok()).toBe(true);
  const task = await response.json();
  await context.setOffline(false);
  await expect(page.locator('.task-list-item').filter({ hasText: prompt })).toBeVisible({ timeout: 20000 });
  await page.request.post(`${baseUrl}/api/tasks/${task.id}/cancel`, { data: {} });
  await expect(page.locator('.task-list-item').filter({ hasText: prompt })).toContainText('已取消');
  await navigate(page, '连接');
  await page.getByRole('navigation', { name: '连接列表' }).getByRole('button', { name: 'MCP', exact: true }).click();
  await page.getByLabel('MCP 配置 JSON', { exact: true }).fill('{ invalid-json');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.locator('.global-error')).toBeVisible();
  await expect(page.getByLabel('MCP 配置 JSON', { exact: true })).toHaveValue('{ invalid-json');
});

test('MCP textarea 凭据保存后不回填，可明确清除', async ({ page }) => {
  await login(page);
  const bootstrap = await (await page.request.get(`${baseUrl}/api/bootstrap`)).json();
  const mcp = bootstrap.integrations.find((integration: { id: string }) => integration.id === 'mcp');
  test.skip(Boolean(mcp?.secretFields.servers), '保留已有管理员 MCP 配置');
  await navigate(page, '连接');
  await page.getByRole('navigation', { name: '连接列表' }).getByRole('button', { name: 'MCP', exact: true }).click();
  const marker = `workbench-credential-test-${Date.now()}`;
  const config = JSON.stringify({ mcpServers: { 'verification-only': { url: 'http://127.0.0.1:1/mcp', headers: { Authorization: `Bearer ${marker}` } } } });
  await page.getByLabel('MCP 配置 JSON', { exact: true }).fill(config);
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.getByLabel('MCP 配置 JSON', { exact: true })).toHaveValue('');
  await expect(page.locator('.secret-state')).toContainText('已设置');
  const integrations = await (await page.request.get(`${baseUrl}/api/integrations`)).json();
  expect(JSON.stringify(integrations)).not.toContain(marker);
  await page.getByRole('button', { name: '清除MCP 配置 JSON', exact: true }).click();
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.locator('.secret-state')).toContainText('未设置');
});

for (const width of [390, 360]) test(`手机 ${width}px 导航、表单与连接没有横向溢出`, async ({ page }) => {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 800 });
  await login(page);
  await expect(page.getByRole('button', { name: '打开导航', exact: true })).toBeVisible();
  await page.getByLabel('消息', { exact: true }).fill('尚未发送的草稿');
  await navigate(page, '连接');
  await expect(page.getByRole('heading', { name: '连接', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '模型', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `${screenshotDir}/workbench-connections-${width}.png`, fullPage: true, animations: 'disabled' });
  await navigate(page, '目标');
  await page.getByRole('button', { name: '新建目标', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await page.getByRole('dialog').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.getByRole('dialog').getByRole('button', { name: '取消', exact: true }).click();
  await navigate(page, '任务');
  await expect(page.getByLabel('消息', { exact: true })).toHaveValue('尚未发送的草稿');
  await page.getByLabel('消息', { exact: true }).fill('');
  await page.screenshot({ path: `${screenshotDir}/workbench-mobile-${width}.png`, fullPage: true, animations: 'disabled' });
});

test('浏览器直播、缩放坐标、中文输入和弹窗批准可操作真实页面', async ({ page }) => {
  test.setTimeout(60000);
  test.skip(Boolean(process.env.AGENT_E2E_URL) && !baseUrl.includes('127.0.0.1'), '远程浏览器需要可达的独立表单 fixture');
  let saved = '';
  const fixture = createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    if (url.pathname === '/save') {
      saved = url.searchParams.get('name') ?? '';
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end(`<meta charset="utf-8"><h1>已保存</h1><p>${saved}</p>`);
    } else {
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end('<!doctype html><meta charset="utf-8"><title>浏览器表单验收</title><form method="get" action="/save" onsubmit="return confirm(\'确认保存中文表单？\')"><input name="name" aria-label="姓名" style="position:absolute;left:40px;top:80px;width:300px;height:42px;font-size:20px"><button style="position:absolute;left:40px;top:150px;width:100px;height:42px">保存</button></form>');
    }
  });
  await new Promise<void>(resolve => fixture.listen(0, '127.0.0.1', resolve));
  try {
    const address = fixture.address();
    if (!address || typeof address === 'string') throw new Error('fixture server unavailable');
    await login(page);
    await navigate(page, '浏览器');
    const start = page.getByRole('button', { name: '启动', exact: true });
    if (await start.isVisible()) await start.click();
    const takeover = page.getByRole('button', { name: '接管', exact: true });
    if (!(await page.getByRole('button', { name: '交回控制', exact: true }).isVisible())) {
      await expect(takeover).toBeEnabled({ timeout: 15000 });
      await takeover.click();
    }
    await expect(page.getByRole('button', { name: '交回控制', exact: true })).toBeEnabled();
    await page.getByLabel('网址', { exact: true }).fill(`http://127.0.0.1:${address.port}`);
    await page.getByRole('button', { name: '前往网址', exact: true }).click();
    const screen = page.getByAltText('当前远程浏览器页面');
    await expect(screen).toBeVisible();
    await expect.poll(async () => screen.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(100);
    await expect(page.getByLabel('浏览器输入文字', { exact: true })).toBeEnabled();
    await page.getByRole('button', { name: '放大画面', exact: true }).click();
    const rect = await screen.boundingBox();
    if (!rect) throw new Error('browser frame missing');
    await screen.click({ position: { x: rect.width * 80 / 1440, y: rect.height * 100 / 900 } });
    await page.getByLabel('浏览器输入文字', { exact: true }).fill('中文验收姓名');
    await page.getByRole('button', { name: '输入到浏览器', exact: true }).click();
    await page.getByRole('button', { name: '适应画面', exact: true }).click();
    const fitted = await screen.boundingBox();
    if (!fitted) throw new Error('browser frame missing');
    await screen.click({ position: { x: fitted.width * 80 / 1440, y: fitted.height * 170 / 900 } });
    await expect(page.locator('.browser-dialog')).toContainText('确认保存中文表单');
    await page.locator('.browser-dialog').getByRole('button', { name: '确认', exact: true }).click();
    await expect.poll(() => saved).toBe('中文验收姓名');
    const pixels = await screen.evaluate(element => {
      const image = element as HTMLImageElement;
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d')!;
      context.drawImage(image, 0, 0);
      const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let dark = 0;
      for (let index = 0; index < data.length; index += 4) if (data[index] + data[index + 1] + data[index + 2] < 450) dark++;
      return { width: canvas.width, height: canvas.height, dark };
    });
    expect(pixels.width).toBe(1440); expect(pixels.height).toBe(900); expect(pixels.dark).toBeGreaterThan(40);
    const frameFits = () => screen.evaluate(element => {
      const frame = element.getBoundingClientRect();
      const viewport = element.parentElement!.getBoundingClientRect();
      return frame.left >= viewport.left - 1 && frame.right <= viewport.right + 1 && frame.top >= viewport.top - 1 && frame.bottom <= viewport.bottom + 1;
    });
    await expect.poll(frameFits).toBe(true);
    await page.screenshot({ path: `${screenshotDir}/workbench-browser.png`, fullPage: true, animations: 'disabled' });
    for (const width of [390, 360]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 800 });
      await expect.poll(frameFits).toBe(true);
      const mobileFrame = await screen.boundingBox();
      expect(mobileFrame!.width / mobileFrame!.height).toBeCloseTo(1440 / 900, 2);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `${screenshotDir}/workbench-browser-${width}.png`, fullPage: true, animations: 'disabled' });
    }
    await page.getByRole('button', { name: '交回控制', exact: true }).click();
    await expect(page.getByLabel('浏览器输入文字', { exact: true })).toBeDisabled();
  } finally {
    fixture.closeAllConnections();
    await new Promise<void>((resolve, reject) => fixture.close(error => error ? reject(error) : resolve()));
  }
});

test('真实新标签画面先于 HTTP 回包到达，回包后不会被清掉', async ({ page }) => {
  test.setTimeout(45000);
  test.skip(!process.env.AGENT_E2E_URL || !baseUrl.includes('127.0.0.1'), '需要独立本地验收服务');
  const fixture = createServer((request, response) => {
    const old = request.url !== '/new';
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(`<!doctype html><meta charset="utf-8"><title>${old ? 'Race old green' : 'Race new red'}</title><style>body{margin:0;background:${old ? '#265d43' : '#a33c2f'};color:#fff;font:24px sans-serif}a{position:absolute;left:40px;top:80px;width:200px;height:50px;color:#fff}</style><h1>${old ? 'Old green page' : 'New red page'}</h1>${old ? '<a href="/new" target="_blank">Open new red tab</a>' : ''}`);
  });
  await new Promise<void>(resolve => fixture.listen(0, '127.0.0.1', resolve));
  let releaseResponse!: () => void;
  const responseGate = new Promise<void>(resolve => { releaseResponse = resolve; });
  let heldResponse: { generation: number; activeTabId: string } | undefined;
  let responseReleased = false;
  const frameGenerations: number[] = [];
  page.on('websocket', socket => {
    if (new URL(socket.url()).pathname !== '/api/browser/stream') return;
    socket.on('framereceived', event => {
      const value = JSON.parse(String(event.payload));
      if (value.type === 'frame') frameGenerations.push(value.generation);
    });
  });
  const screen = page.getByAltText('当前远程浏览器页面');
  const screenPixel = async () => {
    if (!(await screen.isVisible())) return [];
    return screen.evaluate(element => {
      const image = element as HTMLImageElement;
      if (!image.complete || !image.naturalWidth) return [];
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d')!;
      context.drawImage(image, 0, 0);
      return [...context.getImageData(60, 400, 1, 1).data];
    });
  };
  try {
    const address = fixture.address();
    if (!address || typeof address === 'string') throw new Error('Fixture unavailable');
    await login(page);
    await navigate(page, '浏览器');
    const start = page.getByRole('button', { name: '启动', exact: true });
    if (await start.isVisible()) await start.click();
    const release = page.getByRole('button', { name: '交回控制', exact: true });
    if (!(await release.isVisible())) {
      await page.getByRole('button', { name: '接管', exact: true }).click();
    }
    await expect(release).toBeEnabled();
    await page.getByLabel('网址', { exact: true }).fill(`http://127.0.0.1:${address.port}/old`);
    await page.getByRole('button', { name: '前往网址', exact: true }).click();
    await expect.poll(async () => {
      const pixel = await screenPixel();
      return pixel[1] > pixel[0] + 15 && pixel[1] < 140;
    }).toBe(true);
    await expect(page.getByLabel('浏览器输入文字', { exact: true })).toBeEnabled();
    const rect = await screen.boundingBox();
    if (!rect) throw new Error('Old browser frame unavailable');
    await screen.click({ position: { x: rect.width * 80 / 1440, y: rect.height * 100 / 900 } });
    const newTab = page.locator('.browser-tabs').getByRole('button', { name: 'Race new red', exact: true });
    await expect(newTab).toBeEnabled();
    await page.route('**/api/browser/tab', async route => {
      const response = await route.fetch();
      heldResponse = await response.json();
      await responseGate;
      responseReleased = true;
      await route.fulfill({ response });
    });
    await newTab.click();
    await expect.poll(() => Boolean(heldResponse)).toBe(true);
    await expect.poll(() => frameGenerations.includes(heldResponse!.generation), { timeout: 8000 }).toBe(true);
    await expect.poll(async () => {
      const pixel = await screenPixel();
      return pixel[0] > 140 && pixel[0] > pixel[1] + 30 && pixel[2] < 100;
    }, { timeout: 8000 }).toBe(true);
    expect(responseReleased).toBe(false);
    await page.evaluate(() => {
      const viewport = document.querySelector('.browser-viewport')!;
      const image = viewport.querySelector('.browser-frame')!;
      viewport.setAttribute('data-frame-removed', 'false');
      const observer = new MutationObserver(records => {
        if (records.some(record => [...record.removedNodes].some(node => node === image || node.contains(image)))) {
          viewport.setAttribute('data-frame-removed', 'true');
        }
      });
      observer.observe(viewport, { childList: true, subtree: true });
      Object.assign(viewport, { frameRaceObserver: observer });
    });
    releaseResponse();
    await expect(release).toBeEnabled();
    expect(responseReleased).toBe(true);
    await expect(screen).toBeVisible();
    await expect(page.locator('.browser-viewport')).toHaveAttribute('data-frame-removed', 'false');
    const finalPixel = await screenPixel();
    expect(finalPixel[0]).toBeGreaterThan(140);
    expect(finalPixel[0]).toBeGreaterThan(finalPixel[1] + 30);
    expect(finalPixel[2]).toBeLessThan(100);
    await expect(newTab).toHaveClass('selected');
    await expect(page.getByLabel('浏览器输入文字', { exact: true })).toBeEnabled();
    await page.screenshot({ path: `${screenshotDir}/workbench-browser-response-race.png`, fullPage: true, animations: 'disabled' });
    await release.click();
  } finally {
    releaseResponse();
    await page.evaluate(() => {
      const viewport = document.querySelector('.browser-viewport') as (Element & { frameRaceObserver?: MutationObserver }) | null;
      viewport?.frameRaceObserver?.disconnect();
    }).catch(() => {});
    fixture.closeAllConnections();
    await new Promise<void>((resolve, reject) => fixture.close(error => error ? reject(error) : resolve()));
  }
});
