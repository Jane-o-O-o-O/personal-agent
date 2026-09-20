import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppEvent, Approval, Bootstrap, BrowserState, Integration, Message, Operation, Task, TaskDetail } from '../shared/contracts';
import { api, errorMessage } from './api';

function entity<T>(payload: unknown, key: string): T {
  const value = payload as Record<string, unknown> | null;
  return (value && key in value ? value[key] : payload) as T;
}
function upsert<T extends { id: string }>(items: T[], item: T): T[] {
  if (!item?.id) return items;
  return items.some(value => value.id === item.id) ? items.map(value => value.id === item.id ? item : value) : [...items, item];
}
function latestBrowser(previous: BrowserState | undefined, incoming: BrowserState): BrowserState {
  if (!previous) return incoming;
  if (incoming.generation !== previous.generation)
    return incoming.generation > previous.generation ? incoming : previous;
  return (incoming.revision ?? 0) >= (previous.revision ?? 0) ? incoming : previous;
}
function applyDetail(detail: TaskDetail, event: AppEvent): TaskDetail {
  if (event.taskId !== detail.task.id && event.entityId !== detail.task.id) return detail;
  if (event.type === 'task.updated') return { ...detail, task: entity<Task>(event.payload, 'task') };
  if (event.type === 'message.started' || event.type === 'message.completed') {
    return { ...detail, messages: upsert(detail.messages, entity<Message>(event.payload, 'message')) };
  }
  if (event.type === 'message.delta') {
    const value = event.payload as { messageId?: string; id?: string; delta?: string; text?: string };
    const id = value.messageId ?? value.id ?? event.entityId;
    return { ...detail, messages: detail.messages.map(message => message.id === id
      ? { ...message, text: message.text + (value.delta ?? value.text ?? '') } : message) };
  }
  if (event.type.startsWith('tool.')) return { ...detail, operations: upsert(detail.operations, entity<Operation>(event.payload, 'operation')) };
  if (event.type.startsWith('approval.')) return { ...detail, approvals: upsert(detail.approvals, entity<Approval>(event.payload, 'approval')) };
  return detail;
}

export function useWorkbench(selectedId: string | null) {
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null);
  const [detail, setDetail] = useState<TaskDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connection, setConnection] = useState<'connecting' | 'live' | 'reconnecting'>('connecting');
  const [revision, setRevision] = useState(0);
  const [detailLoading, setDetailLoading] = useState(false);
  const cursor = useRef(0);
  const recentEvents = useRef<AppEvent[]>([]);
  const selected = useRef(selectedId);
  selected.current = selectedId;
  const detailRequest = useRef(0);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const refreshDetail = useCallback(async () => {
    const id = selected.current;
    if (!id) { setDetail(null); return; }
    const serial = ++detailRequest.current;
    const startingCursor = cursor.current;
    const value = await api<TaskDetail>(`/tasks/${encodeURIComponent(id)}`);
    if (selected.current === id && serial === detailRequest.current) {
      setDetail(recentEvents.current.filter(event => event.id > startingCursor).reduce(applyDetail, value));
    }
  }, []);

  const refresh = useCallback(async () => {
    const value = await api<Bootstrap>('/bootstrap');
    cursor.current = Math.max(cursor.current, value.cursor);
    setBootstrap(previous => ({ ...value, browser: latestBrowser(previous?.browser, value.browser) }));
    setError(null);
    await refreshDetail();
    setRevision(value => value + 1);
  }, [refreshDetail]);

  useEffect(() => {
    let active = true;
    api<Bootstrap>('/bootstrap').then(value => {
      if (!active) return;
      cursor.current = value.cursor;
      setBootstrap(value);
      setError(null);
    }).catch(error => { if (active) setError(errorMessage(error)); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    setDetail(null);
    setDetailLoading(Boolean(selectedId));
    refreshDetail().catch(error => setError(errorMessage(error))).finally(() => setDetailLoading(false));
  }, [selectedId, refreshDetail]);

  const ready = bootstrap !== null;
  useEffect(() => {
    if (!ready) return;
    const stream = new EventSource(`/api/events?after=${cursor.current}`);
    const handle = (message: MessageEvent<string>) => {
      let event: AppEvent;
      try { event = JSON.parse(message.data) as AppEvent; } catch { return; }
      if (message.type === 'resync_required' || event.type === 'resync_required' || event.type === 'resync') {
        cursor.current = 0;
        recentEvents.current = [];
        void refresh().catch(error => setError(errorMessage(error)));
        return;
      }
      if (!Number.isFinite(event.id) || event.id <= cursor.current) return;
      cursor.current = event.id;
      recentEvents.current = [...recentEvents.current.slice(-999), event];
      setDetail(value => value ? applyDetail(value, event) : value);
      setBootstrap(value => {
        if (!value) return value;
        if (event.type.startsWith('task.')) {
          const task = entity<Task>(event.payload, 'task');
          return { ...value, tasks: upsert(value.tasks, task).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) };
        }
        if (event.type.startsWith('approval.')) {
          return { ...value, pendingApprovals: upsert(value.pendingApprovals, entity<Approval>(event.payload, 'approval')).filter(approval => approval.status === 'pending') };
        }
        if (event.type === 'integration.updated') return { ...value, integrations: upsert(value.integrations, entity<Integration>(event.payload, 'integration')) };
        if (event.type === 'browser.updated') return { ...value, browser: latestBrowser(value.browser, entity<BrowserState>(event.payload, 'browser')) };
        return value;
      });
      if (event.type !== 'message.delta' && event.type !== 'message.started') {
        setRevision(value => value + 1);
        if (event.taskId === selected.current || event.entityId === selected.current) {
          clearTimeout(refreshTimer.current);
          refreshTimer.current = setTimeout(() => { void refreshDetail().catch(error => setError(errorMessage(error))); }, 160);
        }
      }
    };
    stream.onopen = () => setConnection('live');
    stream.onerror = () => setConnection('reconnecting');
    stream.onmessage = handle;
    for (const type of ['agent', 'app', 'task.created', 'task.updated', 'message.started', 'message.delta', 'message.completed', 'tool.started', 'tool.completed', 'approval.created', 'approval.resolved', 'integration.updated', 'memory.updated', 'memory.deleted', 'goal.updated', 'artifact.created', 'browser.updated', 'resync_required']) {
      stream.addEventListener(type, handle as EventListener);
    }
    return () => { stream.close(); clearTimeout(refreshTimer.current); };
  }, [ready, refresh, refreshDetail]);

  useEffect(() => {
    if (connection !== 'reconnecting') return;
    const timer = setInterval(() => { void refresh().catch(error => setError(errorMessage(error))); }, 15000);
    return () => clearInterval(timer);
  }, [connection, refresh]);

  return { bootstrap, detail, detailLoading, error, setError, connection, revision, refresh, refreshDetail };
}
