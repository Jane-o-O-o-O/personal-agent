import { createHash, randomUUID } from 'node:crypto';
import type { Approval } from '../shared/contracts.js';
import type { Store } from './store.js';
import { AppError } from './errors.js';

export function parametersHash(value: unknown): string { return createHash('sha256').update(JSON.stringify(value)).digest('hex'); }
export class ApprovalService {
  private waiters = new Map<string, { resolve: () => void; reject: (reason: Error) => void }>();
  constructor(private store: Store, private onWaiting: (taskId: string, waiting: boolean) => void) {}
  list(taskId?: string): Approval[] {
    return this.store.all<{json:string}>(taskId ? 'SELECT json FROM approvals WHERE task_id=?' : 'SELECT json FROM approvals', ...(taskId ? [taskId] : [])).map(row => JSON.parse(row.json));
  }
  private save(approval: Approval) {
    this.store.run('INSERT INTO approvals(id,task_id,json) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json', approval.id, approval.taskId, JSON.stringify(approval));
  }
  async request(taskId: string, action: string, parameters: unknown, signal: AbortSignal): Promise<void> {
    signal.throwIfAborted();
    const now = Date.now();
    const approval: Approval = { id: randomUUID(), taskId, action, parameters, parametersHash: parametersHash(parameters), status: 'pending', version: 1, createdAt: new Date(now).toISOString(), expiresAt: new Date(now + 15 * 60000).toISOString() };
    this.store.transaction(() => { this.save(approval); this.onWaiting(taskId, true); this.store.publish('approval.created', approval.id, approval, taskId); });
    try {
      await new Promise<void>((resolve, reject) => {
        const cleanup = () => { clearTimeout(timer); signal.removeEventListener('abort', abort); this.waiters.delete(approval.id); };
        const abort = () => { this.finish(approval.id, 'cancelled'); cleanup(); reject(new AppError('CANCELLED', '操作已取消')); };
        const timer = setTimeout(() => { this.finish(approval.id, 'expired'); cleanup(); reject(new AppError('APPROVAL_EXPIRED', '批准请求已过期')); }, 15 * 60000);
        timer.unref();
        this.waiters.set(approval.id, { resolve: () => { cleanup(); resolve(); }, reject: error => { cleanup(); reject(error); } });
        signal.addEventListener('abort', abort, { once: true });
        if (signal.aborted) abort();
      });
      signal.throwIfAborted();
    } finally { this.onWaiting(taskId, false); }
  }
  private finish(id: string, status: Approval['status']): Approval {
    const row = this.store.get<{json:string}>('SELECT json FROM approvals WHERE id=?', id);
    if (!row) throw new AppError('NOT_FOUND', '批准请求不存在', 404);
    const approval: Approval = JSON.parse(row.json);
    approval.status = status; approval.version++; approval.decidedAt = new Date().toISOString();
    this.store.transaction(() => { this.save(approval); this.store.publish('approval.resolved', approval.id, approval, approval.taskId); });
    return approval;
  }
  decide(id: string, decision: 'approve' | 'reject', hash: string, version?: number): Approval {
    const approval = this.list().find(item => item.id === id);
    if (!approval) throw new AppError('NOT_FOUND', '批准请求不存在', 404);
    if (approval.status !== 'pending' || approval.parametersHash !== hash || (version !== undefined && version !== approval.version)) throw new AppError('APPROVAL_CONFLICT', '批准请求已变化，请重新核对', 409);
    if (Date.parse(approval.expiresAt) < Date.now() || !this.waiters.has(id)) {
      this.finish(id, 'expired'); throw new AppError('APPROVAL_EXPIRED', '批准请求已过期或任务已停止', 409);
    }
    const waiter = this.waiters.get(id)!;
    const updated = this.finish(id, decision === 'approve' ? 'approved' : 'rejected');
    if (decision === 'approve') waiter.resolve(); else waiter.reject(new AppError('APPROVAL_REJECTED', '用户拒绝了该操作'));
    return updated;
  }
  recover(): void { for (const approval of this.list()) if (approval.status === 'pending') this.finish(approval.id, 'cancelled'); }
}
