import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import { timingSafeEqual } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import type { BrowserInput, BrowserState } from '../../shared/contracts.js';
import { BrowserService } from './index.js';
import type { BrowserServiceOptions } from './index.js';
import { BrowserServiceError } from './errors.js';

export async function createBrowserSidecar(options: { dataDir: string; workspaceDir?: string; token: string }) {
  if (options.token.length < 24) throw new Error('Browser service token must contain at least 24 characters.');
  const app = Fastify({ logger: false, bodyLimit: 2 * 1024 * 1024 });
  await app.register(websocket, { options: { maxPayload: 1024 } });
  const observers = new Set<(state: BrowserState) => void>();
  const streamBindings = new Set<() => void>();
  const serviceOptions: BrowserServiceOptions = {
    dataDir: options.dataDir,
    workspaceDir: options.workspaceDir,
    remoteUrl: null,
    onChange(state) {
      for (const observer of observers) {
        try { observer(state); } catch { /* A disconnected client cannot stop browser state. */ }
      }
    },
  };
  let service = new BrowserService(serviceOptions);

  app.addHook('onRequest', async (request, reply) => {
    const header = request.headers.authorization;
    const received = typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7) : '';
    const expectedBytes = Buffer.from(options.token);
    const receivedBytes = Buffer.from(received);
    if (receivedBytes.length !== expectedBytes.length || !timingSafeEqual(expectedBytes, receivedBytes))
      return reply.code(401).send({ error: { code: 'BROWSER_UNAUTHORIZED', message: 'Browser executor authentication is required.' } });
  });

  app.setErrorHandler((error, _request, reply) => {
    const known = error instanceof BrowserServiceError;
    const statusCode = known ? error.statusCode : 500;
    return reply.code(statusCode).send({ error: {
      code: known ? error.code : 'BROWSER_EXECUTOR_ERROR',
      message: error instanceof Error ? error.message : 'Browser executor failed.',
    } });
  });

  const disconnectSignal = (reply: { raw: import('node:http').ServerResponse }) => {
    const controller = new AbortController();
    const close = () => { if (!reply.raw.writableEnded) controller.abort(); };
    reply.raw.on('close', close);
    return { signal: controller.signal, cleanup: () => reply.raw.off('close', close) };
  };

  app.get('/internal/status', async () => service.status());
  app.post('/internal/start', async () => service.start());
  app.post<{ Body: { generation?: number } }>('/internal/takeover', async (request) => service.takeover(request.body?.generation));
  app.post<{ Body: { generation?: number } }>('/internal/release', async (request) => service.release(request.body?.generation));
  app.post<{ Body: { url: string; generation?: number } }>('/internal/navigate', async (request) => service.navigate(request.body?.url, request.body?.generation));
  app.post<{ Body: { tabId: string; generation?: number } }>('/internal/tab', async (request) => service.selectTab(request.body?.tabId, request.body?.generation));
  app.post<{ Body: { direction: 'back' | 'forward'; generation?: number } }>('/internal/history', async (request) => service.history(request.body?.direction, request.body?.generation));
  app.post<{ Body: { generation?: number } }>('/internal/reload', async (request) => service.reload(request.body?.generation));
  app.post<{ Body: { url?: string; generation?: number } }>('/internal/tab/new', async (request) => service.newTab(request.body?.url, request.body?.generation));
  app.post<{ Body: { tabId: string; generation?: number } }>('/internal/tab/close', async (request) => service.closeTab(request.body?.tabId, request.body?.generation));
  app.post<{ Body: { taskId?: string } }>('/internal/observe', async (request, reply) => {
    const cancellation = disconnectSignal(reply);
    try { return { text: await service.observe({ taskId: request.body?.taskId, signal: cancellation.signal }) }; }
    finally { cancellation.cleanup(); }
  });
  app.post<{ Body: { code: string; taskId: string; timeoutMs?: number } }>('/internal/execute', async (request, reply) => {
    const cancellation = disconnectSignal(reply);
    try {
      return await service.execute(request.body?.code, {
        taskId: request.body?.taskId, timeoutMs: request.body?.timeoutMs, signal: cancellation.signal,
      });
    } finally { cancellation.cleanup(); }
  });
  app.get('/internal/screenshot', async () => service.screenshot());
  app.post<{ Body: BrowserInput }>('/internal/input', async (request) => { await service.input(request.body); return { ok: true }; });
  app.post<{ Body: { accept: boolean; promptText?: string; generation: number } }>('/internal/dialog', async (request) => { await service.handleDialog(request.body); return { ok: true }; });
  app.post('/internal/stop', async () => {
    await service.dispose();
    service = new BrowserService(serviceOptions);
    // Existing WebSockets outlive the service instance. Move their frame listeners
    // to the replacement so a public viewer does not remain subscribed to a dead browser.
    for (const bind of streamBindings) bind();
    return { ok: true };
  });
  app.get<{ Querystring: { frames?: string } }>('/internal/stream', { websocket: true }, (socket, request) => {
    const send = (value: unknown) => {
      if (socket.readyState === 1 && socket.bufferedAmount < 2 * 1024 * 1024) socket.send(JSON.stringify(value));
    };
    const stateObserver = (state: BrowserState) => send({ type: 'state', state });
    observers.add(stateObserver);
    let unsubscribeFrames: () => void = () => {};
    const bind = () => {
      unsubscribeFrames();
      const current = service;
      unsubscribeFrames = request.query.frames === '1' ? current.subscribeFrames((frame) => send(frame)) : () => {};
      void current.status().then(state => {
        if (service === current) stateObserver(state);
      }).catch(() => {
        if (service === current) send({ type: 'error', message: 'Browser state is unavailable.' });
      });
    };
    streamBindings.add(bind);
    bind();
    socket.on('error', () => {});
    socket.on('close', () => { observers.delete(stateObserver); streamBindings.delete(bind); unsubscribeFrames(); });
  });
  app.addHook('onClose', async () => service.dispose());
  return app;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const token = process.env.BROWSER_SERVICE_TOKEN;
  if (!token) throw new Error('BROWSER_SERVICE_TOKEN is required.');
  const app = await createBrowserSidecar({
    token, dataDir: process.env.BROWSER_DATA_DIR ?? 'browser-data',
    workspaceDir: process.env.BROWSER_WORKSPACE_DIR,
  });
  await app.listen({ host: process.env.BROWSER_SERVICE_HOST ?? '127.0.0.1', port: Number(process.env.BROWSER_SERVICE_PORT ?? 3101) });
  const shutdown = async () => { await app.close(); };
  process.once('SIGTERM', () => { void shutdown(); });
  process.once('SIGINT', () => { void shutdown(); });
}
