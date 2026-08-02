import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { EventEmitter } from 'node:events';
import type { AppEvent } from '../shared/contracts.js';

export class Store {
  readonly db: DatabaseSync;
  private emitter = new EventEmitter();
  private transactionDepth = 0;
  private pendingEvents: AppEvent[] = [];

  constructor(path: string) {
    this.db = new DatabaseSync(path);
    this.db.exec(`
      PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, json TEXT NOT NULL, request_id TEXT UNIQUE, request_hash TEXT, goal_id TEXT, scheduled_for TEXT, UNIQUE(goal_id,scheduled_for));
      CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, task_id TEXT NOT NULL REFERENCES tasks(id), json TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS operations (id TEXT PRIMARY KEY, task_id TEXT NOT NULL REFERENCES tasks(id), json TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS approvals (id TEXT PRIMARY KEY, task_id TEXT NOT NULL REFERENCES tasks(id), json TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS artifacts (id TEXT PRIMARY KEY, task_id TEXT NOT NULL REFERENCES tasks(id), path TEXT NOT NULL, json TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS memories (id TEXT PRIMARY KEY, json TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS goals (id TEXT PRIMARY KEY, json TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS auth_sessions (token_hash TEXT PRIMARY KEY, expires_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, entity_id TEXT NOT NULL, task_id TEXT, payload TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS channel_inbox (id TEXT PRIMARY KEY, channel TEXT NOT NULL, external_id TEXT NOT NULL, received_at TEXT NOT NULL, payload_json TEXT NOT NULL, UNIQUE(channel,external_id));
      CREATE TABLE IF NOT EXISTS outbox (id TEXT PRIMARY KEY, task_id TEXT, channel TEXT NOT NULL, kind TEXT NOT NULL DEFAULT 'result', recipient TEXT NOT NULL, context_ref TEXT, payload_json TEXT NOT NULL, status TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, next_attempt_at TEXT, error TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(task_id,channel,kind));
      CREATE INDEX IF NOT EXISTS messages_task ON messages(task_id);
      CREATE INDEX IF NOT EXISTS operations_task ON operations(task_id);
      CREATE INDEX IF NOT EXISTS approvals_task ON approvals(task_id);
    `);
  }

  get<T>(sql: string, ...params: SQLInputValue[]): T | undefined { return this.db.prepare(sql).get(...params) as T | undefined; }
  all<T>(sql: string, ...params: SQLInputValue[]): T[] { return this.db.prepare(sql).all(...params) as T[]; }
  run(sql: string, ...params: SQLInputValue[]) { return this.db.prepare(sql).run(...params); }
  transaction<T>(fn: () => T): T {
    if (this.transactionDepth > 0) return fn();
    this.db.exec('BEGIN IMMEDIATE');
    this.transactionDepth++;
    try {
      const result = fn();
      this.db.exec('COMMIT');
      this.transactionDepth--;
      const events = this.pendingEvents.splice(0);
      for (const event of events) this.emitter.emit('event', event);
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK');
      this.transactionDepth--;
      this.pendingEvents = [];
      throw error;
    }
  }
  publish(type: string, entityId: string, payload: unknown, taskId?: string): AppEvent {
    const createdAt = new Date().toISOString();
    const result = this.run('INSERT INTO events(type,entity_id,task_id,payload,created_at) VALUES (?,?,?,?,?)', type, entityId, taskId ?? null, JSON.stringify(payload), createdAt);
    const event: AppEvent = { id: Number(result.lastInsertRowid), type, entityId, taskId, payload, createdAt };
    if (this.transactionDepth > 0) this.pendingEvents.push(event);
    else this.emitter.emit('event', event);
    return event;
  }
  cursor(): number { return this.get<{id:number}>('SELECT coalesce(max(id),0) AS id FROM events')!.id; }
  eventsAfter(id: number, limit = 1000): AppEvent[] {
    return this.all<{id:number;type:string;entity_id:string;task_id:string|null;payload:string;created_at:string}>('SELECT * FROM events WHERE id>? ORDER BY id LIMIT ?', id, limit)
      .map(row => ({id:row.id,type:row.type,entityId:row.entity_id,taskId:row.task_id ?? undefined,payload:JSON.parse(row.payload),createdAt:row.created_at}));
  }
  subscribe(listener: (event: AppEvent) => void): () => void { this.emitter.on('event', listener); return () => this.emitter.off('event', listener); }
  close() { this.emitter.removeAllListeners(); this.db.close(); }
}
