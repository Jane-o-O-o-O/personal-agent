export type QueryErrorCode = 'needs_configuration' | 'disabled' | 'unauthorized' | 'quota_exceeded' | 'invalid_parameters' | 'upstream_unavailable' | 'timeout' | 'cancelled' | 'unsupported' | 'invalid_response';
export class QueryError extends Error {
  constructor(public code: QueryErrorCode, message: string, public retryable = false, public upstreamCode?: string) { super(message); }
}

export type FetchLike = typeof fetch;

export async function requestJson(url: URL | string, options: RequestInit = {}, signal?: AbortSignal, timeoutMs = 15000, request: FetchLike = fetch): Promise<{ data: any; response: Response }> {
  if (signal?.aborted) throw new QueryError('cancelled', '查询已取消。');
  const abort = signal ? AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs);
  let response: Response; let raw: string;
  try { response = await request(url, { ...options, signal: abort }); raw = await response.text(); }
  catch {
    if (signal?.aborted) throw new QueryError('cancelled', '查询已取消。');
    if (abort.aborted) throw new QueryError('timeout', '查询超时，请稍后重试。', true);
    throw new QueryError('upstream_unavailable', '无法连接查询服务。', true);
  }
  let data: any;
  try { data = JSON.parse(raw); }
  catch {
    if (!response.ok) throw statusError(response.status);
    throw new QueryError('invalid_response', '查询服务返回了无法解析的响应。', true);
  }
  if (!response.ok) {
    const error = statusError(response.status);
    const upstreamCode = typeof data?.error?.type === 'string' ? data.error.type.split('#').pop() : typeof data?.code === 'string' ? data.code : undefined;
    if (upstreamCode) error.upstreamCode = upstreamCode;
    if (['no-credit', 'over-monthly-limit', 'NO_CREDIT', 'OVER_MONTHLY_LIMIT'].includes(upstreamCode)) { error.code = 'quota_exceeded'; error.retryable = false; }
    throw error;
  }
  return { data, response };
}

function statusError(status: number) {
  if (status === 401 || status === 403) return new QueryError('unauthorized', '查询服务拒绝了凭据、权限或账户额度，请检查配置。', false, String(status));
  if (status === 429) return new QueryError('quota_exceeded', '查询服务限流或额度不足，请稍后重试并检查账户额度。', true, String(status));
  if (status === 400 || status === 404 || status === 422) return new QueryError('invalid_parameters', '查询服务不接受当前参数。', false, String(status));
  return new QueryError('upstream_unavailable', `查询服务暂时不可用（HTTP ${status}）。`, status >= 500, String(status));
}

export function assertObject(value: unknown): asserts value is Record<string, any> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new QueryError('invalid_response', '查询服务返回的数据结构不正确。');
}
