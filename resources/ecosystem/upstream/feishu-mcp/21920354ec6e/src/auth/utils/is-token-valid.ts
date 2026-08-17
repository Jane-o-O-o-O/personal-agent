import { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import { authStore } from '../store';

export async function isTokenValid(
  accessToken?: string,
): Promise<{ valid: boolean; isExpired: boolean; token: AuthInfo | undefined }> {
  if (!accessToken) {
    return { valid: false, isExpired: false, token: undefined };
  }
  const token = await authStore.getToken(accessToken);
  if (!token) {
    return { valid: false, isExpired: false, token: undefined };
  }
  const isExpired = isTokenExpired(token);
  if (isExpired) {
    return { valid: false, isExpired: true, token };
  }
  return { valid: true, isExpired: false, token };
}

export function isTokenExpired(token?: AuthInfo) {
  if (!token) {
    return false;
  }
  if (token.expiresAt && token.expiresAt < Date.now() / 1000) {
    return true;
  }
  return false;
}
