import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import type { Store } from './store.js';
import type { AppConfig } from './config.js';
import { AppError, asObject } from './errors.js';

const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');

export async function registerAuth(app: FastifyInstance, store: Store, config: AppConfig) {
  const salt = randomBytes(16);
  const passwordHash = scryptSync(config.password, salt, 32);
  const attempts = new Map<string, { count: number; until: number }>();
  const valid = (cookie?: string) => {
    if (!cookie || cookie.length > 128) return false;
    return Boolean(store.get('SELECT 1 FROM auth_sessions WHERE token_hash=? AND expires_at>?', tokenHash(cookie), Date.now()));
  };
  app.addHook('onRequest', async (request) => {
    // Fastify decodes paths before matching; authorize the matched route.
    const path = request.routeOptions.url || request.url.split('?')[0];
    const publicPath = ['/api/health', '/api/auth/session', '/api/auth/login'].includes(path);
    if (path.startsWith('/api/') && !publicPath && !valid(request.cookies.pa_session)) throw new AppError('UNAUTHORIZED', '请先登录', 401);
    if (path.startsWith('/api/') && !['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      const origin = request.headers.origin;
      if (origin && origin !== config.publicOrigin && origin !== `http://127.0.0.1:5173` && origin !== `http://localhost:5173`) throw new AppError('INVALID_ORIGIN', '请求来源不匹配', 403);
      if (request.headers['sec-fetch-site'] === 'cross-site') throw new AppError('INVALID_ORIGIN', '请求来源不匹配', 403);
    }
    if (request.headers.upgrade?.toLowerCase() === 'websocket') {
      if (request.headers.origin !== config.publicOrigin && request.headers.origin !== 'http://127.0.0.1:5173' && request.headers.origin !== 'http://localhost:5173') throw new AppError('INVALID_ORIGIN', '请求来源不匹配', 403);
    }
  });
  app.get('/api/auth/session', async request => ({ authenticated: valid(request.cookies.pa_session) }));
  app.post('/api/auth/login', async (request, reply) => {
    const body = asObject(request.body);
    const ip = request.ip;
    const previous = attempts.get(ip);
    if (previous && previous.until > Date.now() && previous.count >= 8) throw new AppError('RATE_LIMITED', '稍后再试', 429);
    const input = typeof body.password === 'string' ? body.password : '';
    if (input.length > 1024 || !timingSafeEqual(scryptSync(input, salt, 32), passwordHash)) {
      attempts.set(ip, { count: previous && previous.until > Date.now() ? previous.count + 1 : 1, until: Date.now() + 300000 });
      throw new AppError('INVALID_PASSWORD', '密码不正确', 401);
    }
    attempts.delete(ip);
    store.run('DELETE FROM auth_sessions WHERE expires_at<=?', Date.now());
    const token = randomBytes(32).toString('base64url');
    const maxAge = 7 * 86400;
    store.run('INSERT INTO auth_sessions(token_hash,expires_at) VALUES (?,?)', tokenHash(token), Date.now() + maxAge * 1000);
    reply.setCookie('pa_session', token, { path: '/', httpOnly: true, secure: config.cookieSecure, sameSite: 'lax', maxAge });
    return { authenticated: true };
  });
  app.post('/api/auth/logout', async (request, reply) => {
    if (request.cookies.pa_session) store.run('DELETE FROM auth_sessions WHERE token_hash=?', tokenHash(request.cookies.pa_session));
    reply.clearCookie('pa_session', { path: '/', secure: config.cookieSecure, sameSite: 'lax', httpOnly: true });
    return { authenticated: false };
  });
}
