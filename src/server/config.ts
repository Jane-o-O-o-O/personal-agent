import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { resolve, join } from 'node:path';

export interface AppConfig {
  host: string; port: number; dataDir: string; password: string; encryptionKey: Buffer;
  cookieSecure: boolean; publicOrigin: string;
}

export function loadConfig(): AppConfig {
  if (existsSync('.env')) process.loadEnvFile('.env');
  const dataDir = resolve(process.env.DATA_DIR || 'data');
  mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  const persistedSecret = (name: string, bytes: number) => {
    const path = join(dataDir, name);
    if (!existsSync(path)) writeFileSync(path, randomBytes(bytes).toString('base64url'), { mode: 0o600, flag: 'wx' });
    chmodSync(path, 0o600);
    return readFileSync(path, 'utf8').trim();
  };
  const password = process.env.ADMIN_PASSWORD || persistedSecret('admin-password', 24);
  const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY || persistedSecret('master-key', 32), 'base64url');
  if (encryptionKey.length !== 32) throw new Error('ENCRYPTION_KEY must be a base64url encoded 32-byte key');
  const port = Number(process.env.PORT || 3420);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
  return {
    host: process.env.HOST || '127.0.0.1', port, dataDir, password, encryptionKey,
    cookieSecure: process.env.COOKIE_SECURE === 'true',
    publicOrigin: process.env.PUBLIC_ORIGIN || `http://127.0.0.1:${port}`,
  };
}
