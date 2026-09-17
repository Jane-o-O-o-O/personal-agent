import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateKeyPairSync, randomBytes, verify } from 'node:crypto';
import { createIntegrationService } from '../../src/server/integrations/index.js';
import { queryCalendar, shanghaiDate } from '../../src/server/integrations/calendar.js';
import { SettingsStore } from '../../src/server/settings.js';
import { Store } from '../../src/server/store.js';

const stores: Store[] = [];
function setup(request = vi.fn<typeof fetch>()) {
  const store = new Store(':memory:'); stores.push(store);
  const settings = new SettingsStore(store, randomBytes(32));
  const service = createIntegrationService({ store, settings, dataDir: '/unused', fetch: request });
  async function query(name: string, args: Record<string, unknown>, signal?: AbortSignal) {
    const tool = service.tools().find(item => item.name === name)!;
    const result = await tool.execute('test', args, signal, undefined, {} as any);
    return JSON.parse((result.content[0] as { text: string }).text);
  }
  return { store, settings, service, query, request };
}
function response(data: unknown, status = 200) { return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } }); }
afterEach(() => { for (const store of stores.splice(0)) store.close(); vi.restoreAllMocks(); });

describe('domestic integration contracts', () => {
  it('keeps the Resend sender fixed, encrypts its key, and checks the domain without sending', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(response({ data: [{ name: 'jane-zz.me', status: 'verified', capabilities: { sending: 'enabled', receiving: 'disabled' } }] }));
    const { service, store } = setup(request);
    const view = service.update('resend', { apiKey: 'private-resend-test-key' });
    expect(view).toMatchObject({ status: 'configured', config: { from: 'i@jane-zz.me', domain: 'jane-zz.me' }, secretFields: { apiKey: true } });
    expect(() => service.update('resend', { from: 'other@example.com' })).toThrow();
    expect(JSON.stringify(view)).not.toContain('private-resend-test-key');
    expect(store.get<{ value: string }>('SELECT value FROM settings WHERE key=?', 'integration:resend')!.value).not.toContain('private-resend-test-key');
    expect(await service.test('resend')).toMatchObject({ ok: true, message: expect.stringContaining('已验证') });
    expect(service.list().find(item => item.id === 'resend')?.status).toBe('connected');
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][0]).toBe('https://api.resend.com/domains');
    expect(request.mock.calls[0][1]?.method).toBe('GET');
  });

  it('reports a sending-only Resend key as configured without claiming domain verification', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(response({ name: 'restricted_api_key' }, 401));
    const { service } = setup(request);
    service.update('resend', { apiKey: 'send-only-key' });
    expect(await service.test('resend')).toMatchObject({ ok: true, message: expect.stringContaining('无法只读核对域名') });
    expect(service.list().find(item => item.id === 'resend')?.status).toBe('configured');
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('does not mistake an inactive Resend key for a sending-only key', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(response({ name: 'restricted_api_key' }, 403));
    const { service } = setup(request);
    service.update('resend', { apiKey: 'inactive-key' });
    expect(await service.test('resend')).toMatchObject({ ok: false, message: expect.stringContaining('HTTP 403') });
    expect(service.list().find(item => item.id === 'resend')?.status).toBe('error');
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('keeps missing credentials explicit and never calls an upstream', async () => {
    const { service, query, request } = setup();
    expect(service.list().find(item => item.id === 'bocha')?.status).toBe('unconfigured');
    expect(await query('web_search', { query: '今天的新闻' })).toMatchObject({ ok: false, error: { code: 'needs_configuration' }, meta: { provider: 'bocha', dataAt: null } });
    expect(request).not.toHaveBeenCalled();
  });

  it('encrypts credentials, redacts responses and events, and deletes only explicitly cleared fields', () => {
    const { service, store, settings } = setup();
    const key = 'private-key-must-not-appear';
    const view = service.update('ima', { clientId: 'my-client', apiKey: key });
    expect(view.secretFields.apiKey).toBe(true);
    expect(view.config).toEqual({ enabled: true, clientId: 'my-client' });
    expect(JSON.stringify(view)).not.toContain(key);
    expect(JSON.stringify(store.eventsAfter(0))).not.toContain(key);
    expect(store.get<{ value: string }>('SELECT value FROM settings WHERE key=?', 'integration:ima')!.value).not.toContain(key);
    service.update('ima', { enabled: false });
    expect(settings.get<any>('integration:ima', {}).config.apiKey).toBe(key);
    service.update('ima', { apiKey: '' });
    expect(service.list().find(item => item.id === 'ima')!.secretFields.apiKey).toBe(false);
  });

  it('uses the exact Bocha endpoint, authenticates on the server, and preserves sources', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(response({ code: 200, data: { webPages: { value: [{ name: '国务院通知', url: 'https://www.gov.cn/example', summary: '正式通知', siteName: '中国政府网', datePublished: '2026-10-02' }] } } }));
    const { service, query } = setup(request); service.update('bocha', { apiKey: 'my-secret' });
    const result = await query('web_search', { query: '调休通知', count: 3, freshness: 'oneWeek' });
    const [url, init] = request.mock.calls[0];
    expect(String(url)).toBe('https://api.bochaai.com/v1/web-search');
    expect(init!.headers).toMatchObject({ Authorization: 'Bearer my-secret' });
    expect(JSON.parse(init!.body as string)).toEqual({ query: '调休通知', summary: true, freshness: 'oneWeek', count: 3 });
    expect(result.data.results[0]).toMatchObject({ title: '国务院通知', url: 'https://www.gov.cn/example', publishedAt: '2026-10-02' });
    expect(result.meta).toMatchObject({ provider: 'bocha', dataAt: null, timezone: 'Asia/Shanghai' });
    expect(JSON.stringify(result)).not.toContain('my-secret');
  });

  it('never treats a malformed provider response as an empty successful search', async () => {
    const { service, query } = setup(vi.fn<typeof fetch>().mockResolvedValue(response({ code: 200, data: {} })));
    service.update('bocha', { apiKey: 'key' });
    expect(await query('web_search', { query: '新闻' })).toMatchObject({ ok: false, error: { code: 'invalid_response' } });
  });

  it('preserves transit departure parameters and actual first/last service fields', async () => {
    const route = { transits: [{ segments: [{ bus: { buslines: [{ name: '地铁2号线', start_time: '0520', end_time: '2310' }] } }] }] };
    const request = vi.fn<typeof fetch>().mockResolvedValue(response({ status: '1', infocode: '10000', route }));
    const { service, query } = setup(request); service.update('amap', { apiKey: 'map-key' });
    const result = await query('maps_route', { origin: '116.4074,39.9042', destination: '116.4531,39.9500', city: '北京', date: '2026-10-04', time: '07:30' });
    const url = new URL(String(request.mock.calls[0][0]));
    expect(url.pathname).toBe('/v3/direction/transit/integrated');
    expect(Object.fromEntries(url.searchParams)).toMatchObject({ city: '北京', cityd: '北京', origin: '116.4074,39.9042', date: '2026-10-04', time: '07:30', key: 'map-key' });
    expect(result.data).toMatchObject({ coordinateSystem: 'GCJ-02', route, realTimeArrivalAvailable: false });
    expect(result.meta.source).not.toContain('map-key');
  });

  it('distinguishes the Amap v4 bicycling business response from v3 status', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(response({ errcode: 0, data: { paths: [{ distance: '1800' }] } }));
    const { service, query } = setup(request); service.update('amap', { apiKey: 'map-key' });
    expect(await query('maps_route', { origin: '116.4074,39.9042', destination: '116.4531,39.9500', mode: 'bicycling' })).toMatchObject({ ok: true });
    expect(new URL(String(request.mock.calls[0][0])).pathname).toBe('/v4/direction/bicycling');
  });

  it('uses QWeather v1 latitude-first paths and never invents a data timestamp', async () => {
    const current = { condition: { text: '晴', code: '100' }, temperature: { value: 20, unit: '°C' }, humidity: 0.5, metadata: { attributions: ['https://developer.qweather.com/attribution.html'] } };
    const request = vi.fn<typeof fetch>().mockResolvedValueOnce(response(current)).mockResolvedValueOnce(response({ days: [{ forecastStartTime: '2026-10-03T00:00+08:00', temperatureMax: { value: 25 } }] }));
    const { service, query } = setup(request); service.update('qweather', { host: 'abcxyz.qweatherapi.com', apiKey: 'weather-key' });
    const result = await query('weather_query', { latitude: 39.92, longitude: 116.41, days: 3 });
    const [nowUrl, init] = request.mock.calls[0];
    expect(String(nowUrl)).toContain('https://abcxyz.qweatherapi.com/weather/v1/current/39.92/116.41');
    expect(new URL(String(nowUrl)).searchParams.get('localTime')).toBe('true');
    expect(init!.headers).toEqual({ 'X-QW-Api-Key': 'weather-key' });
    expect(String(request.mock.calls[1][0])).toContain('/weather/v1/daily/39.92/116.41?days=3');
    expect(result).toMatchObject({ ok: true, data: { current }, meta: { provider: 'qweather', dataAt: null } });
  });

  it('signs QWeather JWTs with the required developer and project identities', async () => {
    const keys = generateKeyPairSync('ed25519');
    const request = vi.fn<typeof fetch>().mockResolvedValueOnce(response({ condition: { text: '晴' }, temperature: { value: 20 } })).mockResolvedValueOnce(response({ days: [{ temperatureMax: { value: 25 } }] }));
    const { service, query } = setup(request);
    service.update('qweather', { host: 'abcxyz.qweatherapi.com', authentication: 'jwt', developerId: 'Q12345ABCD', projectId: 'project-id', credentialId: 'credential-id', privateKey: keys.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString() });
    expect(await query('weather_query', { latitude: 39.92, longitude: 116.41 })).toMatchObject({ ok: true });
    const auth = (request.mock.calls[0][1]!.headers as Record<string, string>).Authorization;
    const [header, payload, signature] = auth.slice(7).split('.');
    expect(JSON.parse(Buffer.from(header, 'base64url').toString())).toEqual({ alg: 'EdDSA', kid: 'credential-id' });
    expect(JSON.parse(Buffer.from(payload, 'base64url').toString())).toMatchObject({ iss: 'Q12345ABCD', sub: 'project-id' });
    expect(verify(null, Buffer.from(`${header}.${payload}`), keys.publicKey, Buffer.from(signature, 'base64url'))).toBe(true);
    expect(JSON.stringify(service.list())).not.toContain('PRIVATE KEY');
  });

  it('rejects hosts that could receive weather credentials outside the official provider', () => {
    const { service } = setup();
    expect(() => service.update('qweather', { host: 'https://qweatherapi.com.attacker.invalid' })).toThrow();
    expect(() => service.update('qweather', { host: 'http://abcxyz.qweatherapi.com' })).toThrow();
  });

  it('redacts upstream error bodies and gives cancellation a distinct result', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(response({ detail: 'reflected-super-secret' }, 401));
    const { service, query } = setup(request); service.update('bocha', { apiKey: 'reflected-super-secret' });
    const result = await query('web_search', { query: '新闻' });
    expect(result).toMatchObject({ ok: false, error: { code: 'unauthorized', retryable: false } });
    expect(JSON.stringify(result)).not.toContain('reflected-super-secret');
    const controller = new AbortController(); controller.abort();
    expect(await query('web_search', { query: '新闻' }, controller.signal)).toMatchObject({ ok: false, error: { code: 'cancelled' } });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('reads ima notes with scoped headers and plaintext format', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(response({ code: 0, data: { content: '我的笔记' } }));
    const { service, query } = setup(request); service.update('ima', { clientId: 'client', apiKey: 'note-key' });
    const result = await query('knowledge_read', { noteId: 'note-123' });
    expect(String(request.mock.calls[0][0])).toBe('https://ima.qq.com/openapi/note/v1/get_doc_content');
    expect(JSON.parse(request.mock.calls[0][1]!.body as string)).toEqual({ note_id: 'note-123', target_content_format: 0 });
    expect(request.mock.calls[0][1]!.headers).toMatchObject({ 'ima-openapi-clientid': 'client', 'ima-openapi-apikey': 'note-key' });
    expect(result).toMatchObject({ ok: true, data: { content: '我的笔记' }, meta: { provider: 'ima', dataAt: null } });
  });

  it('labels public fallback weather and daily reference exchange rates accurately', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValueOnce(response({ timezone: 'Asia/Shanghai', current: { time: '2026-10-03T10:00', temperature_2m: 19 }, daily: { time: ['2026-10-03'] } })).mockResolvedValueOnce(response({ date: '2026-10-02', base: 'CNY', quote: 'USD', rate: 0.14915 }));
    const { query } = setup(request);
    expect(await query('weather_query', { latitude: 39.9, longitude: 116.4 })).toMatchObject({ ok: true, meta: { provider: 'openmeteo', dataAt: '2026-10-03T10:00+08:00' } });
    const rate = await query('exchange_rate', { base: 'CNY', quote: 'USD', amount: 100 });
    expect(rate).toMatchObject({ ok: true, meta: { provider: 'exchange', dataAt: '2026-10-02' } });
    expect(rate.data.convertedAmount).toBeCloseTo(14.915, 8);
    expect(new URL(String(request.mock.calls[1][0])).searchParams.get('providers')).toBe('ecb');
  });
});

describe('local dates and published holiday boundaries', () => {
  it('applies adjusted working days before the weekend rule', () => {
    expect(queryCalendar('2026-10-10').days[0]).toMatchObject({ weekday: '星期六', isWeekend: true, isWorkday: true, isAdjustedWorkday: true });
    expect(queryCalendar('2026-10-01').days[0]).toMatchObject({ isWorkday: false, holidayName: '国庆节' });
  });
  it('does not invent future holiday announcements and rejects impossible dates', () => {
    expect(queryCalendar('2027-01-02').days[0]).toMatchObject({ holidayPolicyKnown: false, isWorkday: null });
    expect(() => queryCalendar('2026-02-30')).toThrow();
  });
  it('uses the China date across the UTC midnight boundary', () => {
    expect(shanghaiDate(new Date('2026-10-02T16:01:00Z'))).toBe('2026-10-03');
    expect(shanghaiDate(new Date('2026-10-02T15:59:00Z'))).toBe('2026-10-02');
  });
});
