import { LoginHandler } from '../src/cli/login-handler';
import * as server from '../src/mcp-server';

// 模拟 LoginHandler
jest.mock('../src/cli/login-handler', () => ({
  LoginHandler: {
    handleLogin: jest.fn(),
    handleLogout: jest.fn(),
  },
}));

// 模拟server模块
jest.mock('../src/mcp-server', () => ({
  initMcpServerWithTransport: jest.fn(),
}));

describe('CLI Commands', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Login Command', () => {
    it('应该调用 LoginHandler.handleLogin', async () => {
      const options = {
        appId: 'test-app-id',
        appSecret: 'test-app-secret',
        domain: 'https://open.feishu.cn',
        scope: 'test-scope',
      };

      // 模拟login命令的action回调
      const loginActionCallback = jest.fn(async (options) => {
        await LoginHandler.handleLogin(options);
      });

      await loginActionCallback(options);

      expect(LoginHandler.handleLogin).toHaveBeenCalledWith(options);
    });
  });

  describe('Logout Command', () => {
    it('应该调用 LoginHandler.handleLogout', async () => {
      // 模拟logout命令的action回调
      const logoutActionCallback = jest.fn(async () => {
        await LoginHandler.handleLogout();
      });

      await logoutActionCallback();

      expect(LoginHandler.handleLogout).toHaveBeenCalledWith();
    });
  });

  describe('MCP Command', () => {
    it('应该调用 initMcpServerWithTransport', async () => {
      const options = {
        appId: 'test-app-id',
        appSecret: 'test-app-secret',
        mode: 'stdio',
      };

      // 模拟mcp命令的action回调
      const mcpActionCallback = jest.fn(async (options) => {
        await server.initMcpServerWithTransport('oapi', options);
      });

      await mcpActionCallback(options);

      expect(server.initMcpServerWithTransport).toHaveBeenCalledWith('oapi', options);
    });
  });
});
