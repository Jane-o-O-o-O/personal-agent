import { USER_AGENT, OAPI_MCP_DEFAULT_ARGS, OAPI_MCP_ENV_ARGS } from '../../src/utils/constants';
import { currentVersion } from '../../src/utils/version';

// Mock environment variables
const originalEnv = process.env;

describe('Constants', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('USER_AGENT', () => {
    it('should include the current version', () => {
      expect(USER_AGENT).toBe(`oapi-sdk-mcp/${currentVersion}`);
    });
  });

  describe('OAPI_MCP_DEFAULT_ARGS', () => {
    it('should have correct default values', () => {
      expect(OAPI_MCP_DEFAULT_ARGS).toEqual({
        domain: 'https://open.feishu.cn',
        toolNameCase: 'snake',
        language: 'en',
        tokenMode: 'auto',
        mode: 'stdio',
        host: 'localhost',
        port: '3000',
      });
    });
  });

  describe('OAPI_MCP_ENV_ARGS', () => {
    it('should be empty when no environment variables are set', () => {
      // Clear environment variables
      delete process.env.APP_ID;
      delete process.env.APP_SECRET;
      delete process.env.USER_ACCESS_TOKEN;
      delete process.env.LARK_TOKEN_MODE;
      delete process.env.LARK_TOOLS;
      delete process.env.LARK_DOMAIN;

      // Re-require the module to get fresh environment
      jest.resetModules();
      const { OAPI_MCP_ENV_ARGS: freshEnvArgs } = require('../../src/utils/constants');

      expect(freshEnvArgs).toEqual({});
    });

    it('should include environment variables when they are set', () => {
      process.env.APP_ID = 'test-app-id';
      process.env.APP_SECRET = 'test-app-secret';
      process.env.USER_ACCESS_TOKEN = 'test-user-token';
      process.env.LARK_TOKEN_MODE = 'manual';
      process.env.LARK_TOOLS = 'tool1,tool2';
      process.env.LARK_DOMAIN = 'https://custom.domain.com';

      jest.resetModules();
      const { OAPI_MCP_ENV_ARGS: freshEnvArgs } = require('../../src/utils/constants');

      expect(freshEnvArgs).toEqual({
        appId: 'test-app-id',
        appSecret: 'test-app-secret',
        userAccessToken: 'test-user-token',
        tokenMode: 'manual',
        tools: 'tool1,tool2',
        domain: 'https://custom.domain.com',
      });
    });

    it('should filter out empty string environment variables', () => {
      process.env.APP_ID = 'valid-id';
      process.env.APP_SECRET = '';
      process.env.USER_ACCESS_TOKEN = undefined;

      jest.resetModules();
      const { OAPI_MCP_ENV_ARGS: freshEnvArgs } = require('../../src/utils/constants');

      // Should only include valid non-empty values
      expect(freshEnvArgs).toEqual({
        appId: 'valid-id',
      });
      expect(freshEnvArgs).not.toHaveProperty('appSecret');
      expect(freshEnvArgs).not.toHaveProperty('userAccessToken');
    });
  });
});
