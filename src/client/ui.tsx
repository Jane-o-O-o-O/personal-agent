import { useEffect, useRef, type ReactNode } from 'react';
import { LoaderCircle, X, type LucideIcon } from 'lucide-react';
import type { TaskStatus } from '../shared/contracts';

export const taskLabels: Record<TaskStatus, string> = {
  queued: '排队中', running: '进行中', paused: '已暂停', waiting_approval: '待批准',
  waiting_user: '待处理', waiting_external: '等待外部结果', succeeded: '已完成', failed: '失败', cancelled: '已取消',
};

export function IconButton({ icon: Icon, label, busy, active, className = '', ...props }: {
  icon: LucideIcon; label: string; busy?: boolean; active?: boolean;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'>) {
  return <button type="button" className={`icon-button ${active ? 'active' : ''} ${className}`} aria-label={label} title={label} {...props}>
    {busy ? <LoaderCircle size={17} className="spin" /> : <Icon size={17} />}
  </button>;
}

export function Status({ status }: { status: TaskStatus }) {
  return <span className={`status status-${status}`}><span className="status-dot" />{taskLabels[status]}</span>;
}

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    (ref.current?.querySelector('input, textarea, select') as HTMLElement | null)?.focus();
  }, []);
  return <dialog ref={ref} className="modal" onCancel={onClose} onClose={onClose} onClick={event => {
    if (event.target === event.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
    }
  }}>
    <div className="modal-heading"><h2>{title}</h2><IconButton icon={X} label="关闭" onClick={onClose} /></div>
    {children}
  </dialog>;
}

export function formatTime(value?: string | null, full = false): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('zh-CN', full
    ? { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Shanghai', hour12: false }
    : { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Shanghai', hour12: false }).format(date);
}

export function jsonText(value: unknown): string {
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value, null, 2) ?? ''; } catch { return String(value); }
}

export function Empty({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return <div className="empty-state"><Icon size={28} strokeWidth={1.4} /><span>{children}</span></div>;
}
