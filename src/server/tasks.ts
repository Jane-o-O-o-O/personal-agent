import { randomUUID } from 'node:crypto';
import type { Task, TaskDetail, Message, Operation, Artifact, TaskStatus } from '../shared/contracts.js';
import type { Store } from './store.js';
import { AppError, cleanError, textInput } from './errors.js';
import { parametersHash } from './approvals.js';

export interface AgentInput { id:string; text:string }
interface StoredTask extends Task { pendingInputs: AgentInput[] }
export interface RunCallbacks {
  session(file: string): void;
  inputConsumed(ids: readonly string[]): void;
  messageStart(): string;
  messageDelta(id: string, delta: string): void;
  messageEnd(id: string, text: string, error?: boolean): void;
  operationStart(toolCallId: string, name: string, parameters: unknown): void;
  operationEnd(toolCallId: string, result: unknown, error: boolean): void;
}
export interface AgentRunner {
  run(task: Task, inputs: readonly AgentInput[], callbacks: RunCallbacks, signal: AbortSignal): Promise<string>;
  // Acceptance into a runtime queue is not a consumption acknowledgement.
  send?(input: AgentInput, mode: 'follow_up' | 'steer'): Promise<void>;
  dispose(): Promise<void>;
}
export class TaskService {
  private current?: { id: string; controller: AbortController; promise: Promise<void>; deliveries:Set<Promise<void>> };
  private runner?: AgentRunner;
  private stopped = false;
  onCompleted?: (task: Task) => void;
  constructor(private store: Store, private configured: () => boolean) {}
  setRunner(runner: AgentRunner) { this.runner = runner; }
  private raw(id: string): StoredTask | undefined {
    const row = this.store.get<{json:string}>('SELECT json FROM tasks WHERE id=?', id);
    if (!row) return undefined;
    const task=JSON.parse(row.json) as StoredTask;
    task.pendingInputs=(task.pendingInputs || []).map((input,index)=>typeof input === 'string' ? {id:`legacy-${index}`,text:input}:input);
    return task;
  }
  private publicTask(task: StoredTask): Task { const {pendingInputs, ...visible} = task; return visible; }
  get(id: string): Task | undefined { const task = this.raw(id); return task ? this.publicTask(task) : undefined; }
  list(): Task[] { return this.store.all<{json:string}>('SELECT json FROM tasks ORDER BY rowid DESC').map(row => this.publicTask(JSON.parse(row.json))); }
  private save(task: StoredTask, event = 'task.updated') {
    task.updatedAt = new Date().toISOString(); task.version++;
    this.store.run('UPDATE tasks SET json=? WHERE id=?', JSON.stringify(task), task.id);
    this.store.publish(event, task.id, this.publicTask(task), task.id);
  }
  update(id: string, patch: Partial<Task>): Task {
    const task = this.raw(id);
    if (!task) throw new AppError('NOT_FOUND', '任务不存在', 404);
    Object.assign(task, patch);
    this.store.transaction(() => this.save(task));
    return this.publicTask(task);
  }
  create(prompt: string, options: {title?:string;channel?:string;requestId?:string;goalId?:string;scheduledFor?:string} = {}): Task {
    prompt = textInput(prompt, 'prompt');
    const channel = options.channel || 'web';
    const requestId = options.requestId ? `${channel}:${textInput(options.requestId, 'clientRequestId', 200)}` : null;
    const hash = parametersHash({prompt,title:options.title || '',goalId:options.goalId});
    if (requestId) {
      const existing = this.store.get<{json:string;request_hash:string}>('SELECT json,request_hash FROM tasks WHERE request_id=?', requestId);
      if (existing) {
        if (existing.request_hash !== hash) throw new AppError('IDEMPOTENCY_CONFLICT', '该请求 ID 已用于不同内容', 409);
        return this.publicTask(JSON.parse(existing.json));
      }
    }
    if (options.goalId && options.scheduledFor) {
      const existing = this.store.get<{json:string}>('SELECT json FROM tasks WHERE goal_id=? AND scheduled_for=?', options.goalId, options.scheduledFor);
      if (existing) return this.publicTask(JSON.parse(existing.json));
    }
    const now = new Date().toISOString();
    const task: StoredTask = {
      id:randomUUID(),title:options.title?.trim().slice(0,120) || prompt.slice(0,60),prompt,
      status:this.configured() ? 'queued':'waiting_user',waitingReason:this.configured() ? undefined:'model_configuration',
      channel,goalId:options.goalId,scheduledFor:options.scheduledFor,version:1,runCount:0,createdAt:now,updatedAt:now,pendingInputs:[{id:randomUUID(),text:prompt}],
    };
    this.store.transaction(() => {
      this.store.run('INSERT INTO tasks(id,json,request_id,request_hash,goal_id,scheduled_for) VALUES (?,?,?,?,?,?)',task.id,JSON.stringify(task),requestId,hash,options.goalId ?? null,options.scheduledFor ?? null);
      this.addMessage(task.id, 'user', prompt);
      this.store.publish('task.created',task.id,this.publicTask(task),task.id);
    });
    this.kick();
    return this.publicTask(task);
  }
  addMessage(taskId: string, role: Message['role'], text: string, status: Message['status'] = 'complete', id = randomUUID()): Message {
    const message: Message = {id,taskId,role,text,status,createdAt:new Date().toISOString()};
    this.store.run('INSERT INTO messages(id,task_id,json) VALUES (?,?,?)',id,taskId,JSON.stringify(message));
    this.store.publish(status === 'streaming' ? 'message.started':'message.completed',id,message,taskId);
    return message;
  }
  detail(id: string): TaskDetail {
    const task = this.get(id);
    if (!task) throw new AppError('NOT_FOUND', '任务不存在', 404);
    const rows = <T>(table: string) => this.store.all<{json:string}>(`SELECT json FROM ${table} WHERE task_id=? ORDER BY rowid`, id).map(row => JSON.parse(row.json) as T);
    return {task,messages:rows<Message>('messages'),operations:rows<Operation>('operations'),artifacts:rows<Artifact>('artifacts'),approvals:rows('approvals')};
  }
  private checkVersion(task:Task, version?:number) { if (version !== undefined && task.version !== version) throw new AppError('VERSION_CONFLICT','任务状态已更新',409); }
  async message(id: string, text: string, requestId: string, mode: 'follow_up' | 'steer' = 'follow_up'): Promise<Task> {
    const task = this.raw(id);
    if (!task) throw new AppError('NOT_FOUND','任务不存在',404);
    text = textInput(text, 'text'); requestId = textInput(requestId,'clientRequestId',200);
    this.store.db.exec('CREATE TABLE IF NOT EXISTS message_requests (request_id TEXT PRIMARY KEY, task_id TEXT NOT NULL, hash TEXT NOT NULL)');
    const key = `${id}:${requestId}`; const hash = parametersHash({text,mode});
    const old = this.store.get<{hash:string}>('SELECT hash FROM message_requests WHERE request_id=?',key);
    if (old) { if (old.hash !== hash) throw new AppError('IDEMPOTENCY_CONFLICT','该请求 ID 已用于不同内容',409); return this.get(id)!; }
    if (task.status === 'waiting_approval') throw new AppError('TASK_WAITING_APPROVAL','先处理批准请求或暂停任务',409);
    const inputId=randomUUID();
    this.store.transaction(() => {
      this.store.run('INSERT INTO message_requests(request_id,task_id,hash) VALUES (?,?,?)',key,id,hash);
      this.addMessage(id,'user',text);
      task.pendingInputs.push({id:inputId,text});
      if (this.current?.id !== id) {
        task.status = this.configured() ? 'queued':'waiting_user';
        task.error = undefined; task.finishedAt = undefined; task.waitingReason = this.configured() ? undefined:'model_configuration';
      }
      this.save(task);
    });
    const running=this.current;
    if (running?.id === id && this.runner?.send) {
      const delivery=this.runner.send({id:inputId,text},mode).catch(error=>{
        if (!(error instanceof AppError) || error.code !== 'TASK_NOT_RUNNING') throw error;
      });
      running.deliveries.add(delivery);
      try {await delivery;} finally {running.deliveries.delete(delivery);}
    }
    this.kick();
    return this.get(id)!;
  }
  async control(id: string, action: 'cancel' | 'pause' | 'resume', version?: number): Promise<Task> {
    const task = this.raw(id);
    if (!task) throw new AppError('NOT_FOUND','任务不存在',404);
    this.checkVersion(task, version);
    if (action === 'resume') {
      if (['running','waiting_approval','queued'].includes(task.status)) return this.publicTask(task);
      if (!this.configured()) return this.update(id,{status:'waiting_user',waitingReason:'model_configuration'});
      if (!task.pendingInputs.length) task.pendingInputs.push({id:randomUUID(),text:'请继续此任务。先核对已有结果与外部操作状态，避免重复操作。'});
      task.status = 'queued'; task.waitingReason = undefined; task.error = undefined; task.finishedAt = undefined;
      this.store.transaction(() => this.save(task)); this.kick(); return this.get(id)!;
    }
    if (['succeeded','failed','cancelled'].includes(task.status) && this.current?.id !== id) return this.publicTask(task);
    task.status = action === 'cancel' ? 'cancelled':'paused'; task.waitingReason = action === 'pause' ? 'user_pause':undefined;
    task.finishedAt = action === 'cancel' ? new Date().toISOString():undefined;
    this.store.transaction(() => this.save(task));
    if (this.current?.id === id) { this.current.controller.abort(action); await this.current.promise; }
    return this.get(id)!;
  }
  waitingApproval(id: string, waiting: boolean) {
    const task = this.get(id);
    if (!task || !['running','waiting_approval'].includes(task.status)) return;
    this.update(id,{status:waiting ? 'waiting_approval':'running',waitingReason:waiting ? 'approval':undefined});
  }
  async pauseCurrent() { if (this.current) await this.control(this.current.id,'pause'); }
  recover() {
    for (const task of this.list()) if (['running','waiting_approval','waiting_external'].includes(task.status)) {
      this.update(task.id,{status:'paused',waitingReason:'server_restart',error:'服务已重启，请核对执行结果后恢复任务'});
      for (const message of this.detail(task.id).messages.filter(item => item.status === 'streaming')) {
        message.status = 'error'; this.store.run('UPDATE messages SET json=? WHERE id=?',JSON.stringify(message),message.id);
      }
      for (const operation of this.detail(task.id).operations.filter(item => item.status === 'running')) {
        operation.status = 'cancelled'; operation.finishedAt = new Date().toISOString();
        operation.result = {error:'服务重启，外部操作结果需要核对'};
        this.store.run('UPDATE operations SET json=? WHERE id=?',JSON.stringify(operation),operation.id);
      }
    }
  }
  kick() { queueMicrotask(() => { if (!this.stopped && !this.current && this.runner) this.startNext(); }); }
  private startNext() {
    const next = this.list().reverse().find(task => task.status === 'queued');
    if (!next) return;
    if (!this.configured()) { this.update(next.id,{status:'waiting_user',waitingReason:'model_configuration'}); this.kick(); return; }
    const controller = new AbortController();
    const promise = Promise.resolve().then(() => this.execute(next.id,controller.signal)).finally(() => { this.current = undefined; this.kick(); });
    this.current = {id:next.id,controller,promise,deliveries:new Set()};
  }
  private async execute(id: string, signal: AbortSignal) {
    const task = this.raw(id)!;
    const inputs = task.pendingInputs;
    task.status = 'running'; task.runCount++; task.startedAt ||= new Date().toISOString();
    task.waitingReason = undefined; task.error = undefined;
    this.store.transaction(() => this.save(task));
    const messageMap = new Map<string,Message>();
    const operationMap = new Map<string,Operation>();
    const callbacks: RunCallbacks = {
      session: file => { this.update(id,{sessionFile:file}); },
      inputConsumed: ids => {
        const latest=this.raw(id)!;
        const consumed=new Set(ids);
        const pending=latest.pendingInputs.filter(item=>!consumed.has(item.id));
        if (pending.length === latest.pendingInputs.length) return;
        latest.pendingInputs=pending;
        this.store.transaction(()=>this.save(latest));
      },
      messageStart: () => { const message = this.addMessage(id,'assistant','','streaming'); messageMap.set(message.id,message); return message.id; },
      messageDelta: (messageId,delta) => {
        const message = messageMap.get(messageId); if (!message) return;
        message.text += delta;
        this.store.run('UPDATE messages SET json=? WHERE id=?',JSON.stringify(message),message.id);
        this.store.publish('message.delta',message.id,{messageId:message.id,delta},id);
      },
      messageEnd: (messageId,text,error) => {
        const message = messageMap.get(messageId); if (!message) return;
        message.text = text; message.status = error ? 'error':'complete';
        this.store.transaction(() => { this.store.run('UPDATE messages SET json=? WHERE id=?',JSON.stringify(message),message.id); this.store.publish('message.completed',message.id,message,id); });
      },
      operationStart: (toolCallId,name,parameters) => {
        const operation:Operation = {id:randomUUID(),taskId:id,toolCallId,name,parameters,status:'running',startedAt:new Date().toISOString()};
        operationMap.set(toolCallId,operation);
        this.store.transaction(() => { this.store.run('INSERT INTO operations(id,task_id,json) VALUES (?,?,?)',operation.id,id,JSON.stringify(operation)); this.store.publish('tool.started',operation.id,operation,id); });
      },
      operationEnd: (toolCallId,result,error) => {
        const operation = operationMap.get(toolCallId); if (!operation) return;
        operation.status = signal.aborted ? 'cancelled':error ? 'failed':'succeeded'; operation.result = result; operation.finishedAt = new Date().toISOString();
        this.store.transaction(() => { this.store.run('UPDATE operations SET json=? WHERE id=?',JSON.stringify(operation),operation.id); this.store.publish('tool.completed',operation.id,operation,id); });
      },
    };
    try {
      signal.throwIfAborted();
      const result = await this.runner!.run(this.publicTask(task),inputs,callbacks,signal);
      while(this.current?.deliveries.size) await Promise.allSettled([...this.current.deliveries]);
      const latest = this.raw(id)!;
      if (!signal.aborted && !['paused','cancelled'].includes(latest.status)) {
        latest.status = latest.pendingInputs.length ? 'queued':'succeeded'; latest.result = result;
        latest.finishedAt = latest.status === 'succeeded' ? new Date().toISOString():undefined; latest.waitingReason = undefined;
        this.store.transaction(() => this.save(latest));
        if(latest.status === 'succeeded') this.onCompleted?.(this.publicTask(latest));
      }
    } catch (error) {
      if (!signal.aborted) {
        const updated = this.update(id,{status:'failed',error:cleanError(error),finishedAt:new Date().toISOString()});
        this.onCompleted?.(updated);
      }
    } finally {
      for (const message of messageMap.values()) if (message.status === 'streaming') callbacks.messageEnd(message.id,message.text,true);
      for (const operation of operationMap.values()) if (operation.status === 'running') callbacks.operationEnd(operation.toolCallId,{error:signal.aborted ? '执行已停止，外部结果需核对':'执行未返回结果'},true);
    }
  }
  async dispose() { this.stopped = true; await this.pauseCurrent(); await this.runner?.dispose(); }
}
