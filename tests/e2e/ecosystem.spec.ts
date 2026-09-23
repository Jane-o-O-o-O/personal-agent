import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { EcosystemItem } from '../../src/shared/contracts';

const baseUrl = process.env.AGENT_E2E_URL ?? 'http://127.0.0.1:3420';
const password = process.env.AGENT_E2E_PASSWORD ?? readFileSync(resolve(process.env.AGENT_E2E_PASSWORD_FILE ?? 'data/admin-password'), 'utf8').trim();
test.use({ trace: 'off', launchOptions: { channel: process.env.AGENT_E2E_BROWSER_CHANNEL ?? (process.platform === 'darwin' ? 'chrome' : undefined) } });

async function login(page: Page) {
  await page.goto(`${baseUrl}/#ecosystem`);
  await page.getByLabel('访问密码').fill(password);
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await expect(page.getByRole('heading', { name: '生态扩展', exact: true })).toBeVisible();
  await expect(page.locator('.ecosystem-card').first()).toBeVisible();
}

async function catalog(page: Page): Promise<EcosystemItem[]> {
  const response = await page.request.get(`${baseUrl}/api/ecosystem`);
  expect(response.ok()).toBe(true);
  const value = await response.json() as { items: EcosystemItem[] };
  expect(Array.isArray(value.items)).toBe(true);
  return value.items;
}

test('生态目录区分可安装适配器、归档资料与尚不可接入的服务', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  const items = await catalog(page);
  expect(items.filter(item => item.id.startsWith('asset-')).length).toBeGreaterThanOrEqual(78);
  expect(items.filter(item => item.id.startsWith('asset-')).every(item => !item.installable && !item.enabled)).toBe(true);
  for (const id of ['mcp-didi', 'mcp-luckin']) {
    expect(items.find(item => item.id === id)).toMatchObject({ status: 'needs_credentials', installable: true, enabled: false });
  }
  for (const id of ['plan-meituan-delivery', 'plan-taobao-flash', 'plan-jd-delivery', 'plan-wps365-mcp']) {
    expect(items.find(item => item.id === id)).toMatchObject({ status: 'reference', installable: false, enabled: false });
  }

  await page.locator('.ecosystem-scene').filter({ hasText: '滴滴打车' }).click();
  await expect(page.locator('.ecosystem-card').filter({ hasText: '滴滴出行 · 查询沙箱' })).toBeVisible();
  await page.locator('.ecosystem-scene').filter({ hasText: '瑞幸咖啡' }).click();
  await expect(page.locator('.ecosystem-card').filter({ hasText: '瑞幸咖啡 · 自提查询' })).toBeVisible();
  await page.locator('.ecosystem-scene').filter({ hasText: '火车与航班' }).click();
  await expect(page.locator('.ecosystem-card').filter({ hasText: '飞常准 · 火车与航班' })).toBeVisible();
  await page.locator('.ecosystem-scene').filter({ hasText: '地图与地铁' }).click();
  await expect(page.locator('.ecosystem-card').filter({ hasText: '高德地图' }).first()).toBeVisible();

  await page.locator('.ecosystem-scene').filter({ hasText: '外卖平台' }).click();
  const foodCards = page.locator('.ecosystem-card');
  await expect(foodCards).toHaveCount(3);
  for (const name of ['美团外卖', '淘宝闪购', '京东外卖']) {
    await foodCards.filter({ hasText: name }).click();
    const detail = page.getByRole('complementary', { name: '扩展详情' });
    await expect(detail.locator('.ecosystem-status')).toHaveText('仅参考');
    await expect(detail.getByRole('button', { name: '安装扩展' })).toHaveCount(0);
  }

  await page.getByRole('searchbox', { name: '搜索生态扩展' }).fill('WPS 365 官方远程 MCP');
  await page.locator('.ecosystem-card').first().click();
  const wps = page.getByRole('complementary', { name: '扩展详情' });
  await expect(wps.locator('.ecosystem-status')).toHaveText('仅参考');
  await expect(wps).toContainText('企业试用');
  await expect(wps.getByRole('button', { name: '安装扩展' })).toHaveCount(0);
  await wps.getByRole('button', { name: '关闭详情' }).click();
  await expect(wps.locator('h2')).toHaveText('选择一个扩展');
});

for (const width of [390, 360]) test(`${width}px 手机生态目录无横向溢出，详情可用键盘关闭`, async ({ page }) => {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 800 });
  await login(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.body.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('.ecosystem-scene').filter({ hasText: '外卖平台' }).click();
  await expect(page.locator('.ecosystem-card')).toHaveCount(3);
  await page.locator('.ecosystem-card').filter({ hasText: '美团外卖' }).click();
  const detail = page.getByRole('complementary', { name: '扩展详情' });
  await expect(detail).toBeVisible();
  await expect(detail.locator('.ecosystem-status')).toHaveText('仅参考');
  await expect(detail.getByRole('button', { name: '安装扩展' })).toHaveCount(0);
  await expect(detail.getByRole('button', { name: '关闭详情' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(detail).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.body.scrollWidth <= innerWidth)).toBe(true);
});
