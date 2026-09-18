import { createHash, randomUUID } from 'node:crypto';
import type { Store } from '../store.js';
import type { SettingsStore } from '../settings.js';
import type { ApprovalService } from '../approvals.js';
import { AppError } from '../errors.js';

export const RESEND_FROM = 'i@jane-zz.me';
const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const SEND_TIMEOUT_MS = 15000;
const UNKNOWN_MESSAGE = 'Resend 发信结果未确认，请先核对服务中的邮件记录，勿自动重发。';
const REJECTED_MESSAGE = 'Resend 已明确拒绝本次发信；请核对配置或邮件内容后重新审批发送。';

export interface ResendMessage {
  from: string;
  to: string;
  subject: string;
  text: string;
}

export interface ResendAccepted {
  status: 'accepted';
  provider: 'resend';
  id: string;
  from: string;
  to: string;
  subject: string;
}

interface SendRow {
  id: string;
  status: string;
  context_ref: string | null;
  payload_json: string;
}

function prepareMessage(value: unknown): ResendMessage {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new AppError('INVALID_EMAIL', '邮件参数不正确。');
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some(key => !['to', 'subject', 'text'].includes(key))) throw new AppError('INVALID_EMAIL', '仅支持单收件人、主题和纯文本正文。');
  if (typeof input.to !== 'string' || typeof input.subject !== 'string' || typeof input.text !== 'string') throw new AppError('INVALID_EMAIL', '邮件参数不完整。');
  const to = input.to.trim();
  const subject = input.subject.trim();
  const body = input.text;
  if (to.length > 254 || !/^[^\s@,<>]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(to) || to.includes('..')) {
    throw new AppError('INVALID_EMAIL', '收件人邮箱地址不正确。');
  }
  if (!subject || subject.length > 500 || /[\r\n]/.test(subject)) throw new AppError('INVALID_EMAIL', '邮件主题不正确。');
  if (!body.trim() || body.length > 100000) throw new AppError('INVALID_EMAIL', '邮件正文不能为空或超过长度限制。');
  return { from: RESEND_FROM, to, subject, text: body };
}

function accepted(message: ResendMessage, id: string): ResendAccepted {
  return { status: 'accepted', provider: 'resend', id, from: message.from, to: message.to, subject: message.subject };
}

export function createResendMailService(opts: { store: Store; settings: SettingsStore; approvals: ApprovalService; fetch?: typeof fetch }) {
  const request = opts.fetch ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
  // A process restart cannot prove whether an interrupted POST was accepted.
  opts.store.run(
    "UPDATE outbox SET status='unknown',error=?,updated_at=? WHERE channel='resend' AND status='sending'",
    UNKNOWN_MESSAGE, new Date().toISOString(),
  );
  const currentConfig = () => opts.settings.get<{ config?: Record<string, unknown> }>('integration:resend', { config: {} }).config ?? {};
  const requireKey = () => {
    const config = currentConfig();
    if (config.enabled === false) throw new AppError('EMAIL_DISABLED', 'Resend 发信已停用。');
    if (typeof config.apiKey !== 'string' || !config.apiKey.trim()) throw new AppError('EMAIL_UNCONFIGURED', '请先配置 Resend 发信密钥。');
    return config.apiKey.trim();
  };

  function existing(taskId: string, baseKind: string, payloadHash: string, toolCallId: string, message: ResendMessage): ResendAccepted | undefined {
    const rows = opts.store.all<SendRow>(
      'SELECT id,status,context_ref,payload_json FROM outbox WHERE task_id=? AND channel=? AND (kind=? OR kind LIKE ?) ORDER BY rowid DESC',
      taskId, 'resend', baseKind, `${baseKind}:%`,
    );
    let previousAccepted: ResendAccepted | undefined;
    let sameCallFailed = false;
    for (const row of rows) {
      let metadata: { payloadHash?: string; toolCallId?: string };
      try {
        const parsed: unknown = JSON.parse(row.payload_json);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid send metadata');
        metadata = parsed as { payloadHash?: string; toolCallId?: string };
      }
      catch { throw new AppError('EMAIL_SEND_UNKNOWN', '邮件发送记录无法核对，请人工检查 Resend 后再处理。', 409); }
      if (metadata.payloadHash !== payloadHash) throw new AppError('EMAIL_SEND_CONFLICT', '邮件发送记录与当前内容不一致。', 409);
      if (row.status === 'unknown' || row.status === 'sending') throw new AppError('EMAIL_SEND_UNKNOWN', UNKNOWN_MESSAGE, 409);
      if (row.status === 'accepted') {
        if (!row.context_ref) throw new AppError('EMAIL_SEND_UNKNOWN', UNKNOWN_MESSAGE, 409);
        previousAccepted = accepted(message, row.context_ref);
      } else if (row.status === 'failed') {
        if (metadata.toolCallId === toolCallId) sameCallFailed = true;
      } else throw new AppError('EMAIL_SEND_UNKNOWN', UNKNOWN_MESSAGE, 409);
    }
    if (previousAccepted) return previousAccepted;
    if (sameCallFailed) throw new AppError('EMAIL_SEND_REJECTED', REJECTED_MESSAGE, 409);
    return undefined;
  }

  async function send(taskId: string, toolCallId: string, params: unknown, signal: AbortSignal): Promise<ResendAccepted> {
    if (!taskId || !toolCallId) throw new AppError('INVALID_EMAIL', '任务或工具调用 ID 不正确。');
    signal.throwIfAborted();
    const message = Object.freeze(prepareMessage(params));
    const bodyJson = JSON.stringify(message);
    const payloadHash = createHash('sha256').update(bodyJson).digest('hex');
    const baseKind = `email:${payloadHash}`;
    const previous = existing(taskId, baseKind, payloadHash, toolCallId, message);
    if (previous) return previous;

    // Do not retain the credential while a human reviews the complete message.
    requireKey();
    await opts.approvals.request(taskId, 'email_send', message, signal);
    signal.throwIfAborted();
    const afterApproval = existing(taskId, baseKind, payloadHash, toolCallId, message);
    if (afterApproval) return afterApproval;
    const apiKey = requireKey();

    const reserved = opts.store.transaction(() => {
      const duplicate = existing(taskId, baseKind, payloadHash, toolCallId, message);
      if (duplicate) return { previous: duplicate };
      const attemptId = randomUUID();
      const id = `resend-email/${attemptId}`;
      const kind = `${baseKind}:${attemptId}`;
      const at = new Date().toISOString();
      opts.store.run(
        'INSERT INTO outbox(id,task_id,channel,kind,recipient,payload_json,status,attempts,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
        id, taskId, 'resend', kind, 'single-recipient', JSON.stringify({ payloadHash, toolCallId }), 'sending', 1, at, at,
      );
      opts.settings.set(`email:outbox:${id}`, message);
      return { id };
    });
    if ('previous' in reserved) return reserved.previous!;

    const markUnknown = () => opts.store.run(
      "UPDATE outbox SET status='unknown',error=?,updated_at=? WHERE id=? AND status='sending'",
      UNKNOWN_MESSAGE, new Date().toISOString(), reserved.id,
    );
    const markFailed = () => opts.store.run(
      "UPDATE outbox SET status='failed',error=?,updated_at=? WHERE id=? AND status='sending'",
      REJECTED_MESSAGE, new Date().toISOString(), reserved.id,
    );
    try {
      signal.throwIfAborted();
      const response = await request(RESEND_ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': reserved.id },
        body: bodyJson,
        signal: AbortSignal.any([signal, AbortSignal.timeout(SEND_TIMEOUT_MS)]),
      });
      if (!response.ok) {
        // A received client rejection is definite, except conflicts and timeouts.
        if (response.status >= 400 && response.status < 500 && response.status !== 408 && response.status !== 409) {
          markFailed();
          throw new AppError('EMAIL_SEND_REJECTED', REJECTED_MESSAGE, 409);
        }
        throw new Error('Resend did not confirm the request');
      }
      const data: unknown = await response.json();
      if (!data || typeof data !== 'object' || typeof (data as { id?: unknown }).id !== 'string' || !(data as { id: string }).id.trim()) {
        throw new Error('Resend did not return an email id');
      }
      const id = (data as { id: string }).id;
      opts.store.run("UPDATE outbox SET status='accepted',context_ref=?,error=NULL,updated_at=? WHERE id=? AND status='sending'", id, new Date().toISOString(), reserved.id);
      return accepted(message, id);
    } catch (error) {
      if (error instanceof AppError && error.code === 'EMAIL_SEND_REJECTED') throw error;
      markUnknown();
      throw new AppError('EMAIL_SEND_UNKNOWN', UNKNOWN_MESSAGE, 409);
    }
  }

  return { send };
}

export type ResendMailService = ReturnType<typeof createResendMailService>;
