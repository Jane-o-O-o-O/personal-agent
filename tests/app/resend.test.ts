import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHash, randomBytes } from 'node:crypto';
import { ApprovalService } from '../../src/server/approvals.js';
import { createResendMailService, RESEND_FROM } from '../../src/server/mail/resend.js';
import { SettingsStore } from '../../src/server/settings.js';
import { Store } from '../../src/server/store.js';
import { TaskService } from '../../src/server/tasks.js';

const stores: Store[] = [];
const draft = { to: 'recipient@example.com', subject: '进度更新', text: '第一行\n第二行' };

function fixture(request: typeof fetch) {
  const store = new Store(':memory:');
  stores.push(store);
  const settings = new SettingsStore(store, randomBytes(32));
  settings.set('integration:resend', { config: { enabled: true, apiKey: 'fake-test-key' } });
  const task = new TaskService(store, () => true).create('发送邮件');
  const approvals = new ApprovalService(store, () => {});
  const mail = createResendMailService({ store, settings, approvals, fetch: request });
  const approve = (decision: 'approve' | 'reject' = 'approve') => {
    const pending = approvals.list(task.id).find(item => item.status === 'pending')!;
    approvals.decide(pending.id, decision, pending.parametersHash, pending.version);
    return pending;
  };
  return { store, settings, task, approvals, mail, approve };
}

function response(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
}

afterEach(() => {
  for (const store of stores.splice(0)) store.close();
  vi.restoreAllMocks();
});

describe('Resend mail send boundary', () => {
  it('rejects unsupported or malformed mail before approval and HTTP', async () => {
    const request = vi.fn<typeof fetch>();
    const { task, approvals, mail, store } = fixture(request);
    await expect(mail.send(task.id, 'call-1', { ...draft, from: 'other@example.com' }, new AbortController().signal)).rejects.toMatchObject({ code: 'INVALID_EMAIL' });
    await expect(mail.send(task.id, 'call-2', { ...draft, to: 'two@example.com,three@example.com' }, new AbortController().signal)).rejects.toMatchObject({ code: 'INVALID_EMAIL' });
    await expect(mail.send(task.id, 'call-3', { ...draft, subject: 'Header\nInjected' }, new AbortController().signal)).rejects.toMatchObject({ code: 'INVALID_EMAIL' });
    expect(approvals.list(task.id)).toHaveLength(0);
    expect(store.all('SELECT id FROM outbox')).toHaveLength(0);
    expect(request).not.toHaveBeenCalled();
  });

  it('shows the frozen full message for approval and sends nothing when rejected', async () => {
    const request = vi.fn<typeof fetch>();
    const { task, approvals, mail, approve, store } = fixture(request);
    const pending = mail.send(task.id, 'call-1', draft, new AbortController().signal);
    const approval = approvals.list(task.id)[0];
    expect(approval.action).toBe('email_send');
    expect(approval.parameters).toEqual({ from: RESEND_FROM, ...draft });
    approve('reject');
    await expect(pending).rejects.toMatchObject({ code: 'APPROVAL_REJECTED' });
    expect(request).not.toHaveBeenCalled();
    expect(store.all('SELECT id FROM outbox')).toHaveLength(0);
  });

  it('persists an encrypted frozen message and a stable key, then returns the old accepted receipt', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(response({ id: 'resend-accepted-id' }));
    const { task, approvals, mail, approve, store, settings } = fixture(request);
    const pending = mail.send(task.id, 'call-1', draft, new AbortController().signal);
    approve();
    expect(await pending).toEqual({ status: 'accepted', provider: 'resend', id: 'resend-accepted-id', from: RESEND_FROM, to: draft.to, subject: draft.subject });
    expect(request).toHaveBeenCalledTimes(1);
    const [url, init] = request.mock.calls[0];
    expect(String(url)).toBe('https://api.resend.com/emails');
    expect(init!.method).toBe('POST');
    expect(init!.headers).toMatchObject({ Authorization: 'Bearer fake-test-key', 'Content-Type': 'application/json' });
    expect(JSON.parse(init!.body as string)).toEqual({ from: RESEND_FROM, ...draft });
    const row = store.get<{ id: string; status: string; context_ref: string; recipient: string; payload_json: string }>("SELECT id,status,context_ref,recipient,payload_json FROM outbox WHERE channel='resend'")!;
    expect(row.status).toBe('accepted');
    expect(row.context_ref).toBe('resend-accepted-id');
    expect(row.recipient).toBe('single-recipient');
    expect((init!.headers as Record<string, string>)['Idempotency-Key']).toBe(row.id);
    expect(row.payload_json).not.toContain(draft.text);
    expect(row.payload_json).not.toContain(draft.to);
    expect(settings.get(`email:outbox:${row.id}`, null)).toEqual({ from: RESEND_FROM, ...draft });
    expect(store.get<{ value: string }>('SELECT value FROM settings WHERE key=?', `email:outbox:${row.id}`)!.value).not.toContain(draft.text);

    const again = await mail.send(task.id, 'call-2', draft, new AbortController().signal);
    expect(again.id).toBe('resend-accepted-id');
    expect(request).toHaveBeenCalledTimes(1);
    expect(approvals.list(task.id)).toHaveLength(1);
  });

  it('blocks a second call while the first request is in flight', async () => {
    let resolveRequest!: (value: Response) => void;
    const request = vi.fn<typeof fetch>().mockImplementation(() => new Promise<Response>(resolve => { resolveRequest = resolve; }));
    const { task, mail, approve, store } = fixture(request);
    const pending = mail.send(task.id, 'call-1', draft, new AbortController().signal);
    approve();
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    await expect(mail.send(task.id, 'call-2', draft, new AbortController().signal)).rejects.toMatchObject({ code: 'EMAIL_SEND_UNKNOWN' });
    expect(store.get<{ status: string }>("SELECT status FROM outbox WHERE channel='resend'")?.status).toBe('sending');
    resolveRequest(response({ id: 'accepted-after-wait' }));
    expect((await pending).id).toBe('accepted-after-wait');
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('marks an uncertain network result and never repeats the POST', async () => {
    const request = vi.fn<typeof fetch>().mockRejectedValue(new Error('connection dropped'));
    const { task, mail, approve, store, approvals } = fixture(request);
    const pending = mail.send(task.id, 'call-1', draft, new AbortController().signal);
    approve();
    await expect(pending).rejects.toMatchObject({ code: 'EMAIL_SEND_UNKNOWN' });
    expect(store.get<{ status: string }>("SELECT status FROM outbox WHERE channel='resend'")?.status).toBe('unknown');
    await expect(mail.send(task.id, 'call-2', draft, new AbortController().signal)).rejects.toMatchObject({ code: 'EMAIL_SEND_UNKNOWN' });
    expect(request).toHaveBeenCalledTimes(1);
    expect(approvals.list(task.id)).toHaveLength(1);
  });

  it.each([400, 401, 403, 422, 429])('persists a definite HTTP %i rejection as failed without exposing its body', async status => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(response({ error: 'secret-provider-body' }, status));
    const { task, mail, approve, store, approvals } = fixture(request);
    const pending = mail.send(task.id, 'call-1', draft, new AbortController().signal);
    approve();
    const error = await pending.then(
      () => { throw new Error('expected Resend rejection'); },
      (value: unknown) => value as Error & { code: string },
    );
    expect(error.code).toBe('EMAIL_SEND_REJECTED');
    expect(error.message).toMatch(/明确拒绝/);
    expect(error.message).not.toContain('secret-provider-body');
    const row = store.get<{ status: string; error: string }>("SELECT status,error FROM outbox WHERE channel='resend'")!;
    expect(row.status).toBe('failed');
    expect(row.error).not.toContain('secret-provider-body');
    await expect(mail.send(task.id, 'call-1', draft, new AbortController().signal)).rejects.toMatchObject({ code: 'EMAIL_SEND_REJECTED' });
    expect(request).toHaveBeenCalledTimes(1);
    expect(approvals.list(task.id)).toHaveLength(1);
  });

  it('requires a new approval and idempotency key after a failed attempt in the same task', async () => {
    const request = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(response({ error: 'invalid credential' }, 401))
      .mockResolvedValueOnce(response({ id: 'accepted-after-correction' }));
    const { task, mail, approve, store, settings, approvals } = fixture(request);
    const first = mail.send(task.id, 'call-1', draft, new AbortController().signal);
    approve();
    await expect(first).rejects.toMatchObject({ code: 'EMAIL_SEND_REJECTED' });
    settings.set('integration:resend', { config: { enabled: true, apiKey: 'corrected-fake-key' } });
    const second = mail.send(task.id, 'call-2', draft, new AbortController().signal);
    expect(approvals.list(task.id).filter(item => item.status === 'pending')).toHaveLength(1);
    approve();
    expect((await second).id).toBe('accepted-after-correction');
    const rows = store.all<{ id: string; status: string; payload_json: string }>("SELECT id,status,payload_json FROM outbox WHERE channel='resend' ORDER BY rowid");
    expect(rows.map(row => row.status)).toEqual(['failed', 'accepted']);
    expect(rows[0].id).not.toBe(rows[1].id);
    expect(rows[0].payload_json).not.toContain(draft.text);
    expect(rows[1].payload_json).not.toContain(draft.text);
    expect((request.mock.calls[0][1]!.headers as Record<string, string>)['Idempotency-Key']).toBe(rows[0].id);
    expect((request.mock.calls[1][1]!.headers as Record<string, string>)['Idempotency-Key']).toBe(rows[1].id);
    expect(request.mock.calls[1][1]!.headers).toMatchObject({ Authorization: 'Bearer corrected-fake-key' });
    expect(approvals.list(task.id)).toHaveLength(2);
  });

  it.each([
    ['HTTP 409', response({ error: 'concurrent_idempotent_requests' }, 409)],
    ['HTTP 500', response({ error: 'temporary failure' }, 500)],
    ['missing receipt id', response({ object: 'email' })],
  ])('keeps %s uncertain and blocks a new attempt', async (_case, result) => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(result);
    const { task, mail, approve, store } = fixture(request);
    const pending = mail.send(task.id, 'call-1', draft, new AbortController().signal);
    approve();
    await expect(pending).rejects.toMatchObject({ code: 'EMAIL_SEND_UNKNOWN' });
    expect(store.get<{ status: string }>("SELECT status FROM outbox WHERE channel='resend'")?.status).toBe('unknown');
    await expect(mail.send(task.id, 'call-2', draft, new AbortController().signal)).rejects.toMatchObject({ code: 'EMAIL_SEND_UNKNOWN' });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('turns a pre-restart sending record into unknown before accepting tool calls', async () => {
    const request = vi.fn<typeof fetch>();
    const { task, store, settings, approvals } = fixture(request);
    const message = { from: RESEND_FROM, ...draft };
    const payloadHash = createHash('sha256').update(JSON.stringify(message)).digest('hex');
    const at = new Date().toISOString();
    store.run(
      'INSERT INTO outbox(id,task_id,channel,kind,recipient,payload_json,status,attempts,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
      'resend-email/restart-attempt', task.id, 'resend', `email:${payloadHash}:restart-attempt`, 'single-recipient',
      JSON.stringify({ payloadHash, toolCallId: 'old-call' }), 'sending', 1, at, at,
    );
    const recovered = createResendMailService({ store, settings, approvals, fetch: request });
    expect(store.get<{ status: string }>("SELECT status FROM outbox WHERE channel='resend'")?.status).toBe('unknown');
    await expect(recovered.send(task.id, 'new-call', draft, new AbortController().signal)).rejects.toMatchObject({ code: 'EMAIL_SEND_UNKNOWN' });
    expect(request).not.toHaveBeenCalled();
    expect(approvals.list(task.id)).toHaveLength(0);
  });

  it('rechecks configuration after approval, before reserving a send', async () => {
    const request = vi.fn<typeof fetch>();
    const { task, mail, approve, store, settings } = fixture(request);
    const pending = mail.send(task.id, 'call-1', draft, new AbortController().signal);
    settings.set('integration:resend', { config: { enabled: false, apiKey: 'fake-test-key' } });
    approve();
    await expect(pending).rejects.toMatchObject({ code: 'EMAIL_DISABLED' });
    expect(store.all('SELECT id FROM outbox')).toHaveLength(0);
    expect(request).not.toHaveBeenCalled();
  });
});
