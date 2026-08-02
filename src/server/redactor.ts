const replacement = '[redacted]';
const omittedBinary = '[binary omitted]';
const secretFields = new Set([
  'apikey', 'authorization', 'token', 'accesstoken', 'refreshtoken', 'contexttoken',
  'password', 'clientsecret', 'secret', 'credentials', 'cookie', 'setcookie', 'bottoken',
  'xapikey',
]);
const queryFields = ['key', 'token', 'api_key', 'apikey', 'api-key', 'access_token', 'refresh_token', 'context_token'];
const queryNames = queryFields.join('|');
const genericPattern = () => new RegExp(`(Bearer\\s+)([^\\s"'<>]+)|([?&](?:${queryNames})=)([^&#\\s"'<>]+)`, 'gi');
const genericPrefixes = ['bearer ', ...queryFields.flatMap(name => [`?${name}=`, `&${name}=`])];

function knownSecrets(secrets: readonly string[]): string[] {
  return [...new Set(secrets.filter(secret => typeof secret === 'string' && secret.length > 0))]
    .sort((left, right) => right.length - left.length);
}

function exactPattern(secrets: readonly string[]): RegExp | undefined {
  if (!secrets.length) return undefined;
  return new RegExp(secrets.map(secret => secret.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
}

export function redactText(text: string, secrets: readonly string[] = []): string {
  const exact = exactPattern(knownSecrets(secrets));
  const masked = exact ? text.replace(exact, replacement) : text;
  return masked.replace(genericPattern(), (_match, bearer: string | undefined, _token: string | undefined, query: string | undefined) => `${bearer ?? query}${replacement}`);
}

export function redactValue(value: unknown, secrets: readonly string[] = []): unknown {
  const seen = new WeakSet<object>();
  const walk = (item: unknown): unknown => {
    if (typeof item === 'string') return redactText(item, secrets);
    if (typeof item === 'bigint') return String(item);
    if (!item || typeof item !== 'object') return item;
    if (ArrayBuffer.isView(item) || item instanceof ArrayBuffer) return omittedBinary;
    if (item instanceof Date) return item.toISOString();
    if (seen.has(item)) return '[circular]';
    seen.add(item);
    try {
      if (Array.isArray(item)) return item.map(walk);
      const record = item as Record<string, unknown>;
      const binary = ['image', 'frame', 'audio', 'video'].includes(String(record.type)) || record.encoding === 'base64' ||
        (typeof record.mimeType === 'string' && /^(image|audio|video)\/|^application\/octet-stream(?:;|$)/i.test(record.mimeType));
      return Object.fromEntries(Object.entries(record).map(([key, entry]) => {
        const normalized = key.replace(/[-_]/g, '').toLowerCase();
        if (secretFields.has(normalized)) return [key, replacement];
        if ((key === 'blob' || (key === 'data' && binary)) && typeof entry === 'string') return [key, omittedBinary];
        return [key, walk(entry)];
      }));
    } finally { seen.delete(item); }
  };
  return walk(value);
}

export class StreamingRedactor {
  private pending = '';
  private finished = false;
  private skippingToken: 'bearer' | 'query' | undefined;
  private readonly holdback: number;
  private readonly exact: RegExp | undefined;
  private readonly generic = genericPattern();

  constructor(options: { secrets: readonly string[] }) {
    const secrets = knownSecrets(options.secrets);
    this.holdback = Math.max(0, (secrets[0]?.length ?? 1) - 1);
    this.exact = exactPattern(secrets);
  }

  push(delta: string): string {
    if (this.finished) throw new Error('Cannot append to a finished redactor.');
    this.pending += delta;
    return this.drain(false);
  }

  finish(): string {
    if (this.finished) return '';
    this.finished = true;
    return this.drain(true);
  }

  private drain(final: boolean): string {
    if (this.skippingToken) {
      const boundary = this.pending.search(this.skippingToken === 'bearer' ? /[\s"'<>]/ : /[&#\s"'<>]/);
      if (boundary < 0) { this.pending = ''; return ''; }
      this.pending = this.pending.slice(boundary);
      this.skippingToken = undefined;
    }
    let limit = final ? this.pending.length : Math.max(0, this.pending.length - this.holdback);
    if (!final) {
      // A label may itself be divided between chunks before its token is visible.
      const lower = this.pending.toLowerCase();
      for (const prefix of genericPrefixes) {
        for (let length = Math.min(prefix.length, lower.length); length > 0; length--) {
          if (lower.endsWith(prefix.slice(0, length))) { limit = Math.min(limit, lower.length - length); break; }
        }
      }
      const bearer = /Bearer\s*$/i.exec(this.pending);
      if (bearer) limit = Math.min(limit, bearer.index);
    }
    const output: string[] = [];
    let cursor = 0;
    while (cursor < limit) {
      if (this.exact) this.exact.lastIndex = cursor;
      this.generic.lastIndex = cursor;
      const exact = this.exact?.exec(this.pending);
      const generic = this.generic.exec(this.pending);
      const match = exact && (!generic || exact.index <= generic.index) ? exact : generic;
      if (!match || match.index >= limit) break;
      output.push(this.pending.slice(cursor, match.index));
      if (match === exact) output.push(replacement);
      else {
        output.push(`${match[1] ?? match[3]}${replacement}`);
        if (!final && match.index + match[0].length === this.pending.length)
          this.skippingToken = match[1] ? 'bearer' : 'query';
      }
      cursor = match.index + match[0].length;
    }
    if (cursor < limit) { output.push(this.pending.slice(cursor, limit)); cursor = limit; }
    this.pending = this.pending.slice(cursor);
    return output.join('');
  }
}
