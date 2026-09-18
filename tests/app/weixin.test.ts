import { afterEach, describe, expect, it, vi } from 'vitest';
import { randomBytes, randomUUID } from 'node:crypto';
import type { Approval, Task } from '../../src/shared/contracts.js';
import { createWeixinService } from '../../src/server/channels/weixin.js';
import { createWeixinProtocol, parseWeixinJson, validateWeixinBase, weixinHeaders } from '../../src/server/channels/weixin-protocol.js';
import { Store } from '../../src/server/store.js';
import { SettingsStore } from '../../src/server/settings.js';

const cleanup: (() => Promise<void>)[] = [];
function response(data: unknown) { return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } }); }
function waitForAbort(signal: AbortSignal | null | undefined): Promise<Response> {
  return new Promise((_resolve, reject) => {
    if (signal?.aborted) { reject(new DOMException('Aborted', 'AbortError')); return; }
    signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
  });
}
function fixture(request: typeof fetch, loggedIn = true, createFailure = false) {
  const store = new Store(':memory:'); const settings = new SettingsStore(store, randomBytes(32));
  if (loggedIn) settings.set('integration:weixin', { token: 'BOT-TOKEN-SECRET', accountId: 'bot-123', userId: 'owner-123', baseUrl: 'https://ilinkai.weixin.qq.com', cursor: 'OLD-CURSOR-SECRET' });
  const tasks: Task[] = [];
  const approvals: Approval[] = [];
  const createTask = vi.fn((prompt: string, options: { channel: string; requestId: string }): Task => {
    if (createFailure) throw new Error('Simulated database failure');
    const at = new Date().toISOString();
    const task: Task = { id: randomUUID(), title: prompt.slice(0, 40), prompt, status: 'queued', channel: options.channel, version: 1, runCount: 0, createdAt: at, updatedAt: at };
    store.run('INSERT INTO tasks(id,json,request_id) VALUES (?,?,?)', task.id, JSON.stringify(task), options.requestId); tasks.push(task); return task;
  });
  const cancelTask = vi.fn(async (id: string) => { const task = tasks.find(item => item.id === id)!; task.status = 'cancelled'; return task; });
  const decideApproval = vi.fn((id: string, decision: 'approve' | 'reject', _hash: string, _version?: number) => { const approval = approvals.find(item => item.id === id)!; approval.status = decision === 'approve' ? 'approved' : 'rejected'; approval.version++; return approval; });
  const service = createWeixinService({ store, settings, createTask, cancelTask, getTasks: () => [...tasks].reverse(), getTask: id => tasks.find(item => item.id === id), getApprovals: () => approvals, decideApproval, fetch: request });
  cleanup.push(async () => { await service.stop(); store.close(); });
  return { store, settings, service, tasks, createTask, cancelTask, approvals, decideApproval };
}
afterEach(async () => { for (const close of cleanup.splice(0)) await close(); vi.restoreAllMocks(); });
const inbound = (extra: Record<string, unknown> = {}) => ({ message_id: '18446744073709551615', message_type: 1, message_state: 2, from_user_id: 'owner-123', context_token: 'CONTEXT-TOKEN-SECRET', item_list: [{ type: 1, text_item: { text: '查一下明天的天气' } }], ...extra });

describe('Weixin official protocol', () => {
  it('preserves uint64 message identifiers with the structured Node 24 parser', () => {
    const raw = '{"message_id":18446744073709551615,"item":{"msg_id":9007199254740993,"svr_id":123},"text":"message_id:18446744073709551615"}';
    expect(parseWeixinJson(raw)).toEqual({ message_id: '18446744073709551615', item: { msg_id: '9007199254740993', svr_id: '123' }, text: 'message_id:18446744073709551615' });
  });
  it('sets the official application/version headers and keeps GET polls unauthenticated', () => {
    const post = weixinHeaders('POST', 'token'); const get = weixinHeaders('GET');
    expect(post).toMatchObject({ 'iLink-App-Id': 'bot', 'iLink-App-ClientVersion': '132105', AuthorizationType: 'ilink_bot_token', Authorization: 'Bearer token' });
    const uin = Number(Buffer.from(post['X-WECHAT-UIN'], 'base64').toString());
    expect(Number.isInteger(uin) && uin >= 0 && uin <= 4294967295).toBe(true);
    expect(get).toEqual({ 'iLink-App-Id': 'bot', 'iLink-App-ClientVersion': '132105' });
  });
  it('refuses untrusted credential redirects and detects business errors even on HTTP 200', async () => {
    expect(validateWeixinBase('ilinkai-hk.weixin.qq.com')).toBe('https://ilinkai-hk.weixin.qq.com');
    expect(() => validateWeixinBase('https://ilinkai.weixin.qq.com.attacker.invalid')).toThrow();
    expect(() => validateWeixinBase('http://ilinkai.weixin.qq.com')).toThrow();
    const request = vi.fn<typeof fetch>().mockResolvedValue(response({ ret: -14, errmsg: 'reflected-secret' }));
    await expect(createWeixinProtocol(request).call('https://ilinkai.weixin.qq.com', 'ilink/bot/getupdates', { token: 'token', botApi: true, body: { get_updates_buf: '' } })).rejects.toMatchObject({ kind: 'business', code: -14, message: '微信服务拒绝了当前请求。' });
    expect(JSON.parse(request.mock.calls[0][1]!.body as string).base_info).toEqual({ channel_version: '2.4.9', bot_agent: 'PersonalAgent/0.1.0' });
  });
});

describe('Weixin durable channel', () => {
  it('does not pretend to be connected or poll without a real credential', async () => {
    const request = vi.fn<typeof fetch>(); const { service } = fixture(request, false);
    await service.start();
    expect(service.integration().status).toBe('unconfigured'); expect(service.login().status).toBe('unconfigured'); expect(request).not.toHaveBeenCalled();
  });
  it('deduplicates exact message IDs and advances the encrypted cursor after task insertion', async () => {
    let polls = 0;
    const request = vi.fn<typeof fetch>().mockImplementation(async (url, init) => {
      if (String(url).includes('getupdates')) {
        if (++polls <= 2) return new Response('{"ret":0,"msgs":[{"message_id":18446744073709551615,"message_type":1,"message_state":2,"from_user_id":"owner-123","context_token":"CONTEXT-TOKEN-SECRET","item_list":[{"type":1,"text_item":{"text":"查一下明天的天气"}}]}],"get_updates_buf":"NEW-CURSOR-SECRET"}');
        return waitForAbort(init?.signal);
      }
      return response({ ret: 0, message_id: '123' });
    });
    const { service, settings, store, createTask, tasks } = fixture(request);
    await service.start();
    await vi.waitFor(() => expect(polls).toBe(3));
    expect(createTask).toHaveBeenCalledTimes(1); expect(tasks).toHaveLength(1);
    expect(settings.get<any>('integration:weixin', {}).cursor).toBe('NEW-CURSOR-SECRET');
    expect(store.all('SELECT * FROM channel_inbox')).toHaveLength(1);
    const persisted = store.get<any>('SELECT external_id,payload_json FROM channel_inbox');
    expect(persisted.external_id).toBe('18446744073709551615');
    expect(persisted.payload_json).not.toContain('CONTEXT-TOKEN-SECRET');
    expect(JSON.stringify(service.integration())).not.toContain('BOT-TOKEN-SECRET');
    expect(JSON.stringify(store.eventsAfter(0))).not.toContain('TOKEN-SECRET');
  });
  it('rolls back inbox, context and cursor together when task creation fails', async () => {
    const request = vi.fn<typeof fetch>().mockImplementation(async url => String(url).includes('getupdates') ? response({ ret: 0, msgs: [inbound()], get_updates_buf: 'UNCOMMITTED-CURSOR' }) : response({ ret: 0 }));
    const { service, settings, store, createTask } = fixture(request, true, true);
    await service.start(); await vi.waitFor(() => expect(createTask).toHaveBeenCalledTimes(1));
    expect(store.all('SELECT * FROM channel_inbox')).toHaveLength(0);
    expect(store.all("SELECT * FROM settings WHERE key LIKE 'weixin:context:%'")).toHaveLength(0);
    expect(settings.get<any>('integration:weixin', {}).cursor).toBe('OLD-CURSOR-SECRET');
  });
  it('persists rejected senders without allowing them to submit tasks or overwrite reply context', async () => {
    let polls = 0;
    const request = vi.fn<typeof fetch>().mockImplementation(async (_url, init) => ++polls === 1 ? response({ ret: 0, msgs: [inbound({ from_user_id: 'stranger' })], get_updates_buf: 'NEXT' }) : waitForAbort(init?.signal));
    const { service, store, settings, createTask } = fixture(request);
    await service.start(); await vi.waitFor(() => expect(polls).toBe(2));
    expect(createTask).not.toHaveBeenCalled();
    expect(JSON.parse(store.get<any>('SELECT payload_json FROM channel_inbox').payload_json).rejected).toBe('unbound_sender');
    expect(settings.get<any>('integration:weixin', {}).contextToken).toBeUndefined();
  });
  it('accepts the complete update of a message previously delivered as incomplete', async () => {
    let polls = 0;
    const request = vi.fn<typeof fetch>().mockImplementation(async (url, init) => {
      if (String(url).includes('getupdates')) {
        if (++polls === 1) return response({ ret: 0, msgs: [inbound({ message_state: 1 })], get_updates_buf: 'PARTIAL' });
        if (polls === 2) return response({ ret: 0, msgs: [inbound()], get_updates_buf: 'COMPLETE' });
        return waitForAbort(init?.signal);
      }
      return response({ ret: 0 });
    });
    const { service, createTask } = fixture(request);
    await service.start(); await vi.waitFor(() => expect(polls).toBe(3));
    expect(createTask).toHaveBeenCalledTimes(1);
  });
  it('separates completed tasks from notifications and never retries an uncertain send after restart', async () => {
    let polls = 0; let sends = 0;
    const request = vi.fn<typeof fetch>().mockImplementation(async (url, init) => {
      if (String(url).includes('getupdates')) return ++polls === 1 ? response({ ret: 0, msgs: [inbound()], get_updates_buf: 'NEXT' }) : waitForAbort(init?.signal);
      sends++; throw new TypeError('connection lost after request');
    });
    const { service, store, tasks } = fixture(request);
    await service.start(); await vi.waitFor(() => expect(store.get<any>("SELECT status FROM outbox WHERE kind='accepted'")?.status).toBe('unknown'));
    tasks[0].status = 'succeeded'; tasks[0].result = '真实结果保留在数据库';
    service.enqueueResult(tasks[0]); service.enqueueResult(tasks[0]);
    await vi.waitFor(() => expect(store.get<any>("SELECT status FROM outbox WHERE kind='result:0'")?.status).toBe('unknown'));
    expect(store.all("SELECT * FROM outbox WHERE kind='result:0'")).toHaveLength(1);
    expect(tasks[0].status).toBe('succeeded'); expect(sends).toBe(2);
    await service.stop(); await service.start(); await new Promise(resolve => setTimeout(resolve, 20));
    expect(sends).toBe(2); expect(tasks[0].result).toBe('真实结果保留在数据库');
  });
  it('recovers interrupted sending records as unknown and stores reauthorization pauses', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(response({ ret: -14 }));
    const { service, store, settings } = fixture(request);
    const now = new Date().toISOString();
    store.run("INSERT INTO outbox(id,channel,recipient,payload_json,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?)", 'pending-old-send', 'weixin', 'owner-123', '{}', 'sending', now, now);
    await service.start(); await vi.waitFor(() => expect(service.integration().status).toBe('requires_reauth'));
    expect(store.get<any>('SELECT status FROM outbox WHERE id=?', 'pending-old-send').status).toBe('unknown');
    expect(settings.get<any>('integration:weixin', {}).pauseUntil).toBeGreaterThan(Date.now() + 3500000);
    expect(request).toHaveBeenCalledTimes(1);
  });
  it('runs a cancellation command independently of task creation', async () => {
    let polls = 0;
    const request = vi.fn<typeof fetch>().mockImplementation(async (url, init) => {
      if (String(url).includes('getupdates')) {
        if (++polls === 1) return response({ ret: 0, msgs: [inbound()], get_updates_buf: 'FIRST' });
        if (polls === 2) return response({ ret: 0, msgs: [inbound({ message_id: '2', item_list: [{ type: 1, text_item: { text: '取消' } }] })], get_updates_buf: 'SECOND' });
        return waitForAbort(init?.signal);
      }
      return response({ ret: 0 });
    });
    const { service, cancelTask, createTask } = fixture(request);
    await service.start(); await vi.waitFor(() => expect(cancelTask).toHaveBeenCalledTimes(1));
    expect(createTask).toHaveBeenCalledTimes(1);
  });
});

describe('Weixin bound approvals', () => {
  function setupApprovalChannel(failDelivery = false) {
    let pending: ((value: Response) => void) | undefined; let polls = 0;
    const request = vi.fn<typeof fetch>().mockImplementation(async (url, init) => {
      if (String(url).includes('getupdates')) {
        if (++polls === 1) return response({ ret: 0, msgs: [inbound()], get_updates_buf: 'FIRST' });
        return new Promise<Response>((resolve, reject) => { pending = resolve; init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true }); });
      }
      const body = JSON.parse(init!.body as string);
      if (failDelivery && body.msg?.item_list?.[0]?.text_item?.text?.startsWith('批准请求')) throw new TypeError('uncertain delivery');
      return response({ ret: 0 });
    });
    const state = fixture(request);
    function send(text: string, id = '2', extra: Record<string, unknown> = {}) {
      const receive = pending!; pending = undefined;
      receive(response({ ret: 0, msgs: [inbound({ message_id: id, item_list: [{ type: 1, text_item: { text } }], ...extra })], get_updates_buf: `CURSOR-${id}` }));
    }
    async function ready() { await state.service.start(); await vi.waitFor(() => expect(pending).toBeDefined()); }
    function addApproval(parameters: unknown = { code: 'await bu.click(123)' }): Approval {
      const approval: Approval = { id: randomUUID(), taskId: state.tasks[0].id, action: 'browser_execute', parameters, parametersHash: 'persisted-parameters-hash', status: 'pending', version: 1, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 600000).toISOString() };
      state.approvals.push(approval); return approval;
    }
    return { ...state, request, send, ready, addApproval };
  }

  it('sends full parameters in multiple parts and decides with the persisted hash/version', async () => {
    const state = setupApprovalChannel(); await state.ready();
    const code = 'await bu.state();\n'.repeat(500);
    const approval = state.addApproval({ code }); state.service.enqueueApproval(approval); state.service.enqueueApproval(approval);
    await vi.waitFor(() => {
      const delivery = state.store.get<any>('SELECT * FROM weixin_approval_delivery WHERE approval_id=?', approval.id)!;
      expect(delivery.parts).toBeGreaterThan(1);
      expect(state.store.all<any>("SELECT status FROM outbox WHERE kind LIKE 'approval:%'").every(row => row.status === 'sent')).toBe(true);
    });
    const messages = state.request.mock.calls.filter(([url]) => String(url).includes('sendmessage')).map(([, init]) => JSON.parse(init!.body as string).msg.item_list[0].text_item.text as string).filter(text => text.startsWith('批准请求'));
    const full = messages.map(text => text.slice(text.indexOf('\n') + 1)).join('');
    expect(full).toContain(JSON.stringify({ code }, null, 2));
    expect(full).toContain(approval.id); expect(full).toContain(approval.parametersHash);
    state.send(`批准 ${approval.id.slice(0, 8)}`);
    await vi.waitFor(() => expect(state.decideApproval).toHaveBeenCalledTimes(1));
    expect(state.decideApproval).toHaveBeenCalledWith(approval.id, 'approve', 'persisted-parameters-hash', 1);
    expect(state.createTask).toHaveBeenCalledTimes(1);
  });

  it('keeps an approval pending after uncertain delivery and never runs a new task', async () => {
    const state = setupApprovalChannel(true); await state.ready();
    const approval = state.addApproval(); state.service.enqueueApproval(approval);
    await vi.waitFor(() => expect(state.store.get<any>("SELECT status FROM outbox WHERE kind LIKE 'approval:%' LIMIT 1")?.status).toBe('unknown'));
    state.send(`批准 ${approval.id}`);
    await vi.waitFor(() => expect(state.store.get<any>("SELECT status FROM weixin_commands WHERE action='approve'")?.status).toBe('done'));
    expect(state.decideApproval).not.toHaveBeenCalled(); expect(approval.status).toBe('pending'); expect(state.createTask).toHaveBeenCalledTimes(1);
  });

  it('allows the bound owner to reject a pending request without repeating the action', async () => {
    const state = setupApprovalChannel(); await state.ready();
    const approval = state.addApproval(); state.send(`拒绝 ${approval.id.slice(0, 8)}`);
    await vi.waitFor(() => expect(state.decideApproval).toHaveBeenCalledTimes(1));
    expect(state.decideApproval).toHaveBeenCalledWith(approval.id, 'reject', 'persisted-parameters-hash', 1);
    expect(approval.status).toBe('rejected'); expect(state.createTask).toHaveBeenCalledTimes(1);
  });

  it('rejects foreign task approvals even when their ID is known', async () => {
    const state = setupApprovalChannel(); await state.ready();
    const approval = state.addApproval(); approval.taskId = 'another-user-task';
    state.service.enqueueApproval(approval);
    expect(state.store.all('SELECT * FROM weixin_approval_delivery')).toHaveLength(0);
    state.send(`批准 ${approval.id}`);
    await vi.waitFor(() => expect(state.store.get<any>("SELECT status FROM weixin_commands WHERE action='approve'")?.status).toBe('done'));
    expect(state.decideApproval).not.toHaveBeenCalled(); expect(approval.status).toBe('pending');
  });

  it('answers an explicit approval query with the full current request', async () => {
    const state = setupApprovalChannel(); await state.ready();
    const approval = state.addApproval(); state.send('批准请求');
    await vi.waitFor(() => expect(state.store.get<any>('SELECT approval_id FROM weixin_approval_delivery')?.approval_id).toBe(approval.id));
    expect(state.decideApproval).not.toHaveBeenCalled(); expect(state.createTask).toHaveBeenCalledTimes(1);
  });
  it('processes later commands while an earlier asynchronous cancellation is settling', async () => {
    const state = setupApprovalChannel(); await state.ready();
    let finish: ((task: Task) => void) | undefined;
    state.cancelTask.mockImplementationOnce(() => new Promise<Task>(resolve => { finish = resolve; }));
    state.send('取消'); await vi.waitFor(() => expect(finish).toBeDefined());
    state.send('状态', '3');
    await vi.waitFor(() => expect(state.store.get<any>("SELECT status FROM weixin_commands WHERE action='status'")?.status).toBe('pending'));
    finish!(state.tasks[0]);
    await vi.waitFor(() => expect(state.store.get<any>("SELECT status FROM weixin_commands WHERE action='status'")?.status).toBe('done'));
    expect(state.createTask).toHaveBeenCalledTimes(1);
  });
});

describe('Weixin QR authorization', () => {
  it('produces a real QR image and binds only the confirmed scanner', async () => {
    const request = vi.fn<typeof fetch>().mockImplementation(async (url, init) => {
      if (String(url).includes('get_bot_qrcode')) return response({ qrcode: 'QR-VALUE-SECRET', qrcode_img_content: 'https://weixin.qq.com/qr/example' });
      if (String(url).includes('get_qrcode_status')) return response({ status: 'confirmed', bot_token: 'NEW-BOT-SECRET', ilink_bot_id: 'new-bot', ilink_user_id: 'scanner', baseurl: 'https://ilinkai.weixin.qq.com' });
      return waitForAbort(init?.signal);
    });
    const { service, settings, store } = fixture(request, false);
    const login = await service.connect();
    expect(login).toMatchObject({ status: 'qr_pending', qrcodeUrl: 'https://weixin.qq.com/qr/example' });
    expect(login.qrcodeImage).toMatch(/^data:image\/png;base64,/);
    await vi.waitFor(() => expect(service.login().status).toBe('connected'));
    expect(settings.get<any>('integration:weixin', {})).toMatchObject({ token: 'NEW-BOT-SECRET', userId: 'scanner', cursor: '' });
    expect(JSON.stringify(store.eventsAfter(0))).not.toContain('NEW-BOT-SECRET');
    expect(JSON.stringify(store.eventsAfter(0))).not.toContain('QR-VALUE-SECRET');
    const qrCall = request.mock.calls.find(([url]) => String(url).includes('get_bot_qrcode'))!;
    expect(JSON.parse(qrCall[1]!.body as string)).toEqual({ local_token_list: [] });
    expect((qrCall[1]!.headers as Record<string, string>).Authorization).toBeUndefined();
  });
  it('supports a phone verification code without exposing it in events', async () => {
    const request = vi.fn<typeof fetch>().mockImplementation(async (url, init) => {
      if (String(url).includes('get_bot_qrcode')) return response({ qrcode: 'QR-VALUE', qrcode_img_content: 'https://weixin.qq.com/qr/example' });
      if (String(url).includes('get_qrcode_status')) return new URL(String(url)).searchParams.get('verify_code') === '501234' ? response({ status: 'confirmed', bot_token: 'TOKEN', ilink_bot_id: 'bot', ilink_user_id: 'scanner' }) : response({ status: 'need_verifycode' });
      return waitForAbort(init?.signal);
    });
    const { service, store } = fixture(request, false);
    await service.connect(); await vi.waitFor(() => expect(service.login().status).toBe('verification_required'));
    await service.verify('501234'); await vi.waitFor(() => expect(service.login().status).toBe('connected'), { timeout: 2500 });
    expect(JSON.stringify(store.eventsAfter(0))).not.toContain('501234');
  });
  it('does not claim binded_redirect is success without existing local credentials', async () => {
    const request = vi.fn<typeof fetch>().mockImplementation(async url => String(url).includes('get_bot_qrcode') ? response({ qrcode: 'QR', qrcode_img_content: 'https://weixin.qq.com/qr/example' }) : response({ status: 'binded_redirect' }));
    const { service } = fixture(request, false);
    await service.connect(); await vi.waitFor(() => expect(service.login().status).toBe('error'));
    expect(service.integration().status).toBe('unconfigured');
  });
  it('disconnects, removes credentials and stops further polling', async () => {
    const request = vi.fn<typeof fetch>().mockImplementation(async (_url, init) => waitForAbort(init?.signal));
    const { service, settings } = fixture(request);
    await service.start(); await service.disconnect();
    expect(service.login().status).toBe('unconfigured'); expect(settings.get('integration:weixin', null)).toBeNull();
    expect(request).toHaveBeenCalledTimes(1);
  });
});
