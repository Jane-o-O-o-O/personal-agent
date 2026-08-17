import { Request, Response } from 'express';
import {
  JSONRPCErrorCodes,
  parseMCPServerOptionsFromRequest,
  sendJsonRpcError,
  sendResponseError,
} from '../../../src/mcp-server/transport/utils';

// Mock console.error to avoid console output during tests
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('mcp-server/transport/utils', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  describe('parseMCPServerOptionsFromRequest', () => {
    it('should handle request with empty query', () => {
      const req = {
        query: {},
      } as any as Request;

      const result = parseMCPServerOptionsFromRequest(req);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
      expect(result.message).toBeUndefined();
    });

    it('should handle request with undefined query', () => {
      const req = {} as any as Request;

      const result = parseMCPServerOptionsFromRequest(req);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
      expect(result.message).toBeUndefined();
    });

    it('should return error for invalid schema', () => {
      const req = {
        query: {
          language: 'invalid-language', // 无效的语言值
        },
      } as any as Request;

      const result = parseMCPServerOptionsFromRequest(req);

      expect(result.success).toBe(false);
      expect(result.data).toEqual({});
      expect(result.message).toBeDefined();
      expect(result.message).toContain('Invalid enum value');
    });
  });

  describe('sendJsonRpcError', () => {
    let mockRes: Partial<Response>;

    beforeEach(() => {
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        headersSent: false,
      } as any;
    });

    it('should send JSON RPC error with default parameters', () => {
      const error = new Error('Test error');

      sendJsonRpcError(mockRes as Response, error);

      expect(mockConsoleError).toHaveBeenCalledWith(error);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        jsonrpc: '2.0',
        error: {
          code: JSONRPCErrorCodes.INTERNAL_ERROR,
          message: 'Test error',
        },
        id: null,
      });
    });

    it('should send JSON RPC error with custom parameters', () => {
      const error = new Error('Custom error');
      const httpCode = 400;
      const code = JSONRPCErrorCodes.INVALID_REQUEST;
      const id = 123;

      sendJsonRpcError(mockRes as Response, error, httpCode, code, id);

      expect(mockConsoleError).toHaveBeenCalledWith(error);
      expect(mockRes.status).toHaveBeenCalledWith(httpCode);
      expect(mockRes.json).toHaveBeenCalledWith({
        jsonrpc: '2.0',
        error: {
          code,
          message: 'Custom error',
        },
        id,
      });
    });

    it('should not send response if headers already sent', () => {
      const error = new Error('Test error');
      mockRes.headersSent = true;

      sendJsonRpcError(mockRes as Response, error);

      expect(mockConsoleError).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('sendResponseError', () => {
    let mockRes: Partial<Response>;

    beforeEach(() => {
      mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        headersSent: false,
      } as any;
    });

    it('should send response error', () => {
      const error = new Error('Response error');

      sendResponseError(mockRes as Response, error);

      expect(mockConsoleError).toHaveBeenCalledWith(error);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith('Response error');
    });
  });
});
