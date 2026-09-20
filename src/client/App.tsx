import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Brain, CircleHelp, Globe, Layers3, Link2, LoaderCircle, LogOut, Menu, MessageSquare, Plus, RefreshCw, Search, Target, X } from 'lucide-react';
import { api, errorMessage } from './api';
import { ApprovalItem, Chat, type RunAction } from './Chat';
import { BrowserPanel } from './BrowserPanel';
import { ConnectionsView } from './Connections';
import { EcosystemView } from './Ecosystem';
import { GoalsView, MemoriesView } from './Resources';
import { formatTime, IconButton, Status } from './ui';
import { useWorkbench } from './use-workbench';

type View = 'tasks' | 'goals' | 'memories' | 'connections' | 'ecosystem' | 'browser' | 'approvals';
function initialRoute(): { view: View; taskId: string | null } {
  const [view, id] = location.hash.slice(1).split('/');
  let taskId: string | null = null;
  try { if ((view === 'tasks' || view === 'browser') && id) taskId = decodeURIComponent(id); } catch { /* Invalid deep links open a new task. */ }
  return { view: ['goals', 'memories', 'connections', 'ecosystem', 'browser', 'approvals'].includes(view) ? view as View : 'tasks', taskId };
}

export function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const check = useCallback(async () => { try { setAuthenticated((await api<{ authenticated: boolean }>('/auth/session')).authenticated); setError(null); } catch (error) { setError(errorMessage(error)); } }, []);
  useEffect(() => {
    void check(); const unauthorized = () => setAuthenticated(false);
    window.addEventListener('agent:unauthorized', unauthorized);
    return () => window.removeEventListener('agent:unauthorized', unauthorized);
  }, [check]);
  if (authenticated) return <Workbench onLogout={() => setAuthenticated(false)} />;
  return <main className="login-screen"><section className="login-panel"><div className="login-brand"><span className="brand-symbol"><MessageSquare size={21} /></span><span>Personal Agent</span></div>
    <h1>{authenticated === null ? '连接工作台' : '登录工作台'}</h1>
    {error && <div className="notice error" role="alert"><AlertCircle size={16} /><span>{error}</span></div>}
    {authenticated === null ? <button className="button full-width" disabled={busy} onClick={() => void check()}><RefreshCw size={16} />重新连接</button> : <form className="form-layout" onSubmit={event => {
      event.preventDefault(); setBusy(true); setError(null);
      void api('/auth/login', { method: 'POST', body: { password } }).then(() => { setPassword(''); setAuthenticated(true); }).catch(error => setError(errorMessage(error))).finally(() => setBusy(false));
    }}><label>访问密码<input type="password" autoComplete="current-password" required autoFocus value={password} onChange={event => setPassword(event.target.value)} /></label>
      <button className="button full-width" disabled={busy}>{busy ? <LoaderCircle size={16} className="spin" /> : null}登录</button>
    </form>}
  </section></main>;
}

function Workbench({ onLogout }: { onLogout: () => void }) {
  const [route, setRoute] = useState(initialRoute);
  const [lastTaskId, setLastTaskId] = useState(route.taskId);
  const [drawer, setDrawer] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const workbench = useWorkbench(route.taskId);
  const navigate = (view: View, taskId: string | null = null) => {
    if (view === 'tasks') setLastTaskId(taskId);
    setRoute({ view, taskId }); setDrawer(false);
    location.hash = `${view}${taskId ? `/${encodeURIComponent(taskId)}` : ''}`;
  };
  useEffect(() => { const change = () => { const route = initialRoute(); setRoute(route); if (route.view === 'tasks') setLastTaskId(route.taskId); setDrawer(false); }; window.addEventListener('hashchange', change); return () => window.removeEventListener('hashchange', change); }, []);
  const run: RunAction = async (key, action) => {
    setBusy(value => new Set(value).add(key)); workbench.setError(null);
    try { await action(); return true; }
    catch (error) { workbench.setError(errorMessage(error)); return false; }
    finally { setBusy(value => { const next = new Set(value); next.delete(key); return next; }); }
  };
  const bootstrap = workbench.bootstrap;
  const tasks = bootstrap?.tasks.filter(task => {
    if (query && !`${task.title} ${task.prompt}`.toLowerCase().includes(query.toLowerCase())) return false;
    const completed = ['succeeded', 'failed', 'cancelled'].includes(task.status);
    return filter === 'all' || (filter === 'active' ? !completed : completed);
  }) ?? [];
  const pending = bootstrap?.pendingApprovals ?? [];
  const selectedTask = bootstrap?.tasks.find(task => task.id === route.taskId);
  const navigation = [
    { view: 'tasks' as const, label: '任务', icon: MessageSquare },
    { view: 'goals' as const, label: '目标', icon: Target },
    { view: 'memories' as const, label: '记忆', icon: Brain },
    { view: 'connections' as const, label: '连接', icon: Link2 },
    { view: 'ecosystem' as const, label: '生态扩展', icon: Layers3 },
    { view: 'browser' as const, label: '浏览器', icon: Globe },
  ];

  return <div className="workbench">
    {drawer && <button className="drawer-backdrop" aria-label="关闭导航" onClick={() => setDrawer(false)} />}
    <aside className={`sidebar ${drawer ? 'drawer-open' : ''}`}><div className="sidebar-brand"><span className="brand-symbol"><MessageSquare size={18} /></span><strong>Personal Agent</strong><IconButton icon={X} label="关闭导航" className="mobile-only" onClick={() => setDrawer(false)} /></div>
      <nav className="primary-nav" aria-label="主导航">{navigation.map(item => <button key={item.view} className={route.view === item.view ? 'selected' : ''} onClick={() => navigate(item.view, item.view === 'tasks' ? lastTaskId : null)}><item.icon size={17} /><span>{item.label}</span></button>)}</nav>
      {pending.length > 0 && <button className={`approval-nav ${route.view === 'approvals' ? 'selected' : ''}`} onClick={() => navigate('approvals')}><CircleHelp size={16} /><span>待批准</span><strong>{pending.length}</strong></button>}
      <div className="sidebar-section-heading"><span>任务</span><IconButton icon={Plus} label="新建任务" onClick={() => navigate('tasks')} /></div>
      <div className="task-search"><Search size={14} /><input type="search" aria-label="搜索任务" placeholder="搜索任务" value={query} onChange={event => setQuery(event.target.value)} /></div>
      <div className="task-filters" role="tablist" aria-label="任务筛选">{(['all', 'active', 'completed'] as const).map(value => <button key={value} role="tab" aria-selected={filter === value} onClick={() => setFilter(value)}>{value === 'all' ? '全部' : value === 'active' ? '进行中' : '已结束'}</button>)}</div>
      <div className="task-list">{tasks.map(task => <button key={task.id} className={`task-list-item ${route.taskId === task.id && route.view === 'tasks' ? 'selected' : ''}`} onClick={() => navigate('tasks', task.id)}><span className="task-item-title">{task.title}</span><span className="task-item-meta"><Status status={task.status} /><time>{formatTime(task.updatedAt, true)}</time></span></button>)}
        {!tasks.length && <div className="sidebar-empty">{bootstrap ? query ? '没有匹配任务' : '暂无任务' : '加载中'}</div>}
      </div><footer className="sidebar-footer"><div className="workspace-connection"><span className={`connection-dot ${workbench.connection === 'live' ? 'connected' : 'unconfigured'}`} /><span>{workbench.connection === 'live' ? '已连接' : workbench.connection === 'reconnecting' ? '重新连接中' : '连接中'}</span></div>
        <IconButton icon={RefreshCw} label="刷新工作台" busy={busy.has('refresh')} onClick={() => void run('refresh', workbench.refresh)} /><IconButton icon={LogOut} label="退出登录" onClick={() => void run('logout', async () => { await api('/auth/logout', { method: 'POST', body: {} }); onLogout(); })} /></footer>
    </aside>
    <main className="main-workspace"><div className="mobile-bar"><IconButton icon={Menu} label="打开导航" onClick={() => setDrawer(true)} /><strong>Personal Agent</strong><IconButton icon={Plus} label="新建任务" onClick={() => navigate('tasks')} /></div>
      {workbench.error && <div className="global-error notice error" role="alert"><AlertCircle size={16} /><span>{workbench.error}</span><IconButton icon={X} label="关闭错误提示" onClick={() => workbench.setError(null)} /></div>}
      {!bootstrap ? <div className="loading-state workspace-loading"><LoaderCircle size={22} className="spin" /><span>{workbench.error ? '无法加载工作台' : '加载工作台'}</span><button className="button secondary" onClick={() => void run('refresh', workbench.refresh)}><RefreshCw size={16} />重试</button></div>
        : route.view === 'tasks' ? <Chat key={route.taskId ?? 'new'} detail={workbench.detail} selectedTask={selectedTask} loading={workbench.detailLoading} configured={bootstrap.model.configured} run={run} busy={busy} onCreated={id => navigate('tasks', id)} refresh={workbench.refresh} onConnections={() => navigate('connections')} onBrowser={() => navigate('browser', route.taskId)} draft={drafts[route.taskId ?? 'new'] ?? ''} onDraftChange={value => setDrafts(previous => ({ ...previous, [route.taskId ?? 'new']: value }))} />
          : route.view === 'goals' ? <GoalsView revision={workbench.revision} />
            : route.view === 'memories' ? <MemoriesView revision={workbench.revision} />
              : route.view === 'connections' ? <ConnectionsView integrations={bootstrap.integrations} run={run} busy={busy} refresh={workbench.refresh} />
                : route.view === 'ecosystem' ? <EcosystemView onConnections={() => navigate('connections')} />
                : route.view === 'browser' ? <BrowserPanel browser={bootstrap.browser} onChanged={workbench.refresh} onBack={route.taskId ? () => navigate('tasks', route.taskId) : undefined} />
                  : <section className="resource-page"><header className="page-heading"><div><h1>待批准</h1><span className="heading-meta">{pending.length} 项待处理</span></div></header><div className="approval-list">{pending.map(approval => <ApprovalItem key={approval.id} approval={approval} run={run} busy={busy} onResolved={workbench.refresh} onOpen={() => navigate('tasks', approval.taskId)} />)}{!pending.length && <div className="empty-state"><CircleHelp size={28} />暂无待批准操作</div>}</div></section>}
    </main>
  </div>;
}
