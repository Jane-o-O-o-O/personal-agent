/**
 * DingTalk Calendar MCP Server Type Definitions
 */
export interface MCPTool {
    name: string;
    description: string;
    args?: MCPArg[];
    requestTemplate: RequestTemplate;
}
export interface MCPArg {
    name: string;
    type: string;
    description: string;
    required?: boolean;
    position?: 'body' | 'query' | 'path' | 'header';
    items?: {
        type: string;
    };
}
export interface RequestTemplate {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
    headers?: HeaderTemplate[];
}
export interface HeaderTemplate {
    key: string;
    value: string;
}
export interface TokenCacheData {
    access_token: string;
    expires_in: number;
    expires_at: number;
    created_at: number;
    app_id?: string | undefined;
}
export interface DingTalkTokenResponse {
    errcode: number;
    errmsg?: string;
    access_token: string;
    expires_in: number;
}
export interface ToolExecutionResult {
    content: Array<{
        type: 'text';
        text: string;
    }>;
    isError?: boolean;
}
export interface MCPServerConfig {
    name: string;
    version: string;
}
export interface MCPServerCapabilities {
    capabilities: {
        tools: Record<string, any>;
    };
}
export interface MCPToolSchema {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, any>;
        required: string[];
    };
}
//# sourceMappingURL=types.d.ts.map