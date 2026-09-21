import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowDownToLine, ArrowUpRight, BookOpen, CarFront, Check, CheckCircle2, ChevronRight, CircleHelp, Coffee, Filter, KeyRound, Layers3, LoaderCircle, MapPinned, PackageOpen, RefreshCw, Search, ShieldAlert, TrainFront, Trash2, UtensilsCrossed, X } from 'lucide-react';
import type { EcosystemItem, EcosystemStatus } from '../shared/contracts';
import { api, errorMessage } from './api';
import { IconButton } from './ui';

type FilterMode = 'all' | 'enabled' | 'installable' | 'research';
type SceneId = 'ride' | 'coffee' | 'delivery' | 'tickets' | 'maps';
const scenes = [
  { id: 'ride', label: '滴滴打车', note: '查看接入条件', icon: CarFront, words: /滴滴|打车/i },
  { id: 'coffee', label: '瑞幸咖啡', note: '查看接入条件', icon: Coffee, words: /瑞幸|咖啡/i },
  { id: 'delivery', label: '外卖平台', note: '暂不能安装', icon: UtensilsCrossed, words: /外卖|闪购|京东到家/i },
  { id: 'tickets', label: '火车与航班', note: '时刻与票务资料', icon: TrainFront, words: /火车|航班|机票|12306|飞常准|tripmatch|variflight/i },
  { id: 'maps', label: '地图与地铁', note: '路线与站点查询', icon: MapPinned, words: /地图|地铁|公交|高德|百度地图/i },
] as const;
const statusCopy: Record<EcosystemStatus, string> = {
  enabled: '已启用', needs_credentials: '需凭据', available: '可安装', archived: '已归档', reference: '仅参考',
};
const categoryCopy: Record<string, string> = {
  life: '生活服务', transport: '交通出行', maps: '地图位置', logistics: '物流快递', weather: '天气',
  search: '搜索', knowledge: '知识文档', organization: '办公协作', messaging: '消息', calendar: '日历',
  currency: '汇率', development: '开发工具', cloud: '云服务', ocr: '图文识别', framework: '框架',
};
const kindCopy: Record<string, string> = {
  'skill-bundle': 'Skill 发布包', 'skill-source': 'Skill 源码', 'mcp-package': 'MCP 发布包',
  'mcp-source': 'MCP 源码', 'cli-package': 'CLI 发布包', 'cli-source': 'CLI 源码',
  docs: '官方文档', 'api-source': 'API 源码', 'api-docs-source': 'API 文档',
  'api-spec': 'API 规范', 'sdk-source': 'SDK 源码', 'agent-source': 'Agent 源码',
  'channel-source': '渠道源码', 'library-source': '代码库', 'data-source': '数据源',
  mcp: '远程 MCP', connector: '内建连接器', plan: '接入规划',
};
function statusIcon(status: EcosystemStatus) {
  return status === 'enabled' ? <CheckCircle2 size={13} />
    : status === 'needs_credentials' ? <KeyRound size={13} />
      : status === 'available' ? <ArrowDownToLine size={13} />
        : status === 'archived' ? <PackageOpen size={13} /> : <BookOpen size={13} />;
}
function safeSource(value?: string) {
  if (!value) return null;
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : null; } catch { return null; }
}

export function EcosystemView({ onConnections }: { onConnections: () => void }) {
  const [items, setItems] = useState<EcosystemItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [scene, setScene] = useState<SceneId | null>(null);
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const load = async (initial = false) => {
    if (initial) setLoading(true); else setRefreshing(true);
    setError(null);
    try {
      const response = await api<{ items: EcosystemItem[] } | EcosystemItem[]>('/ecosystem');
      const incoming = Array.isArray(response) ? response : response.items;
      if (!Array.isArray(incoming)) throw new Error('生态目录格式不正确');
      setItems(incoming);
      return incoming;
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => { void load(true); }, []);
  useEffect(() => {
    if (!selectedId) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelectedId(null); };
    window.addEventListener('keydown', closeOnEscape);
    if (window.matchMedia('(max-width: 850px)').matches) {
      window.requestAnimationFrame(() => (document.querySelector('.ecosystem-detail-close') as HTMLButtonElement | null)?.focus());
    }
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedId]);

  const selected = items.find(item => item.id === selectedId) ?? null;
  const categories = useMemo(() => [...new Set(items.map(item => item.category))].sort((a, b) => (categoryCopy[a] ?? a).localeCompare(categoryCopy[b] ?? b, 'zh-CN')), [items]);
  const filtered = useMemo(() => items.filter(item => {
    if (category !== 'all' && item.category !== category) return false;
    if (scene && !scenes.find(entry => entry.id === scene)?.words.test([item.name, item.platform, item.description, ...(item.capabilities ?? [])].join(' '))) return false;
    if (filter === 'enabled' && item.status !== 'enabled') return false;
    if (filter === 'installable' && (!item.installable || item.status === 'enabled')) return false;
    if (filter === 'research' && item.status !== 'archived' && item.status !== 'reference') return false;
    const needle = search.trim().toLocaleLowerCase('zh-CN');
    return !needle || [item.name, item.platform, item.description, item.category, item.kind, ...(item.capabilities ?? [])].some(value => typeof value === 'string' && value.toLocaleLowerCase('zh-CN').includes(needle));
  }), [items, category, filter, search, scene]);
  const counts = {
    enabled: items.filter(item => item.status === 'enabled').length,
    installable: items.filter(item => item.installable && item.status !== 'enabled').length,
    research: items.filter(item => item.status === 'archived' || item.status === 'reference').length,
  };

  const choose = (item: EcosystemItem) => {
    setSelectedId(item.id); setValues({}); setConfirmRemove(false); setNotice(null);
  };
  const install = async (item: EcosystemItem) => {
    setWorkingId(item.id); setError(null); setNotice(null);
    try {
      const config = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ''));
      const result = await api<EcosystemItem | { item?: EcosystemItem }>(`/ecosystem/${encodeURIComponent(item.id)}/install`, { method: 'POST', body: { config } });
      setValues({});
      const refreshed = await load();
      const returned = result && typeof result === 'object' && 'item' in result ? result.item : result as EcosystemItem;
      const current = refreshed?.find(entry => entry.id === item.id) ?? returned;
      setNotice(current?.enabled && current.status === 'enabled'
        ? `${item.name} 已接入 Agent。`
        : `${item.name} 的配置已保存，但尚未启用或验证。请查看状态及授权要求。`);
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setWorkingId(null); }
  };
  const remove = async (item: EcosystemItem) => {
    setWorkingId(item.id); setError(null); setNotice(null);
    try {
      await api(`/ecosystem/${encodeURIComponent(item.id)}`, { method: 'DELETE' });
      setNotice(`${item.name} 已卸载。`); setConfirmRemove(false);
      await load();
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setWorkingId(null); }
  };
  const test = async (item: EcosystemItem) => {
    setWorkingId(item.id); setError(null); setNotice(null);
    try {
      const result = await api<{ ok: boolean; message?: string }>(`/ecosystem/${encodeURIComponent(item.id)}/test`, { method: 'POST', body: {} });
      await load();
      if (result.ok) setNotice(result.message || `${item.name} 连接测试通过。`);
      else setError(result.message || `${item.name} 连接测试未通过，请检查授权与配置。`);
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setWorkingId(null); }
  };
  const source = safeSource(selected?.sourceUrl);

  return <section className="resource-page ecosystem-page">
    <header className="page-heading ecosystem-heading"><div className="heading-copy"><h1>生态扩展</h1><span className="heading-meta">管理可接入的 MCP、Skill 与开发资料</span></div>
      <IconButton icon={RefreshCw} label="刷新生态目录" busy={refreshing} onClick={() => void load()} /></header>
    <div className="ecosystem-shell">
      <div className="ecosystem-intro"><div><span className="ecosystem-eyebrow"><Layers3 size={14} />生态目录</span><h2>把需要的能力接入 Agent</h2><p>目录收录了可安装扩展和本地研究资料。只有标记「可安装」的条目才会写入运行配置；外部服务仍需各自授权。</p></div>
        <div className="ecosystem-metrics" aria-label="生态目录概况"><div><strong>{items.length}</strong><span>目录条目</span></div><div><strong>{counts.enabled}</strong><span>已启用</span></div><div><strong>{counts.installable}</strong><span>可安装</span></div><div><strong>{counts.research}</strong><span>资料与参考</span></div></div></div>
      {error && <div className="notice error ecosystem-notice" role="alert"><AlertCircle size={16} /><span>{error}</span><button type="button" onClick={() => setError(null)} aria-label="关闭错误"><X size={15} /></button></div>}
      {notice && <div className="notice success ecosystem-notice" role="status"><Check size={16} /><span>{notice}</span><button type="button" onClick={() => setNotice(null)} aria-label="关闭提示"><X size={15} /></button></div>}
      <section className="ecosystem-scenes" aria-label="常用场景"><div className="ecosystem-scenes-heading"><div><span>常用场景</span><p>先看能做什么，再决定是否接入</p></div>{scene && <button type="button" onClick={() => setScene(null)}>显示全部<X size={13} /></button>}</div>
        <div className="ecosystem-scene-list">{scenes.map(entry => <button key={entry.id} type="button" className={`ecosystem-scene ${scene === entry.id ? 'selected' : ''}`} aria-pressed={scene === entry.id} onClick={() => { setScene(scene === entry.id ? null : entry.id); setSearch(''); setCategory('all'); setFilter('all'); setSelectedId(null); }}><span className="ecosystem-scene-icon"><entry.icon size={18} strokeWidth={1.8} /></span><strong>{entry.label}</strong><span>{entry.note}</span></button>)}</div></section>
      <div className="ecosystem-toolbar"><label className="ecosystem-search"><Search size={17} /><input type="search" aria-label="搜索生态扩展" placeholder="搜索服务、功能或关键词" value={search} onChange={event => { setSearch(event.target.value); setScene(null); }} /></label>
        <label className="ecosystem-category"><Filter size={15} /><select aria-label="筛选分类" value={category} onChange={event => { setCategory(event.target.value); setScene(null); }}><option value="all">全部分类</option>{categories.map(value => <option key={value} value={value}>{categoryCopy[value] ?? value}</option>)}</select></label></div>
      <div className="ecosystem-filters" role="tablist" aria-label="生态状态筛选">{([
        ['all', '全部', items.length], ['enabled', '已启用', counts.enabled], ['installable', '可安装', counts.installable], ['research', '资料与参考', counts.research],
      ] as const).map(([id, label, count]) => <button key={id} type="button" role="tab" aria-selected={filter === id} onClick={() => setFilter(id)}>{label}<span>{count}</span></button>)}</div>
      <div className="ecosystem-content"><div className="ecosystem-list" aria-label="生态扩展列表">
        {loading ? <div className="loading-state"><LoaderCircle size={20} className="spin" />加载目录</div>
          : filtered.length ? filtered.map(item => <button key={item.id} type="button" className={`ecosystem-card ${selected?.id === item.id ? 'selected' : ''}`} onClick={() => choose(item)} aria-pressed={selected?.id === item.id}>
            <span className="ecosystem-card-mark" aria-hidden="true">{item.platform?.trim().slice(0, 1) || item.name.trim().slice(0, 1)}</span><span className="ecosystem-card-body"><span className="ecosystem-card-top"><strong>{item.name}</strong><span className={`ecosystem-status ${item.status}`}>{statusIcon(item.status)}{statusCopy[item.status] ?? item.status}</span></span>
              <span className="ecosystem-card-meta">{item.platform} · {categoryCopy[item.category] ?? item.category} · {kindCopy[item.kind] ?? item.kind}</span>
              <span className="ecosystem-card-description">{item.description || item.access || '查看接入方式、能力和限制'}</span></span><ChevronRight className="ecosystem-card-arrow" size={17} /></button>)
            : <div className="ecosystem-empty"><Search size={24} /><strong>{scene === 'delivery' ? '普通外卖暂不能安装' : '没有匹配的条目'}</strong><span>{scene === 'delivery' ? '当前仅保留可核实的接入研究资料，尚无可运行适配器。' : '试试其他关键词或分类'}</span><button type="button" className="button secondary compact" onClick={() => { setSearch(''); setCategory('all'); setFilter('all'); setScene(null); }}>清除筛选</button></div>}
      </div>
      <aside className={`ecosystem-detail ${selected ? 'has-selection' : ''}`} aria-label="扩展详情">{selected ? <>
        <div className="ecosystem-detail-header"><div><span className="ecosystem-detail-overline">{categoryCopy[selected.category] ?? selected.category} / {kindCopy[selected.kind] ?? selected.kind}</span><h2>{selected.name}</h2><span className="ecosystem-detail-platform">{selected.platform}{selected.sourceType ? ` · ${selected.sourceType}` : ''}{selected.version ? ` · ${selected.version}` : ''}</span></div><IconButton icon={X} label="关闭详情" className="ecosystem-detail-close" onClick={() => setSelectedId(null)} /></div>
        <span className={`ecosystem-status large ${selected.status}`}>{statusIcon(selected.status)}{statusCopy[selected.status] ?? selected.status}</span>
        {selected.description && <p className="ecosystem-detail-description">{selected.description}</p>}
        {selected.lastError && <div className="notice warning"><ShieldAlert size={15} />{selected.lastError}</div>}
        {!!selected.capabilities?.length && <section className="ecosystem-detail-section"><h3>可提供的能力</h3><div className="ecosystem-capabilities">{selected.capabilities.map(value => <span key={value}>{value}</span>)}</div></section>}
        {selected.access && <section className="ecosystem-detail-section"><h3>接入条件</h3><p>{selected.access}</p></section>}
        {!!selected.limitations?.length && <section className="ecosystem-detail-section"><h3>范围与限制</h3><ul>{selected.limitations.map((value, index) => <li key={`${selected.id}-limit-${index}`}>{value}</li>)}</ul></section>}
        {(selected.status === 'archived' || selected.status === 'reference') && <div className="ecosystem-research-note"><CircleHelp size={17} /><span>{selected.status === 'archived' ? '本地保存了源码或文档，尚未接入 Agent 运行时。' : '此条目仅供接入研究，尚不能安装或调用。'}</span></div>}
        {selected.installable && selected.status !== 'enabled' && <form className="ecosystem-install-form" onSubmit={event => { event.preventDefault(); void install(selected); }}><h3>安装配置</h3><p>安装后仍需完成服务方授权；需要付款、下单或写入数据的操作由 Agent 单独请求批准。</p>
          {selected.fields?.map(field => <label key={field.name}>{field.label}{field.required && <span className="required-mark">必填</span>}
            {field.type === 'boolean' ? <input type="checkbox" checked={Boolean(values[field.name])} onChange={event => setValues(previous => ({ ...previous, [field.name]: event.target.checked }))} />
              : field.type === 'select' ? <select required={field.required} value={String(values[field.name] ?? '')} onChange={event => setValues(previous => ({ ...previous, [field.name]: event.target.value }))}><option value="">请选择</option>{field.options?.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                : field.type === 'textarea' ? <textarea required={field.required && !selected.configuredFields?.[field.name]} placeholder={selected.configuredFields?.[field.name] ? '已保存，留空则保持不变' : field.placeholder} value={String(values[field.name] ?? '')} onChange={event => setValues(previous => ({ ...previous, [field.name]: event.target.value }))} />
                  : <input type={field.type === 'password' ? 'password' : field.type === 'number' ? 'number' : 'text'} required={field.required && !selected.configuredFields?.[field.name]} autoComplete={field.type === 'password' ? 'new-password' : 'off'} placeholder={selected.configuredFields?.[field.name] ? '已保存，留空则保持不变' : field.placeholder} value={String(values[field.name] ?? '')} onChange={event => setValues(previous => ({ ...previous, [field.name]: event.target.value }))} />}</label>)}
          <button className="button" type="submit" disabled={workingId !== null}>{workingId === selected.id ? <LoaderCircle size={16} className="spin" /> : <ArrowDownToLine size={16} />}安装扩展</button>
        </form>}
        {selected.status === 'enabled' && <div className="ecosystem-enabled-actions"><div><CheckCircle2 size={18} /><span>已接入 Agent 运行配置</span></div><button className="button secondary compact" type="button" disabled={workingId !== null} onClick={() => void test(selected)}>{workingId === selected.id ? <LoaderCircle size={14} className="spin" /> : <RefreshCw size={14} />}测试连接</button>{selected.integrationId && <button className="button secondary compact" type="button" onClick={onConnections}>管理连接<ChevronRight size={14} /></button>}
          {!confirmRemove ? <button className="button secondary compact" type="button" onClick={() => setConfirmRemove(true)}><Trash2 size={14} />卸载</button>
            : <div className="ecosystem-confirm-remove"><span>确定卸载此扩展？</span><button type="button" className="button secondary compact" onClick={() => setConfirmRemove(false)}>取消</button><button type="button" className="button compact" disabled={workingId !== null} onClick={() => void remove(selected)}>{workingId === selected.id ? <LoaderCircle size={14} className="spin" /> : <Trash2 size={14} />}确认卸载</button></div>}</div>}
        {source && <a className="ecosystem-source-link" href={source} target="_blank" rel="noopener noreferrer">查看原始来源<ArrowUpRight size={15} /></a>}
      </> : <div className="ecosystem-detail-placeholder"><Layers3 size={30} strokeWidth={1.4} /><h2>选择一个扩展</h2><p>查看来源、接入条件和当前运行状态。</p></div>}</aside></div>
    </div>
  </section>;
}
