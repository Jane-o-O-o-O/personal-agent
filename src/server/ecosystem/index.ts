import { McpClient, McpHttpError, StreamableHttpTransport } from '@earendil-works/pi-mcp';
import type { McpServerConfig } from '@earendil-works/pi-coding-agent';
import type { EcosystemItem, Integration, IntegrationField } from '../../shared/contracts.js';
import type { Store } from '../store.js';
import type { SettingsStore } from '../settings.js';
import type { createIntegrationService } from '../integrations/index.js';
import { AppError } from '../errors.js';
import catalog from './catalog.json' with { type: 'json' };

type IntegrationService = ReturnType<typeof createIntegrationService>;
type ManagedId = 'mcp-didi' | 'mcp-luckin' | 'mcp-variflight-aviation' | 'mcp-variflight-tripmatch';
interface ManagedDefinition {
  id: ManagedId; name: string; platform: string; category: string; description: string;
  sourceId: string; sourceUrl: string; version: string; access: string; limitations: string;
  capabilities: string[]; label: string; serverName: string; url: (apiKey: string) => string;
  headers?: (apiKey: string) => Record<string, string>; exposedTools: readonly string[];
}
interface SavedManaged {
  apiKey?: string; enabled?: boolean; verified?: boolean; lastCheckedAt?: string; lastError?: string; toolCount?: number;
}

const didiTools = [
  'maps_direction_bicycling', 'maps_direction_driving', 'maps_direction_transit', 'maps_direction_walking',
  'maps_place_around', 'maps_regeocode', 'maps_textsearch', 'taxi_estimate', 'taxi_generate_ride_app_link',
  'taxi_get_driver_location', 'taxi_query_order',
] as const;
const luckinTools = ['queryShopList', 'searchProductForMcp', 'switchProduct', 'queryProductDetailInfo', 'previewOrder', 'queryOrderDetailInfo'] as const;
const aviationTools = ['searchFlightsByDepArr', 'searchFlightsByNumber', 'getFlightTransferInfo', 'flightHappinessIndex', 'getRealtimeLocationByAnum', 'getTodayDate', 'getFutureWeatherByAirport', 'searchFlightItineraries', 'getFlightPriceByCities'] as const;
const tripmatchTools = ['searchFlightsByDepArr', 'searchFlightsByNumber', 'getFlightAndTrainTransferInfo', 'flightHappinessIndex', 'getTodayDate', 'getFutureWeatherByAirport', 'searchTrainTickets', 'searchTrainTicketsByStation', 'searchTrainTicketsByCity', 'getFlightPriceByCities', 'searchTrainStations'] as const;

const definitions: readonly ManagedDefinition[] = [
  {
    id: 'mcp-didi', name: '滴滴出行 · 查询沙箱', platform: '滴滴出行', category: 'transport',
    description: '官方远程 MCP：路线、估价、订单查询及打开滴滴 App 的链接。', sourceId: 'didi-ride-skill-official',
    sourceUrl: 'https://mcp.didichuxing.com/claw', version: '1.1.3', access: '需要个人滴滴 MCP Key；生产叫车另需 Pro、实名及支付条件。',
    limitations: '仅暴露查询、估价与 App 跳转工具；创建及取消订单在 Pi 运行时隐藏。每次 MCP 调用仍需本应用批准。',
    capabilities: ['路线', '估价', '订单查询', 'App 跳转'], label: '滴滴 MCP Key', serverName: 'managed-didi',
    url: apiKey => `https://mcp.didichuxing.com/mcp-servers-sandbox?key=${encodeURIComponent(apiKey)}`, exposedTools: didiTools,
  },
  {
    id: 'mcp-luckin', name: '瑞幸咖啡 · 自提查询', platform: '瑞幸咖啡', category: 'life',
    description: '官方远程 MCP：门店、商品、订单预览与已有订单查询。', sourceId: 'luckin-coffee-skill',
    sourceUrl: 'https://open.lkcoffee.com/mcp', version: '0.8.4', access: '需要瑞幸开放平台的个人 Token。',
    limitations: '仅开放自提商品与门店查询、订单预览及已有订单查询；创建和取消订单在 Pi 运行时隐藏，不含外送或支付。',
    capabilities: ['门店查询', '商品查询', '订单预览', '订单查询'], label: '瑞幸 MCP Token', serverName: 'managed-luckin',
    url: () => 'https://gwmcp.lkcoffee.com/order/user/mcp', headers: apiKey => ({ Authorization: `Bearer ${apiKey}` }), exposedTools: luckinTools,
  },
  {
    id: 'mcp-variflight-aviation', name: '飞常准 · 航班查询', platform: '飞常准', category: 'transport',
    description: '官方远程 Aviation MCP：航班、机场天气、转机及票价查询。', sourceId: 'variflight-mcp-official-docs-component',
    sourceUrl: 'https://ai.variflight.com', version: '0fef264ddc95', access: '需要飞常准个人开发者 API Key 与可用积分。',
    limitations: '仅查询；返回时价是快照，不含出票、锁票或支付。每次 MCP 调用仍需本应用批准。',
    capabilities: ['航班', '转机', '机场天气', '票价'], label: '飞常准 API Key', serverName: 'managed-variflight-aviation',
    url: () => 'https://ai.variflight.com/servers/aviation/mcp', headers: apiKey => ({ 'X-API-Key': apiKey }), exposedTools: aviationTools,
  },
  {
    id: 'mcp-variflight-tripmatch', name: '飞常准 · 火车与航班', platform: '飞常准', category: 'transport',
    description: '官方远程 Tripmatch MCP：火车票、站点及航班查询。', sourceId: 'variflight-mcp-official-docs-component',
    sourceUrl: 'https://ai.variflight.com', version: '0fef264ddc95', access: '需要飞常准个人开发者 API Key 与可用积分。',
    limitations: '仅查询；余票和价格为查询时快照，不含锁票、出票或支付。每次 MCP 调用仍需本应用批准。',
    capabilities: ['火车票', '站点', '航班', '票价'], label: '飞常准 API Key', serverName: 'managed-variflight-tripmatch',
    url: () => 'https://ai.variflight.com/servers/tripmatch/mcp', headers: apiKey => ({ 'X-API-Key': apiKey }), exposedTools: tripmatchTools,
  },
];

const deliveryPlans = [
  { id: 'plan-meituan-delivery', name: '美团外卖', platform: '美团', sourceUrl: 'https://open.meituan.com/' },
  { id: 'plan-taobao-flash', name: '淘宝闪购', platform: '淘宝', sourceUrl: 'https://open.taobao.com/' },
  { id: 'plan-jd-delivery', name: '京东外卖', platform: '京东', sourceUrl: 'https://open.jd.com/' },
] as const;
const wpsPlan = {
  id: 'plan-wps365-mcp', name: 'WPS 365 官方远程 MCP', platform: 'WPS 365', category: 'organization', kind: 'mcp',
  description: 'WPS 官方远程 MCP 接入路线，需企业试用和应用授权。', status: 'reference',
  installable: false, enabled: false,
  sourceUrl: 'https://open.wps.cn/documents/app-integration-dev/mcp-server/introduction', sourceType: '官方文档',
  access: '需 WPS 365 企业试用、应用注册和管理员授权。',
  limitations: ['当前没有用户企业授权，未连接 WPS 服务器，也未验证文档、表格等实际业务权限。'],
  capabilities: [], fields: [], configuredFields: {},
} satisfies EcosystemItem;

function platform(name: string, id: string): string {
  const normalized = `${id} ${name}`.toLowerCase();
  const names: [RegExp, string][] = [
    [/didi|滴滴/, '滴滴出行'], [/luckin|瑞幸/, '瑞幸咖啡'], [/meituan|美团/, '美团'],
    [/wps/, 'WPS'], [/amap|高德/, '高德地图'], [/baidu|百度/, '百度'], [/qweather|和风/, '和风天气'],
    [/variflight|飞常准/, '飞常准'], [/tencent|腾讯|qq|ima|微信|weixin/, '腾讯'],
    [/feishu|lark|飞书/, '飞书'], [/dingtalk|钉钉/, '钉钉'], [/wecom|企业微信/, '企业微信'],
    [/aliyun|阿里云/, '阿里云'], [/kuaidi100|快递100/, '快递100'], [/yuque|语雀/, '语雀'],
    [/open-meteo/, 'Open-Meteo'], [/zhipu|智谱/, '智谱'],
  ];
  return names.find(([pattern]) => pattern.test(normalized))?.[1] || '其他';
}

function category(name: string, kind: string): string {
  const text = `${name} ${kind}`.toLowerCase();
  if (/打车|航班|火车|公交|地铁|地图|路线|携程|旅|didi|variflight|amap|maps/.test(text)) return 'transport';
  if (/咖啡|外卖|美团|luckin/.test(text)) return 'life';
  if (/天气|weather|mete[o]|彩云|和风/.test(text)) return 'weather';
  if (/快递|物流|kuaidi/.test(text)) return 'logistics';
  if (/飞书|钉钉|企业微信|微信|qq|邮箱|channel/.test(text)) return 'messaging';
  if (/文档|笔记|知识|wps|语雀|ima/.test(text)) return 'knowledge';
  if (/搜索|search|博查|智谱/.test(text)) return 'search';
  if (/云|cloud|阿里|火山|七牛|qiniu|devops|gitee/.test(text)) return 'development';
  return 'life';
}

function safeConfig(definition: ManagedDefinition, apiKey: string, endpoint?: string): McpServerConfig {
  const toolExposure = Object.fromEntries(definition.exposedTools.map(name => [name, 'direct' as const]));
  return { url: endpoint || definition.url(apiKey), ...(definition.headers ? { headers: definition.headers(apiKey) } : {}),
    // Didi and VariFlight do not use Pi OAuth; their own key is sent by query or X-API-Key.
    ...(definition.id !== 'mcp-luckin' ? { auth: { provider: 'personal-agent-managed-no-oauth' } } : {}),
    exposure: 'hidden', toolExposure, timeout: 20, description: definition.description };
}

async function probe(definition: ManagedDefinition, apiKey: string, endpoint?: string): Promise<number> {
  const client = new McpClient({ name: 'PersonalAgent', version: '0.1.0', requestTimeoutMs: 12000 });
  const config = safeConfig(definition, apiKey, endpoint);
  const transport = new StreamableHttpTransport({ url: (config as { url: string }).url,
    headers: 'headers' in config ? config.headers : undefined, openGetStream: false });
  try {
    await client.connect(transport);
    const tools = await client.listTools({ timeoutMs: 12000 });
    const safe = tools.filter(tool => definition.exposedTools.includes(tool.name));
    if (!safe.length) throw new AppError('MCP_TOOLS_UNAVAILABLE', '服务已连接，但未发现当前允许的查询工具。', 502);
    return safe.length;
  } finally { await client.close().catch(() => {}); }
}

function probeFailure(error: unknown): string {
  if (error instanceof AppError && error.code === 'MCP_TOOLS_UNAVAILABLE') return error.message;
  if (error instanceof McpHttpError && [401, 403].includes(error.status)) return 'MCP 服务拒绝了凭据或账号权限。';
  if (error instanceof McpHttpError && error.status === 429) return 'MCP 服务限流或额度不足。';
  if (error instanceof McpHttpError && error.status === 404) return 'MCP 服务端点不可用，请稍后核对官方服务状态。';
  return 'MCP 握手或工具列表验证失败；请核对凭据、权限与服务状态。';
}

export function createEcosystemService(opts: {
  store: Store; settings: SettingsStore; integrations: IntegrationService;
  configuredMcpNames?: () => string[];
  beforeMutation?: () => void;
  endpointOverrides?: Partial<Record<ManagedId, string>>;
  probe?: (definition: ManagedDefinition, apiKey: string) => Promise<number>;
}) {
  const key = (id: ManagedId) => `ecosystem:mcp:${id}`;
  const saved = (id: ManagedId) => opts.settings.get<SavedManaged>(key(id), {});
  const findManaged = (id: string) => definitions.find(item => item.id === id);
  const findBuiltin = (id: string) => id.startsWith('connector-') ? opts.integrations.list().find(item => item.id === id.slice(10)) : undefined;
  const publish = (item: EcosystemItem) => opts.store.publish('ecosystem.updated', item.id, item);
  const normalizedMcpName = (name: string) => name.replace(/-/g, '_');
  const busy = new Set<string>();
  const exclusive = async <T>(id: string, work: () => Promise<T>): Promise<T> => {
    if (busy.has(id)) throw new AppError('ECOSYSTEM_BUSY', '此连接正在验证，请稍后再试。', 409);
    busy.add(id); try { return await work(); } finally { busy.delete(id); }
  };
  const managedItem = (definition: ManagedDefinition): EcosystemItem => {
    const state = saved(definition.id);
    const hasKey = Boolean(state.apiKey);
    const enabled = Boolean(state.enabled && state.verified && hasKey);
    return { id: definition.id, name: definition.name, platform: definition.platform, category: definition.category,
      kind: 'mcp', description: definition.description, status: enabled ? 'enabled' : hasKey ? 'available' : 'needs_credentials',
      installable: true, enabled, sourceUrl: definition.sourceUrl, sourceType: '官方发布', version: definition.version,
      access: definition.access, limitations: [definition.limitations], capabilities: definition.capabilities,
      fields: [{ name: 'apiKey', label: definition.label, type: 'password', required: true }],
      configuredFields: { apiKey: hasKey }, lastCheckedAt: state.lastCheckedAt, lastError: state.lastError,
      toolCount: state.toolCount,
    };
  };
  const builtinItem = (integration: Integration): EcosystemItem => {
    const enabled = integration.config.enabled !== false && integration.status !== 'unconfigured';
    const isMissing = integration.status === 'unconfigured';
    return { id: `connector-${integration.id}`, name: integration.name, platform: platform(integration.name, integration.id),
      category: category(integration.name, 'connector'), kind: 'connector', description: integration.description,
      status: isMissing ? 'needs_credentials' : enabled ? 'enabled' : 'available', installable: true, enabled,
      sourceType: '项目内建', access: isMissing ? '需要配置相应凭据。' : '使用当前用户已配置的连接。',
      limitations: integration.id === 'resend' ? ['每封发信仍须应用内审批，Resend 接受不等于邮件已送达。'] : [],
      capabilities: integration.capabilities, fields: integration.fields.filter(field => field.name !== 'enabled'),
      configuredFields: Object.fromEntries([
        ...Object.entries(integration.secretFields),
        ...Object.entries(integration.config).filter(([name,value]) => name !== 'enabled' && typeof value === 'string').map(([name,value]) => [name,Boolean(value)] as const),
      ]), integrationId: integration.id,
      lastCheckedAt: integration.lastCheckedAt, lastError: integration.lastError,
    };
  };
  const assetItems = (catalog.entries as Array<typeof catalog.entries[number]>).map(asset => ({
    id: `asset-${asset.id}`, name: asset.name, platform: asset.platform, category: asset.category,
    kind: asset.kind, description: `${asset.sourceType} · 固定版本 ${asset.version}；已归档供开发参考。`,
    status: (asset.kind === 'docs' || asset.kind.includes('spec') || asset.kind.includes('library') ? 'reference' : 'archived') as EcosystemItem['status'],
    installable: false, enabled: false, sourceUrl: asset.sourceUrl, sourceType: asset.sourceType, version: asset.version,
    access: asset.access, limitations: [...asset.limitations, '归档文件不等于已安装、已授权或可在 Pi 中直接运行。'],
    capabilities: [], fields: [], configuredFields: {},
  })) satisfies EcosystemItem[];
  const planItems: EcosystemItem[] = [...deliveryPlans.map(plan => ({
    id: plan.id, name: plan.name, platform: plan.platform, category: 'life', kind: 'plan',
    description: '外卖平台参考入口。当前没有已验证、可供本项目使用的通用个人下单接口。',
    status: 'reference' as const, installable: false, enabled: false, sourceUrl: plan.sourceUrl, sourceType: '平台参考',
    access: '需要平台正式开放的业务授权与接口。', limitations: ['不能安装为可调用工具，也不支持自动下单或支付。'],
    capabilities: [], fields: [], configuredFields: {},
  })), wpsPlan];

  const list = (): EcosystemItem[] => [...opts.integrations.list().map(builtinItem), ...definitions.map(managedItem), ...planItems, ...assetItems];
  const one = (id: string) => list().find(item => item.id === id);
  const requireInstallable = (id: string) => {
    const item = one(id);
    if (!item) throw new AppError('ECOSYSTEM_NOT_FOUND', '生态条目不存在。', 404);
    if (!item.installable) throw new AppError('ECOSYSTEM_UNAVAILABLE', '该条目只是已归档资料或规划项，暂不能安装。', 409);
    return item;
  };
  const checkCredential = (apiKey: unknown): string => {
    if (typeof apiKey !== 'string' || apiKey.length < 8 || apiKey.length > 4096 || !/^[A-Za-z0-9._~+\/=:-]+$/.test(apiKey))
      throw new AppError('INVALID_CREDENTIAL', '凭据格式不正确。', 400);
    return apiKey;
  };
  const runProbe = async (definition: ManagedDefinition, apiKey: string): Promise<number> =>
    opts.probe ? opts.probe(definition, apiKey) : probe(definition, apiKey, opts.endpointOverrides?.[definition.id]);
  const activate = async (definition: ManagedDefinition, config: Record<string, unknown> = {}): Promise<EcosystemItem> => exclusive(definition.id, async () => {
    if (Object.keys(config).some(name => name !== 'apiKey')) throw new AppError('INVALID_INPUT', '此连接只接受指定凭据字段。');
    if (opts.configuredMcpNames?.().some(name => normalizedMcpName(name) === normalizedMcpName(definition.serverName)))
      throw new AppError('MCP_NAME_CONFLICT', '自定义 MCP 已占用此扩展名称；请先在连接页更名。', 409);
    const before = saved(definition.id);
    const apiKey = config.apiKey === undefined ? before.apiKey : checkCredential(config.apiKey);
    if (!apiKey) throw new AppError('NEEDS_CREDENTIALS', `请先填写${definition.label}。`, 409);
    let count: number;
    try { count = await runProbe(definition, apiKey); }
    catch (error) { throw new AppError('MCP_CONNECT_FAILED', probeFailure(error), 502); }
    if (!Number.isSafeInteger(count) || count < 1) throw new AppError('MCP_TOOLS_UNAVAILABLE', '未发现当前允许的查询工具。', 502);
    opts.beforeMutation?.();
    opts.settings.set(key(definition.id), { apiKey, enabled: true, verified: true, toolCount: count, lastCheckedAt: new Date().toISOString() } satisfies SavedManaged);
    const item = managedItem(definition); publish(item); return item;
  });
  return {
    list,
    reservedMcpNames: () => definitions.filter(definition => {
      const state = saved(definition.id); return state.enabled && state.verified && Boolean(state.apiKey);
    }).map(definition => definition.serverName),
    managedConfigs(): Array<{ name: string; config: McpServerConfig; source: string; scope: 'global' }> {
      return definitions.flatMap(definition => {
        const state = saved(definition.id);
        return state.enabled && state.verified && state.apiKey ? [{ name: definition.serverName, config: safeConfig(definition, state.apiKey, opts.endpointOverrides?.[definition.id]), source: `managed:${definition.id}`, scope: 'global' as const }] : [];
      });
    },
    async install(id: string, config: Record<string, unknown> = {}): Promise<EcosystemItem> {
      requireInstallable(id);
      opts.beforeMutation?.();
      const managed = findManaged(id);
      if (managed) return activate(managed, config);
      const builtin = findBuiltin(id)!;
      const patch = { ...config, enabled: true };
      const result = opts.integrations.update(builtin.id, patch);
      const item = builtinItem(result); publish(item); return item;
    },
    async uninstall(id: string): Promise<EcosystemItem> {
      requireInstallable(id);
      opts.beforeMutation?.();
      const managed = findManaged(id);
      if (managed) return exclusive(id, async () => {
        opts.settings.delete(key(managed.id));
        const item = managedItem(managed); publish(item); return item;
      });
      const builtin = findBuiltin(id)!;
      const result = opts.integrations.update(builtin.id, { enabled: false });
      const item = builtinItem(result); publish(item); return item;
    },
    async test(id: string): Promise<{ ok: boolean; message: string; item: EcosystemItem }> {
      requireInstallable(id);
      opts.beforeMutation?.();
      const managed = findManaged(id);
      if (managed) {
        return exclusive(id, async () => {
          const before = saved(managed.id);
          if (!before.apiKey) return { ok: false, message: `请先填写${managed.label}。`, item: managedItem(managed) };
          let ok = false; let message: string; let toolCount = before.toolCount;
          try {
            toolCount = await runProbe(managed, before.apiKey);
            ok = Number.isSafeInteger(toolCount) && toolCount > 0;
            message = ok ? `MCP 已连接，当前开放 ${toolCount} 个查询工具。` : '未发现当前允许的查询工具。';
          } catch (error) { message = probeFailure(error); }
          opts.beforeMutation?.();
          opts.settings.set(key(managed.id), { ...before, verified: ok, enabled: before.enabled && ok, lastCheckedAt: new Date().toISOString(), lastError: ok ? undefined : message, toolCount: ok ? toolCount : undefined } satisfies SavedManaged);
          const item = managedItem(managed); publish(item);
          return { ok, message, item };
        });
      }
      const builtin = findBuiltin(id)!;
      const result = await opts.integrations.test(builtin.id, opts.beforeMutation);
      const item = builtinItem(opts.integrations.list().find(entry => entry.id === builtin.id)!);
      publish(item);
      return { ...result, item };
    },
  };
}

export type EcosystemService = ReturnType<typeof createEcosystemService>;
