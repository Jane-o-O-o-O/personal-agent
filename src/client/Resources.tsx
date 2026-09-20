import { useCallback, useEffect, useState } from 'react';
import { Check, Clock3, Edit3, FileText, LoaderCircle, Pause, Play, Plus, RefreshCw, Save, Target, Trash2 } from 'lucide-react';
import type { Goal, Memory, Schedule } from '../shared/contracts';
import { api, errorMessage } from './api';
import { Empty, formatTime, IconButton, Modal } from './ui';

function useCollection<T>(path: string, revision: number) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => { setItems(await api<T[]>(path)); setError(null); }, [path]);
  useEffect(() => {
    let active = true;
    api<T[]>(path).then(items => { if (active) { setItems(items); setError(null); } })
      .catch(error => { if (active) setError(errorMessage(error)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [path, revision]);
  const mutate = async (action: () => Promise<void>) => {
    setBusy(true);
    try { await action(); await refresh(); return true; }
    catch (error) { setError(errorMessage(error)); return false; }
    finally { setBusy(false); }
  };
  return { items, loading, error, busy, refresh, mutate };
}

function ResourceError({ error }: { error: string | null }) { return error ? <div className="notice error" role="alert">{error}</div> : null; }
function localDateTime(value?: string): string {
  const date = value ? new Date(value) : new Date(Date.now() + 3600000);
  const shifted = new Date(date.getTime() + 8 * 3600000);
  return shifted.toISOString().slice(0, 16);
}

export function GoalsView({ revision }: { revision: number }) {
  const data = useCollection<Goal>('/goals', revision);
  const [editing, setEditing] = useState<Goal | 'new' | null>(null);
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [scheduleType, setScheduleType] = useState<Schedule['type']>('daily');
  const [at, setAt] = useState(localDateTime());
  const [time, setTime] = useState('08:00');
  const [minutes, setMinutes] = useState(60);
  const [maxRuns, setMaxRuns] = useState(30);
  const [enabled, setEnabled] = useState(true);
  const open = (goal?: Goal) => {
    setEditing(goal ?? 'new'); setTitle(goal?.title ?? ''); setPrompt(goal?.prompt ?? ''); setEnabled(goal?.enabled ?? true);
    setScheduleType(goal?.schedule.type ?? 'daily'); setMaxRuns(goal?.maxRuns ?? 30);
    if (goal?.schedule.type === 'once') setAt(localDateTime(goal.schedule.at));
    if (goal?.schedule.type === 'daily') setTime(goal.schedule.time);
    if (goal?.schedule.type === 'interval') setMinutes(goal.schedule.minutes);
  };
  const save = async () => {
    const schedule: Schedule = scheduleType === 'once' ? { type: 'once', at: new Date(`${at}+08:00`).toISOString() }
      : scheduleType === 'daily' ? { type: 'daily', time } : { type: 'interval', minutes };
    const body = { title, prompt, schedule, enabled, maxRuns, ...(editing && editing !== 'new' ? { version: editing.version } : {}) };
    if (await data.mutate(async () => { await api(editing === 'new' ? '/goals' : `/goals/${(editing as Goal).id}`, { method: editing === 'new' ? 'POST' : 'PATCH', body }); })) setEditing(null);
  };
  const scheduleLabel = (schedule: Schedule) => schedule.type === 'daily' ? `每日 ${schedule.time}` : schedule.type === 'interval' ? `每 ${schedule.minutes} 分钟` : formatTime(schedule.at, true);
  return <section className="resource-page"><header className="page-heading"><div><h1>目标</h1><span className="heading-meta">{data.items.length} 个目标</span></div>
    <button className="button" onClick={() => open()}><Plus size={16} />新建目标</button></header>
    <ResourceError error={data.error} />
    <div className="resource-content">{data.loading ? <div className="loading-state"><LoaderCircle className="spin" size={18} />加载中</div> : !data.items.length ? <Empty icon={Target}>暂无目标</Empty> : data.items.map(goal => <article key={goal.id} className="goal-row">
      <div className="resource-row-main"><div className="row-title"><h2>{goal.title}</h2><span className={`small-badge ${goal.enabled ? 'positive' : ''}`}>{goal.enabled ? '运行中' : '已暂停'}</span></div><p>{goal.prompt}</p>
        <div className="resource-meta"><span><Clock3 size={14} />{scheduleLabel(goal.schedule)}</span><span>已运行 {goal.runCount} / {goal.maxRuns} 次</span>{goal.nextRunAt && <span>下次 {formatTime(goal.nextRunAt, true)}</span>}</div>
      </div><div className="button-row"><IconButton icon={goal.enabled ? Pause : Play} label={goal.enabled ? '暂停目标' : '恢复目标'} disabled={data.busy} onClick={() => void data.mutate(async () => { await api(`/goals/${goal.id}`, { method: 'PATCH', body: { enabled: !goal.enabled, version: goal.version } }); })} />
        <IconButton icon={Edit3} label="编辑目标" onClick={() => open(goal)} /><IconButton icon={Trash2} label="删除目标" className="danger-icon" disabled={data.busy} onClick={() => {
          if (window.confirm(`删除目标“${goal.title}”？`)) void data.mutate(async () => { await api(`/goals/${goal.id}`, { method: 'DELETE' }); });
        }} /></div>
    </article>)}</div>
    {editing && <Modal title={editing === 'new' ? '新建目标' : '编辑目标'} onClose={() => setEditing(null)}><form className="form-layout" onSubmit={event => { event.preventDefault(); void save(); }}>
      <label>名称<input aria-label="名称" required value={title} onChange={event => setTitle(event.target.value)} maxLength={120} /></label>
      <label>任务内容<textarea aria-label="任务内容" required value={prompt} onChange={event => setPrompt(event.target.value)} rows={4} /></label>
      <div className="form-grid"><label>调度<select value={scheduleType} onChange={event => setScheduleType(event.target.value as Schedule['type'])}><option value="once">指定时间</option><option value="daily">每天</option><option value="interval">固定间隔</option></select></label>
        {scheduleType === 'once' ? <label>时间 · 北京时间<input type="datetime-local" required value={at} onChange={event => setAt(event.target.value)} /></label>
          : scheduleType === 'daily' ? <label>时间 · 北京时间<input type="time" required value={time} onChange={event => setTime(event.target.value)} /></label>
            : <label>间隔（分钟）<input type="number" required min={1} max={525600} value={minutes} onChange={event => setMinutes(Number(event.target.value))} /></label>}
      </div><label>最多运行次数<input type="number" required min={1} max={10000} value={maxRuns} onChange={event => setMaxRuns(Number(event.target.value))} /></label>
      <label className="checkbox-label"><input type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)} />启用</label>
      <ResourceError error={data.error} /><div className="form-actions"><button type="button" className="button secondary" onClick={() => setEditing(null)}>取消</button><button className="button" disabled={data.busy}><Save size={16} />保存</button></div>
    </form></Modal>}
  </section>;
}

export function MemoriesView({ revision }: { revision: number }) {
  const data = useCollection<Memory>('/memories', revision);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Memory | 'new' | null>(null);
  const [content, setContent] = useState('');
  const [source, setSource] = useState('手动记录');
  const open = (memory?: Memory) => { setEditing(memory ?? 'new'); setContent(memory?.content ?? ''); setSource(memory?.source ?? '手动记录'); };
  const save = async () => {
    if (await data.mutate(async () => {
      await api(editing === 'new' ? '/memories' : `/memories/${(editing as Memory).id}`, {
        method: editing === 'new' ? 'POST' : 'PATCH', body: editing === 'new' ? { content, source } : { content, version: (editing as Memory).version },
      });
    })) setEditing(null);
  };
  const filtered = data.items.filter(memory => `${memory.content} ${memory.source}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="resource-page"><header className="page-heading"><div><h1>记忆</h1><span className="heading-meta">{data.items.length} 条记录</span></div>
    <div className="button-row"><IconButton icon={RefreshCw} label="刷新记忆" onClick={() => void data.mutate(async () => {})} /><button className="button" onClick={() => open()}><Plus size={16} />添加记忆</button></div></header>
    <ResourceError error={data.error} /><div className="resource-toolbar"><input type="search" className="search-input" aria-label="搜索记忆" placeholder="搜索记忆" value={query} onChange={event => setQuery(event.target.value)} /></div>
    <div className="resource-content">{data.loading ? <div className="loading-state"><LoaderCircle className="spin" size={18} />加载中</div> : !filtered.length ? <Empty icon={FileText}>{query ? '无匹配记录' : '暂无记忆'}</Empty> : filtered.map(memory => <article key={memory.id} className="memory-row"><div className="resource-row-main"><p>{memory.content}</p><div className="resource-meta"><span>{memory.source}</span><span>{formatTime(memory.updatedAt, true)}</span></div></div>
      <div className="button-row"><IconButton icon={Edit3} label="编辑记忆" onClick={() => open(memory)} /><IconButton icon={Trash2} label="删除记忆" className="danger-icon" disabled={data.busy} onClick={() => { if (window.confirm('删除这条记忆？')) void data.mutate(async () => { await api(`/memories/${memory.id}`, { method: 'DELETE' }); }); }} /></div>
    </article>)}</div>
    {editing && <Modal title={editing === 'new' ? '添加记忆' : '编辑记忆'} onClose={() => setEditing(null)}><form className="form-layout" onSubmit={event => { event.preventDefault(); void save(); }}>
      <label>内容<textarea aria-label="内容" required rows={5} value={content} onChange={event => setContent(event.target.value)} /></label>
      {editing === 'new' ? <label>来源<input value={source} onChange={event => setSource(event.target.value)} /></label> : <div className="resource-meta">来源：{source}</div>}
      <ResourceError error={data.error} /><div className="form-actions"><button type="button" className="button secondary" onClick={() => setEditing(null)}>取消</button><button className="button" disabled={data.busy}><Check size={16} />保存</button></div>
    </form></Modal>}
  </section>;
}
