export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export async function api<T>(path: string, options?: { method?: string; body?: unknown; signal?: AbortSignal }): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method: options?.method ?? 'GET',
    credentials: 'same-origin',
    headers: options?.body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: options?.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options?.signal,
  });
  let value: unknown;
  const text = await response.text();
  try { value = text ? JSON.parse(text) : null; } catch { value = null; }
  if (!response.ok) {
    const error = value as { error?: { code?: string; message?: string } } | null;
    if (response.status === 401) window.dispatchEvent(new Event('agent:unauthorized'));
    throw new ApiError(response.status, error?.error?.code ?? 'REQUEST_FAILED', error?.error?.message ?? `请求失败 (${response.status})`);
  }
  if (text && value === null) throw new ApiError(response.status, 'INVALID_RESPONSE', '服务器返回了无效数据');
  return value as T;
}

export function requestId(): string { return crypto.randomUUID(); }
export function errorMessage(error: unknown): string { return error instanceof Error ? error.message : '请求失败'; }
