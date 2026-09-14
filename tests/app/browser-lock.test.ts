import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { createBrowserService, type BrowserServiceClient } from '../../src/server/browser/index.js';
import { browserProcessIdentity, browserProfileLocks, type BrowserProfileLock } from '../../vendor/browser-use/src/browser.js';

const fixtures: { dataDir: string; browser: BrowserServiceClient; child?: ChildProcess; owner?: BrowserProfileLock }[] = [];
afterEach(async () => {
  for (const fixture of fixtures.splice(0)) {
    await fixture.browser.dispose();
    fixture.child?.kill('SIGKILL');
    if (fixture.owner?.browserPid && (await browserProcessIdentity(fixture.owner.browserPid))?.startTime === fixture.owner.browserOwner?.startTime)
      process.kill(fixture.owner.browserPid, 'SIGKILL');
    await rm(fixture.dataDir, { recursive: true, force: true });
  }
});
async function fixture() {
  const dataDir = await mkdtemp(join(tmpdir(), 'personal-agent-browser-lock-'));
  const profile = join(dataDir, 'browser', 'profile');
  await mkdir(profile, { recursive: true });
  const browser = createBrowserService({ dataDir, remoteUrl: null });
  const result = { dataDir, profile, browser, child: undefined as ChildProcess | undefined, owner: undefined as BrowserProfileLock | undefined };
  fixtures.push(result);
  return result;
}

it('preserves native-only and foreign namespace locks without assuming a PID is dead', async () => {
  const current = await browserProcessIdentity(process.pid);
  for (const kind of ['native-only', 'foreign-host', 'foreign-namespace', 'reused-native-pid']) {
    const { profile, browser } = await fixture();
    await symlink(`${kind === 'reused-native-pid' ? current!.host : 'foreign-browser'}-${process.pid}`, join(profile, 'SingletonLock'));
    await symlink('original-cookie', join(profile, 'SingletonCookie'));
    await symlink('/nonexistent/original-socket', join(profile, 'SingletonSocket'));
    const native = await browserProfileLocks(profile);
    if (kind !== 'native-only') {
      const owner = { ...current!, ...(kind === 'foreign-host' ? { host: 'other-host' } : kind === 'foreign-namespace' ? { pidNamespace: 'other-namespace' } : { startTime: 'previous-process-start' }) };
      await writeFile(join(profile, '.bu-pi.lock'), JSON.stringify({ pid: process.pid, token: 'fixture', owner, ...(kind === 'reused-native-pid' ? { browserPid: process.pid, browserOwner: owner } : {}) }));
    }
    await expect(browser.start()).rejects.toMatchObject({ code: 'BROWSER_PROFILE_LOCKED' });
    expect(await browserProfileLocks(profile)).toEqual(native);
  }
});

it('does not clear a live owner, but distinguishes a reused PID by its process start identity', async () => {
  const { profile, browser } = await fixture();
  const identity = await browserProcessIdentity(process.pid);
  const marker = { pid: process.pid, token: 'fixture', owner: identity };
  const path = join(profile, '.bu-pi.lock');
  await writeFile(path, JSON.stringify(marker));
  await expect(browser.start()).rejects.toMatchObject({ code: 'BROWSER_PROFILE_LOCKED' });
  expect(JSON.parse(await readFile(path, 'utf8'))).toEqual(marker);
  await writeFile(path, JSON.stringify({ ...marker, owner: { ...identity, startTime: 'previous-process-start' } }));
  expect((await browser.start()).status).toBe('ready');
});

it('recovers only after both fixture launcher and its real Chrome have exited in the same process domain', async () => {
  const resource = await fixture();
  const moduleUrl = new URL('../../vendor/browser-use/src/browser.ts', import.meta.url).href;
  const child = spawn(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', `
    import { openBrowser } from ${JSON.stringify(moduleUrl)};
    const browser = await openBrowser({kind:'chromium',profileDir:${JSON.stringify(resource.profile)},headless:true});
    console.log('fixture-ready');
    setInterval(() => {}, 1000);
  `], { stdio: ['ignore', 'pipe', 'pipe'] });
  resource.child = child;
  let output = ''; let stderr = '';
  child.stdout!.on('data', data => { output += data; });
  child.stderr!.on('data', data => { stderr += data; });
  await expect.poll(() => {
    if (child.exitCode !== null) throw new Error(stderr || 'Fixture launcher exited early');
    return output;
  }, { timeout: 15000 }).toContain('fixture-ready');
  resource.owner = JSON.parse(await readFile(join(resource.profile, '.bu-pi.lock'), 'utf8')) as BrowserProfileLock;
  const native = await browserProfileLocks(resource.profile);
  expect(native.SingletonLock).toBe(`${resource.owner.owner!.host}-${resource.owner.browserPid}`);
  await writeFile(join(resource.profile, 'preserved-profile-fixture'), 'existing-login-data');
  const exited = once(child, 'exit');child.kill('SIGKILL');await exited;
  await expect(resource.browser.start()).rejects.toMatchObject({ code: 'BROWSER_PROFILE_LOCKED' });
  expect(await browserProfileLocks(resource.profile)).toEqual(native);
  process.kill(resource.owner.browserPid!, 'SIGKILL');
  await expect.poll(() => browserProcessIdentity(resource.owner!.browserPid!), { timeout: 5000 }).toBeUndefined();
  expect((await resource.browser.start()).status).toBe('ready');
  expect(await readFile(join(resource.profile, 'preserved-profile-fixture'), 'utf8')).toBe('existing-login-data');
  await resource.browser.dispose();
  expect(await browserProfileLocks(resource.profile)).toEqual({});
}, 30000);
