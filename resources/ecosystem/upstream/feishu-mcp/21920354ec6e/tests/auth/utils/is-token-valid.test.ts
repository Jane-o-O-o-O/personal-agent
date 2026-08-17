import { isTokenValid, isTokenExpired } from '../../../src/auth/utils/is-token-valid';
import { authStore } from '../../../src/auth/store';
import { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';

// Mock token store
jest.mock('../../../src/auth/store', () => ({
  authStore: {
    getToken: jest.fn(),
  },
}));

describe('isTokenValid', () => {
  const mockauthStore = authStore as jest.Mocked<typeof authStore>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset Date.now to a fixed timestamp for consistent testing
    jest.spyOn(Date, 'now').mockReturnValue(1000000 * 1000); // 1000000 seconds in milliseconds
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('应该在没有accessToken时返回invalid', async () => {
    const result = await isTokenValid();

    expect(result).toEqual({
      valid: false,
      isExpired: false,
      token: undefined,
    });
    expect(mockauthStore.getToken).not.toHaveBeenCalled();
  });

  it('应该在传入空字符串时返回invalid', async () => {
    const result = await isTokenValid('');

    expect(result).toEqual({
      valid: false,
      isExpired: false,
      token: undefined,
    });
    expect(mockauthStore.getToken).not.toHaveBeenCalled();
  });

  it('应该在token不存在时返回invalid', async () => {
    mockauthStore.getToken.mockResolvedValue(undefined);

    const result = await isTokenValid('non-existent-token');

    expect(result).toEqual({
      valid: false,
      isExpired: false,
      token: undefined,
    });
    expect(mockauthStore.getToken).toHaveBeenCalledWith('non-existent-token');
  });

  it('应该在token已过期时返回expired', async () => {
    const expiredToken: AuthInfo = {
      token: 'expired-token',
      clientId: 'test-client',
      scopes: ['test-scope'],
      expiresAt: 999999, // Before current time (1000000)
    };

    mockauthStore.getToken.mockResolvedValue(expiredToken);

    const result = await isTokenValid('expired-token');

    expect(result).toEqual({
      valid: false,
      isExpired: true,
      token: expiredToken,
    });
    expect(mockauthStore.getToken).toHaveBeenCalledWith('expired-token');
  });

  it('应该在token有效时返回valid', async () => {
    const validToken: AuthInfo = {
      token: 'valid-token',
      clientId: 'test-client',
      scopes: ['test-scope'],
      expiresAt: 1000001, // After current time (1000000)
    };

    mockauthStore.getToken.mockResolvedValue(validToken);

    const result = await isTokenValid('valid-token');

    expect(result).toEqual({
      valid: true,
      isExpired: false,
      token: validToken,
    });
    expect(mockauthStore.getToken).toHaveBeenCalledWith('valid-token');
  });

  it('应该在token没有过期时间时返回valid', async () => {
    const tokenWithoutExpiry: AuthInfo = {
      token: 'no-expiry-token',
      clientId: 'test-client',
      scopes: ['test-scope'],
      // No expiresAt field
    };

    mockauthStore.getToken.mockResolvedValue(tokenWithoutExpiry);

    const result = await isTokenValid('no-expiry-token');

    expect(result).toEqual({
      valid: true,
      isExpired: false,
      token: tokenWithoutExpiry,
    });
    expect(mockauthStore.getToken).toHaveBeenCalledWith('no-expiry-token');
  });
});

describe('isTokenExpired', () => {
  beforeEach(() => {
    // Reset Date.now to a fixed timestamp for consistent testing
    jest.spyOn(Date, 'now').mockReturnValue(1000000 * 1000); // 1000000 seconds in milliseconds
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('应该在token为undefined时返回false', () => {
    const result = isTokenExpired(undefined);
    expect(result).toBe(false);
  });

  it('应该在token没有过期时间时返回false', () => {
    const token: AuthInfo = {
      token: 'test-token',
      clientId: 'test-client',
      scopes: ['test-scope'],
      // No expiresAt field
    };

    const result = isTokenExpired(token);
    expect(result).toBe(false);
  });

  it('应该在token已过期时返回true', () => {
    const expiredToken: AuthInfo = {
      token: 'expired-token',
      clientId: 'test-client',
      scopes: ['test-scope'],
      expiresAt: 999999, // Before current time (1000000)
    };

    const result = isTokenExpired(expiredToken);
    expect(result).toBe(true);
  });

  it('应该在token未过期时返回false', () => {
    const validToken: AuthInfo = {
      token: 'valid-token',
      clientId: 'test-client',
      scopes: ['test-scope'],
      expiresAt: 1000001, // After current time (1000000)
    };

    const result = isTokenExpired(validToken);
    expect(result).toBe(false);
  });

  it('应该在token正好在过期时间时返回false（边界情况）', () => {
    const tokenAtExpiry: AuthInfo = {
      token: 'at-expiry-token',
      clientId: 'test-client',
      scopes: ['test-scope'],
      expiresAt: 1000000, // Exactly at current time
    };

    const result = isTokenExpired(tokenAtExpiry);
    expect(result).toBe(false);
  });
});
