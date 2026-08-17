import { Request, Response } from 'express';
import { McpServerOptions, mcpServerOptionSchema } from '../shared';

export enum JSONRPCErrorCodes {
  PARSE_ERROR = -32700,
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603,
}

export function parseMCPServerOptionsFromRequest(req: Request): {
  data: McpServerOptions;
  success: boolean;
  message?: string;
} {
  const result = mcpServerOptionSchema.safeParse(req.query || {});
  if (!result.success) {
    return { data: {}, success: false, message: result.error.message };
  }
  return { data: result.data as McpServerOptions, success: true };
}

export function sendJsonRpcError(
  res: Response,
  error: Error,
  httpCode = 500,
  code = JSONRPCErrorCodes.INTERNAL_ERROR,
  id: number | null = null,
) {
  console.error(error);
  if (!res.headersSent) {
    res.status(httpCode).json({ jsonrpc: '2.0', error: { code, message: error.message }, id });
  }
}

export function sendResponseError(res: Response, error: Error, httpCode = 500): void {
  console.error(error);
  if (!res.headersSent) {
    res.status(httpCode).send(error.message);
  }
}
