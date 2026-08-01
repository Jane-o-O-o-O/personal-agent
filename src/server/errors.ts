export class AppError extends Error {
  constructor(public code: string, message: string, public statusCode = 400) { super(message); }
}
export function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new AppError('INVALID_INPUT', 'Invalid request');
  return value as Record<string, unknown>;
}
export function textInput(value: unknown, name: string, max = 100000): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new AppError('INVALID_INPUT', `Invalid ${name}`);
  return value.trim();
}
export function cleanError(error: unknown, secrets: string[] = []): string {
  let message = error instanceof Error ? error.message : String(error);
  for (const secret of secrets) if (secret.length >= 4) message = message.split(secret).join('[redacted]');
  return message.replace(/(Bearer\s+)[^\s"'<>]+/gi, '$1[redacted]')
    .replace(/([?&](?:key|token|api_key|access_token)=)[^&\s]+/gi, '$1[redacted]').slice(0, 2000);
}
