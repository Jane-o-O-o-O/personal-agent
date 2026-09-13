import { randomUUID } from 'node:crypto';
import type { Memory } from '../shared/contracts.js';
import type { Store } from './store.js';
import { AppError, textInput } from './errors.js';

export class MemoryService {
  constructor(private store: Store) {}
  list(): Memory[] { return this.store.all<{json:string}>('SELECT json FROM memories ORDER BY rowid DESC').map(row => JSON.parse(row.json)); }
  create(content: string, source = 'user'): Memory {
    const now = new Date().toISOString();
    const memory: Memory = { id: randomUUID(), content: textInput(content, 'content', 12000), source: source.slice(0, 200), version: 1, createdAt: now, updatedAt: now };
    this.store.transaction(() => { this.store.run('INSERT INTO memories(id,json) VALUES (?,?)', memory.id, JSON.stringify(memory)); this.store.publish('memory.updated', memory.id, memory); });
    return memory;
  }
  update(id: string, content: string, version?: number): Memory {
    const old = this.list().find(item => item.id === id);
    if (!old) throw new AppError('NOT_FOUND', '记忆不存在', 404);
    if (version !== undefined && old.version !== version) throw new AppError('VERSION_CONFLICT', '记忆已更新', 409);
    const memory = { ...old, content: textInput(content, 'content', 12000), version: old.version + 1, updatedAt: new Date().toISOString() };
    this.store.transaction(() => { this.store.run('UPDATE memories SET json=? WHERE id=?', JSON.stringify(memory), id); this.store.publish('memory.updated', id, memory); });
    return memory;
  }
  delete(id: string): void {
    this.store.transaction(() => { this.store.run('DELETE FROM memories WHERE id=?', id); this.store.publish('memory.deleted', id, { id }); });
  }
  search(query: string): Memory[] {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return this.list().map(memory => ({ memory, score: terms.filter(term => memory.content.toLowerCase().includes(term)).length }))
      .filter(item => item.score > 0).sort((a,b) => b.score - a.score).slice(0, 12).map(item => item.memory);
  }
}
