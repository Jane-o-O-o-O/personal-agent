import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, ArrowRightToLine, Check, CornerDownLeft, Globe, Hand, Home, Keyboard, LoaderCircle, Maximize2, MousePointer2, Play, Plus, RefreshCw, Search, Send, WifiOff, X, ZoomIn, ZoomOut } from 'lucide-react';
import type { BrowserFrame, BrowserInput, BrowserState } from '../shared/contracts';
import { api, ApiError, errorMessage } from './api';
import { IconButton } from './ui';

const homeUrl = 'https://www.baidu.com';
type Action = { path: string; body?: Record<string, unknown>; label: string; control?: boolean };
type ViewFrame = BrowserFrame & { tabId?: string; sequence?: number };
type DecodedFrame = { generation: number; data: string };

function readableError(error: unknown) {
  if (error instanceof ApiError) {
    const messages: Record<string, string> = {
      STALE_BROWSER_GENERATION: '浏览器控制状态已更新，请重试。',
      BROWSER_NOT_OWNED: '浏览器控制权已交接，请重新接管后操作。',
      BROWSER_BUSY: '浏览器正在处理上一项操作，请稍后重试。',
      BROWSER_CLOSED: '浏览器服务已停止，请重新启动。',
      BROWSER_EXECUTOR_UNAVAILABLE: '浏览器服务暂时无法连接，请重试。',
    };
    return messages[error.code] ?? error.message;
  }
  if (error instanceof TypeError) return '无法连接服务器，检查网络后重试。';
  return errorMessage(error);
}

export function BrowserPanel({ browser, onChanged, onBack }: { browser: BrowserState; onChanged: () => Promise<void>; onBack?: () => void }) {
  const [state, setState] = useState(browser);
  const [frame, setFrame] = useState<ViewFrame | null>(null);
  const [decodedFrame, setDecodedFrame] = useState<DecodedFrame | null>(null);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [streamRevision, setStreamRevision] = useState(0);
  const [staleFrame, setStaleFrame] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [dialogBusy, setDialogBusy] = useState(false);
  const [url, setUrl] = useState('');
  const [query, setQuery] = useState('');
  const [text, setText] = useState('');
  const [textSending, setTextSending] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [zoom, setZoom] = useState(1);
  const [viewSize, setViewSize] = useState({ width: 0, height: 0 });
  const stateRef = useRef(state);
  const statusSync = useRef<Promise<BrowserState> | null>(null);
  const frameSync = useRef({ pending: false, nextAllowedAt: 0, backoffMs: 1000 });
  const actionRef = useRef<Action | null>(null);
  const actionLock = useRef(false);
  const dialogLock = useRef(false);
  const failedDialog = useRef<Action | null>(null);
  const autoStartAttempted = useRef(false);
  const urlDirty = useRef(false);
  const addressDraft = useRef('');
  const textLock = useRef(false);
  const syncedTab = useRef<string | undefined>(undefined);
  const inputChain = useRef<Promise<void>>(Promise.resolve());
  const image = useRef<HTMLImageElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const lastMove = useRef(0);
  const pendingInputs = useRef(0);
  const frameArrivedAt = useRef(0);
  const live = useRef({ connected, frame, staleFrame, decodedFrame });
  const touchStart = useRef<{ clientX: number; clientY: number; x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  live.current = { connected, frame, staleFrame, decodedFrame };
  const activeTab = state.tabs.find(tab => tab.id === state.activeTabId);
  const currentFrame = frame?.generation === state.generation && (!frame.tabId || frame.tabId === state.activeTabId) ? frame : null;
  const frameReady = Boolean(currentFrame && decodedFrame?.generation === currentFrame.generation && decodedFrame?.data === currentFrame.data);
  const controllable = !busy && connected && !staleFrame && !state.transportError && state.status === 'ready' && state.owner === 'user' && frameReady;

  const applyState = (value: BrowserState) => {
    const previous = stateRef.current;
    if (value.generation < previous.generation || (value.generation === previous.generation && (value.revision ?? 0) < (previous.revision ?? 0))) return previous;
    stateRef.current = value;
    setState(value);
    return value;
  };
  const syncState = () => {
    if (statusSync.current) return statusSync.current;
    const pending = api<BrowserState>('/browser', { signal: AbortSignal.timeout(8000) }).then(applyState).finally(() => {
      if (statusSync.current === pending) statusSync.current = null;
    });
    statusSync.current = pending;
    return pending;
  };
  const syncFrameGeneration = (generation: number) => {
    const recovery = frameSync.current;
    if (generation <= stateRef.current.generation || recovery.pending || Date.now() < recovery.nextAllowedAt) return;
    recovery.pending = true;
    recovery.nextAllowedAt = Date.now() + recovery.backoffMs;
    void syncState().then(authoritative => {
      recovery.backoffMs = authoritative.generation >= generation ? 1000 : Math.min(8000, recovery.backoffMs * 2);
    }).catch(() => { recovery.backoffMs = Math.min(8000, recovery.backoffMs * 2); }).finally(() => {
      recovery.pending = false;
      recovery.nextAllowedAt = Date.now() + recovery.backoffMs;
    });
  };
  const reconnect = () => {
    setConnected(false); setReconnecting(true); setStaleFrame(false);
    setFrame(null); setDecodedFrame(null);
    setStreamRevision(value => value + 1);
  };

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setViewSize({ width: element.clientWidth, height: element.clientHeight }));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => { applyState(browser); }, [browser]);
  useEffect(() => {
    const changedTab = syncedTab.current !== state.activeTabId;
    if (changedTab || !urlDirty.current) {
      const address = activeTab?.url === 'about:blank' ? '' : activeTab?.url ?? '';
      addressDraft.current = address; setUrl(address);
      urlDirty.current = false;
    }
    syncedTab.current = state.activeTabId;
  }, [state.activeTabId, activeTab?.url]);
  useEffect(() => { setPrompt(state.dialog?.defaultPrompt ?? ''); }, [state.dialog?.message]);
  useEffect(() => {
    let active = true;
    let socket: WebSocket | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    let openedAt = 0;
    const connect = () => {
      if (!active) return;
      const currentSocket = new WebSocket(`${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/api/browser/stream?ack=1`);
      socket = currentSocket;
      currentSocket.onopen = () => {
        if (!active) return;
        openedAt = Date.now(); attempts = 0;
        setConnected(true); setReconnecting(false); setStaleFrame(false);
        setFrame(null); setDecodedFrame(null);
        void syncState().catch(() => {});
      };
      currentSocket.onmessage = event => {
        if (!active || socket !== currentSocket) return;
        let value: ViewFrame | { type: 'state'; state: BrowserState } | { type: 'error'; message: string };
        try { value = JSON.parse(String(event.data)) as typeof value; } catch { return; }
        if (value.type === 'frame') {
          if (value.generation >= stateRef.current.generation && (!value.tabId || value.generation > stateRef.current.generation || value.tabId === stateRef.current.activeTabId)) {
            frameArrivedAt.current = Date.now(); setStaleFrame(false); setFrame(value);
            // State events travel separately from pixels. Recover a missing SSE
            // update by reading status; never guess ownership or replay a control action.
            if (value.generation > stateRef.current.generation) syncFrameGeneration(value.generation);
          }
          // Discarded frames need an ACK too, otherwise an old document can block the newest frame.
          if (Number.isSafeInteger(value.sequence) && currentSocket.readyState === WebSocket.OPEN)
            currentSocket.send(JSON.stringify({ type: 'frame_ack', sequence: value.sequence }));
        } else if (value.type === 'state') {
          if (value.state) applyState(value.state);
        } else if (value.type === 'error') setError(value.message);
      };
      currentSocket.onerror = () => { if (active) setReconnecting(true); };
      currentSocket.onclose = () => {
        if (!active || socket !== currentSocket) return;
        setConnected(false); setReconnecting(true);
        setFrame(null); setDecodedFrame(null);
        retry = setTimeout(connect, Math.min(8000, 1000 * 2 ** attempts++));
      };
    };
    connect();
    const watchdog = setInterval(() => {
      if (!active || stateRef.current.status !== 'ready' || socket?.readyState !== WebSocket.OPEN) return;
      const age = Date.now() - Math.max(frameArrivedAt.current, openedAt);
      if (age > 12000) setStaleFrame(true);
      if (age > 18000) socket.close();
    }, 2000);
    const online = () => { if (active && socket?.readyState !== WebSocket.OPEN) { clearTimeout(retry); socket?.close(); connect(); } };
    window.addEventListener('online', online);
    return () => { active = false; clearTimeout(retry); clearInterval(watchdog); window.removeEventListener('online', online); socket?.close(); };
  }, [streamRevision]);

  const requestControl = async (path: 'takeover' | 'release', value: BrowserState) => {
    const target = path === 'takeover' ? 'user' : 'agent';
    if (value.status === 'ready' && value.owner === target) return value;
    try {
      return applyState(await api<BrowserState>(`/browser/${path}`, { method: 'POST', body: { generation: value.generation } }));
    } catch (problem) {
      if (!(problem instanceof ApiError) || problem.code !== 'STALE_BROWSER_GENERATION') throw problem;
      const latest = await syncState();
      if (latest.status === 'ready' && latest.owner === target) return latest;
      return applyState(await api<BrowserState>(`/browser/${path}`, { method: 'POST', body: { generation: latest.generation } }));
    }
  };
  const respondDialog = async (action: Action) => {
    if (dialogLock.current || stateRef.current.owner !== 'user') return false;
    dialogLock.current = true; setDialogBusy(true); setError(null);
    failedDialog.current = action;
    try {
      // A beforeunload dialog can pause a navigation control request. Its answer
      // must use a separate lock and must not wait for either control or input queues.
      await api('/browser/dialog', { method: 'POST', body: { ...action.body, generation: stateRef.current.generation } });
      failedDialog.current = null;
      void syncState().catch(() => {});
      void onChanged().catch(() => {});
      return true;
    } catch (problem) {
      setError(readableError(problem));
      return false;
    } finally { dialogLock.current = false; setDialogBusy(false); }
  };
  const mutate = async (action: Action) => {
    if (action.path === 'dialog') return respondDialog(action);
    if (actionLock.current) return false;
    actionLock.current = true;
    actionRef.current = action;
    setBusy(action.label); setError(null);
    try {
      // Drain inputs before switching documents or owners. Queued input never borrows a new generation.
      await inputChain.current.catch(() => {});
      let latest = await syncState();
      if (action.path === 'start' || (action.control && latest.status !== 'ready')) latest = applyState(await api<BrowserState>('/browser/start', { method: 'POST', body: {} }));
      if (action.path === 'takeover' || action.path === 'release') {
        if (action.path === 'takeover' && latest.status !== 'ready') latest = applyState(await api<BrowserState>('/browser/start', { method: 'POST', body: {} }));
        await requestControl(action.path, latest);
      } else if (action.path !== 'start') {
        if (action.control) latest = await requestControl('takeover', latest);
        const result = await api<BrowserState | { ok: boolean }>(`/browser/${action.path}`, { method: 'POST', body: { ...action.body, generation: latest.generation } });
        if ('viewport' in result) applyState(result);
        else await syncState();
      }
      actionRef.current = null;
      // A workbench refresh cannot turn a successful control API response into a handoff failure.
      void onChanged().catch(() => {});
      return true;
    } catch (problem) {
      if (problem instanceof ApiError && problem.code === 'BROWSER_NAVIGATION_CANCELLED') {
        // The user chose to stay on the page. Keep ownership and pixels, and
        // reconcile the address without retrying the cancelled navigation.
        actionRef.current = null; setError(null);
        const retained = await syncState().catch(() => stateRef.current);
        if (typeof action.body?.url === 'string' && addressDraft.current.trim() === action.body.url) {
          const address = retained.tabs.find(tab => tab.id === retained.activeTabId)?.url ?? '';
          urlDirty.current = false; addressDraft.current = address; setUrl(address);
        }
        void onChanged().catch(() => {});
        return false;
      }
      setError(readableError(problem));
      void syncState().catch(() => {});
      return false;
    } finally { actionLock.current = false; setBusy(null); }
  };
  useEffect(() => {
    if (state.status !== 'stopped' || autoStartAttempted.current) return;
    autoStartAttempted.current = true;
    void mutate({ path: 'start', label: '正在启动浏览器' });
  }, [state.status]);
  const navigateTo = (destination: string, label = '正在打开页面') => mutate({ path: 'navigate', body: { url: destination }, label, control: true });
  const sendInput = (input: Omit<BrowserInput, 'generation' | 'tabId'>): Promise<boolean> => {
    const current = stateRef.current;
    const shown = live.current;
    if (actionLock.current || current.owner !== 'user' || !shown.connected || shown.staleFrame || current.transportError || shown.frame?.generation !== current.generation || shown.decodedFrame?.generation !== current.generation || shown.decodedFrame?.data !== shown.frame.data) return Promise.resolve(false);
    const generation = current.generation;
    let sent = false;
    pendingInputs.current++;
    const result = inputChain.current.catch(() => {}).then(async () => {
      if (stateRef.current.owner !== 'user' || stateRef.current.generation !== generation || stateRef.current.activeTabId !== current.activeTabId) return;
      await api('/browser/input', { method: 'POST', body: { ...input, generation, tabId: current.activeTabId } });
      sent = true;
    }).catch(problem => {
      setError(readableError(problem));
      if (problem instanceof ApiError && ['STALE_BROWSER_GENERATION', 'BROWSER_NOT_OWNED'].includes(problem.code)) void syncState().catch(() => {});
    }).finally(() => { pendingInputs.current--; });
    inputChain.current = result;
    return result.then(() => sent);
  };
  const coordinates = (clientX: number, clientY: number) => {
    const rect = image.current?.getBoundingClientRect();
    if (!rect || !currentFrame || !rect.width || !rect.height) return null;
    const x = (clientX - rect.left) / rect.width * state.viewport.width;
    const y = (clientY - rect.top) / rect.height * state.viewport.height;
    if (x < 0 || y < 0 || x > state.viewport.width || y > state.viewport.height) return null;
    return { x, y };
  };
  const keyInput = (key: string, modifiers = 0) => void sendInput({ type: 'key', key, modifiers });
  const fittedWidth = currentFrame && viewSize.width && viewSize.height ? Math.min(viewSize.width, viewSize.height * currentFrame.width / currentFrame.height) : viewSize.width;
  useEffect(() => {
    const element = viewport.current;
    const wheel = (event: WheelEvent) => {
      const current = stateRef.current;
      const shown = live.current;
      if (actionLock.current || !shown.connected || shown.staleFrame || current.transportError || current.owner !== 'user' || shown.frame?.generation !== current.generation || shown.decodedFrame?.generation !== current.generation || shown.decodedFrame?.data !== shown.frame.data) return;
      const rect = image.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (event.clientX - rect.left) / rect.width * current.viewport.width;
      const y = (event.clientY - rect.top) / rect.height * current.viewport.height;
      if (x < 0 || y < 0 || x > current.viewport.width || y > current.viewport.height) return;
      event.preventDefault();
      void sendInput({ type: 'scroll', x, y, deltaX: event.deltaX, deltaY: event.deltaY });
    };
    element?.addEventListener('wheel', wheel, { passive: false });
    return () => element?.removeEventListener('wheel', wheel);
  }, []);

  const ownerLabel = state.owner === 'user' ? '你正在控制' : state.owner === 'agent' && state.taskId ? 'Agent 正在控制' : 'Agent 待机';
  const streamLabel = !connected ? reconnecting ? '重新连接中' : '连接画面中' : staleFrame ? '画面恢复中' : currentFrame && frameReady ? '实时画面' : '等待新画面';
  const statusLabel = state.status === 'ready' ? ownerLabel : state.status === 'starting' ? '浏览器启动中' : state.status === 'error' ? '浏览器需要恢复' : '浏览器未启动';
  const overlay = !connected ? '画面连接已暂停' : staleFrame ? '画面更新暂时中断' : null;
  const errorText = error ?? state.transportError ?? state.error;
  const controlAction: Action = state.status === 'stopped' || state.status === 'error' ? { path: 'start', label: '正在启动浏览器' } : state.owner === 'user' ? { path: 'release', label: '正在交回控制' } : { path: 'takeover', label: '正在接管浏览器' };

  return <section className="browser-panel" aria-label="浏览器工作区">
    <header className="page-heading browser-heading"><div className="browser-title">{onBack && <IconButton icon={ArrowLeft} label="返回任务" onClick={onBack} />}<div><h1>浏览器</h1><div className="heading-meta"><span className={`connection-dot ${connected && !staleFrame ? 'connected' : 'error'}`} />{statusLabel}<span className="browser-stream-label">{streamLabel}</span></div></div></div>
      <button className={`button browser-control ${state.owner === 'user' ? 'secondary' : ''}`} disabled={Boolean(busy) || state.status === 'starting'} onClick={() => void mutate(controlAction)}>
        {busy ? <LoaderCircle size={16} className="spin" /> : state.status === 'stopped' || state.status === 'error' ? <Play size={16} /> : state.owner === 'user' ? <MousePointer2 size={16} /> : <Hand size={16} />}
        {busy ? busy.includes('接管') ? '正在接管' : busy.includes('交回') ? '正在交回' : '处理中' : state.status === 'stopped' || state.status === 'error' ? '启动' : state.owner === 'user' ? '交回控制' : '接管'}
      </button>
    </header>
    {errorText && <div className="notice error browser-error" role="alert"><AlertCircle size={16} /><span>{errorText}</span><button className="button secondary compact" disabled={failedDialog.current ? dialogBusy : Boolean(busy)} onClick={() => { const failed = failedDialog.current ?? actionRef.current; if (failed) void mutate(failed); else { setError(null); reconnect(); void syncState().catch(problem => setError(readableError(problem))); } }}>重试</button><IconButton icon={X} label="关闭浏览器错误提示" onClick={() => setError(null)} /></div>}
    <div className="browser-search-area"><form className="browser-search-form" onSubmit={event => { event.preventDefault(); if (!query.trim() || actionLock.current) return; void navigateTo(`${homeUrl}/s?wd=${encodeURIComponent(query.trim())}`, '正在百度搜索'); }}><span className="browser-search-brand"><Search size={18} /><span>百度</span></span><input aria-label="百度搜索" type="search" placeholder="搜索问题、地点或任何你想了解的事" value={query} onChange={event => setQuery(event.target.value)} /><button className="button" disabled={Boolean(busy) || !query.trim()}><Search size={16} /><span>搜索</span></button></form><p>{state.owner === 'user' ? '网页已接管，可以点击、滚动和输入文字' : state.taskId ? '搜索或打开网址会暂停 Agent，并接管浏览器' : '搜索或打开网址即可开始浏览，自动为你接管'}</p></div>
    <div className="browser-stage">
      <div className="browser-toolbar"><div className="browser-navigation"><IconButton icon={ArrowLeft} label="浏览器后退" disabled={Boolean(busy) || state.status !== 'ready'} onClick={() => void mutate({ path: 'history', body: { direction: 'back' }, label: '正在返回上一页', control: true })} /><IconButton icon={ArrowRight} label="浏览器前进" disabled={Boolean(busy) || state.status !== 'ready'} onClick={() => void mutate({ path: 'history', body: { direction: 'forward' }, label: '正在前往下一页', control: true })} /><IconButton icon={RefreshCw} label="刷新网页" disabled={Boolean(busy) || state.status !== 'ready'} onClick={() => void mutate({ path: 'reload', label: '正在刷新网页', control: true })} /><IconButton icon={Home} label="百度首页" disabled={Boolean(busy)} onClick={() => void navigateTo(homeUrl, '正在打开百度首页')} /></div>
        <form className="address-form" onSubmit={event => {
          event.preventDefault(); const destination = url.trim(); if (!destination) return;
          const submitted = url;
          void navigateTo(destination).then(ok => {
            if (!ok || addressDraft.current !== submitted) return;
            urlDirty.current = false;
            const current = stateRef.current;
            const address = current.tabs.find(tab => tab.id === current.activeTabId)?.url ?? destination;
            addressDraft.current = address; setUrl(address);
          });
        }}><Globe size={15} /><input aria-label="网址" placeholder="输入网址，例如 www.baidu.com" type="text" spellCheck={false} autoComplete="off" value={url} onChange={event => { urlDirty.current = true; addressDraft.current = event.target.value; setUrl(event.target.value); }} /><IconButton icon={ArrowRight} label="前往网址" type="submit" disabled={Boolean(busy) || !url.trim()} /></form>
      </div>
      <div className="browser-tabbar"><div className="browser-tabs" aria-label="浏览器标签页">{state.tabs.length ? state.tabs.map(tab => <div key={tab.id} className={`browser-tab ${tab.id === state.activeTabId ? 'selected' : ''}`}><button className={tab.id === state.activeTabId ? 'selected' : ''} title={tab.url} aria-current={tab.id === state.activeTabId ? 'page' : undefined} disabled={Boolean(busy)} onClick={() => { if (tab.id !== stateRef.current.activeTabId) void mutate({ path: 'tab', body: { tabId: tab.id }, label: '正在切换标签页', control: true }); }}><Globe size={12} /><span>{tab.title || (tab.url === 'about:blank' ? '新标签页' : tab.url) || '新标签页'}</span></button><IconButton icon={X} label={`关闭标签页 ${tab.title || tab.url || '新标签页'}`} disabled={Boolean(busy)} onClick={() => void mutate({ path: 'tab/close', body: { tabId: tab.id }, label: '正在关闭标签页', control: true })} /></div>) : <span className="browser-no-tabs">启动后将打开百度首页</span>}</div><IconButton icon={Plus} label="新建标签页" disabled={Boolean(busy)} onClick={() => void mutate({ path: 'tab/new', body: { url: homeUrl }, label: '正在新建标签页', control: true })} /></div>
      <div className={`browser-viewport ${controllable ? 'user-controlled' : ''} ${overlay ? 'browser-paused' : ''}`} ref={viewport} tabIndex={controllable ? 0 : -1} aria-label="远程浏览器画面" aria-busy={Boolean(busy) || !frameReady}
        onKeyDown={event => {
          if (!controllable || event.nativeEvent.isComposing || ['Control', 'Shift', 'Alt', 'Meta'].includes(event.key)) return;
          const modifiers = (event.altKey ? 1 : 0) | (event.ctrlKey ? 2 : 0) | (event.metaKey ? 4 : 0) | (event.shiftKey ? 8 : 0);
          if (event.key === 'Tab' && !modifiers) return;
          event.preventDefault();
          if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) void sendInput({ type: 'text', text: event.key }); else keyInput(event.key, modifiers);
        }}>
        {currentFrame ? <img key={currentFrame.generation} ref={image} className="browser-frame" style={{ width: fittedWidth ? `${fittedWidth * zoom}px` : '100%', aspectRatio: `${currentFrame.width}/${currentFrame.height}`, touchAction: controllable && zoom === 1 ? 'none' : 'pan-x pan-y' }} src={currentFrame.data.startsWith('data:') ? currentFrame.data : `data:${currentFrame.mimeType};base64,${currentFrame.data}`} alt="当前远程浏览器页面" draggable={false}
          onLoad={() => setDecodedFrame({ generation: currentFrame.generation, data: currentFrame.data })} onError={() => { setError('这张浏览器画面未能解码，请重新连接画面。'); setStaleFrame(true); }}
          onClick={event => { if (!controllable || suppressClick.current) { suppressClick.current = false; return; } const point = coordinates(event.clientX, event.clientY); if (point) { viewport.current?.focus({ preventScroll: true }); void sendInput({ type: 'click', ...point }); } }}
          onPointerDown={event => { if (controllable && zoom === 1 && event.pointerType === 'touch') { const point = coordinates(event.clientX, event.clientY); if (point) { touchStart.current = { ...point, clientX: event.clientX, clientY: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); } } }}
          onPointerCancel={() => { touchStart.current = null; }}
          onPointerUp={event => {
            const start = touchStart.current; touchStart.current = null;
            if (!start || !controllable || event.pointerType !== 'touch') return;
            const rect = image.current?.getBoundingClientRect();
            if (!rect || Math.abs(start.clientX - event.clientX) + Math.abs(start.clientY - event.clientY) < 12) return;
            suppressClick.current = true; setTimeout(() => { suppressClick.current = false; }, 200);
            void sendInput({ type: 'scroll', x: start.x, y: start.y, deltaX: (start.clientX - event.clientX) / rect.width * state.viewport.width, deltaY: (start.clientY - event.clientY) / rect.height * state.viewport.height });
          }}
          onPointerMove={event => { if (!controllable || pendingInputs.current > 0 || Date.now() - lastMove.current < 120 || event.pointerType === 'touch') return; lastMove.current = Date.now(); const point = coordinates(event.clientX, event.clientY); if (point) void sendInput({ type: 'move', ...point }); }} />
          : <div className="browser-empty">{state.status === 'starting' || state.status === 'ready' ? <LoaderCircle size={28} className="spin" /> : <Globe size={34} strokeWidth={1.3} />}<strong>{busy ?? (state.status === 'ready' ? '正在获取当前页面画面' : state.status === 'starting' ? '浏览器正在启动' : '从百度开始浏览')}</strong><span>{state.status === 'ready' ? '页面更新期间，旧画面不会接收点击' : '在上方直接搜索，或启动浏览器打开百度首页'}</span>{state.status === 'error' && <button className="button secondary compact" disabled={Boolean(busy)} onClick={() => void mutate({ path: 'start', label: '正在恢复浏览器' })}><RefreshCw size={14} />恢复浏览器</button>}</div>}
        {overlay && <div className="browser-stream-overlay" role="status"><WifiOff size={24} /><strong>{overlay}</strong><span>{reconnecting ? '正在自动恢复连接，恢复前暂停网页操作' : '当前画面已暂停，重新连接后继续操作'}</span><button className="button secondary compact" onClick={reconnect}><RefreshCw size={14} />重新连接画面</button></div>}
        {busy && currentFrame && !overlay && <div className="browser-progress" role="status"><LoaderCircle size={14} className="spin" />{busy}</div>}
      </div>
      <div className="browser-viewbar"><span className={`browser-mode ${controllable ? 'interactive' : ''}`}>{controllable ? <><Check size={13} />可操作网页</> : <><MousePointer2 size={13} />{busy ? '操作进行中' : state.owner === 'user' ? streamLabel : '观看模式 · 接管后可操作'}</>}</span><div className="button-row"><IconButton icon={ZoomOut} label="缩小画面" disabled={zoom <= 1} onClick={() => setZoom(value => Math.max(1, value - .5))} /><button className="browser-zoom" title="适应画面" aria-label="适应画面" onClick={() => setZoom(1)}>{zoom === 1 ? <><Maximize2 size={13} />适应</> : `${Math.round(zoom * 100)}%`}</button><IconButton icon={ZoomIn} label="放大画面" disabled={zoom >= 4} onClick={() => setZoom(value => Math.min(4, value + .5))} /></div></div>
    </div>
    {state.dialog && <section className="browser-dialog"><strong>{state.dialog.type === 'prompt' ? '输入请求' : state.dialog.type === 'confirm' ? '网页确认' : '网页提示'}</strong><p>{state.dialog.message}</p>
      {state.dialog.type === 'prompt' && <input aria-label="网页输入请求" value={prompt} onChange={event => setPrompt(event.target.value)} />}
      <div className="button-row">{state.dialog.type !== 'alert' && <button className="button secondary" disabled={dialogBusy || state.owner !== 'user'} onClick={() => void mutate({ path: 'dialog', body: { accept: false }, label: '正在取消网页弹窗' })}>取消</button>}<button className="button" disabled={dialogBusy || state.owner !== 'user'} onClick={() => void mutate({ path: 'dialog', body: { accept: true, promptText: prompt }, label: '正在确认网页弹窗' })}>{dialogBusy ? <LoaderCircle size={14} className="spin" /> : null}确认</button></div>
    </section>}
    <div className="browser-input"><form onSubmit={event => {
      event.preventDefault(); if (!controllable || !text || textLock.current) return;
      textLock.current = true; setTextSending(true);
      const draft = text;
      void sendInput({ type: 'text', text: draft }).then(sent => { if (sent) setText(value => value === draft ? '' : value); }).finally(() => { textLock.current = false; setTextSending(false); });
    }}><Keyboard size={17} /><input aria-label="浏览器输入文字" placeholder={state.owner === 'user' ? '点击网页输入框，再在这里输入中文或粘贴文字' : '接管后，向网页输入中文或粘贴文字'} value={text} disabled={!controllable} onChange={event => setText(event.target.value)} /><button className="icon-button" aria-label="输入到浏览器" title="输入到浏览器" disabled={!controllable || !text || textSending}>{textSending ? <LoaderCircle size={16} className="spin" /> : <Send size={16} />}</button></form>
      <div className="button-row"><IconButton icon={ArrowRightToLine} label="Tab" disabled={!controllable} onClick={() => keyInput('Tab')} /><IconButton icon={X} label="Esc" disabled={!controllable} onClick={() => keyInput('Escape')} /><IconButton icon={CornerDownLeft} label="回车" disabled={!controllable} onClick={() => keyInput('Enter')} /></div>
    </div>
  </section>;
}
