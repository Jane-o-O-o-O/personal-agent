import { sign, createPrivateKey } from 'node:crypto';
import { Type, type TSchema } from '@sinclair/typebox';
import type { ToolDefinition } from '@earendil-works/pi-coding-agent';
import type { Integration, IntegrationField } from '../../shared/contracts.js';
import type { Store } from '../store.js';
import type { SettingsStore } from '../settings.js';
import { queryCalendar, validateDate } from './calendar.js';
import { assertObject, QueryError, requestJson, type FetchLike } from './http.js';

interface Definition {
  id: string; name: string; description: string; capabilities: string[]; fields: IntegrationField[];
  required: string[]; defaults?: Record<string, unknown>;
}
interface SavedIntegration { config: Record<string, unknown>; lastCheckedAt?: string; lastError?: string; verified?: boolean }
interface QueryMeta { provider: string; source: string; queriedAt: string; dataAt: string | null; parameters: Record<string, unknown>; timezone: string }
type QueryResult = { ok: true; data: unknown; meta: QueryMeta } | { ok: false; error: { code: string; message: string; retryable: boolean; upstreamCode?: string }; meta: QueryMeta };

const enabled: IntegrationField = { name: 'enabled', label: '启用', type: 'boolean' };
const apiKey: IntegrationField = { name: 'apiKey', label: 'API Key', type: 'password', required: true };
const definitions: Definition[] = [
  { id: 'bocha', name: '博查搜索', description: '国内网页检索，保留原始来源链接。', capabilities: ['网页搜索'], required: ['apiKey'], fields: [enabled, apiKey] },
  { id: 'amap', name: '高德地图', description: '地点、路线、公交地铁和公交线路查询。', capabilities: ['地点', '路线', '公交地铁', '线路资料'], required: ['apiKey'], fields: [enabled, { ...apiKey, label: 'Web 服务 Key' }] },
  { id: 'qweather', name: '和风天气', description: '和风新版实时天气与每日预报。', capabilities: ['实时天气', '每日预报', '城市查询'], required: ['host'], defaults: { authentication: 'key' }, fields: [enabled,
    { name: 'host', label: '专属 API Host', type: 'text', required: true, placeholder: 'abcxyz.qweatherapi.com' },
    { name: 'authentication', label: '认证方式', type: 'select', options: [{ value: 'key', label: 'API Key' }, { value: 'jwt', label: 'Ed25519 JWT' }] },
    { ...apiKey, required: false }, { name: 'developerId', label: '开发者 ID（JWT）', type: 'text' }, { name: 'projectId', label: '项目 ID（JWT）', type: 'text' },
    { name: 'credentialId', label: '凭据 ID（JWT）', type: 'text' }, { name: 'privateKey', label: 'Ed25519 私钥 PEM（JWT）', type: 'textarea' },
  ] },
  { id: 'ima', name: '腾讯 ima', description: '仅检索和读取本人授权的笔记与知识库。', capabilities: ['笔记搜索', '笔记读取', '知识库检索'], required: ['clientId', 'apiKey'], fields: [enabled, { name: 'clientId', label: 'Client ID', type: 'text', required: true }, apiKey] },
  { id: 'calendar', name: '中国日历', description: '公农历、节气、已公布的全国调休安排。', capabilities: ['农历', '节气', '调休'], required: [], fields: [enabled] },
  { id: 'openmeteo', name: 'Open-Meteo 天气', description: '无需 Key 的国际天气来源，免费服务限非商业用途。', capabilities: ['实时天气', '每日预报'], required: [], fields: [enabled] },
  { id: 'exchange', name: 'Frankfurter 汇率', description: '无需 Key 的央行参考汇率，非实时结算价格。', capabilities: ['参考汇率'], required: [], fields: [enabled] },
  { id: 'resend', name: 'Resend 邮件', description: '从 i@jane-zz.me 发送单封纯文本邮件；每封发送前须在应用内核对并批准。此连接不接收邮件。', capabilities: ['审批后发信'], required: ['apiKey'], defaults: { domain: 'jane-zz.me', from: 'i@jane-zz.me' }, fields: [enabled, apiKey] },
];

function definition(id: string): Definition {
  const result = definitions.find(item => item.id === id);
  if (!result) throw new QueryError('invalid_parameters', '连接器不存在。');
  return result;
}
function secretNames(item: Definition) { return item.fields.filter(field => field.type === 'password' || field.name === 'privateKey').map(field => field.name); }
function configured(item: Definition, config: Record<string, unknown>): boolean {
  if (!item.required.every(name => typeof config[name] === 'string' && String(config[name]).trim())) return false;
  if (item.id === 'qweather') return config.authentication === 'jwt'
    ? ['developerId', 'projectId', 'credentialId', 'privateKey'].every(name => typeof config[name] === 'string' && String(config[name]).trim())
    : typeof config.apiKey === 'string' && Boolean(config.apiKey.trim());
  return true;
}
function qweatherHost(value: unknown): string {
  const text = String(value ?? '').trim();
  let url: URL;
  try { url = new URL(text.includes('://') ? text : `https://${text}`); }
  catch { throw new QueryError('invalid_parameters', '和风 API Host 不合法。'); }
  if (url.protocol !== 'https:' || !/^[a-z0-9-]+\.qweatherapi\.com$/i.test(url.hostname) || url.port || url.username || url.password || url.search || url.hash || (url.pathname !== '/' && url.pathname !== '')) {
    throw new QueryError('invalid_parameters', '请填写控制台提供的专属 qweatherapi.com Host。');
  }
  return url.origin;
}
function text(value: unknown, name: string, max = 1000): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new QueryError('invalid_parameters', `${name}不能为空，且不能超过 ${max} 个字符。`);
  return value.trim();
}
function coordinate(value: unknown, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > max) throw new QueryError('invalid_parameters', '经纬度参数不合法。');
  return value;
}
function mapCoordinate(value: unknown): string {
  const raw = text(value, '经纬度', 80);
  if (!/^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$/.test(raw)) throw new QueryError('invalid_parameters', '高德坐标格式为经度,纬度。');
  const [longitude, latitude] = raw.split(',').map(Number);
  coordinate(longitude, 180); coordinate(latitude, 90);
  return raw;
}
function assertProviderSuccess(data: any, kind: 'amap' | 'bocha' | 'ima') {
  assertObject(data);
  if (kind === 'amap' && data.status !== '1' && data.status !== 1) {
    const code = String(data.infocode ?? 'unknown');
    const quota = ['10003', '10004', '10019', '10020', '10021', '10029', '10044'].includes(code);
    throw new QueryError(quota ? 'quota_exceeded' : 'unauthorized', '高德服务拒绝了请求，请检查 Key、权限、额度和参数。', quota, code);
  }
  if (kind === 'bocha' && data.code !== undefined && Number(data.code) !== 200 && Number(data.code) !== 0) throw new QueryError(Number(data.code) === 429 ? 'quota_exceeded' : 'upstream_unavailable', '博查服务返回业务错误，请检查账户与参数。', false, String(data.code));
  if (kind === 'ima' && data.code !== undefined && Number(data.code) !== 0) throw new QueryError('upstream_unavailable', 'ima 服务返回业务错误，请检查授权和笔记权限。', false, String(data.code));
}

export function createIntegrationService(opts: { store: Store; settings: SettingsStore; dataDir: string; fetch?: FetchLike }) {
  const request = opts.fetch ?? ((...args: Parameters<FetchLike>) => fetch(...args));
  const load = (id: string): SavedIntegration => opts.settings.get<SavedIntegration>(`integration:${id}`, { config: {} });
  const config = (id: string): Record<string, unknown> => ({ enabled: true, ...definition(id).defaults, ...load(id).config });
  const view = (id: string): Integration => {
    const item = definition(id); const saved = load(id); const current = config(id);
    const secrets = secretNames(item);
    const publicConfig = Object.fromEntries(Object.entries(current).filter(([name]) => !secrets.includes(name)));
    const status = !configured(item, current) ? 'unconfigured' : saved.lastError ? 'error' : saved.verified || item.id === 'calendar' ? 'connected' : 'configured';
    return { id, name: item.name, description: item.description, capabilities: item.capabilities, fields: item.fields, status,
      config: publicConfig, secretFields: Object.fromEntries(secrets.map(name => [name, Boolean(current[name])])), lastCheckedAt: saved.lastCheckedAt, lastError: saved.lastError };
  };
  const publish = (id: string) => opts.store.publish('integration.updated', id, view(id));
  const requireConfig = (id: string) => {
    const current = config(id);
    if (current.enabled === false) throw new QueryError('disabled', `${definition(id).name}已停用。`);
    if (!configured(definition(id), current)) throw new QueryError('needs_configuration', `请先在连接器中配置${definition(id).name}。`);
    return current;
  };
  const run = async (id: string, parameters: Record<string, unknown>, source: string, work: (current: Record<string, unknown>, meta: QueryMeta) => Promise<unknown>): Promise<QueryResult> => {
    const meta: QueryMeta = { provider: id, source, queriedAt: new Date().toISOString(), dataAt: null, parameters, timezone: 'Asia/Shanghai' };
    try { return { ok: true, data: await work(requireConfig(id), meta), meta }; }
    catch (error) {
      const known = error instanceof QueryError ? error : new QueryError('invalid_parameters', '查询参数或配置不合法。');
      return { ok: false, error: { code: known.code, message: known.message, retryable: known.retryable, ...(known.upstreamCode ? { upstreamCode: known.upstreamCode } : {}) }, meta };
    }
  };
  const json = (url: URL | string, options: RequestInit = {}, signal?: AbortSignal) => requestJson(url, options, signal, 15000, request);

  async function bocha(args: any, signal?: AbortSignal) {
    return run('bocha', args, 'https://api.bochaai.com/v1/web-search', async current => {
      const query = text(args.query, '搜索词', 2000); const count = args.count ?? 10;
      if (!Number.isInteger(count) || count < 1 || count > 50) throw new QueryError('invalid_parameters', '结果数量为 1 至 50。');
      const { data } = await json('https://api.bochaai.com/v1/web-search', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${current.apiKey}` }, body: JSON.stringify({ query, summary: true, freshness: args.freshness ?? 'noLimit', count }) }, signal);
      assertProviderSuccess(data, 'bocha');
      if (!data.data?.webPages || !Array.isArray(data.data.webPages.value)) throw new QueryError('invalid_response', '博查未返回网页结果列表。');
      return { query, results: data.data.webPages.value.map((item: any) => ({ title: item.name, url: item.url, summary: item.summary ?? item.snippet ?? '', siteName: item.siteName, publishedAt: item.datePublished ?? null })), total: data.data.webPages.totalEstimatedMatches ?? null };
    });
  }
  async function amap(path: string, params: Record<string, string>, signal?: AbortSignal) {
    const current = requireConfig('amap'); const url = new URL(`https://restapi.amap.com${path}`);
    url.search = new URLSearchParams({ ...params, key: String(current.apiKey), output: 'JSON' }).toString();
    const { data } = await json(url, {}, signal);
    if (path.startsWith('/v4/')) {
      assertObject(data);
      if (data.errcode !== 0) throw new QueryError('upstream_unavailable', '高德骑行服务返回业务错误。', false, String(data.errcode ?? 'unknown'));
    } else assertProviderSuccess(data, 'amap');
    return data;
  }
  async function mapsSearch(args: any, signal?: AbortSignal) {
    return run('amap', args, 'https://restapi.amap.com/v3/place/text', async (_current, meta) => {
      const params: Record<string, string> = { keywords: text(args.query, '地点', 500), extensions: 'all', offset: String(args.limit ?? 10), page: '1' };
      if (args.city) params.city = text(args.city, '城市', 100);
      let path = '/v3/place/text';
      if (args.location) { path = '/v3/place/around'; params.location = mapCoordinate(args.location); params.radius = String(args.radius ?? 3000); }
      meta.source = `https://restapi.amap.com${path}`;
      const data = await amap(path, params, signal);
      if (!Array.isArray(data.pois)) throw new QueryError('invalid_response', '高德未返回地点列表。');
      return { coordinateSystem: 'GCJ-02', count: data.count, pois: data.pois };
    });
  }
  async function mapsGeocode(args: any, signal?: AbortSignal) {
    return run('amap', args, 'https://restapi.amap.com/v3/geocode/geo', async () => {
      const params: Record<string, string> = { address: text(args.address, '地址', 500) };
      if (args.city) params.city = text(args.city, '城市', 100);
      const data = await amap('/v3/geocode/geo', params, signal);
      if (!Array.isArray(data.geocodes)) throw new QueryError('invalid_response', '高德未返回地址匹配列表。');
      return { coordinateSystem: 'GCJ-02', geocodes: data.geocodes };
    });
  }
  async function mapsRoute(args: any, signal?: AbortSignal) {
    return run('amap', args, 'https://restapi.amap.com/v3/direction', async (_current, meta) => {
      const params: Record<string, string> = { origin: mapCoordinate(args.origin), destination: mapCoordinate(args.destination), extensions: 'all' };
      const mode = args.mode ?? 'transit'; let path: string;
      if (mode === 'transit') {
        path = '/v3/direction/transit/integrated'; params.city = text(args.city, '起点城市', 100); params.cityd = text(args.destinationCity ?? args.city, '终点城市', 100);
        if (args.date) { validateDate(args.date); params.date = args.date; }
        if (args.time) { if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(args.time)) throw new QueryError('invalid_parameters', '出发时间为 HH:mm。'); params.time = args.time; }
      } else if (mode === 'walking' || mode === 'driving') path = `/v3/direction/${mode}`;
      else if (mode === 'bicycling') path = '/v4/direction/bicycling';
      else throw new QueryError('invalid_parameters', '不支持的路线模式。');
      meta.source = `https://restapi.amap.com${path}`;
      const data = await amap(path, params, signal);
      if (!data.route && !data.data) throw new QueryError('invalid_response', '高德未返回路线。');
      return { coordinateSystem: 'GCJ-02', mode, route: data.route ?? data.data, realTimeArrivalAvailable: false };
    });
  }
  async function mapsBus(args: any, signal?: AbortSignal) {
    return run('amap', args, 'https://restapi.amap.com/v3/bus/linename', async () => {
      const data = await amap('/v3/bus/linename', { keywords: text(args.query, '线路名称', 200), city: text(args.city, '城市', 100), extensions: 'all', offset: '10' }, signal);
      if (!Array.isArray(data.buslines)) throw new QueryError('invalid_response', '高德未返回线路列表。');
      return { buslines: data.buslines, timingScope: '返回字段属于线路资料，不能代替具体上车站的实时到站时间。', realTimeArrivalAvailable: false };
    });
  }
  function qweatherHeaders(current: Record<string, unknown>): Record<string, string> {
    if (current.authentication !== 'jwt') return { 'X-QW-Api-Key': String(current.apiKey) };
    const now = Math.floor(Date.now() / 1000); const header = Buffer.from(JSON.stringify({ alg: 'EdDSA', kid: current.credentialId })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ iss: current.developerId, sub: current.projectId, iat: now - 30, exp: now + 870 })).toString('base64url');
    const unsigned = `${header}.${payload}`;
    let signature: string;
    try {
      const key = createPrivateKey(String(current.privateKey));
      if (key.asymmetricKeyType !== 'ed25519') throw new Error('Invalid key');
      signature = sign(null, Buffer.from(unsigned), key).toString('base64url');
    } catch { throw new QueryError('invalid_parameters', '和风 Ed25519 私钥不合法。'); }
    return { Authorization: `Bearer ${unsigned}.${signature}` };
  }
  async function weather(args: any, signal?: AbortSignal, forced?: 'qweather' | 'openmeteo') {
    const id = forced ?? (configured(definition('qweather'), config('qweather')) && config('qweather').enabled !== false ? 'qweather' : 'openmeteo');
    return run(id, args, id === 'qweather' ? 'https://dev.qweather.com/docs/api/weather/weather-current/' : 'https://open-meteo.com/', async (current, meta) => {
      let latitude: number; let longitude: number; let location: unknown;
      if (args.latitude !== undefined && args.longitude !== undefined) { latitude = coordinate(args.latitude, 90); longitude = coordinate(args.longitude, 180); }
      else {
        const name = text(args.location, '城市或坐标', 200);
        if (id === 'qweather') {
          const url = new URL(`${qweatherHost(current.host)}/geo/v2/city/lookup`); url.search = new URLSearchParams({ location: name, lang: 'zh', number: '5' }).toString();
          const { data } = await json(url, { headers: qweatherHeaders(current) }, signal);
          if (data.code !== '200' || !Array.isArray(data.location) || data.location.length === 0) throw new QueryError('invalid_parameters', '和风未找到城市，请使用具体经纬度。');
          location = data.location[0]; latitude = coordinate(Number(data.location[0].lat), 90); longitude = coordinate(Number(data.location[0].lon), 180);
        } else {
          const url = new URL('https://geocoding-api.open-meteo.com/v1/search'); url.search = new URLSearchParams({ name, count: '5', language: 'zh', format: 'json' }).toString();
          const { data } = await json(url, {}, signal);
          if (!Array.isArray(data.results) || !data.results.length) throw new QueryError('invalid_parameters', '天气服务未找到城市，请提供经纬度或城市英文名。');
          location = data.results[0]; latitude = coordinate(data.results[0].latitude, 90); longitude = coordinate(data.results[0].longitude, 180);
        }
      }
      const count = args.days ?? 3;
      if (!Number.isInteger(count) || count < 1 || count > 10) throw new QueryError('invalid_parameters', '预报天数为 1 至 10。');
      if (id === 'qweather') {
        const host = qweatherHost(current.host); const headers = qweatherHeaders(current);
        const nowUrl = `${host}/weather/v1/current/${latitude}/${longitude}?localTime=true&lang=zh`;
        const dailyUrl = `${host}/weather/v1/daily/${latitude}/${longitude}?days=${count}&localTime=true&lang=zh`;
        const now = await json(nowUrl, { headers }, signal); const daily = await json(dailyUrl, { headers }, signal);
        if (!now.data.condition || !now.data.temperature || !Array.isArray(daily.data.days) || !daily.data.days.length) throw new QueryError('invalid_response', '和风新版天气响应结构不正确。');
        return { latitude, longitude, location, current: now.data, days: daily.data.days, attribution: [...(now.data.metadata?.attributions ?? []), ...(daily.data.metadata?.attributions ?? [])], dataTimeAvailable: false };
      }
      const url = new URL('https://api.open-meteo.com/v1/forecast');
      url.search = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude), current: 'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m', daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,weather_code', forecast_days: String(count), timezone: 'Asia/Shanghai' }).toString();
      const { data } = await json(url, {}, signal);
      if (!data.current || !data.daily || data.timezone !== 'Asia/Shanghai') throw new QueryError('invalid_response', 'Open-Meteo 天气响应结构不正确。');
      meta.dataAt = typeof data.current.time === 'string' ? `${data.current.time}+08:00` : null;
      return { ...data, location, attribution: 'https://open-meteo.com/', weatherCodeStandard: 'WMO', dataKind: '天气模型数据，非现场实测。' };
    });
  }
  async function ima(path: string, body: Record<string, unknown>, signal?: AbortSignal, domain = 'note') {
    const current = requireConfig('ima');
    const { data } = await json(`https://ima.qq.com/openapi/${domain}/v1/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'ima-openapi-clientid': String(current.clientId), 'ima-openapi-apikey': String(current.apiKey) }, body: JSON.stringify(body) }, signal);
    assertProviderSuccess(data, 'ima'); return data.data ?? data;
  }
  async function knowledgeSearch(args: any, signal?: AbortSignal) {
    return run('ima', args, 'https://ima.qq.com/openapi/note/v1/search_note', async (_current, meta) => {
      if (args.knowledgeBaseId) {
        meta.source = 'https://ima.qq.com/openapi/wiki/v1/search_knowledge';
        const data = await ima('search_knowledge', { query: text(args.query, '搜索词', 500), cursor: args.cursor ?? '', knowledge_base_id: text(args.knowledgeBaseId, '知识库 ID', 500) }, signal, 'wiki');
        if (!Array.isArray(data.info_list)) throw new QueryError('invalid_response', 'ima 未返回知识库搜索结果。');
        return data;
      }
      const data = await ima('search_note', { search_type: args.searchContent === false ? 0 : 1, query_info: args.searchContent === false ? { title: text(args.query, '搜索词', 500) } : { content: text(args.query, '搜索词', 500) }, start: args.offset ?? 0, end: (args.offset ?? 0) + (args.limit ?? 10), sort_type: 0 }, signal);
      if (!Array.isArray(data.search_note_infos)) throw new QueryError('invalid_response', 'ima 未返回笔记搜索列表。');
      return data;
    });
  }
  async function knowledgeBases(args: any, signal?: AbortSignal) {
    return run('ima', args, 'https://ima.qq.com/openapi/wiki/v1/search_knowledge_base', async () => {
      const data = await ima('search_knowledge_base', { query: text(args.query, '知识库名称', 500), cursor: args.cursor ?? '', limit: args.limit ?? 10 }, signal, 'wiki');
      if (!Array.isArray(data.info_list)) throw new QueryError('invalid_response', 'ima 未返回知识库列表。');
      return data;
    });
  }
  async function knowledgeRead(args: any, signal?: AbortSignal) {
    return run('ima', args, 'https://ima.qq.com/openapi/note/v1/get_doc_content', async () => {
      const data = await ima('get_doc_content', { note_id: text(args.noteId, '笔记 ID', 500), target_content_format: 0 }, signal);
      if (typeof data.content !== 'string') throw new QueryError('invalid_response', 'ima 未返回笔记正文。');
      return { noteId: args.noteId, content: data.content };
    });
  }
  async function calendar(args: any, signal?: AbortSignal) {
    return run('calendar', args, 'https://github.com/NateScarlet/holiday-cn', async () => {
      if (signal?.aborted) throw new QueryError('cancelled', '查询已取消。');
      return queryCalendar(args.date, args.days);
    });
  }
  async function exchange(args: any, signal?: AbortSignal) {
    return run('exchange', args, 'https://api.frankfurter.dev/v2/', async (_current, meta) => {
      const base = text(args.base, '基础货币', 3).toUpperCase(); const quote = text(args.quote, '目标货币', 3).toUpperCase();
      if (!/^[A-Z]{3}$/.test(base) || !/^[A-Z]{3}$/.test(quote)) throw new QueryError('invalid_parameters', '货币使用三位代码，例如 CNY、USD。');
      const url = new URL(`https://api.frankfurter.dev/v2/rate/${base}/${quote}`); url.searchParams.set('providers', 'ecb');
      const { data } = await json(url, {}, signal);
      if (typeof data.rate !== 'number' || typeof data.date !== 'string') throw new QueryError('invalid_response', '汇率服务未返回参考汇率。');
      meta.dataAt = data.date;
      return { ...data, ...(args.amount !== undefined ? { amount: args.amount, convertedAmount: args.amount * data.rate } : {}), rateKind: 'ECB 参考汇率，非银行结算价或实时成交价。' };
    });
  }
  async function testResend(): Promise<{ ok: boolean; verified: boolean; message: string }> {
    const current = requireConfig('resend');
    let response: Response;
    try {
      response = await request('https://api.resend.com/domains', {
        method: 'GET', headers: { Authorization: `Bearer ${current.apiKey}` }, signal: AbortSignal.timeout(15000),
      });
    } catch { return { ok: false, verified: false, message: '无法连接 Resend 域名查询接口。未发送邮件。' }; }
    let body: unknown;
    try { body = await response.json(); }
    catch { return { ok: false, verified: false, message: 'Resend 域名查询响应无效。未发送邮件。' }; }
    const record = body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : {};
    const errorName = typeof record.name === 'string' ? record.name : typeof record.code === 'string' ? record.code : '';
    if (response.status === 401 && errorName === 'restricted_api_key')
      return { ok: true, verified: false, message: '发信 Key 已配置，但仅发信权限无法只读核对域名；尚未执行真实发信。' };
    if (!response.ok) return { ok: false, verified: false, message: `Resend 拒绝域名查询（HTTP ${response.status}）；请检查 Key 和权限。未发送邮件。` };
    const domains = record.data;
    if (!Array.isArray(domains)) return { ok: false, verified: false, message: 'Resend 未返回可核对的域名列表。未发送邮件。' };
    const domain = domains.find(item => item && typeof item === 'object' && item.name === 'jane-zz.me') as { status?: unknown; capabilities?: { sending?: unknown } } | undefined;
    if (!domain) return { ok: false, verified: false, message: '当前 Resend 域名列表未找到 jane-zz.me；请核对账户。未发送邮件。' };
    const verified = domain.status === 'verified' && domain.capabilities?.sending === 'enabled';
    return { ok: verified, verified, message: verified ? 'jane-zz.me 已验证并启用发信；未发送测试邮件。' : 'jane-zz.me 尚未同时满足已验证和发信启用；未发送邮件。' };
  }
  function tool(name: string, label: string, description: string, parameters: TSchema, call: (args: any, signal?: AbortSignal) => Promise<QueryResult>): ToolDefinition {
    return { name, label, description, parameters, executionMode: 'parallel',
      async execute(_id, args, signal) {
        const originalSecrets = definitions.flatMap(item => { const current = config(item.id); return secretNames(item).map(key => current[key]); });
        const result = await call(args, signal);
        const current = config(result.meta.provider);
        const secrets = [...originalSecrets, ...secretNames(definition(result.meta.provider)).map(key => current[key])].filter((value): value is string => typeof value === 'string' && Boolean(value));
        const serialized = JSON.stringify(result, (_key, value) => typeof value === 'string' ? secrets.reduce((text, secret) => text.split(secret).join('[redacted]'), value) : value);
        return { content: [{ type: 'text', text: serialized }], details: JSON.parse(serialized), isError: !result.ok };
      } };
  }
  const tools = () => [
    tool('web_search', '网页搜索', '通过博查检索国内网页，返回真实来源链接和发布时间；需要配置 Key。', Type.Object({ query: Type.String({ minLength: 1, maxLength: 2000 }), freshness: Type.Optional(Type.String({ maxLength: 80 })), count: Type.Optional(Type.Integer({ minimum: 1, maximum: 50 })) }), bocha),
    tool('maps_search', '地点查询', '高德地点查询，可按城市或 GCJ-02 经度,纬度搜索附近地点。', Type.Object({ query: Type.String({ minLength: 1 }), city: Type.Optional(Type.String()), location: Type.Optional(Type.String()), radius: Type.Optional(Type.Integer({ minimum: 1, maximum: 50000 })), limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 25 })) }), mapsSearch),
    tool('maps_geocode', '地址转坐标', '将详细地址解析为高德 GCJ-02 经纬度，返回所有匹配项供核对。', Type.Object({ address: Type.String(), city: Type.Optional(Type.String()) }), mapsGeocode),
    tool('maps_route', '路线查询', '高德驾车、步行、骑行、公交地铁路线。坐标为 GCJ-02 经度,纬度，公交须城市；不是实时到站。', Type.Object({ origin: Type.String(), destination: Type.String(), mode: Type.Optional(Type.Union(['transit', 'walking', 'driving', 'bicycling'].map(value => Type.Literal(value)))), city: Type.Optional(Type.String()), destinationCity: Type.Optional(Type.String()), date: Type.Optional(Type.String()), time: Type.Optional(Type.String()) }), mapsRoute),
    tool('maps_bus_line', '公交地铁线路', '查询高德公交或地铁线路资料，首末班仅按返回字段展示。', Type.Object({ query: Type.String(), city: Type.String() }), mapsBus),
    tool('weather_query', '天气查询', '查询天气。配置和风时使用和风；否则使用已启用的 Open-Meteo 国际非商业备用。提供城市名或经纬度，返回实际供应商和时间。', Type.Object({ location: Type.Optional(Type.String()), latitude: Type.Optional(Type.Number({ minimum: -90, maximum: 90 })), longitude: Type.Optional(Type.Number({ minimum: -180, maximum: 180 })), days: Type.Optional(Type.Integer({ minimum: 1, maximum: 10 })) }), weather),
    tool('knowledge_search', '搜索 ima 知识', '检索本人授权的 ima 笔记；提供 knowledgeBaseId 时检索该知识库，ID 从 knowledge_bases 真实结果取得。', Type.Object({ query: Type.String(), knowledgeBaseId: Type.Optional(Type.String()), cursor: Type.Optional(Type.String()), searchContent: Type.Optional(Type.Boolean()), offset: Type.Optional(Type.Integer({ minimum: 0 })), limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 20 })) }), knowledgeSearch),
    tool('knowledge_bases', '搜索 ima 知识库', '按名称检索本人授权可访问的 ima 知识库列表，取得真实知识库 ID。', Type.Object({ query: Type.String(), cursor: Type.Optional(Type.String()), limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 20 })) }), knowledgeBases),
    tool('knowledge_read', '读取 ima 笔记', '读取搜索结果中 note_id 对应的本人笔记纯文本，不猜测笔记 ID。', Type.Object({ noteId: Type.String() }), knowledgeRead),
    tool('calendar_query', '中国日历', '本地公农历、节气、已公布调休。日期默认中国时区今天；未收录的年度调休为未知，不能推断公司排班。', Type.Object({ date: Type.Optional(Type.String()), days: Type.Optional(Type.Integer({ minimum: 1, maximum: 62 })) }), calendar),
    tool('exchange_rate', '参考汇率', '获取 ECB 每日参考汇率，非银行结算价；货币使用 CNY/USD 等三位代码。', Type.Object({ base: Type.String(), quote: Type.String(), amount: Type.Optional(Type.Number({ minimum: 0, maximum: 1e12 })) }), exchange),
  ];
  const activeTools = () => tools().filter(item => {
    const name = item.name;
    if (name === 'web_search') return config('bocha').enabled !== false && configured(definition('bocha'),config('bocha'));
    if (name.startsWith('maps_')) return config('amap').enabled !== false && configured(definition('amap'),config('amap'));
    if (name === 'weather_query') return ['qweather','openmeteo'].some(id => config(id).enabled !== false && configured(definition(id),config(id)));
    if (name.startsWith('knowledge_')) return config('ima').enabled !== false && configured(definition('ima'),config('ima'));
    if (name === 'calendar_query') return config('calendar').enabled !== false;
    if (name === 'exchange_rate') return config('exchange').enabled !== false;
    return false;
  });
  return {
    list: () => definitions.map(item => view(item.id)),
    update(id: string, patch: Record<string, unknown>): Integration {
      const item = definition(id); const saved = load(id); const next = { ...saved.config };
      for (const [name, value] of Object.entries(patch)) {
        const field = item.fields.find(candidate => candidate.name === name);
        if (!field) throw new QueryError('invalid_parameters', `不支持的配置字段：${name}`);
        if (field.type === 'boolean') { if (typeof value !== 'boolean') throw new QueryError('invalid_parameters', `${field.label}须为布尔值。`); next[name] = value; }
        else {
          if (typeof value !== 'string' || value.length > 20000) throw new QueryError('invalid_parameters', `${field.label}参数不合法。`);
          if (field.options && !field.options.some(option => option.value === value)) throw new QueryError('invalid_parameters', `${field.label}选项不合法。`);
          if (!value.trim()) delete next[name]; else next[name] = value.trim();
        }
      }
      if (next.host) qweatherHost(next.host);
      opts.settings.set(`integration:${id}`, { config: next } satisfies SavedIntegration); publish(id); return view(id);
    },
    async test(id: string, beforeCommit?: () => void): Promise<{ ok: boolean; message: string }> {
      definition(id); const snapshot = JSON.stringify(config(id));
      if (id === 'resend') {
        let result: { ok: boolean; verified: boolean; message: string };
        try { result = await testResend(); }
        catch (error) { result = { ok: false, verified: false, message: error instanceof QueryError ? error.message : 'Resend 连接测试失败；未发送邮件。' }; }
        if (snapshot === JSON.stringify(config(id))) {
          beforeCommit?.();
          opts.settings.set(`integration:${id}`, { ...load(id), lastCheckedAt: new Date().toISOString(), verified: result.verified, ...(result.ok ? { lastError: undefined } : { lastError: result.message }) });
          publish(id);
        }
        return { ok: result.ok, message: result.message };
      }
      let result: QueryResult;
      if (id === 'bocha') result = await bocha({ query: '国务院', count: 1 });
      else if (id === 'amap') result = await mapsSearch({ query: '北京站', city: '北京', limit: 1 });
      else if (id === 'qweather' || id === 'openmeteo') result = await weather({ latitude: 39.9042, longitude: 116.4074, days: 1 }, undefined, id);
      else if (id === 'ima') result = await run('ima', {}, 'https://ima.qq.com/openapi/note/v1/list_notebook', async () => { const data = await ima('list_notebook', { cursor: '0', limit: 1 }); if (!Array.isArray(data.note_folder_infos)) throw new QueryError('invalid_response', 'ima 未返回笔记本列表。'); return data; });
      else if (id === 'calendar') result = await calendar({ date: '2026-10-10' });
      else result = await exchange({ base: 'CNY', quote: 'USD' });
      const message = result.ok ? id === 'calendar' ? '本地日历与调休数据可用。' : '已收到真实服务响应。' : result.error.message;
      if (snapshot === JSON.stringify(config(id))) { beforeCommit?.(); opts.settings.set(`integration:${id}`, { ...load(id), lastCheckedAt: new Date().toISOString(), verified: result.ok, ...(result.ok ? { lastError: undefined } : { lastError: message }) }); publish(id); }
      return { ok: result.ok, message };
    },
    tools,
    activeTools,
  };
}

export default createIntegrationService;
