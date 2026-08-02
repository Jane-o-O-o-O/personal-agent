import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import type { Store } from './store.js';

export class SettingsStore {
  constructor(private store: Store, private key: Buffer) {}
  get<T>(name: string, fallback: T): T {
    const row = this.store.get<{value:string}>('SELECT value FROM settings WHERE key=?', name);
    if (!row) return fallback;
    const [nonce, tag, ciphertext] = row.value.split('.');
    const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(nonce, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return JSON.parse(Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64url')), decipher.final()]).toString('utf8')) as T;
  }
  set(name: string, value: unknown): void {
    const nonce = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, nonce);
    const data = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
    const encrypted = [nonce, cipher.getAuthTag(), data].map(buf => buf.toString('base64url')).join('.');
    this.store.run('INSERT INTO settings(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', name, encrypted);
  }
  delete(name: string) { this.store.run('DELETE FROM settings WHERE key=?', name); }
  sensitiveStrings():string[] {
    const values:string[]=[];
    const walk=(value:unknown,sensitive=false):void=>{
      if(typeof value==='string') {
        if(sensitive && value.length>=4) {values.push(value);if(value.startsWith('Bearer '))values.push(value.slice(7));}
        if(value.startsWith('{')) {try{walk(JSON.parse(value));}catch{}}
      } else if(Array.isArray(value)) value.forEach(item=>walk(item,sensitive));
      else if(value && typeof value==='object') for(const [key,item] of Object.entries(value)) walk(item,sensitive || /api.?key|token|password|secret|private.?key|authorization|headers|^env$/i.test(key));
    };
    for(const row of this.store.all<{key:string}>('SELECT key FROM settings')) walk(this.get(row.key,null));
    return [...new Set(values)];
  }
}
