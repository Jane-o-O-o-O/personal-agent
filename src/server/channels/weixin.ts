import { createHash, randomUUID } from 'node:crypto';
import QRCode from 'qrcode';
import type { Approval, Integration, Task, WeixinLogin } from '../../shared/contracts.js';
import type { SettingsStore } from '../settings.js';
import type { Store } from '../store.js';
import type { FetchLike } from '../integrations/http.js';
import { createWeixinProtocol, WEIXIN_API_BASE, validateWeixinBase, WeixinApiError } from './weixin-protocol.js';

interface Credentials {
  token: string; accountId: string; userId: string; baseUrl: string; cursor: string;
  contextToken?: string; pauseUntil?: number; requiresReauth?: boolean; lastCheckedAt?: string; lastError?: string;
}
interface QrSession { qrcode: string; baseUrl: string; expiresAt: number; verifyCode?: string; controller: AbortController }
interface OutboundRow { id: string; task_id: string | null; recipient: string; context_ref: string | null; payload_json: string; status: string; attempts: number }
interface Context { accountId: string; userId: string; token: string }
interface CommandRow { id: string; action: string; target_task_id: string | null; status: string; account_id: string; user_id: string; context_ref: string; parameters_hash?: string; version?: number }
interface ApprovalDelivery { approval_id: string; task_id: string; account_id: string; recipient: string; parameters_hash: string; version: number; delivery_id: string; parts: number }
interface Message { message_id?: string; from_user_id?: string; to_user_id?: string; message_type?: number; message_state?: number; group_id?: string; context_token?: string; item_list?: { type?: number; text_item?: { text?: string }; voice_item?: { text?: string } }[] }

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise(resolve => {
    if (signal?.aborted) { resolve(); return; }
    const stop = () => { clearTimeout(timer); signal?.removeEventListener('abort', stop); resolve(); };
    const timer = setTimeout(stop, ms); timer.unref();
    signal?.addEventListener('abort', stop, { once: true });
  });
}
function messageText(message: Message): string {
  return (message.item_list ?? []).map(item => item.type === 1 ? item.text_item?.text ?? '' : item.type === 3 ? item.voice_item?.text ?? '' : '').filter(Boolean).join('\n').trim();
}
function chunks(value: string): string[] {
  const points = Array.from(value); const result: string[] = [];
  for (let offset = 0; offset < points.length; offset += 2500) result.push(points.slice(offset, offset + 2500).join(''));
  return result.length ? result : ['任务已结束。'];
}

export function createWeixinService(opts: {
  store: Store; settings: SettingsStore;
  createTask: (prompt: string, options: { channel: string; requestId: string }) => Task;
  cancelTask: (id: string) => Promise<Task>; getTasks: () => Task[]; getTask: (id: string) => Task | undefined;
  getApprovals?: () => Approval[]; decideApproval?: (id: string, decision: 'approve' | 'reject', parametersHash: string, version?: number) => Approval;
  fetch?: FetchLike;
}) {
  const { store, settings } = opts;
  const protocol = createWeixinProtocol(opts.fetch ?? ((...args: Parameters<FetchLike>) => fetch(...args)));
  store.db.exec(`
    CREATE TABLE IF NOT EXISTS weixin_task_context (task_id TEXT PRIMARY KEY REFERENCES tasks(id), account_id TEXT NOT NULL, recipient TEXT NOT NULL, context_ref TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS weixin_commands (id TEXT PRIMARY KEY, action TEXT NOT NULL, target_task_id TEXT, status TEXT NOT NULL, account_id TEXT NOT NULL, user_id TEXT NOT NULL, context_ref TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS weixin_approval_delivery (approval_id TEXT PRIMARY KEY, task_id TEXT NOT NULL, account_id TEXT NOT NULL, recipient TEXT NOT NULL, parameters_hash TEXT NOT NULL, version INTEGER NOT NULL, delivery_id TEXT NOT NULL, parts INTEGER NOT NULL);
  `);
  const columns = store.all<{ name: string }>('PRAGMA table_info(weixin_commands)').map(row => row.name);
  if (!columns.includes('parameters_hash')) store.db.exec('ALTER TABLE weixin_commands ADD COLUMN parameters_hash TEXT');
  if (!columns.includes('version')) store.db.exec('ALTER TABLE weixin_commands ADD COLUMN version INTEGER');
  const load = () => settings.get<Credentials | null>('integration:weixin', null);
  let active = false; let pollController: AbortController | undefined; let qr: QrSession | undefined;
  let pollPromise: Promise<void> | undefined; let qrPromise: Promise<void> | undefined; let sendPromise: Promise<void> | undefined; let commandPromise: Promise<void> | undefined;
  let sendingController: AbortController | undefined; let connectingController: AbortController | undefined; let loginGeneration = 0;
  let loginState: WeixinLogin = load()?.token ? { status: load()!.requiresReauth ? 'requires_reauth' : 'connected' } : { status: 'unconfigured' };
  const integration = (): Integration => {
    const state = load();
    return { id: 'weixin', name: '微信', description: '腾讯官方 Agent 私聊消息通道。',
      status: !state?.token ? 'unconfigured' : state.requiresReauth ? 'requires_reauth' : state.lastError ? 'error' : 'connected',
      capabilities: ['扫码授权', '文字任务', '查询状态', '取消任务', '任务结果', ...(opts.decideApproval ? ['操作批准'] : [])], fields: [], config: state ? { accountId: state.accountId } : {}, secretFields: { botToken: Boolean(state?.token) },
      lastCheckedAt: state?.lastCheckedAt, lastError: state?.lastError };
  };
  const publish = () => store.publish('integration.updated', 'weixin', integration());
  const setLogin = (state: WeixinLogin) => { loginState = state; publish(); };
  const saveCredentials = (value: Credentials) => settings.set('integration:weixin', value);
  function markFailure(message: string, stale = false) {
    const current = load(); if (!current) return;
    saveCredentials({ ...current, lastError: message, ...(stale ? { requiresReauth: true, pauseUntil: Date.now() + 3600000 } : {}) });
    if (stale) loginState = { status: 'requires_reauth', message: '微信凭据已失效，请重新扫码授权。' };
    publish();
  }
  function enqueueText(id: string, taskId: string | null, kind: string, recipient: string, contextRef: string, value: string) {
    const at = new Date().toISOString();
    store.run('INSERT OR IGNORE INTO outbox(id,task_id,channel,kind,recipient,context_ref,payload_json,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
      id, taskId, 'weixin', kind, recipient, contextRef, JSON.stringify({ text: value, clientId: `personal-agent-${randomUUID()}` }), 'pending', at, at);
  }
  function contextReference(accountId: string, messageId: string) { return `weixin:context:${accountId}:${messageId}`; }
  function ownedApproval(approval: Approval, credentials: Credentials): boolean {
    const context = store.get<{ account_id: string; recipient: string }>('SELECT account_id,recipient FROM weixin_task_context WHERE task_id=?', approval.taskId);
    return Boolean(context && context.account_id === credentials.accountId && context.recipient === credentials.userId);
  }
  function pendingApprovals(credentials: Credentials) {
    return (opts.getApprovals?.() ?? []).filter(approval => approval.status === 'pending' && Number.isFinite(Date.parse(approval.expiresAt)) && Date.parse(approval.expiresAt) > Date.now() && ownedApproval(approval, credentials));
  }
  function queueApproval(approval: Approval, contextRef?: string, requestedDeliveryId?: string) {
    const credentials = load();
    if (!credentials || !ownedApproval(approval, credentials) || approval.status !== 'pending' || !Number.isFinite(Date.parse(approval.expiresAt)) || Date.parse(approval.expiresAt) <= Date.now()) return;
    const context = store.get<{ context_ref: string }>('SELECT context_ref FROM weixin_task_context WHERE task_id=?', approval.taskId)!;
    const saved = store.get<ApprovalDelivery>('SELECT * FROM weixin_approval_delivery WHERE approval_id=?', approval.id);
    if (!requestedDeliveryId && saved && saved.parameters_hash === approval.parametersHash && saved.version === approval.version) return;
    const deliveryId = requestedDeliveryId ?? `${approval.id}:${approval.version}:${approval.parametersHash}`;
    const body = `批准请求 ${approval.id}\n任务 ${approval.taskId}\n动作：${approval.action}\n有效期：${approval.expiresAt}\n参数标识：${approval.parametersHash}\n\n${JSON.stringify(approval.parameters, null, 2)}\n\n批准 ${approval.id}\n拒绝 ${approval.id}`;
    const parts = chunks(body);
    store.transaction(() => {
      parts.forEach((part, index) => enqueueText(`weixin:approval:${deliveryId}:${index}`, approval.taskId, `approval:${deliveryId}:${index}`, credentials.userId, contextRef ?? context.context_ref, `批准请求 ${approval.id.slice(0, 8)} (${index + 1}/${parts.length})\n${part}`));
      store.run('INSERT INTO weixin_approval_delivery(approval_id,task_id,account_id,recipient,parameters_hash,version,delivery_id,parts) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(approval_id) DO UPDATE SET parameters_hash=excluded.parameters_hash,version=excluded.version,delivery_id=excluded.delivery_id,parts=excluded.parts', approval.id, approval.taskId, credentials.accountId, credentials.userId, approval.parametersHash, approval.version, deliveryId, parts.length);
    });
    pumpOutbox();
  }
  function approvalDelivered(approval: Approval, credentials: Credentials): boolean {
    const delivery = store.get<ApprovalDelivery>('SELECT * FROM weixin_approval_delivery WHERE approval_id=?', approval.id);
    if (!delivery || delivery.account_id !== credentials.accountId || delivery.recipient !== credentials.userId || delivery.parameters_hash !== approval.parametersHash || delivery.version !== approval.version) return false;
    for (let index = 0; index < delivery.parts; index++) if (store.get<{ status: string }>('SELECT status FROM outbox WHERE id=?', `weixin:approval:${delivery.delivery_id}:${index}`)?.status !== 'sent') return false;
    return true;
  }
  function processUpdates(credentials: Credentials, response: any) {
    if (response.msgs !== undefined && !Array.isArray(response.msgs)) throw new WeixinApiError('invalid_response', '微信消息列表不合法。');
    const recovered = Boolean(credentials.lastError);
    store.transaction(() => {
      for (const message of response.msgs ?? []) {
        const inbound = message as Message;
        const hasId = typeof inbound.message_id === 'string' && /^\d+$/.test(inbound.message_id);
        const messageId = hasId ? inbound.message_id! : `invalid-${createHash('sha256').update(JSON.stringify({ sender: inbound.from_user_id, type: inbound.message_type, text: messageText(inbound) })).digest('hex')}`;
        const externalId = inbound.message_state === 1 ? `${messageId}:incomplete` : messageId;
        const channel = `weixin:${credentials.accountId}`;
        if (store.get('SELECT id FROM channel_inbox WHERE channel=? AND external_id=?', channel, externalId)) continue;
        let rejection: string | undefined;
        if (!hasId) rejection = 'missing_message_id';
        else if (inbound.from_user_id !== credentials.userId) rejection = 'unbound_sender';
        else if (inbound.group_id) rejection = 'unsupported_group';
        else if (inbound.message_type !== 1) rejection = 'non_user_message';
        else if (inbound.message_state === 1) rejection = 'incomplete_message';
        const prompt = messageText(inbound);
        if (!rejection && !prompt) rejection = 'unsupported_content';
        if (!rejection && prompt.length > 50000) rejection = 'message_too_large';
        const inboxId = `${channel}:${externalId}`;
        const contextRef = contextReference(credentials.accountId, externalId);
        if (!rejection && inbound.context_token) {
          settings.set(contextRef, { accountId: credentials.accountId, userId: credentials.userId, token: inbound.context_token } satisfies Context);
          credentials.contextToken = inbound.context_token;
        }
        const payload = { messageId, sender: inbound.from_user_id, text: prompt, ...(rejection ? { rejected: rejection } : {}) };
        store.run('INSERT INTO channel_inbox(id,channel,external_id,received_at,payload_json) VALUES (?,?,?,?,?)', inboxId, channel, externalId, new Date().toISOString(), JSON.stringify(payload));
        if (rejection) continue;
        const cancel = /^(?:取消|停止|\/cancel)(?:\s+([a-zA-Z0-9-]+))?$/.exec(prompt);
        const approvalCommand = /^(批准|同意|拒绝|\/approve|\/reject)\s+([a-zA-Z0-9-]+)$/.exec(prompt);
        const approvalQuery = /^(?:批准请求|审批请求|\/approvals)$/.test(prompt);
        if (cancel || approvalCommand || approvalQuery || /^(?:状态|任务状态|\/status)$/.test(prompt)) {
          let target: string | null = null;
          let approval: Approval | undefined;
          let action = approvalQuery ? 'approvals' : 'status';
          if (cancel) {
            action = 'cancel';
            const candidates = opts.getTasks().filter(task => cancel[1] ? task.id.startsWith(cancel[1]) : task.channel === 'weixin' && ['queued', 'running', 'waiting_approval', 'waiting_user', 'waiting_external', 'paused'].includes(task.status));
            if (cancel[1] ? candidates.length === 1 : candidates.length > 0) target = candidates[0].id;
          }
          if (approvalCommand) {
            action = approvalCommand[1] === '拒绝' || approvalCommand[1] === '/reject' ? 'reject' : 'approve';
            const candidates = pendingApprovals(credentials).filter(item => item.id.startsWith(approvalCommand[2]));
            if (candidates.length === 1) { approval = candidates[0]; target = approval.id; }
          }
          store.run('INSERT INTO weixin_commands(id,action,target_task_id,status,account_id,user_id,context_ref,parameters_hash,version) VALUES (?,?,?,?,?,?,?,?,?)', inboxId, action, target, 'pending', credentials.accountId, credentials.userId, contextRef, approval?.parametersHash ?? null, approval?.version ?? null);
          continue;
        }
        const task = opts.createTask(prompt, { channel: 'weixin', requestId: inboxId });
        store.run('INSERT OR IGNORE INTO weixin_task_context(task_id,account_id,recipient,context_ref) VALUES (?,?,?,?)', task.id, credentials.accountId, credentials.userId, contextRef);
        enqueueText(`${inboxId}:accepted`, task.id, 'accepted', credentials.userId, contextRef, `已收到任务 ${task.id.slice(0, 8)}：${task.title}`);
      }
      if (typeof response.get_updates_buf === 'string' && response.get_updates_buf) credentials.cursor = response.get_updates_buf;
      credentials.lastCheckedAt = new Date().toISOString(); delete credentials.lastError;
      saveCredentials(credentials);
      if (recovered) publish();
    });
    pumpCommands(); pumpOutbox();
  }
  async function poll(signal: AbortSignal) {
    let nextTimeout = 35000; let failures = 0;
    while (active && !signal.aborted) {
      const credentials = load(); if (!credentials?.token || credentials.requiresReauth) return;
      if (credentials.pauseUntil && credentials.pauseUntil > Date.now()) { await sleep(Math.min(credentials.pauseUntil - Date.now(), 30000), signal); continue; }
      try {
        const response = await protocol.call(credentials.baseUrl, 'ilink/bot/getupdates', { token: credentials.token, body: { get_updates_buf: credentials.cursor }, botApi: true, signal, timeoutMs: nextTimeout + 3000 });
        if (signal.aborted || !active || load()?.token !== credentials.token) return;
        if (response.ret !== 0) throw new WeixinApiError('invalid_response', '微信未明确确认消息轮询成功。');
        if (typeof response.longpolling_timeout_ms === 'number' && response.longpolling_timeout_ms > 0) nextTimeout = Math.max(1000, Math.min(60000, response.longpolling_timeout_ms));
        processUpdates(credentials, response); failures = 0;
        if (!response.msgs?.length) await sleep(250, signal);
      } catch (error) {
        if (signal.aborted || !active) return;
        if (error instanceof WeixinApiError && error.kind === 'timeout') continue;
        if (error instanceof WeixinApiError && error.code === -14) { markFailure('微信凭据失效，需要重新授权。', true); return; }
        failures++; markFailure(error instanceof WeixinApiError ? error.message : '微信消息处理失败，游标保持不变。');
        await sleep(failures >= 3 ? 30000 : 2000, signal);
      }
    }
  }
  function ensurePolling() {
    if (!active || pollPromise || !load()?.token || load()?.requiresReauth) return;
    const controller = new AbortController(); pollController = controller;
    pollPromise = poll(controller.signal).finally(() => { pollPromise = undefined; if (pollController === controller) pollController = undefined; });
  }
  async function processCommands() {
    for (const command of store.all<CommandRow>("SELECT * FROM weixin_commands WHERE status IN ('pending','running') ORDER BY rowid")) {
      if (!active) return;
      const credentials = load();
      if (!credentials || credentials.accountId !== command.account_id || credentials.userId !== command.user_id) { store.run("UPDATE weixin_commands SET status='failed' WHERE id=?", command.id); continue; }
      store.run("UPDATE weixin_commands SET status='running' WHERE id=?", command.id);
      let reply: string;
      if (command.action === 'status') {
        const tasks = opts.getTasks().slice(0, 8);
        reply = tasks.length ? tasks.map(task => `${task.id.slice(0, 8)} ${task.status} ${task.title}`).join('\n') : '暂时没有任务。';
      } else if (command.action === 'approvals') {
        const approvals = pendingApprovals(credentials);
        for (const approval of approvals) queueApproval(approval, command.context_ref, `${approval.id}:query:${command.id}`);
        reply = approvals.length ? `有 ${approvals.length} 个待批准请求，完整动作和参数将分别发送。` : '当前没有待批准请求。';
      } else if (command.action === 'approve' || command.action === 'reject') {
        const approval = (opts.getApprovals?.() ?? []).find(item => item.id === command.target_task_id);
        if (!approval || !ownedApproval(approval, credentials) || !opts.decideApproval) reply = '未找到唯一且有效的本人批准请求。';
        else if (approval.status !== 'pending') reply = `请求 ${approval.id.slice(0, 8)} 已处理：${approval.status}`;
        else if (Date.parse(approval.expiresAt) <= Date.now()) reply = '批准请求已过期，请在工作台重新核对任务。';
        else if (approval.parametersHash !== command.parameters_hash || approval.version !== command.version) reply = '批准请求参数已变化，请重新核对完整参数。';
        else if (command.action === 'approve' && !approvalDelivered(approval, credentials)) reply = '完整动作和参数尚未通过微信确认送达，请在工作台核对后批准。';
        else {
          try { const decided = opts.decideApproval(approval.id, command.action, approval.parametersHash, approval.version); reply = `请求 ${approval.id.slice(0, 8)} 当前状态：${decided.status}`; }
          catch { reply = '批准请求状态已变化或无法处理，请在工作台核对。'; }
        }
      } else if (!command.target_task_id) reply = '未找到可取消的任务。';
      else {
        try { const task = await opts.cancelTask(command.target_task_id); reply = `任务 ${task.id.slice(0, 8)} 当前状态：${task.status}`; }
        catch { reply = '任务取消失败，请在工作台核对状态。'; }
      }
      store.transaction(() => { enqueueText(`${command.id}:reply`, null, `command:${command.id}`, command.user_id, command.context_ref, reply); store.run("UPDATE weixin_commands SET status='done' WHERE id=?", command.id); });
    }
  }
  function pumpCommands() {
    if (!active || commandPromise) return;
    let failed = false;
    commandPromise = processCommands().catch(() => { failed = true; markFailure('微信任务指令处理失败。'); }).finally(() => {
      commandPromise = undefined; pumpOutbox();
      if (!failed && active && store.get("SELECT id FROM weixin_commands WHERE status='pending' LIMIT 1")) queueMicrotask(pumpCommands);
    });
  }
  async function sendPending(signal: AbortSignal) {
    while (active && !signal.aborted) {
      const credentials = load(); if (!credentials?.token || credentials.requiresReauth) return;
      const row = store.get<OutboundRow>("SELECT * FROM outbox WHERE channel='weixin' AND status='pending' ORDER BY created_at,rowid LIMIT 1");
      if (!row) return;
      let original: Context | null;
      try { original = row.context_ref ? settings.get<Context | null>(row.context_ref, null) : null; }
      catch { store.run("UPDATE outbox SET status='failed',error=?,updated_at=? WHERE id=?", '微信回复上下文无法读取。', new Date().toISOString(), row.id); continue; }
      if (row.recipient !== credentials.userId || !original || original.accountId !== credentials.accountId || original.userId !== credentials.userId) {
        store.run("UPDATE outbox SET status='failed',error=?,updated_at=? WHERE id=?", '微信会话授权不可用。', new Date().toISOString(), row.id); continue;
      }
      const contextToken = credentials.contextToken ?? original.token;
      if (!contextToken) { store.run("UPDATE outbox SET status='failed',error=?,updated_at=? WHERE id=?", '没有可用的微信回复上下文。', new Date().toISOString(), row.id); continue; }
      let payload: { text: string; clientId: string };
      try {
        payload = JSON.parse(row.payload_json);
        if (typeof payload.text !== 'string' || !payload.text || typeof payload.clientId !== 'string' || !payload.clientId) throw new Error('Invalid payload');
      } catch { store.run("UPDATE outbox SET status='failed',error=?,updated_at=? WHERE id=?", '微信通知记录不完整。', new Date().toISOString(), row.id); continue; }
      store.run("UPDATE outbox SET status='sending',attempts=attempts+1,updated_at=? WHERE id=?", new Date().toISOString(), row.id);
      let status = 'sent'; let errorMessage: string | null = null;
      try {
        const response = await protocol.call(credentials.baseUrl, 'ilink/bot/sendmessage', { token: credentials.token, botApi: true, signal,
          body: { msg: { from_user_id: '', to_user_id: row.recipient, client_id: payload.clientId, message_type: 2, message_state: 2, context_token: contextToken, item_list: [{ type: 1, text_item: { text: payload.text } }] } } });
        if (response.ret !== 0) throw new WeixinApiError('invalid_response', '微信未明确确认消息已发送。');
      } catch (error) {
        status = error instanceof WeixinApiError && (error.kind === 'business' || error.kind === 'http' && error.code! < 500) ? 'failed' : 'unknown';
        errorMessage = error instanceof WeixinApiError ? error.message : '微信通知结果不确定。';
        if (error instanceof WeixinApiError && error.code === -14) markFailure('微信凭据失效，需要重新授权。', true);
      }
      store.transaction(() => {
        store.run('UPDATE outbox SET status=?,error=?,updated_at=? WHERE id=?', status, errorMessage, new Date().toISOString(), row.id);
        store.publish('notification.updated', row.id, { channel: 'weixin', status, error: errorMessage }, row.task_id ?? undefined);
      });
    }
  }
  function pumpOutbox() {
    if (!active || sendPromise || !load()?.token || load()?.requiresReauth) return;
    const controller = new AbortController(); sendingController = controller;
    let failed = false;
    sendPromise = sendPending(controller.signal).catch(() => { failed = true; markFailure('微信通知处理失败。'); }).finally(() => {
      sendPromise = undefined; if (sendingController === controller) sendingController = undefined;
      if (!failed && active && !load()?.requiresReauth && store.get("SELECT id FROM outbox WHERE channel='weixin' AND status='pending' LIMIT 1")) queueMicrotask(pumpOutbox);
    });
  }
  async function stopPolling() { pollController?.abort(); sendingController?.abort(); await Promise.allSettled([pollPromise, sendPromise]); }
  async function stopService() {
    active = false; loginGeneration++; connectingController?.abort(); qr?.controller.abort(); qr = undefined; pollController?.abort(); sendingController?.abort();
    await Promise.allSettled([pollPromise, qrPromise, sendPromise, commandPromise]);
  }
  async function pollQr(session: QrSession) {
    while (active && qr === session && !session.controller.signal.aborted && Date.now() < session.expiresAt) {
      if (loginState.status === 'verification_required' && !session.verifyCode) { await sleep(500, session.controller.signal); continue; }
      try {
        const suffix = `ilink/bot/get_qrcode_status?qrcode=${encodeURIComponent(session.qrcode)}${session.verifyCode ? `&verify_code=${encodeURIComponent(session.verifyCode)}` : ''}`;
        const response = await protocol.call(session.baseUrl, suffix, { method: 'GET', signal: session.controller.signal, timeoutMs: 35000 });
        if (qr !== session || session.controller.signal.aborted || !active) return;
        const status = response.status;
        if (status === 'confirmed') {
          if (![response.bot_token, response.ilink_bot_id, response.ilink_user_id].every(value => typeof value === 'string' && value.trim())) throw new WeixinApiError('invalid_response', '微信确认授权时缺少凭据或绑定用户。');
          const nextBase = validateWeixinBase(response.baseurl ?? session.baseUrl);
          await stopPolling();
          saveCredentials({ token: response.bot_token, accountId: response.ilink_bot_id, userId: response.ilink_user_id, baseUrl: nextBase, cursor: '', lastCheckedAt: new Date().toISOString() });
          qr = undefined; setLogin({ status: 'connected', message: '微信已连接。' }); ensurePolling(); pumpCommands(); pumpOutbox(); return;
        }
        if (status === 'binded_redirect') {
          const current = load();
          qr = undefined;
          if (current?.token && !current.requiresReauth) { setLogin({ status: 'connected', message: '微信已有有效授权。' }); ensurePolling(); return; }
          setLogin({ status: 'error', message: '微信已有绑定，但本地没有可用凭据，请在微信解除绑定后重新连接。' }); return;
        }
        if (status === 'scaned_but_redirect') {
          if (typeof response.redirect_host !== 'string') throw new WeixinApiError('invalid_response', '微信未提供重定向地址。');
          session.baseUrl = validateWeixinBase(response.redirect_host);
        } else if (status === 'need_verifycode') {
          const wrong = Boolean(session.verifyCode); session.verifyCode = undefined;
          setLogin({ ...loginState, status: 'verification_required', message: wrong ? '验证码不匹配，请重新输入手机显示的数字。' : '请输入手机微信显示的数字。' });
        } else if (status === 'verify_code_blocked') { qr = undefined; setLogin({ status: 'error', message: '微信验证次数过多，请重新生成二维码。' }); return; }
        else if (status === 'expired') { qr = undefined; setLogin({ status: 'expired', message: '二维码已过期。' }); return; }
        else if (status === 'scaned' && loginState.status !== 'scanned') setLogin({ ...loginState, status: 'scanned', message: '已扫码，等待微信确认。' });
        else if (status !== 'wait' && status !== 'scaned') throw new WeixinApiError('invalid_response', '微信返回未知的登录状态。');
      } catch (error) {
        if (session.controller.signal.aborted || qr !== session || !active) return;
        if (error instanceof WeixinApiError && ['timeout', 'network'].includes(error.kind)) { await sleep(1000, session.controller.signal); continue; }
        qr = undefined; setLogin({ status: 'error', message: error instanceof WeixinApiError ? error.message : '微信登录失败。' }); return;
      }
      await sleep(1000, session.controller.signal);
    }
    if (qr === session && !session.controller.signal.aborted && active) { qr = undefined; setLogin({ status: 'expired', message: '二维码已过期。' }); }
  }
  return {
    async start(): Promise<void> {
      if (active) return; active = true;
      store.run("UPDATE outbox SET status='unknown',error=?,updated_at=? WHERE channel='weixin' AND status='sending'", '服务重启后无法确认通知是否送达。', new Date().toISOString());
      ensurePolling(); pumpCommands(); pumpOutbox();
    },
    stop: stopService,
    async connect(): Promise<WeixinLogin> {
      if (!active) active = true;
      const generation = ++loginGeneration; connectingController?.abort();
      qr?.controller.abort(); qr = undefined;
      const controller = new AbortController(); connectingController = controller;
      try {
        const credentials = load();
        const response = await protocol.call(WEIXIN_API_BASE, 'ilink/bot/get_bot_qrcode?bot_type=3', { body: { local_token_list: credentials?.token ? [credentials.token] : [] }, signal: controller.signal });
        if (controller.signal.aborted || generation !== loginGeneration || !active) return { ...loginState };
        if (typeof response.qrcode !== 'string' || typeof response.qrcode_img_content !== 'string' || !response.qrcode || !response.qrcode_img_content) throw new WeixinApiError('invalid_response', '微信未提供可用的二维码。');
        const value = response.qrcode_img_content;
        if (!/^https?:\/\//i.test(value) && !/^data:image\//.test(value)) throw new WeixinApiError('invalid_response', '微信返回的扫码内容格式不受支持。');
        const session: QrSession = { qrcode: response.qrcode, baseUrl: WEIXIN_API_BASE, expiresAt: Date.now() + 300000, controller };
        const state: WeixinLogin = { status: 'qr_pending', qrcodeUrl: /^https?:/.test(value) ? value : undefined, qrcodeImage: value.startsWith('data:image/') ? value : await QRCode.toDataURL(value, { width: 280, margin: 2 }), expiresAt: new Date(session.expiresAt).toISOString(), message: '请在微信确认授权。' };
        if (controller.signal.aborted || generation !== loginGeneration || !active) return { ...loginState };
        qr = session;
        setLogin(state);
        qrPromise = pollQr(session).finally(() => { if (qr === session) qr = undefined; });
        return { ...state };
      } catch (error) {
        if (generation !== loginGeneration || !active) return { ...loginState };
        controller.abort(); const state: WeixinLogin = { status: 'error', message: error instanceof WeixinApiError ? error.message : '获取微信二维码失败。' }; setLogin(state); return { ...state };
      }
    },
    async verify(code: string): Promise<WeixinLogin> {
      if (!qr || loginState.status !== 'verification_required') throw new Error('当前没有等待验证码的微信登录。');
      if (!/^\d{1,12}$/.test(code)) throw new Error('验证码须为手机显示的数字。');
      qr.verifyCode = code; return { ...loginState };
    },
    login: (): WeixinLogin => ({ ...loginState }),
    async disconnect(): Promise<void> {
      await stopService();
      store.transaction(() => {
        settings.delete('integration:weixin');
        store.run("DELETE FROM settings WHERE key LIKE 'weixin:context:%'");
        store.run("UPDATE outbox SET status='failed',error=?,updated_at=? WHERE channel='weixin' AND status='pending'", '微信授权已断开。', new Date().toISOString());
        store.run("UPDATE weixin_commands SET status='failed' WHERE status IN ('pending','running')");
        loginState = { status: 'unconfigured' }; publish();
      });
    },
    integration,
    enqueueApproval(approval: Approval): void {
      const current = opts.getApprovals?.().find(item => item.id === approval.id) ?? approval;
      queueApproval(current);
    },
    enqueueResult(task: Task): void {
      if (!['succeeded', 'failed', 'cancelled'].includes(task.status)) return;
      const context = store.get<{ recipient: string; context_ref: string }>('SELECT recipient,context_ref FROM weixin_task_context WHERE task_id=?', task.id);
      if (!context) return;
      const result = task.result ?? task.error ?? (task.status === 'cancelled' ? '任务已取消。' : '任务已结束。');
      store.transaction(() => {
        chunks(`${task.title}\n任务 ${task.id.slice(0, 8)}：${task.status}\n\n${result}`).forEach((part, index) => enqueueText(`${task.id}:weixin:result:${index}`, task.id, `result:${index}`, context.recipient, context.context_ref, part));
      });
      pumpOutbox();
    },
  };
}

export default createWeixinService;
