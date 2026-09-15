import { build } from 'esbuild';
import { mkdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BrowserDialog, BrowserFrame, BrowserInput, BrowserState } from '../../shared/contracts.js';
import { openBrowser, browserProcessIdentity, browserProfileLocks, clearBrowserProfileLocks, type BrowserProfileLock, type BrowserProcessIdentity } from '../../../vendor/browser-use/src/browser.js';
import { CDP } from '../../../vendor/browser-use/src/cdp.js';
import { imageDimensions } from '../../../vendor/browser-use/src/images.js';
import { Page } from '../../../vendor/browser-use/src/page.js';
import { BrowserRuntime, workerExecutable } from '../../../vendor/browser-use/src/runtime.js';
import type { CellResult } from '../../../vendor/browser-use/src/protocol.js';
import { BrowserServiceError } from './errors.js';
import { RemoteBrowserService } from './remote.js';

export { BrowserServiceError } from './errors.js';

export interface BrowserServiceOptions {
  dataDir: string;
  workspaceDir?: string;
  remoteUrl?: string | null;
  remoteToken?: string;
  onChange?: (state: BrowserState) => void;
  beforeTakeover?: () => Promise<void>;
}

export type BrowserServiceClient = Pick<BrowserService, keyof BrowserService>;

type ActiveCell = { controller: AbortController; done: Promise<CellResult>; taskId: string };
type PendingNavigation = { targetId: string; generation: number; cancelledBeforeUnload?: Promise<boolean> };
const viewport = { width: 1440, height: 900 };
const defaultHomeUrl = 'https://www.baidu.com/';
const bareDomain = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}(?::\d{1,5})?(?:[/?#][^\s]*)?$/i;
const loopbackAddress = /^(?:localhost|127(?:\.\d{1,3}){3}|\[::1\])(?::\d{1,5})?(?:[/?#][^\s]*)?$/i;
const taskIdPattern = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/;
const keys: Record<string, { code: string; keyCode: number; text?: string }> = {
  Enter: { code: 'Enter', keyCode: 13, text: '\r' },
  Backspace: { code: 'Backspace', keyCode: 8 },
  Tab: { code: 'Tab', keyCode: 9 },
  Escape: { code: 'Escape', keyCode: 27 },
  Delete: { code: 'Delete', keyCode: 46 },
  ArrowLeft: { code: 'ArrowLeft', keyCode: 37 },
  ArrowUp: { code: 'ArrowUp', keyCode: 38 },
  ArrowRight: { code: 'ArrowRight', keyCode: 39 },
  ArrowDown: { code: 'ArrowDown', keyCode: 40 },
  Home: { code: 'Home', keyCode: 36 },
  End: { code: 'End', keyCode: 35 },
  PageUp: { code: 'PageUp', keyCode: 33 },
  PageDown: { code: 'PageDown', keyCode: 34 },
  Control: { code: 'ControlLeft', keyCode: 17 },
  Shift: { code: 'ShiftLeft', keyCode: 16 },
  Alt: { code: 'AltLeft', keyCode: 18 },
  Meta: { code: 'MetaLeft', keyCode: 91 },
};

export function normalizeBrowserNavigationUrl(value: string): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 4096)
    throw new BrowserServiceError('INVALID_BROWSER_URL', 'Enter an address or search terms.', 400);
  const input = value.trim();
  let candidate: string;
  if (loopbackAddress.test(input)) candidate = `http://${input}`;
  else if (bareDomain.test(input)) candidate = `https://${input}`;
  else if (/^[a-z][a-z0-9+.-]*:/i.test(input)) candidate = input;
  else {
    const search = new URL('https://www.baidu.com/s');
    search.searchParams.set('wd', input);
    return search.href;
  }
  let parsed: URL;
  try { parsed = new URL(candidate); }
  catch { throw new BrowserServiceError('INVALID_BROWSER_URL', 'Enter a valid HTTP or HTTPS address.', 400); }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password)
    throw new BrowserServiceError('INVALID_BROWSER_URL', 'Only HTTP or HTTPS pages without URL credentials are supported.', 400);
  return parsed.href;
}

export function createBrowserService(options: BrowserServiceOptions): BrowserServiceClient {
  const remoteUrl = options.remoteUrl === null ? undefined : options.remoteUrl ?? process.env.BROWSER_SERVICE_URL;
  if (remoteUrl) {
    const token = options.remoteToken ?? process.env.BROWSER_SERVICE_TOKEN;
    if (!token) throw new BrowserServiceError('BROWSER_EXECUTOR_TOKEN_REQUIRED', 'Browser executor authentication is not configured.', 503);
    return new RemoteBrowserService({ ...options, remoteUrl, remoteToken: token });
  }
  return new BrowserService(options);
}

export class BrowserService {
  private state: BrowserState = {
    status: 'stopped', owner: 'none', generation: Date.now() * 1024, revision: 0, tabs: [], viewport: { ...viewport },
  };
  private controls: Promise<void> = Promise.resolve();
  private browser: Awaited<ReturnType<typeof openBrowser>> | undefined;
  private connection: CDP | undefined;
  private readonly pages = new Map<string, Page>();
  private readonly attaching = new Map<string, Promise<Page>>();
  private readonly dialogs = new Map<string, BrowserDialog>();
  private readonly documents = new Map<string, string>();
  private pendingNavigation: PendingNavigation | undefined;
  private runtime: BrowserRuntime | undefined;
  private runtimeTaskId: string | undefined;
  private workerPath: string | undefined;
  private active: ActiveCell | undefined;
  private disposed = false;
  private disposing: Promise<void> | undefined;
  private readonly frameListeners = new Set<(frame: BrowserFrame) => void>();
  private streamPage: Page | undefined;
  private streamGeneration: number | undefined;
  private streamDocument: string | undefined;
  private streamStartedAt = 0;
  private authoritativeFrame: { targetId: string; generation: number; document?: string } | undefined;
  private streamQueue: Promise<void> = Promise.resolve();
  private fallbackTimer: ReturnType<typeof setInterval> | undefined;
  private frameCapture: { targetId: string; generation: number; document?: string; promise: Promise<BrowserFrame> } | undefined;
  private lastFrameAt = 0;
  private lastFrame: BrowserFrame | undefined;
  private tabRefreshVersion = 0;

  constructor(private readonly options: BrowserServiceOptions) {}

  private trace(event: string, details: Record<string, unknown> = {}) {
    if (process.env.BROWSER_STREAM_DIAGNOSTICS !== 'true') return;
    console.error(JSON.stringify({ browserStream: {
      event, at: Date.now(), generation: this.state.generation, activeTabId: this.state.activeTabId,
      streamTargetId: this.streamPage?.targetId, listeners: this.frameListeners.size,
      lastFrameAgeMs: Date.now() - this.lastFrameAt, ...details,
    } }));
  }

  private snapshot(): BrowserState {
    return structuredClone(this.state);
  }

  private notify() {
    this.state.revision = (this.state.revision ?? 0) + 1;
    try { this.options.onChange?.(this.snapshot()); } catch { /* Observers do not own browser execution. */ }
  }

  private control<T>(action: () => Promise<T>): Promise<T> {
    const result = this.controls.then(action);
    this.controls = result.then(() => {}, () => {});
    return result;
  }

  private checkDisposed() {
    if (this.disposed) throw new BrowserServiceError('BROWSER_CLOSED', 'Browser service has stopped.');
  }

  private checkGeneration(generation?: number) {
    if (generation !== undefined && (!Number.isSafeInteger(generation) || generation < 0))
      throw new BrowserServiceError('INVALID_BROWSER_GENERATION', 'Browser control generation must be a nonnegative integer.', 400);
    if (generation !== undefined && generation !== this.state.generation)
      throw new BrowserServiceError('STALE_BROWSER_GENERATION', 'Browser control changed. Refresh before sending input.');
  }

  private checkHuman(generation: number | undefined) {
    this.checkDisposed();
    this.checkGeneration(generation);
    if (this.state.status !== 'ready' || this.state.owner !== 'user')
      throw new BrowserServiceError('BROWSER_NOT_OWNED', 'Take over the browser before sending input.');
  }

  async status(): Promise<BrowserState> {
    if (this.state.status === 'ready' && !this.state.dialog) {
      const connection = this.connection;
      try { await this.refreshTabs(); }
      catch (error) {
        if (this.connection !== connection) return this.snapshot();
        const message = error instanceof Error ? error.message : String(error);
        if (/CDP connection (?:is )?(?:closed|failed)|Chrome (?:exited|closed)|Chromium (?:exited|closed)|not open/i.test(message)) {
          this.state.status = 'error';
          this.state.owner = 'none';
          this.state.generation++;
          this.state.error = 'Browser connection was lost. Start the browser to restore control.';
          this.active?.controller.abort();
          this.notify();
          this.queueStream();
        } else if (!/CDP .* exceeded \d+ ms|CDP connection timed out|dialog/i.test(message)) {
          throw error;
        }
      }
    }
    return this.snapshot();
  }

  private async compileWorker() {
    if (this.workerPath) return this.workerPath;
    const directory = join(this.options.dataDir, 'browser', 'runtime');
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const sdkEntry = fileURLToPath(import.meta.resolve('@earendil-works/pi-coding-agent'));
    const websocketEntry = fileURLToPath(import.meta.resolve('ws'));
    const workerPath = join(directory, 'worker.mjs');
    await build({
      entryPoints: [fileURLToPath(new URL('../../../vendor/browser-use/src/worker.ts', import.meta.url))],
      outfile: workerPath, bundle: true, platform: 'node', target: 'node24', format: 'esm',
      logLevel: 'silent',
      plugins: [{
        name: 'isolated-image-backend',
        setup(plugin) {
          plugin.onResolve({ filter: /^@earendil-works\/pi-coding-agent$/ }, () => ({ path: sdkEntry, external: true }));
          plugin.onResolve({ filter: /^ws$/ }, () => ({ path: websocketEntry, external: true }));
        },
      }],
    });
    this.workerPath = workerPath;
    return workerPath;
  }

  private async recoverProfileLock(profile: string) {
    const lock = join(profile, '.bu-pi.lock');
    let previous: BrowserProfileLock | undefined;
    let original: string | undefined;
    try { original = await readFile(lock, 'utf8'); previous = JSON.parse(original) as BrowserProfileLock; }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
        throw new BrowserServiceError('BROWSER_PROFILE_LOCKED', 'Browser profile lock is invalid; inspect its owner before restarting.');
    }
    try {
      const native = await browserProfileLocks(profile);
      if (!previous && !Object.keys(native).length) return;
      if (!previous) throw new Error('Native Chromium profile locks have no verifiable SDK owner.');
      const current = await browserProcessIdentity(process.pid);
      const proveDead = async (pid: number, owner: BrowserProcessIdentity | undefined) => {
        if (!Number.isSafeInteger(pid) || pid <= 0 || !current?.startTime || typeof owner?.startTime !== 'string' || !owner.startTime || owner.host !== current.host ||
            owner.bootId !== current.bootId || owner.pidNamespace !== current.pidNamespace)
          throw new Error('Browser profile owner belongs to an unknown host, boot or process namespace.');
        const live = await browserProcessIdentity(pid);
        if (live && live.startTime === owner.startTime) throw new Error('Browser profile still has a live owner.');
      };
      await proveDead(previous.pid, previous.owner);
      if (previous.browserPid !== undefined) await proveDead(previous.browserPid, previous.browserOwner);
      if (native.SingletonLock && native.SingletonLock !== `${current!.host}-${previous.browserPid}`)
        throw new Error('Chromium singleton lock does not match its recorded browser owner.');
      if (native.SingletonLock && await browserProcessIdentity(previous.browserPid!))
        throw new Error('Chromium singleton PID is live or was reused; its current ownership is unknown.');
      if (Object.keys(native).length && !native.SingletonLock)
        throw new Error('Chromium singleton records are incomplete; inspect their owner before restarting.');
      if (await readFile(lock, 'utf8') !== original) throw new Error('Browser profile ownership changed during recovery.');
      await clearBrowserProfileLocks(profile, native);
      await rm(lock, { force: true });
    } catch (error) {
      throw new BrowserServiceError('BROWSER_PROFILE_LOCKED', `${error instanceof Error ? error.message : 'Browser profile ownership is unknown'} Inspect its owner before restarting.`);
    }
  }

  async start(): Promise<BrowserState> {
    return this.control(() => this.startLocked());
  }

  private async startLocked(): Promise<BrowserState> {
    this.checkDisposed();
    if (this.state.status === 'ready') return this.snapshot();
    if (process.platform === 'linux' && process.getuid?.() === 0)
      throw new BrowserServiceError('BROWSER_REQUIRES_NON_ROOT', 'Run Chromium under a non-root service user with its sandbox enabled.', 503);
    this.state.status = 'starting';
    this.state.owner = 'none';
    delete this.state.error;
    this.notify();
    try {
      await this.compileWorker();
      if (this.browser) {
        const active = this.active;
        active?.controller.abort();
        await active?.done.catch(() => {});
        if (this.active === active) this.active = undefined;
        delete this.state.taskId;
        await this.runtime?.close({ keepTabs: true }).catch(() => {});
        this.runtime = undefined;
        this.runtimeTaskId = undefined;
        this.clearConnectionState(true);
        try {
          // The owned Chromium may still be alive after only its CDP socket failed.
          // Reattach first; do not destroy its tabs or repeat the interrupted action.
          return await this.connectOwnedBrowser();
        } catch (error) {
          this.trace('cdp-reconnect-failed', { errorName: error instanceof Error ? error.name : 'unknown' });
          this.clearConnectionState(false);
          await this.browser.close();
          this.browser = undefined;
        }
      }
      const profile = join(this.options.dataDir, 'browser', 'profile');
      await mkdir(profile, { recursive: true, mode: 0o700 });
      await this.recoverProfileLock(profile);
      this.browser = await openBrowser({
        kind: 'chromium', profileDir: profile,
        headless: process.env.BROWSER_HEADLESS !== 'false',
        ...(process.env.BROWSER_EXECUTABLE_PATH ? { executablePath: process.env.BROWSER_EXECUTABLE_PATH } : {}),
      });
      return await this.connectOwnedBrowser();
    } catch (error) {
      this.clearConnectionState(false);
      await this.browser?.close().catch(() => {});
      this.browser = undefined;
      this.state.status = 'error';
      this.state.owner = 'none';
      this.state.error = error instanceof Error ? error.message : String(error);
      this.notify();
      throw error;
    }
  }

  private clearConnectionState(keepActiveTab: boolean) {
    this.connection?.close();
    this.connection = undefined;
    this.pages.clear();
    this.attaching.clear();
    this.dialogs.clear();
    this.documents.clear();
    this.streamPage = undefined;
    this.streamGeneration = undefined;
    this.streamDocument = undefined;
    this.streamStartedAt = 0;
    this.authoritativeFrame = undefined;
    this.frameCapture = undefined;
    this.lastFrame = undefined;
    this.tabRefreshVersion++;
    this.state.tabs = [];
    if (!keepActiveTab) delete this.state.activeTabId;
    delete this.state.dialog;
    clearInterval(this.fallbackTimer);
    this.fallbackTimer = undefined;
  }

  private async connectOwnedBrowser(): Promise<BrowserState> {
    const connection = await CDP.connect(this.browser!.endpoint, 10_000);
    this.connection = connection;
    connection.observeCommand = (method, _params, sessionId) => {
      if (['Runtime.evaluate', 'Page.captureScreenshot', 'Page.startScreencast', 'Page.stopScreencast'].includes(method))
        this.trace('cdp-send', { method, targetId: sessionId && connection.targetForSession(sessionId) });
    };
    connection.observeResponse = (method, _params, _result, sessionId) => {
      if (['Runtime.evaluate', 'Page.captureScreenshot', 'Page.startScreencast', 'Page.stopScreencast'].includes(method))
        this.trace('cdp-response', { method, targetId: sessionId && connection.targetForSession(sessionId) });
    };
    connection.observeEvent = (method, params, sessionId) => this.onProtocolEvent(method, params, sessionId);
    await connection.send('Target.setDiscoverTargets', { discover: true });
    await this.refreshTabs();
    for (let attempt = 0; attempt < 10 && !this.state.tabs.length; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      await this.refreshTabs();
    }
    if (!this.state.tabs.length) {
      const { targetId } = await connection.send('Target.createTarget', { url: 'about:blank' });
      for (let attempt = 0; attempt < 10 && !this.state.tabs.some(tab => tab.id === targetId); attempt++) {
        await this.refreshTabs();
        if (!this.state.tabs.some(tab => tab.id === targetId)) await new Promise(resolve => setTimeout(resolve, 50));
      }
      if (!this.state.tabs.some(tab => tab.id === targetId))
        throw new BrowserServiceError('BROWSER_NO_TAB', 'Chromium did not expose its new tab after startup.', 503);
    }
    await Promise.all(this.state.tabs.map((tab) => this.attach(tab.id)));
    // Only an empty/new-tab profile receives a default homepage.
    if (this.state.tabs.length === 1 && /^(?:about:blank|chrome:\/\/newtab\/?|chrome:\/\/new-tab-page\/?)$/.test(this.state.tabs[0].url)) {
      try {
        await (await this.attach(this.state.tabs[0].id)).cdp('Page.navigate', { url: defaultHomeUrl });
        await this.refreshTabs();
      } catch { /* A network error must not make a usable browser fail to start. */ }
    }
    this.state.status = 'ready';
    this.state.owner = 'agent';
    this.state.generation++;
    this.notify();
    this.queueStream();
    return this.snapshot();
  }

  private async attach(targetId: string): Promise<Page> {
    const existing = this.pages.get(targetId);
    if (existing) return existing;
    let pending = this.attaching.get(targetId);
    if (!pending) {
      const connection = this.connection;
      if (!connection) throw new BrowserServiceError('BROWSER_UNAVAILABLE', 'Browser is not connected.', 503);
      pending = Page.attach(connection, targetId).then(async (page) => {
        await page.cdp('Emulation.setDeviceMetricsOverride', { ...viewport, deviceScaleFactor: 1, mobile: false });
        this.pages.set(targetId, page);
        return page;
      }).finally(() => this.attaching.delete(targetId));
      this.attaching.set(targetId, pending);
    }
    return pending;
  }

  private async refreshTabs() {
    const revision = ++this.tabRefreshVersion;
    const connection = this.connection;
    if (!connection) return;
    const { targetInfos } = await connection.send('Target.getTargets');
    const tabs = await Promise.all(targetInfos.filter((tab) => tab.type === 'page').map(async (tab) => {
      // Chrome's target list can retain provisional metadata after a native form submission.
      if (!tab.url) {
        try { tab = (await connection.send('Target.getTargetInfo', { targetId: tab.targetId })).targetInfo; } catch {}
        const page = this.pages.get(tab.targetId);
        if (!tab.url && page) {
          try { tab = { ...tab, url: (await page.cdp('Page.getFrameTree')).frameTree.frame.url }; } catch {}
        }
      }
      const previous = this.state.tabs.find(item => item.id === tab.targetId);
      return { id: tab.targetId, title: tab.title, url: tab.url || previous?.url || 'about:blank' };
    }));
    if (this.connection !== connection || this.tabRefreshVersion !== revision) return;
    const changed = JSON.stringify(tabs) !== JSON.stringify(this.state.tabs);
    this.state.tabs = tabs;
    if (!tabs.some((tab) => tab.id === this.state.activeTabId)) this.setActive(tabs[0]?.id);
    if (changed) this.notify();
  }

  private setActive(targetId: string | undefined) {
    if (this.state.activeTabId === targetId) return;
    this.state.activeTabId = targetId;
    this.state.dialog = targetId ? this.dialogs.get(targetId) : undefined;
    this.state.generation++;
    this.notify();
    this.queueStream();
  }

  private onProtocolEvent(method: string, value: unknown, sessionId?: string) {
    const params = value as Record<string, unknown>;
    if (method === 'Page.screencastFrame' && sessionId) {
      this.trace('native-frame', { targetId: this.connection?.targetForSession(sessionId) });
      void this.connection?.send('Page.screencastFrameAck', { sessionId: params.sessionId as number }, sessionId).catch(() => {});
      const frameTime = (params.metadata as { timestamp?: number } | undefined)?.timestamp;
      if (this.streamPage?.sessionId === sessionId && this.streamPage.targetId === this.state.activeTabId &&
          this.streamGeneration === this.state.generation && this.streamDocument === this.documents.get(this.streamPage.targetId) &&
          this.authoritativeFrame?.targetId === this.streamPage.targetId &&
          this.authoritativeFrame.generation === this.state.generation &&
          this.authoritativeFrame.document === this.streamDocument &&
          typeof frameTime === 'number' && frameTime >= this.streamStartedAt &&
          typeof params.data === 'string') {
        const dimensions = imageDimensions(Buffer.from(params.data, 'base64'));
        if (dimensions) this.emitFrame({ type: 'frame', data: params.data, mimeType: 'image/jpeg', ...dimensions, generation: this.state.generation });
      }
      return;
    }
    if (method === 'Target.targetCreated') {
      const tab = params.targetInfo as { targetId?: string; type?: string } | undefined;
      if (tab?.type === 'page' && tab.targetId) {
        void this.attach(tab.targetId).catch(() => {});
        void this.refreshTabs().catch(() => {});
      }
      return;
    }
    if (method === 'Target.targetDestroyed') {
      const targetId = params.targetId as string;
      this.pages.delete(targetId);
      this.dialogs.delete(targetId);
      this.documents.delete(targetId);
      void this.refreshTabs().catch(() => {});
      return;
    }
    if (method === 'Target.targetInfoChanged') {
      void this.refreshTabs().catch(() => {});
      return;
    }
    if (!sessionId) return;
    const targetId = this.connection?.targetForSession(sessionId);
    if (!targetId) return;
    if (method === 'Page.frameNavigated' && !(params.frame as { parentId?: string } | undefined)?.parentId) {
      const { url, loaderId } = params.frame as { url?: string; loaderId?: string };
      const previousDocument = this.documents.get(targetId);
      if (loaderId && previousDocument !== loaderId) {
        this.documents.set(targetId, loaderId);
        if (this.state.activeTabId === targetId) {
          this.state.generation++;
          this.notify();
        }
      }
      const tab = this.state.tabs.find(item => item.id === targetId);
      if (tab && url) { tab.url = url; this.notify(); }
      if (this.state.activeTabId === targetId) this.queueStream();
      void this.refreshTabs().catch(() => {});
    } else if (method === 'Page.domContentEventFired' || method === 'Page.loadEventFired') {
      void this.refreshTabs().catch(() => {});
      if (this.state.activeTabId === targetId) this.queueStream();
    }
    if (method === 'Page.javascriptDialogOpening') {
      const dialog: BrowserDialog = {
        type: String(params.type), message: String(params.message),
        ...(typeof params.defaultPrompt === 'string' ? { defaultPrompt: params.defaultPrompt } : {}),
      };
      this.dialogs.set(targetId, dialog);
      this.setActive(targetId);
      this.state.dialog = dialog;
      this.notify();
    } else if (method === 'Page.javascriptDialogClosed') {
      this.dialogs.delete(targetId);
      if (this.state.activeTabId === targetId) delete this.state.dialog;
      this.notify();
      if (this.state.activeTabId === targetId) this.queueStream();
    }
  }

  async takeover(generation?: number): Promise<BrowserState> {
    return this.control(async () => {
      // Start and transfer ownership in one control transaction: the supplied
      // stopped-state version stays valid, while another caller's version never does.
      this.checkDisposed();
      this.checkGeneration(generation);
      await this.startLocked();
      if (this.state.owner === 'user') return this.snapshot();
      this.state.owner = 'none';
      this.state.generation++;
      this.notify();
      this.active?.controller.abort();
      try {
        await this.options.beforeTakeover?.();
        await this.active?.done.catch(() => {});
      } catch (error) {
        this.state.owner = 'agent';
        this.state.generation++;
        this.notify();
        throw error;
      }
      this.state.owner = 'user';
      delete this.state.taskId;
      this.state.generation++;
      this.notify();
      this.queueStream();
      return this.snapshot();
    });
  }

  async release(generation?: number): Promise<BrowserState> {
    return this.control(async () => {
      this.checkDisposed();
      this.checkGeneration(generation);
      if (this.state.status === 'ready' && this.state.owner === 'agent') return this.snapshot();
      this.checkHuman(generation);
      if (this.state.dialog)
        throw new BrowserServiceError('BROWSER_DIALOG_PENDING', 'Resolve the browser dialog before releasing control.');
      await this.refreshTabs();
      if (this.state.activeTabId) await (await this.attach(this.state.activeTabId)).snapshot();
      await this.runtime?.close({ keepTabs: true });
      this.runtime = undefined;
      this.runtimeTaskId = undefined;
      this.state.owner = 'agent';
      this.state.generation++;
      this.notify();
      this.queueStream();
      return this.snapshot();
    });
  }

  async navigate(url: string, generation?: number): Promise<BrowserState> {
    return this.control(async () => {
      this.checkHuman(generation);
      const href = this.navigationUrl(url);
      const page = await this.activePage();
      const navigation: PendingNavigation = { targetId: page.targetId, generation: this.state.generation };
      this.pendingNavigation = navigation;
      try {
        const previousDocument = this.documents.get(page.targetId);
        const destination = await page.goto(href);
        await this.waitForMainDocument(page, previousDocument, destination.url);
        await this.refreshTabs();
        this.queueStream();
        return this.snapshot();
      } catch (error) {
        if (error instanceof Error && /^Navigation failed:\s*net::ERR_ABORTED\b/.test(error.message) &&
            await navigation.cancelledBeforeUnload)
          throw new BrowserServiceError('BROWSER_NAVIGATION_CANCELLED', '已取消离开当前网页。', 409);
        throw error;
      } finally {
        if (this.pendingNavigation === navigation) this.pendingNavigation = undefined;
      }
    });
  }

  private async waitForMainDocument(page: Page, previousDocument: string | undefined, expectedUrl: string) {
    const deadline = Date.now() + 10_000;
    while (Date.now() < deadline) {
      const { frameTree } = await page.cdp('Page.getFrameTree');
      const frame = frameTree.frame;
      if ((frame.loaderId && frame.loaderId !== previousDocument) || frame.url === expectedUrl) {
        this.onProtocolEvent('Page.frameNavigated', { frame }, page.sessionId);
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    throw new BrowserServiceError('BROWSER_NAVIGATION_PENDING', 'The page has not committed its new document. Refresh its state before retrying.', 503);
  }

  private navigationUrl(url: string): string {
    return normalizeBrowserNavigationUrl(url);
  }

  async history(direction: 'back' | 'forward', generation?: number): Promise<BrowserState> {
    return this.control(async () => {
      this.checkHuman(generation);
      if (direction !== 'back' && direction !== 'forward')
        throw new BrowserServiceError('INVALID_BROWSER_HISTORY', 'Choose back or forward.', 400);
      const page = await this.activePage();
      const history = await page.cdp('Page.getNavigationHistory');
      const index = history.currentIndex + (direction === 'back' ? -1 : 1);
      const entry = history.entries[index];
      if (!entry) throw new BrowserServiceError('BROWSER_HISTORY_EDGE', 'There is no page in that history direction.');
      const previousDocument = this.documents.get(page.targetId);
      await page.cdp('Page.navigateToHistoryEntry', { entryId: entry.id });
      await this.waitForMainDocument(page, previousDocument, entry.url);
      await this.refreshTabs();
      this.queueStream();
      return this.snapshot();
    });
  }

  async reload(generation?: number): Promise<BrowserState> {
    return this.control(async () => {
      this.checkHuman(generation);
      const page = await this.activePage();
      const previousDocument = this.documents.get(page.targetId);
      await page.cdp('Page.reload');
      await this.waitForMainDocument(page, previousDocument, '');
      await this.refreshTabs();
      this.queueStream();
      return this.snapshot();
    });
  }

  async newTab(url?: string, generation?: number): Promise<BrowserState> {
    return this.control(async () => {
      this.checkHuman(generation);
      const href = url === undefined ? defaultHomeUrl : this.navigationUrl(url);
      const { targetId } = await this.connection!.send('Target.createTarget', { url: href });
      await this.attach(targetId);
      await this.connection!.send('Target.activateTarget', { targetId });
      await this.refreshTabs();
      this.setActive(targetId);
      return this.snapshot();
    });
  }

  async closeTab(tabId: string, generation?: number): Promise<BrowserState> {
    return this.control(async () => {
      this.checkHuman(generation);
      await this.refreshTabs();
      if (!this.state.tabs.some(tab => tab.id === tabId))
        throw new BrowserServiceError('BROWSER_UNKNOWN_TAB', 'The selected browser tab no longer exists.');
      if (this.state.tabs.length === 1) {
        const { targetId } = await this.connection!.send('Target.createTarget', { url: defaultHomeUrl });
        await this.attach(targetId);
        await this.connection!.send('Target.activateTarget', { targetId });
        this.setActive(targetId);
      } else if (this.state.activeTabId === tabId) {
        const next = this.state.tabs.find(tab => tab.id !== tabId)!;
        await this.connection!.send('Target.activateTarget', { targetId: next.id });
        this.setActive(next.id);
      }
      const { success } = await this.connection!.send('Target.closeTarget', { targetId: tabId });
      if (!success) throw new BrowserServiceError('BROWSER_CLOSE_FAILED', 'The browser could not close this tab.');
      this.pages.delete(tabId);
      this.dialogs.delete(tabId);
      this.documents.delete(tabId);
      for (let attempt = 0; attempt < 20; attempt++) {
        await this.refreshTabs();
        if (!this.state.tabs.some(tab => tab.id === tabId)) break;
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      if (this.state.tabs.some(tab => tab.id === tabId))
        throw new BrowserServiceError('BROWSER_CLOSE_PENDING', 'The tab has not finished closing; refresh its state before retrying.', 503);
      this.queueStream();
      return this.snapshot();
    });
  }

  async selectTab(tabId: string, generation?: number): Promise<BrowserState> {
    return this.control(async () => {
      this.checkHuman(generation);
      await this.refreshTabs();
      if (!this.state.tabs.some((tab) => tab.id === tabId))
        throw new BrowserServiceError('BROWSER_UNKNOWN_TAB', 'The selected browser tab no longer exists.');
      await this.connection!.send('Target.activateTarget', { targetId: tabId });
      await this.attach(tabId);
      this.setActive(tabId);
      return this.snapshot();
    });
  }

  private async activePage(): Promise<Page> {
    if (!this.state.activeTabId) throw new BrowserServiceError('BROWSER_NO_TAB', 'No active browser tab is available.');
    return this.attach(this.state.activeTabId);
  }

  private async getRuntime(taskId: string): Promise<BrowserRuntime> {
    if (!taskIdPattern.test(taskId)) throw new BrowserServiceError('INVALID_TASK_ID', 'Invalid task workspace identifier.', 400);
    if (this.runtime && this.runtimeTaskId === taskId) return this.runtime;
    await this.runtime?.close({ keepTabs: 'current' });
    const workspace = join(this.options.workspaceDir ?? process.env.BROWSER_WORKSPACE_DIR ?? join(this.options.dataDir, 'workspaces'), taskId);
    await mkdir(workspace, { recursive: true, mode: 0o700 });
    await this.connection!.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: workspace, eventsEnabled: true });
    const runtime = new BrowserRuntime({
      mode: 'ultrafast', endpoint: this.browser!.endpoint, workspace,
      ...(this.state.activeTabId ? { targetId: this.state.activeTabId } : {}),
      operationTimeoutMs: 15_000, maxOutputChars: 12_000,
      browserSwitching: false, dedicatedBrowser: true,
    }, await workerExecutable(), await this.compileWorker());
    runtime.onAction = (event) => this.setActive(event.targetId);
    this.runtime = runtime;
    this.runtimeTaskId = taskId;
    return runtime;
  }

  async execute(code: string, options: { taskId: string; signal: AbortSignal; timeoutMs?: number }): Promise<CellResult> {
    this.checkDisposed();
    if (typeof code !== 'string' || !code.trim() || code.length > 100_000)
      throw new BrowserServiceError('INVALID_BROWSER_CODE', 'Browser code must contain between 1 and 100000 characters.', 400);
    const timeoutMs = options.timeoutMs ?? 30_000;
    if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120_000)
      throw new BrowserServiceError('INVALID_BROWSER_TIMEOUT', 'Browser timeout must be between 1 and 120000 milliseconds.', 400);
    options.signal.throwIfAborted();
    await this.start();
    const cell = await this.control(async () => {
      if (this.state.owner !== 'agent')
        throw new BrowserServiceError('BROWSER_NOT_OWNED', 'The browser is under user control. Release it before running the task.');
      if (this.active) throw new BrowserServiceError('BROWSER_BUSY', 'Another browser cell is still running.');
      options.signal.throwIfAborted();
      const runtime = await this.getRuntime(options.taskId);
      const controller = new AbortController();
      const done = runtime.execute(code, timeoutMs, AbortSignal.any([options.signal, controller.signal]));
      const active: ActiveCell = { controller, done, taskId: options.taskId };
      this.active = active;
      this.state.taskId = options.taskId;
      this.notify();
      return { active, runtime };
    });
    try {
      const result = await cell.active.done;
      if (cell.runtime.currentTarget) this.setActive(cell.runtime.currentTarget);
      return result;
    } finally {
      if (this.active === cell.active) {
        this.active = undefined;
        delete this.state.taskId;
        this.notify();
      }
      await this.refreshTabs().catch(() => {});
    }
  }

  async observe(options: { taskId?: string; signal?: AbortSignal } = {}): Promise<string> {
    const result = await this.execute('await bu.state()', {
      taskId: options.taskId ?? this.runtimeTaskId ?? 'observation',
      signal: options.signal ?? new AbortController().signal,
    });
    return result.text;
  }

  async screenshot(): Promise<BrowserFrame> {
    this.checkDisposed();
    if (this.state.status !== 'ready') throw new BrowserServiceError('BROWSER_UNAVAILABLE', 'Start the browser before capturing its screen.', 503);
    const generation = this.state.generation;
    const targetId = this.state.activeTabId;
    if (!targetId) throw new BrowserServiceError('BROWSER_NO_TAB', 'No active browser tab is available.');
    const document = this.documents.get(targetId);
    if (this.frameCapture?.generation === generation && this.frameCapture.targetId === targetId && this.frameCapture.document === document) {
      this.trace('capture-shared', { targetId });
      return this.frameCapture.promise;
    }
    this.trace('capture-start', { targetId });
    const promise = (async () => {
      const page = await this.attach(targetId);
      const bytes = await page.screenshot({ quality: 75, viewport });
      if (this.documents.get(targetId) !== document)
        throw new BrowserServiceError('STALE_BROWSER_SCREENSHOT', 'The browser navigated during capture. Request its current screen.', 409);
      const dimensions = imageDimensions(bytes);
      if (!dimensions) throw new BrowserServiceError('BROWSER_SCREENSHOT_ERROR', 'Browser returned an invalid screenshot.', 502);
      if (this.state.generation === generation && this.state.activeTabId === targetId && this.documents.get(targetId) === document)
        this.authoritativeFrame = { targetId, generation, document };
      return { type: 'frame' as const, data: bytes.toString('base64'), mimeType: 'image/jpeg', ...dimensions, generation };
    })().then(frame => {
      this.trace('capture-complete', { targetId, frameGeneration: frame.generation });
      return frame;
    }, error => {
      this.trace('capture-failed', { targetId, errorName: error instanceof Error ? error.name : 'unknown',
        errorCode: error instanceof BrowserServiceError ? error.code : undefined });
      throw error;
    }).finally(() => { if (this.frameCapture?.promise === promise) this.frameCapture = undefined; });
    this.frameCapture = { targetId, generation, document, promise };
    return promise;
  }

  async input(input: BrowserInput): Promise<void> {
    return this.control(async () => {
      if (!input || !Number.isSafeInteger(input.generation) || input.generation < 0)
        throw new BrowserServiceError('INVALID_BROWSER_GENERATION', 'Browser input needs the current control generation.', 400);
      this.checkHuman(input.generation);
      if (input.tabId) {
        await this.refreshTabs();
        if (!this.state.tabs.some((tab) => tab.id === input.tabId))
          throw new BrowserServiceError('BROWSER_UNKNOWN_TAB', 'The selected browser tab no longer exists.');
        this.checkHuman(input.generation);
        if (input.tabId !== this.state.activeTabId)
          throw new BrowserServiceError('BROWSER_TAB_NOT_ACTIVE', 'Select the browser tab before sending input.', 409);
      }
      const targetId = this.state.activeTabId;
      const page = await this.activePage();
      this.checkHuman(input.generation);
      if (targetId !== this.state.activeTabId || page.targetId !== targetId)
        throw new BrowserServiceError('STALE_BROWSER_GENERATION', 'Browser tab changed before input could be sent.', 409);
      const modifiers = input.modifiers ?? 0;
      if (!Number.isSafeInteger(modifiers) || modifiers < 0 || modifiers > 15)
        throw new BrowserServiceError('INVALID_BROWSER_INPUT', 'Invalid keyboard modifiers.', 400);
      const point = (required = false) => {
        if (required && (input.x === undefined || input.y === undefined))
          throw new BrowserServiceError('INVALID_BROWSER_INPUT', 'Pointer input needs both x and y coordinates.', 400);
        const x = input.x ?? viewport.width / 2;
        const y = input.y ?? viewport.height / 2;
        if (![x, y].every(Number.isFinite) || x < 0 || y < 0 || x > viewport.width || y > viewport.height)
          throw new BrowserServiceError('INVALID_BROWSER_INPUT', 'Pointer coordinates are outside the browser viewport.', 400);
        return { x, y };
      };
      switch (input.type) {
        case 'click': {
          const { x, y } = point(true);
          await page.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, modifiers });
          await page.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, modifiers, button: 'left', clickCount: 1 });
          await page.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, modifiers, button: 'left', clickCount: 1 });
          break;
        }
        case 'move': await page.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point(true), modifiers }); break;
        case 'scroll': {
          const deltaX = input.deltaX ?? 0;
          const deltaY = input.deltaY ?? 0;
          if (![deltaX, deltaY].every(Number.isFinite) || Math.abs(deltaX) + Math.abs(deltaY) > 100_000)
            throw new BrowserServiceError('INVALID_BROWSER_INPUT', 'Invalid scroll distance.', 400);
          await page.cdp('Input.dispatchMouseEvent', { type: 'mouseWheel', ...point(), modifiers, deltaX, deltaY });
          break;
        }
        case 'text':
          if (typeof input.text !== 'string' || input.text.length > 64_000)
            throw new BrowserServiceError('INVALID_BROWSER_INPUT', 'Text input must be a string shorter than 64000 characters.', 400);
          await page.cdp('Input.insertText', { text: input.text });
          break;
        case 'key': {
          const key = input.key;
          if (typeof key !== 'string' || !key || [...key].length > 32)
            throw new BrowserServiceError('INVALID_BROWSER_INPUT', 'Invalid browser key.', 400);
          const named = keys[key];
          if (!named && [...key].length !== 1)
            throw new BrowserServiceError('INVALID_BROWSER_INPUT', 'Unsupported browser key.', 400);
          const value = named ?? { code: /^[a-z]$/i.test(key) ? `Key${key.toUpperCase()}` : '', keyCode: key.toUpperCase().charCodeAt(0), text: key };
          const event = { key, code: value.code, windowsVirtualKeyCode: value.keyCode, modifiers };
          await page.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...event });
          if (value.text && !(modifiers & (1 | 2 | 4)))
            await page.cdp('Input.dispatchKeyEvent', { type: 'char', ...event, text: value.text, unmodifiedText: value.text });
          await page.cdp('Input.dispatchKeyEvent', { type: 'keyUp', ...event });
          break;
        }
        default: throw new BrowserServiceError('INVALID_BROWSER_INPUT', 'Unsupported browser input type.', 400);
      }
    });
  }

  async handleDialog(options: { accept: boolean; promptText?: string; generation: number }): Promise<void> {
    this.checkDisposed();
    if (!options || !Number.isSafeInteger(options.generation) || options.generation < 0)
      throw new BrowserServiceError('INVALID_BROWSER_GENERATION', 'Dialog input needs the current control generation.', 400);
    this.checkGeneration(options.generation);
    if (this.state.status !== 'ready' || this.state.owner === 'none' || !this.state.dialog)
      throw new BrowserServiceError('BROWSER_NO_DIALOG', 'There is no current browser dialog under active control.');
    if (typeof options.accept !== 'boolean' || (options.promptText !== undefined && typeof options.promptText !== 'string'))
      throw new BrowserServiceError('INVALID_BROWSER_INPUT', 'Invalid browser dialog decision.', 400);
    const dialog = this.state.dialog;
    const page = await this.activePage();
    this.checkGeneration(options.generation);
    const current = this.snapshot();
    if (current.status !== 'ready' || current.owner === 'none' || this.state.dialog !== dialog)
      throw new BrowserServiceError('BROWSER_NO_DIALOG', 'Browser control or the pending dialog changed.');
    const navigation = this.pendingNavigation;
    let resolveCancellation: ((confirmed: boolean) => void) | undefined;
    let cancellation: Promise<boolean> | undefined;
    if (!options.accept && dialog.type === 'beforeunload' && navigation?.targetId === page.targetId &&
        navigation.generation === options.generation && !navigation.cancelledBeforeUnload) {
      cancellation = new Promise<boolean>(resolve => { resolveCancellation = resolve; });
      navigation.cancelledBeforeUnload = cancellation;
    }
    // A native click may wait for this dialog while holding the ordinary input queue.
    try {
      await page.cdp('Page.handleJavaScriptDialog', { accept: options.accept, ...(options.promptText !== undefined ? { promptText: options.promptText } : {}) });
      resolveCancellation?.(true);
    } catch (error) {
      resolveCancellation?.(false);
      if (navigation && cancellation && navigation.cancelledBeforeUnload === cancellation)
        delete navigation.cancelledBeforeUnload;
      throw error;
    }
    this.dialogs.delete(page.targetId);
    if (this.state.dialog === dialog) delete this.state.dialog;
    this.notify();
  }

  private emitFrame(frame: BrowserFrame) {
    this.trace('emit-frame', { frameGeneration: frame.generation });
    if (frame.generation !== this.state.generation || frame === this.lastFrame) return;
    this.lastFrame = frame;
    this.lastFrameAt = Date.now();
    for (const listener of this.frameListeners) {
      try { listener(frame); } catch { /* Disconnecting viewers cannot interrupt the browser. */ }
    }
  }

  subscribeFrames(listener: (frame: BrowserFrame) => void): () => void {
    this.frameListeners.add(listener);
    this.trace('subscribe');
    this.queueStream();
    return () => {
      this.frameListeners.delete(listener);
      this.trace('unsubscribe');
      if (!this.frameListeners.size) this.queueStream();
    };
  }

  private queueStream() {
    this.trace('queue-stream', { timerActive: Boolean(this.fallbackTimer) });
    if (this.frameListeners.size && this.state.status === 'ready') {
      this.startFrameFallback();
      // Capturing the selected page can wake its compositor while native stream commands wait.
      void this.screenshot().then(frame => this.emitFrame(frame)).catch(() => {});
    } else {
      clearInterval(this.fallbackTimer);
      this.fallbackTimer = undefined;
    }
    this.streamQueue = this.streamQueue.then(() => this.updateStream()).catch(() => {
      if (this.frameListeners.size && this.state.status === 'ready') this.startFrameFallback();
    });
  }

  private async updateStream() {
    this.trace('update-stream');
    const wanted = this.frameListeners.size && this.state.status === 'ready' ? this.state.activeTabId : undefined;
    const generation = this.state.generation;
    const document = wanted ? this.documents.get(wanted) : undefined;
    if (!wanted || this.streamPage?.targetId !== wanted || this.streamGeneration !== generation || this.streamDocument !== document) {
      const previous = this.streamPage;
      this.streamPage = undefined;
      this.streamGeneration = undefined;
      this.streamDocument = undefined;
      this.streamStartedAt = 0;
      if (previous) await previous.cdp('Page.stopScreencast').catch(() => {});
    }
    if (!wanted) return;
    if (this.state.status !== 'ready' || this.state.activeTabId !== wanted || this.state.generation !== generation || this.documents.get(wanted) !== document) return;
    const page = await this.attach(wanted);
    if (!this.streamPage) {
      const startedAt = Date.now() / 1000;
      await page.cdp('Page.startScreencast', { format: 'jpeg', quality: 70, maxWidth: viewport.width, maxHeight: viewport.height, everyNthFrame: 1 });
      if (this.state.status !== 'ready' || this.state.activeTabId !== wanted || this.state.generation !== generation || this.documents.get(wanted) !== document) {
        await page.cdp('Page.stopScreencast').catch(() => {});
        return;
      }
      this.streamPage = page;
      this.streamGeneration = generation;
      this.streamDocument = document;
      this.streamStartedAt = startedAt;
    }
  }

  private startFrameFallback() {
    if (this.fallbackTimer) return;
    this.fallbackTimer = setInterval(() => {
      this.trace('fallback-tick', { status: this.state.status });
      if (!this.frameListeners.size || this.state.status !== 'ready' || Date.now() - this.lastFrameAt < 1500) return;
      void this.screenshot().then((frame) => this.emitFrame(frame)).catch(() => {});
    }, 750);
    this.fallbackTimer.unref();
  }

  dispose(): Promise<void> {
    if (this.disposing) return this.disposing;
    this.disposed = true;
    this.active?.controller.abort();
    this.disposing = this.control(async () => {
      await this.active?.done.catch(() => {});
      this.frameListeners.clear();
      clearInterval(this.fallbackTimer);
      await this.streamPage?.cdp('Page.stopScreencast').catch(() => {});
      this.streamPage = undefined;
      this.streamGeneration = undefined;
      this.streamDocument = undefined;
      this.streamStartedAt = 0;
      this.authoritativeFrame = undefined;
      await this.runtime?.close({ keepTabs: true }).catch(() => {});
      this.runtime = undefined;
      this.runtimeTaskId = undefined;
      this.connection?.close();
      this.connection = undefined;
      await this.browser?.close();
      this.browser = undefined;
      this.pages.clear();
      this.attaching.clear();
      this.dialogs.clear();
      this.documents.clear();
      this.state = { status: 'stopped', owner: 'none', generation: this.state.generation + 1, tabs: [], viewport: { ...viewport } };
      this.notify();
    });
    return this.disposing;
  }
}
