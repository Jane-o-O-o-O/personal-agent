import { randomBytes } from 'node:crypto';
import type { FetchLike } from '../integrations/http.js';

export const WEIXIN_API_BASE = 'https://ilinkai.weixin.qq.com';
export const WEIXIN_CHANNEL_VERSION = '2.4.9';
const idFields = new Set(['message_id', 'msg_id', 'svr_id']);

export class WeixinApiError extends Error {
  constructor(public kind: 'http' | 'business' | 'network' | 'timeout' | 'cancelled' | 'invalid_response', message: string, public code?: number) { super(message); }
}

export function parseWeixinJson(raw: string): any {
  // Node 24 supplies the original number token, before uint64 precision is lost.
  return JSON.parse(raw, (key: string, value: unknown, context?: { source?: string }) => {
    if (!idFields.has(key) || typeof value !== 'number') return value;
    if (context?.source && /^\d+$/.test(context.source)) return context.source;
    if (Number.isSafeInteger(value) && value >= 0) return String(value);
    throw new WeixinApiError('invalid_response', '微信消息 ID 无法无损解析。');
  });
}

export function validateWeixinBase(value: string): string {
  let url: URL;
  try { url = new URL(value.includes('://') ? value : `https://${value}`); }
  catch { throw new WeixinApiError('invalid_response', '微信返回的 API 地址不合法。'); }
  if (url.protocol !== 'https:' || !/^[a-z0-9.-]+\.weixin\.qq\.com$/i.test(url.hostname) || url.port || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new WeixinApiError('invalid_response', '微信返回的 API 地址不受信任。');
  }
  return url.origin;
}

export function weixinHeaders(method: 'GET' | 'POST', token?: string): Record<string, string> {
  const common = { 'iLink-App-Id': 'bot', 'iLink-App-ClientVersion': '132105' };
  if (method === 'GET') return common;
  return { ...common, 'Content-Type': 'application/json', AuthorizationType: 'ilink_bot_token',
    'X-WECHAT-UIN': Buffer.from(String(randomBytes(4).readUInt32BE(0))).toString('base64'),
    ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export function createWeixinProtocol(request: FetchLike = fetch) {
  async function call(base: string, endpoint: string, options: { method?: 'GET' | 'POST'; body?: unknown; token?: string; signal?: AbortSignal; timeoutMs?: number; botApi?: boolean } = {}) {
    const method = options.method ?? 'POST';
    const url = new URL(endpoint, `${validateWeixinBase(base)}/`);
    const timeout = AbortSignal.timeout(options.timeoutMs ?? 15000);
    const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
    const body = options.botApi ? { ...(options.body as object ?? {}), base_info: { channel_version: WEIXIN_CHANNEL_VERSION, bot_agent: 'PersonalAgent/0.1.0' } } : options.body;
    let response: Response; let raw: string;
    try {
      response = await request(url, { method, headers: weixinHeaders(method, options.token), ...(method === 'POST' ? { body: JSON.stringify(body ?? {}) } : {}), signal });
      raw = await response.text();
    } catch {
      if (options.signal?.aborted) throw new WeixinApiError('cancelled', '微信请求已停止。');
      if (timeout.aborted) throw new WeixinApiError('timeout', '微信请求超时。');
      throw new WeixinApiError('network', '无法连接微信服务。');
    }
    if (!response.ok) throw new WeixinApiError('http', `微信服务返回 HTTP ${response.status}。`, response.status);
    let data: any;
    try { data = parseWeixinJson(raw); }
    catch { throw new WeixinApiError('invalid_response', '微信服务返回了无法解析的响应。'); }
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new WeixinApiError('invalid_response', '微信服务返回的数据结构不正确。');
    if ((data.ret !== undefined && data.ret !== 0) || (data.errcode !== undefined && data.errcode !== 0)) {
      throw new WeixinApiError('business', '微信服务拒绝了当前请求。', data.ret === -14 || data.errcode === -14 ? -14 : Number(data.errcode || data.ret));
    }
    return data;
  }
  return { call };
}
