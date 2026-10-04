import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, Check, ChevronDown, CircleHelp, Copy, Download, FileText, Globe, LoaderCircle, MessageSquare, Pause, Play, Send, Square, Terminal, X } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Approval, BrowserState, Task, TaskDetail } from '../shared/contracts';
import { api, requestId } from './api';
import { Empty, formatTime, IconButton, jsonText, Status } from './ui';

export type RunAction = (key: string, action: () => Promise<void>) => Promise<boolean>;

export function ApprovalItem({ approval, run, busy, onResolved, onOpen }: {
  approval: Approval; run: RunAction; busy: Set<string>; onResolved: () => Promise<void>; onOpen?: () => void;
}) {
  const expired = new Date(approval.expiresAt).getTime() <= Date.now();
  const key = `approval:${approval.id}`;
  const decide = (decision: 'approve' | 'reject') => void run(key, async () => {
    await api(`/approvals/${encodeURIComponent(approval.id)}/decision`, {
      method: 'POST', body: { decision, parametersHash: approval.parametersHash, version: approval.version },
    });
    await onResolved();
  });
  return <section className="approval-item">
    <div className="approval-heading"><CircleHelp size={18} /><strong>{approval.action}</strong>
      {onOpen && <IconButton icon={ArrowUpRight} label="打开任务" onClick={onOpen} />}
    </div>
    <pre className="parameter-view">{jsonText(approval.parameters)}</pre>
    <div className="approval-footer"><span>{expired ? '已过期' : `有效至 ${formatTime(approval.expiresAt, true)}`}</span>
      <div className="button-row"><button className="button secondary compact" disabled={busy.has(key) || expired} onClick={() => decide('reject')}><X size={15} />拒绝</button>
        <button className="button compact" disabled={busy.has(key) || expired} onClick={() => decide('approve')}><Check size={15} />批准</button></div>
    </div>
  </section>;
}

function MessageText({ text }: { text: string }) {
  return <div className="message-text"><Markdown remarkPlugins={[remarkGfm]} skipHtml components={{
    a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noreferrer" />,
    table: ({ node: _node, ...props }) => <div className="table-scroll"><table {...props} /></div>,
    img: ({ node: _node, ...props }) => <img {...props} loading="lazy" />,
  }}>{text}</Markdown></div>;
}

export function Chat({ detail, selectedTask, loading, configured, run, busy, onCreated, refresh, onConnections, onBrowser, draft, onDraftChange }: {
  detail: TaskDetail | null; selectedTask?: Task; loading: boolean; configured: boolean;
  run: RunAction; busy: Set<string>; onCreated: (id: string) => void; refresh: () => Promise<void>;
  onConnections: () => void; onBrowser: () => void;
  draft: string; onDraftChange: (value: string) => void;
}) {
  const [text, setText] = useState(draft);
  const [mode, setMode] = useState<'follow_up' | 'steer'>('follow_up');
  const [tab, setTab] = useState<'messages' | 'activity' | 'artifacts'>('messages');
  const [pinned, setPinned] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const sending = useRef(false);
  const outbound = useRef<{ key: string; id: string } | null>(null);
  const task = detail?.task ?? selectedTask;
  const active = task && ['queued', 'running', 'waiting_approval', 'waiting_external'].includes(task.status);
  const waitingForBrowserControl = task?.status === 'waiting_user' && task.waitingReason === 'browser_control';
  const pending = detail?.approvals.filter(approval => approval.status === 'pending') ?? [];
  const submitting = busy.has('message');

  useEffect(() => { setTab('messages'); setPinned(true); }, [task?.id]);
  useEffect(() => {
    if (pinned && tab === 'messages') scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'instant' });
  }, [detail?.messages, pending.length, pinned, tab]);
  useEffect(() => {
    if (!input.current) return;
    input.current.style.height = 'auto';
    input.current.style.height = `${Math.min(160, Math.max(52, input.current.scrollHeight))}px`;
  }, [text]);

  const send = async () => {
    if (!text.trim() || submitting || sending.current) return;
    sending.current = true;
    const prompt = text.trim();
    const key = JSON.stringify([task?.id ?? null, prompt, mode]);
    if (outbound.current?.key !== key) outbound.current = { key, id: requestId() };
    const clientRequestId = outbound.current.id;
    await run('message', async () => {
      const response = task
        ? await api<Task>(`/tasks/${encodeURIComponent(task.id)}/messages`, { method: 'POST', body: { text: prompt, mode, clientRequestId } })
        : await api<Task>('/tasks', { method: 'POST', body: { prompt, clientRequestId } });
      setText(''); onDraftChange(''); setPinned(true); outbound.current = null;
      onCreated(response.id);
      await refresh();
    });
    sending.current = false;
    input.current?.focus();
  };
  const control = (action: 'pause' | 'cancel' | 'resume') => {
    if (!task) return;
    void run(`task:${task.id}`, async () => {
      await api(`/tasks/${encodeURIComponent(task.id)}/${action}`, { method: 'POST', body: { version: task.version } });
      await refresh();
    });
  };
  const returnBrowserAndContinue = () => {
    if (!task || !waitingForBrowserControl) return;
    void run(`task:${task.id}`, async () => {
      const browser = await api<BrowserState>('/browser');
      const latest = (await api<TaskDetail>(`/tasks/${encodeURIComponent(task.id)}`)).task;
      if (latest.status !== 'waiting_user' || latest.waitingReason !== 'browser_control')
        throw new Error('任务状态已变化，请刷新后再操作。');
      if (browser.transportError) throw new Error(browser.transportError);
      if (browser.owner === 'user')
        await api('/browser/release', { method: 'POST', body: { generation: browser.generation } });
      await api(`/tasks/${encodeURIComponent(task.id)}/resume`, { method: 'POST', body: { version: latest.version } });
      await refresh();
    });
  };

  return <section className="chat-layout">
    <header className="page-heading task-heading"><div className="heading-copy"><h1>{task?.title ?? '新任务'}</h1>
      {task ? <div className="heading-meta"><Status status={task.status} /><span>{formatTime(task.createdAt, true)}</span></div>
        : <span className="heading-meta">Personal Agent</span>}</div>
      <div className="button-row">
        <IconButton icon={Globe} label="打开浏览器" onClick={onBrowser} />
        {task && active && <IconButton icon={Pause} label="暂停任务" busy={busy.has(`task:${task.id}`)} disabled={busy.has(`task:${task.id}`)} onClick={() => control('pause')} />}
        {task && !waitingForBrowserControl && ['paused', 'waiting_user', 'failed', 'waiting_external'].includes(task.status) && <IconButton icon={Play} label="恢复任务" busy={busy.has(`task:${task.id}`)} disabled={busy.has(`task:${task.id}`)} onClick={() => control('resume')} />}
        {task && !['succeeded', 'cancelled', 'failed'].includes(task.status) && <IconButton icon={Square} label="取消任务" className="danger-icon" disabled={busy.has(`task:${task.id}`)} onClick={() => control('cancel')} />}
      </div>
    </header>
    {task && <div className="view-tabs" role="tablist" aria-label="任务详情">
      <button role="tab" aria-selected={tab === 'messages'} onClick={() => setTab('messages')}><MessageSquare size={15} />消息</button>
      <button role="tab" aria-selected={tab === 'activity'} onClick={() => setTab('activity')}><Terminal size={15} />操作<span>{detail?.operations.length ?? 0}</span></button>
      <button role="tab" aria-selected={tab === 'artifacts'} onClick={() => setTab('artifacts')}><FileText size={15} />成果<span>{detail?.artifacts.length ?? 0}</span></button>
    </div>}
    {task?.waitingReason && <div className="notice warning"><CircleHelp size={16} />{waitingForBrowserControl ? <div><span>任务正在等待你交回浏览器控制权。完成操作后，可以交回并继续任务。</span><div className="button-row" style={{ flexWrap: 'wrap', marginTop: 8 }}><button className="button compact" disabled={busy.has(`task:${task.id}`)} onClick={returnBrowserAndContinue}><Play size={15} />交回浏览器并继续任务</button><button className="button secondary compact" onClick={onBrowser}>打开浏览器</button></div></div> : <span>{task.waitingReason}</span>}</div>}
    {task?.error && <div className="notice error"><span>{task.error}</span></div>}
    <div className="chat-scroll" ref={scroller} onScroll={() => {
      const element = scroller.current;
      if (element) setPinned(element.scrollHeight - element.scrollTop - element.clientHeight < 80);
    }}>
      {loading ? <div className="loading-state"><LoaderCircle className="spin" size={20} />加载中</div> : tab === 'messages' ? <div className="message-list">
        {detail?.messages.map(message => <article key={message.id} className={`message message-${message.role}`}>
          <div className="message-label"><span>{message.role === 'user' ? '你' : message.role === 'assistant' ? 'Agent' : '系统'}</span><time>{formatTime(message.createdAt)}</time><IconButton icon={copied === message.id ? Check : Copy} label={copied === message.id ? '已复制' : '复制消息'} onClick={() => void run(`copy:${message.id}`, async () => {
            if (!navigator.clipboard) throw new Error('当前连接无法访问剪贴板');
            await navigator.clipboard.writeText(message.text); setCopied(message.id); setTimeout(() => setCopied(null), 2000);
          })} /></div>
          <MessageText text={message.text} />
          {message.status === 'streaming' && <span className="streaming-indicator" aria-label="正在回复"><span /><span /><span /></span>}
          {message.status === 'error' && <span className="muted error-text">回复中断</span>}
        </article>)}
        {(!detail?.messages.length && !task) && <Empty icon={MessageSquare}>暂无消息</Empty>}
        {pending.map(approval => <ApprovalItem key={approval.id} approval={approval} run={run} busy={busy} onResolved={refresh} />)}
        {task?.result && !detail?.messages.some(message => message.role === 'assistant' && message.text === task.result) && <article className="message message-assistant"><div className="message-label"><span>成果</span></div><MessageText text={task.result} /></article>}
      </div> : tab === 'activity' ? <div className="activity-list">
        {!detail?.operations.length && <Empty icon={Terminal}>暂无操作</Empty>}
        {detail?.operations.map(operation => <details key={operation.id} className="operation" open={operation.status === 'running'}>
          <summary><span className={`operation-mark ${operation.status}`}>{operation.status === 'running' ? <LoaderCircle size={16} className="spin" /> : operation.status === 'succeeded' ? <Check size={16} /> : <X size={16} />}</span>
            <strong>{operation.name}</strong><time>{formatTime(operation.startedAt)}</time><ChevronDown size={14} /></summary>
          <div className="operation-details"><div className="field-caption">参数</div><pre>{jsonText(operation.parameters)}</pre>
            {operation.result !== undefined && <><div className="field-caption">结果</div><pre>{jsonText(operation.result)}</pre></>}
          </div>
        </details>)}
      </div> : <div className="artifact-list">
        {!detail?.artifacts.length && <Empty icon={FileText}>暂无文件成果</Empty>}
        {detail?.artifacts.map(artifact => <a key={artifact.id} className="artifact-row" href={`/api/artifacts/${encodeURIComponent(artifact.id)}/download`} download>
          <FileText size={22} /><div><strong>{artifact.name}</strong><span>{artifact.mimeType} · {artifact.size < 1024 ? `${artifact.size} B` : `${(artifact.size / 1024).toFixed(1)} KB`}</span></div><Download size={17} />
        </a>)}
        {task?.result && <article className="result-document"><MessageText text={task.result} /></article>}
      </div>}
    </div>
    {!pinned && tab === 'messages' && <div className="scroll-bottom"><IconButton icon={ArrowDown} label="跳到最新消息" onClick={() => { setPinned(true); scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' }); }} /></div>}
    <div className="composer-area">
      {!configured && <div className="connection-notice"><span className="status-dot" />模型未连接<button onClick={onConnections}>配置连接<ArrowUpRight size={14} /></button></div>}
      {active && <div className="composer-mode"><select aria-label="追加方式" value={mode} onChange={event => setMode(event.target.value as 'follow_up' | 'steer')}><option value="follow_up">后续消息</option><option value="steer">调整当前任务</option></select></div>}
      <form className="composer" onSubmit={event => { event.preventDefault(); void send(); }}>
        <textarea ref={input} aria-label="消息" placeholder="发送消息..." value={text} onChange={event => { setText(event.target.value); onDraftChange(event.target.value); }} rows={1} onKeyDown={event => {
          if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(); }
        }} />
        <button className="send-button" type="submit" aria-label="发送消息" title="发送消息" disabled={!text.trim() || submitting}>
          {submitting ? <LoaderCircle size={18} className="spin" /> : <Send size={18} />}
        </button>
      </form>
    </div>
  </section>;
}
