import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createServer } from 'node:http';

const baseUrl = process.env.AGENT_E2E_URL ?? 'http://127.0.0.1:3420';
test.use({ trace: 'off', launchOptions: { channel: process.platform === 'darwin' ? 'chrome' : undefined } });

test('接管的后台刷新不会覆盖地址草稿，提交导航到真实页面', async ({ page }) => {
  test.skip(!baseUrl.includes('127.0.0.1'), '独立本地 HTTP fixture');
  const fixture = createServer((_request, response) => response.end('<!doctype html><title>Address refresh verification</title><h1>Verified navigation</h1>'));
  await new Promise<void>(resolve => fixture.listen(0, '127.0.0.1', resolve));
  let holdRefresh = false;
  let held = false;
  let resumeRefresh: (() => void) | undefined;
  await page.route('**/api/bootstrap', async route => {
    const response = await route.fetch();
    if (holdRefresh) {
      held = true;
      await new Promise<void>(resolve => { resumeRefresh = resolve; });
    }
    await route.fulfill({ response });
  });
  try {
    const address = fixture.address();
    if (!address || typeof address === 'string') throw new Error('Fixture unavailable');
    const url = `http://127.0.0.1:${address.port}/`;
    const password = process.env.AGENT_E2E_PASSWORD ?? readFileSync(resolve(process.env.AGENT_E2E_PASSWORD_FILE ?? 'data/admin-password'), 'utf8').trim();
    expect((await page.request.post(`${baseUrl}/api/auth/login`, { data: { password } })).ok()).toBe(true);
    await page.goto(`${baseUrl}/#browser`);
    await expect(page.getByRole('heading', { name: '浏览器', exact: true })).toBeVisible();
    const start = page.getByRole('button', { name: '启动', exact: true });
    if (await start.isVisible()) await start.click();
    const release = page.getByRole('button', { name: '交回控制', exact: true });
    if (await release.isVisible()) await release.click();
    const takeover = page.getByRole('button', { name: '接管', exact: true });
    await expect(takeover).toBeEnabled();
    holdRefresh = true;
    await takeover.click();
    await expect.poll(() => held).toBe(true);
    await page.getByLabel('网址', { exact: true }).fill(url);
    holdRefresh = false;
    resumeRefresh?.();
    await expect(release).toBeEnabled();
    await expect(page.getByLabel('网址', { exact: true })).toHaveValue(url);
    const navigation = page.waitForRequest(request => request.url().endsWith('/api/browser/navigate'));
    await page.getByRole('button', { name: '前往网址', exact: true }).click();
    expect((await navigation).postDataJSON().url).toBe(url);
    await expect.poll(async () => {
      const browser = await (await page.request.get(`${baseUrl}/api/browser`)).json();
      return browser.tabs.find((tab: { id: string }) => tab.id === browser.activeTabId)?.url;
    }).toBe(url);
    await expect(page.locator('.notice.error')).toHaveCount(0);
    await expect(release).toBeEnabled();
    await release.click();
  } finally {
    resumeRefresh?.();
    fixture.closeAllConnections();
    await new Promise<void>((resolve, reject) => fixture.close(error => error ? reject(error) : resolve()));
  }
});
