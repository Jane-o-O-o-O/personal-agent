import { request as playwrightRequest } from '@playwright/test';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

export const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
export const verificationDir = join(projectRoot, '.runtime', 'full-verification');
const socket = process.env.AGENT_VERIFY_SSH_SOCKET || '/tmp/personal-agent-ssh.sock';

export async function command(executable, args, input = '') {
  return await new Promise((resolve, reject) => {
    const child = spawn(executable, args, { stdio: ['pipe', 'pipe', 'pipe'], timeout: 60000 });
    let output = '';
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', chunk => { output += chunk; if (output.length > 4_000_000) child.kill(); });
    child.stderr.resume();
    child.once('error', () => reject(new Error('Verification command failed')));
    child.once('close', code => code === 0 ? resolve(output.trim()) : reject(new Error('Verification command failed')));
    child.stdin.on('error', () => {});
    child.stdin.end(input);
  });
}

export const ssh = (source, input) => command('ssh', ['-S', socket, '-o', 'BatchMode=yes', 'root@39.107.111.115', source], input);

export async function remoteNode(container, source) {
  if (!['app', 'browser'].includes(container)) throw new Error('Invalid container');
  const wrapper = `try { const result = await (async () => { ${source}\n})(); process.stdout.write(JSON.stringify(result)); } catch { process.stdout.write('{"verificationError":true}'); process.exitCode = 1; }`;
  return JSON.parse(await ssh(`cd /opt/personal-agent/deploy && docker compose --env-file ../.env -f compose.yaml exec -T ${container} node --input-type=module -`, wrapper));
}

export async function internal(path, body) {
  if (!/^[a-z]+$/.test(path)) throw new Error('Invalid internal path');
  return remoteNode('app', `
    const response = await fetch(new URL(${JSON.stringify(`/internal/${path}`)}, process.env.BROWSER_SERVICE_URL), {
      method: 'POST', headers: { authorization: 'Bearer ' + process.env.BROWSER_SERVICE_TOKEN, 'content-type': 'application/json' },
      body: ${JSON.stringify(JSON.stringify(body))}, signal: AbortSignal.timeout(45000)
    });
    if (!response.ok) throw new Error('Internal verification failed');
    return await response.json();`);
}

export async function createVerificationClient() {
  const baseUrl = (process.env.AGENT_VERIFY_URL || 'https://39.107.111.115:8443').replace(/\/$/, '');
  const password = (await readFile(process.env.AGENT_VERIFY_PASSWORD_FILE || join(projectRoot, 'data', 'admin-password'), 'utf8')).trim();
  const context = await playwrightRequest.newContext({ baseURL: baseUrl, extraHTTPHeaders: { Origin: baseUrl }, timeout: 60000 });
  const login = await context.post('/api/auth/login', { data: { password } });
  if (!login.ok()) { await context.dispose(); throw new Error(`Verification login failed: HTTP ${login.status()}`); }
  const state = await context.storageState();
  const session = state.cookies.find(value => value.name === 'pa_session');
  if (!session) { await context.dispose(); throw new Error('Verification login returned no session'); }
  const apiPath = path => path.startsWith('/api/') ? path : `/api/${path.replace(/^\//, '')}`;
  const rawRequest = (method, path, body) => context.fetch(apiPath(path), { method, ...(body !== undefined ? { data: body } : {}) });
  const request = async (method, path, body) => {
    const response = await rawRequest(method, path, body);
    if (!response.ok()) throw new Error(`Verification HTTP ${response.status()} at ${apiPath(path)}`);
    return response.json();
  };
  return {
    baseUrl, password, cookie: `${session.name}=${session.value}`, cookies: state.cookies, context, request, rawRequest,
    async logout() {
      try {
        const deadline = Date.now() + 15000;
        do {
          try {
            const response = await context.post('/api/auth/logout', { timeout: 4000 });
            if (response.ok() || response.status() === 401) {
              const stale = await context.get('/api/tasks', { headers: { Cookie: `${session.name}=${session.value}` }, timeout: 4000 });
              if (stale.status() === 401) return;
            }
          } catch {}
          await delay(300);
        } while (Date.now() < deadline);
        throw new Error('Verification session could not be invalidated');
      } finally { await context.dispose(); }
    },
  };
}
