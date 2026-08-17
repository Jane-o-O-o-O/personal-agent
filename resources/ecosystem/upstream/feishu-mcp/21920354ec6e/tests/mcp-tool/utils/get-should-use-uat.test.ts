import { getShouldUseUAT } from '../../../src/mcp-tool/utils/get-should-use-uat';
import { TokenMode } from '../../../src/mcp-tool/types';

describe('getShouldUseUAT', () => {
  describe('USER_ACCESS_TOKEN 模式', () => {
    it('当有 userAccessToken 时应返回 true', () => {
      expect(getShouldUseUAT(TokenMode.USER_ACCESS_TOKEN, false)).toBe(true);
      expect(getShouldUseUAT(TokenMode.USER_ACCESS_TOKEN, true)).toBe(true);
    });

    it('当没有 userAccessToken 时应返回 true', () => {
      expect(getShouldUseUAT(TokenMode.USER_ACCESS_TOKEN, false)).toBe(true);
      expect(getShouldUseUAT(TokenMode.USER_ACCESS_TOKEN, true)).toBe(true);
    });
  });

  describe('TENANT_ACCESS_TOKEN 模式', () => {
    it('无论参数如何都应返回 false', () => {
      expect(getShouldUseUAT(TokenMode.TENANT_ACCESS_TOKEN, false)).toBe(false);
      expect(getShouldUseUAT(TokenMode.TENANT_ACCESS_TOKEN, true)).toBe(false);
      expect(getShouldUseUAT(TokenMode.TENANT_ACCESS_TOKEN, false)).toBe(false);
      expect(getShouldUseUAT(TokenMode.TENANT_ACCESS_TOKEN, true)).toBe(false);
    });
  });

  describe('AUTO 模式', () => {
    it('应该直接返回 useUAT 参数的值', () => {
      expect(getShouldUseUAT(TokenMode.AUTO, true)).toBe(true);
      expect(getShouldUseUAT(TokenMode.AUTO, true)).toBe(true);
      expect(getShouldUseUAT(TokenMode.AUTO, false)).toBe(false);
      expect(getShouldUseUAT(TokenMode.AUTO, false)).toBe(false);
    });

    it('当 useUAT 为 undefined 时应返回 undefined', () => {
      expect(getShouldUseUAT(TokenMode.AUTO, undefined)).toBe(undefined);
      expect(getShouldUseUAT(TokenMode.AUTO, undefined)).toBe(undefined);
    });
  });
});
