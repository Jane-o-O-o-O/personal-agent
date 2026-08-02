import { describe, expect, it } from 'vitest';
import { redactText, redactValue, StreamingRedactor } from '../../src/server/redactor.js';

describe('event redaction', () => {
  it('masks overlapping literal secrets without truncating the reply', () => {
    const longReply = 'Useful result. '.repeat(1000);
    expect(redactText(`long-key/key [a.*] ${longReply}`, ['key', 'long-key', '[a.*]']))
      .toBe(`[redacted]/[redacted] [redacted] ${longReply}`);
  });

  it('masks credential fields and binary content while preserving result data and hashes', () => {
    const value = {
      data: { forecast: 'sunny', temperature: 28 }, parametersHash: 'approval-hash', tokenHash: 'opaque-hash',
      headers: { Authorization: 'Bearer secret', 'X-Api-Key': 'secret' }, context_token: 'secret',
      content: [{ type: 'image', data: 'BASE64', mimeType: 'image/png' }, { type: 'text', text: 'value is secret' }],
      resource: { blob: 'BASE64', mimeType: 'application/pdf' },
    };
    expect(redactValue(value, ['secret'])).toEqual({
      data: { forecast: 'sunny', temperature: 28 }, parametersHash: 'approval-hash', tokenHash: 'opaque-hash',
      headers: { Authorization: '[redacted]', 'X-Api-Key': '[redacted]' }, context_token: '[redacted]',
      content: [{ type: 'image', data: '[binary omitted]', mimeType: 'image/png' }, { type: 'text', text: 'value is [redacted]' }],
      resource: { blob: '[binary omitted]', mimeType: 'application/pdf' },
    });
    expect(value.headers.Authorization).toBe('Bearer secret');
  });

  it('protects query credentials and bearer tokens and supports circular tool results', () => {
    expect(redactText('Bearer unknown-token https://api.example/query?key=unknown-key&date=2026-10-03'))
      .toBe('Bearer [redacted] https://api.example/query?key=[redacted]&date=2026-10-03');
    const value: Record<string, unknown> = { bytes: Buffer.from('private'), ok: true };
    value.self = value;
    expect(redactValue(value)).toEqual({ bytes: '[binary omitted]', ok: true, self: '[circular]' });
  });

  it('holds the longest secret suffix and flushes ordinary text at completion', () => {
    const redactor = new StreamingRedactor({ secrets: ['long-key'] });
    expect(redactor.push('abcdefghijk')).toBe('abcd');
    expect(redactor.finish()).toBe('efghijk');
    expect(redactor.finish()).toBe('');
    expect(() => redactor.push('late')).toThrow('finished');
  });

  it('never emits a known credential across any split or single-character chunks', () => {
    const secret = 'private-key-123456789';
    const text = `Before ${secret} middle ${secret} after.`;
    const expected = 'Before [redacted] middle [redacted] after.';
    for (let split = 0; split <= text.length; split++) {
      const redactor = new StreamingRedactor({ secrets: [secret, 'private-key'] });
      const chunks = [redactor.push(text.slice(0, split)), redactor.push(text.slice(split)), redactor.finish()];
      expect(chunks.join('')).toBe(expected);
      expect(chunks.join('')).not.toContain(secret);
    }
    const redactor = new StreamingRedactor({ secrets: [secret] });
    const chunks = [...text].map(character => redactor.push(character));
    chunks.push(redactor.finish());
    expect(chunks.join('')).toBe(expected);
  });

  it('masks unknown bearer and URL tokens split inside both their labels and values', () => {
    const text = 'Bearer unlisted-token https://api.example/query?api_key=unlisted-key&day=today';
    const expected = 'Bearer [redacted] https://api.example/query?api_key=[redacted]&day=today';
    for (let split = 0; split <= text.length; split++) {
      const redactor = new StreamingRedactor({ secrets: [] });
      const result = redactor.push(text.slice(0, split)) + redactor.push(text.slice(split)) + redactor.finish();
      expect(result).toBe(expected);
    }
    const redactor = new StreamingRedactor({ secrets: [] });
    expect([...text].map(character => redactor.push(character)).join('') + redactor.finish()).toBe(expected);
  });
});
