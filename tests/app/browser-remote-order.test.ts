import { createServer, type ServerResponse } from 'node:http';
import { expect, it } from 'vitest';
import WebSocket, { WebSocketServer } from 'ws';
import { createBrowserService, type BrowserServiceClient } from '../../src/server/browser/index.js';
import type { BrowserState } from '../../src/shared/contracts.js';

it('keeps newer sidecar ownership when a delayed HTTP snapshot arrives and distinguishes relay failure', async () => {
  const token = 'remote-state-test-token-123456789012345';
  const older: BrowserState = { status: 'ready', owner: 'agent', generation: 100, revision: 1,
    tabs: [{ id: 'tab-one', title: 'Old', url: 'https://example.com/old' }], activeTabId: 'tab-one', viewport: { width: 1440, height: 900 } };
  const newer: BrowserState = { ...older, owner: 'user', generation: 101, revision: 2,
    tabs: [{ id: 'tab-one', title: 'New', url: 'https://example.com/new' }] };
  const responses: ServerResponse[] = [];
  let failStatus = false;
  const wss = new WebSocketServer({ noServer: true });
  const sockets = new Set<WebSocket>();
  const server = createServer((request, response) => {
    if (request.url === '/internal/status') {
      if (failStatus) { response.writeHead(503, { 'content-type': 'application/json' }).end(JSON.stringify({ error: { code: 'RELAY_DOWN', message: 'Relay unavailable' } })); return; }
      responses.push(response); return;
    }
    response.writeHead(200, { 'content-type': 'application/json' }).end('{}');
  });
  server.on('upgrade', (request, socket, head) => {
    if (new URL(request.url ?? '/', 'http://localhost').pathname !== '/internal/stream' || request.headers.authorization !== `Bearer ${token}`) { socket.destroy(); return; }
    wss.handleUpgrade(request, socket, head, ws => {
      sockets.add(ws);
      ws.on('close', () => sockets.delete(ws));
      ws.send(JSON.stringify({ type: 'state', state: older }));
    });
  });
  let remote: BrowserServiceClient | undefined;
  try {
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Fixture did not bind');
    const seen: BrowserState[] = [];
    remote = createBrowserService({ dataDir: '/unused', remoteUrl: `http://127.0.0.1:${address.port}`, remoteToken: token,
      onChange: state => seen.push(state) });
    await expect.poll(() => seen.at(-1)?.generation).toBe(100);
    const pending = remote.status();
    await expect.poll(() => responses.length).toBe(1);
    for (const ws of sockets) ws.send(JSON.stringify({ type: 'state', state: newer }));
    await expect.poll(() => seen.at(-1)?.generation).toBe(101);
    responses.shift()!.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(older));
    expect(await pending).toMatchObject({ generation: 101, revision: 2, owner: 'user' });

    failStatus = true;
    const degraded = await remote.status();
    expect(degraded).toMatchObject({ status: 'ready', owner: 'user', generation: 101, transportError: expect.any(String) });
    failStatus = false;
    const recovering = remote.status();
    await expect.poll(() => responses.length).toBe(1);
    responses.shift()!.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(newer));
    expect((await recovering).transportError).toBeUndefined();
  } finally {
    for (const response of responses) response.writeHead(503, { 'content-type': 'application/json' }).end('{}');
    await remote?.dispose().catch(() => {});
    for (const ws of sockets) ws.terminate();
    await new Promise<void>(resolve => wss.close(() => resolve()));
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
