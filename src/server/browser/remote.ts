import WebSocket from 'ws';
import type { BrowserFrame, BrowserInput, BrowserState } from '../../shared/contracts.js';
import type { CellResult } from '../../../vendor/browser-use/src/protocol.js';
import type { BrowserServiceClient, BrowserServiceOptions } from './index.js';
import { BrowserServiceError } from './errors.js';

export class RemoteBrowserService implements BrowserServiceClient {
  private cached: BrowserState = {
    status: 'stopped', owner: 'none', generation: 0, revision: 0, tabs: [], viewport: { width: 1440, height: 900 },
  };
  private socket: WebSocket | undefined;
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly listeners = new Set<(frame: BrowserFrame) => void>();
  private disposed = false;
  private closing: Promise<void> | undefined;
  private readonly baseUrl: URL;

  constructor(private readonly options: BrowserServiceOptions & { remoteUrl: string; remoteToken: string }) {
    this.baseUrl = new URL(options.remoteUrl);
    if (!['http:', 'https:'].includes(this.baseUrl.protocol) || this.baseUrl.username || this.baseUrl.password)
      throw new BrowserServiceError('INVALID_BROWSER_EXECUTOR_URL', 'Browser executor needs a valid HTTP or HTTPS URL.', 503);
    if (options.onChange) this.connectEvents();
  }

  private update(state: BrowserState) {
    if (state.generation < this.cached.generation ||
      (state.generation === this.cached.generation && (state.revision ?? 0) < (this.cached.revision ?? 0))) return;
    const changed = JSON.stringify(state) !== JSON.stringify(this.cached);
    this.cached = state;
    if (changed) {
      try { this.options.onChange?.(structuredClone(state)); } catch { /* Status observers cannot change request delivery. */ }
    }
  }

  private async request<T>(path: string, body?: unknown, options: { signal?: AbortSignal; timeoutMs?: number } = {}): Promise<T> {
    if (this.disposed && path !== 'stop') throw new BrowserServiceError('BROWSER_CLOSED', 'Browser proxy has stopped.');
    const timeout = AbortSignal.timeout(options.timeoutMs ?? 20_000);
    let response: Response;
    try {
      response = await fetch(new URL(`/internal/${path}`, this.baseUrl), {
        method: body === undefined ? 'GET' : 'POST', redirect: 'error',
        headers: { authorization: `Bearer ${this.options.remoteToken}`, ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: options.signal ? AbortSignal.any([options.signal, timeout]) : timeout,
      });
    } catch {
      if (options.signal?.aborted) throw new BrowserServiceError('BROWSER_EXECUTION_CANCELLED', 'Browser execution cancelled. Inspect the page before retrying.');
      throw new BrowserServiceError('BROWSER_EXECUTOR_UNAVAILABLE', 'Browser executor is unavailable or the request timed out. Inspect state before retrying.', 503);
    }
    let value: unknown;
    try { value = await response.json(); }
    catch { throw new BrowserServiceError('BROWSER_EXECUTOR_RESPONSE', 'Browser executor returned an invalid response.', 502); }
    if (!response.ok) {
      const error = (value as { error?: { code?: string; message?: string } })?.error;
      throw new BrowserServiceError(error?.code ?? 'BROWSER_EXECUTOR_ERROR', error?.message ?? 'Browser executor rejected the request.', response.status);
    }
    return value as T;
  }

  async status(): Promise<BrowserState> {
    try { this.update(await this.request<BrowserState>('status', undefined, { timeoutMs: 4000 })); }
    catch (error) {
      // A relay timeout does not prove Chromium lost its profile or ownership.
      this.update({ ...this.cached, transportError: error instanceof Error ? error.message : 'Browser executor is unavailable.' });
    }
    return structuredClone(this.cached);
  }

  async start(): Promise<BrowserState> {
    const state = await this.request<BrowserState>('start', {}, { timeoutMs: 60_000 });
    this.update(state);
    this.connectEvents();
    return structuredClone(this.cached);
  }

  async takeover(generation?: number): Promise<BrowserState> {
    const before = await this.request<BrowserState>('status', undefined, { timeoutMs: 5000 });
    this.update(before);
    if (generation !== undefined && generation !== before.generation)
      throw new BrowserServiceError('STALE_BROWSER_GENERATION', 'Browser control changed. Refresh before sending input.');
    let current = before;
    if (before.owner !== 'user') {
      await this.options.beforeTakeover?.();
      current = await this.request<BrowserState>('status', undefined, { timeoutMs: 5000 });
      this.update(current);
      if ((current.owner !== 'agent' && !(before.owner === 'none' && current.owner === 'none')) ||
          current.status === 'error')
        throw new BrowserServiceError('STALE_BROWSER_GENERATION', 'Browser control changed while pausing the task. Refresh before retrying.');
    }
    const state = await this.request<BrowserState>('takeover', { generation: current.generation }, { timeoutMs: 60_000 });
    this.update(state);
    return structuredClone(this.cached);
  }

  async release(generation?: number): Promise<BrowserState> {
    const state = await this.request<BrowserState>('release', { generation });
    this.update(state);
    return structuredClone(this.cached);
  }

  async navigate(url: string, generation?: number): Promise<BrowserState> {
    const state = await this.request<BrowserState>('navigate', { url, generation });
    this.update(state);
    return structuredClone(this.cached);
  }

  async selectTab(tabId: string, generation?: number): Promise<BrowserState> {
    const state = await this.request<BrowserState>('tab', { tabId, generation });
    this.update(state);
    return structuredClone(this.cached);
  }

  async history(direction: 'back' | 'forward', generation?: number): Promise<BrowserState> {
    const state = await this.request<BrowserState>('history', { direction, generation });
    this.update(state);
    return structuredClone(this.cached);
  }

  async reload(generation?: number): Promise<BrowserState> {
    const state = await this.request<BrowserState>('reload', { generation });
    this.update(state);
    return structuredClone(this.cached);
  }

  async newTab(url?: string, generation?: number): Promise<BrowserState> {
    const state = await this.request<BrowserState>('tab/new', { url, generation });
    this.update(state);
    return structuredClone(this.cached);
  }

  async closeTab(tabId: string, generation?: number): Promise<BrowserState> {
    const state = await this.request<BrowserState>('tab/close', { tabId, generation });
    this.update(state);
    return structuredClone(this.cached);
  }

  observe(options: { taskId?: string; signal?: AbortSignal } = {}): Promise<string> {
    return this.request<{ text: string }>('observe', { taskId: options.taskId }, options).then((result) => result.text);
  }

  execute(code: string, options: { taskId: string; signal: AbortSignal; timeoutMs?: number }): Promise<CellResult> {
    return this.request<CellResult>('execute', { code, taskId: options.taskId, timeoutMs: options.timeoutMs }, {
      signal: options.signal, timeoutMs: (options.timeoutMs ?? 30_000) + 25_000,
    });
  }

  screenshot(): Promise<BrowserFrame> {
    return this.request<BrowserFrame>('screenshot');
  }

  input(input: BrowserInput): Promise<void> {
    return this.request('input', input).then(() => {});
  }

  handleDialog(options: { accept: boolean; promptText?: string; generation: number }): Promise<void> {
    return this.request('dialog', options).then(() => {});
  }

  subscribeFrames(listener: (frame: BrowserFrame) => void): () => void {
    const wasEmpty = !this.listeners.size;
    this.listeners.add(listener);
    if (wasEmpty) this.reconnectEvents();
    return () => {
      this.listeners.delete(listener);
      if (!this.listeners.size) this.reconnectEvents();
    };
  }

  private reconnectEvents() {
    if (this.socket) {
      const previous = this.socket;
      this.socket = undefined;
      previous.close();
    }
    this.connectEvents();
  }

  private connectEvents() {
    if (this.disposed || this.socket || (!this.options.onChange && !this.listeners.size)) return;
    clearTimeout(this.reconnectTimer);
    const url = new URL('/internal/stream', this.baseUrl);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.searchParams.set('frames', this.listeners.size ? '1' : '0');
    const socket = new WebSocket(url, { headers: { authorization: `Bearer ${this.options.remoteToken}` }, handshakeTimeout: 5000, maxPayload: 4 * 1024 * 1024 });
    this.socket = socket;
    socket.on('message', (data) => {
      if (this.socket !== socket) return;
      try {
        const event = JSON.parse(String(data)) as { type: 'state'; state: BrowserState } | BrowserFrame | { type: 'error'; message: string };
        if (event.type === 'state' && event.state) this.update(event.state);
        else if (event.type === 'frame') {
          if (process.env.BROWSER_STREAM_DIAGNOSTICS === 'true')
            console.error(JSON.stringify({ browserRelay: { event: 'remote-frame', at: Date.now(), generation: event.generation, listeners: this.listeners.size } }));
          for (const listener of this.listeners) {
            try { listener(event); } catch { /* Viewers do not own the executor. */ }
          }
        }
      } catch { socket.close(); }
    });
    socket.on('error', () => {});
    socket.on('close', () => {
      if (this.socket !== socket) return;
      this.socket = undefined;
      if (!this.disposed) {
        this.reconnectTimer = setTimeout(() => this.connectEvents(), 1500);
        this.reconnectTimer.unref();
      }
    });
  }

  dispose(): Promise<void> {
    if (this.closing) return this.closing;
    this.disposed = true;
    clearTimeout(this.reconnectTimer);
    this.socket?.close();
    this.socket = undefined;
    this.listeners.clear();
    this.closing = this.request('stop', {}, { timeoutMs: 10_000 }).then(() => {});
    return this.closing;
  }
}
