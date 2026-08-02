import { afterEach, describe, expect, it } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import websocket from '@fastify/websocket';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { registerAuth } from '../../src/server/auth.js';
import { Store } from '../../src/server/store.js';
import type { AppConfig } from '../../src/server/config.js';

const resources: { app: FastifyInstance; store: Store; directory: string }[] = [];
afterEach(async () => {
  for (const { app, store, directory } of resources.splice(0)) {
    await app.close();
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

async function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'pa-auth-'));
  const store = new Store(join(directory, 'test.sqlite'));
  const app = Fastify();
  const config: AppConfig = {
    host: '127.0.0.1', port: 3420, dataDir: directory,
    password: 'regression-password-only', encryptionKey: randomBytes(32),
    cookieSecure: false, publicOrigin: 'http://127.0.0.1:3420',
  };
  resources.push({ app, store, directory });
  await app.register(cookie);
  await app.register(websocket);
  await registerAuth(app, store, config);
  let mutations = 0;
  app.get('/api/health', async () => ({ ok: true }));
  app.get('/api/tasks', async () => []);
  app.get('/api/tasks/:id', async request => request.params);
  app.post('/api/tasks', async () => ({ mutations: ++mutations }));
  app.get('/api/browser/stream', { websocket: true }, socket => {
    socket.on('message', bytes => socket.send(bytes));
  });
  return { app, config, mutations: () => mutations };
}

describe('matched-route authentication', () => {
  it('rejects unauthenticated ordinary and encoded API paths before their handlers', async () => {
    const { app, mutations } = await fixture();
    for (const url of ['/api/tasks', '/%61pi/tasks', '/a%70i/tasks', '/%61%70%69/tasks', '/api/%74asks', '/%61pi/tasks/example?view=full']) {
      const response = await app.inject({ url });
      expect(response.statusCode, url).toBe(401);
    }
    for (const url of ['/api/tasks', '/%61pi/tasks', '/api/%74asks']) {
      const response = await app.inject({ method: 'POST', url, payload: {} });
      expect(response.statusCode, url).toBe(401);
    }
    expect(mutations()).toBe(0);
  });

  it('allows only matched public routes and accepts an authenticated encoded path', async () => {
    const { app, config } = await fixture();
    expect((await app.inject({ url: '/%61pi/health' })).statusCode).toBe(200);
    const session = await app.inject({ url: '/%61pi/auth/%73ession' });
    expect(session.statusCode).toBe(200);
    expect(session.json()).toEqual({ authenticated: false });
    const login = await app.inject({ method: 'POST', url: '/%61pi/auth/login', payload: { password: config.password } });
    expect(login.statusCode).toBe(200);
    const authCookie = String(login.headers['set-cookie']).split(';')[0];
    expect((await app.inject({ url: '/%61pi/tasks', headers: { cookie: authCookie } })).statusCode).toBe(200);
    expect((await app.inject({ method: 'POST', url: '/%61pi/auth/logout' })).statusCode).toBe(401);
  });

  it('checks origins and fetch metadata on encoded public and authenticated mutations', async () => {
    const { app, config, mutations } = await fixture();
    const wrongOrigin = 'https://wrong.example';
    const rejectedLogin = await app.inject({ method: 'POST', url: '/%61pi/auth/login', headers: { origin: wrongOrigin }, payload: { password: config.password } });
    expect(rejectedLogin.statusCode).toBe(403);
    const login = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { password: config.password } });
    const authCookie = String(login.headers['set-cookie']).split(';')[0];
    for (const extra of [{ origin: wrongOrigin }, { 'sec-fetch-site': 'cross-site' }]) {
      const response = await app.inject({ method: 'POST', url: '/%61pi/tasks', headers: { cookie: authCookie, ...extra }, payload: {} });
      expect(response.statusCode).toBe(403);
    }
    expect(mutations()).toBe(0);
    const accepted = await app.inject({ method: 'POST', url: '/%61pi/tasks', headers: { cookie: authCookie, origin: config.publicOrigin }, payload: {} });
    expect(accepted.statusCode).toBe(200);
    expect(mutations()).toBe(1);
  });

  it('authenticates an encoded WebSocket route and rejects a foreign upgrade origin', async () => {
    const { app, config } = await fixture();
    await app.ready();
    await expect(app.injectWS('/%61pi/browser/stream', { headers: { origin: config.publicOrigin } })).rejects.toThrow('401');
    const login = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { password: config.password } });
    const authCookie = String(login.headers['set-cookie']).split(';')[0];
    await expect(app.injectWS('/%61pi/browser/stream', { headers: { cookie: authCookie, origin: 'https://wrong.example' } })).rejects.toThrow('403');
    await expect(app.injectWS('/%61pi/browser/stream', { headers: { cookie: authCookie } })).rejects.toThrow('403');
    const socket = await app.injectWS('/%61pi/browser/stream', { headers: { cookie: authCookie, origin: config.publicOrigin } });
    const received = new Promise<string>(resolve => socket.once('message', bytes => resolve(bytes.toString())));
    socket.send('authenticated-echo');
    expect(await received).toBe('authenticated-echo');
    socket.terminate();
  });
});
