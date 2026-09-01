export declare class DingTalkMCPServer {
    private server;
    private accessToken;
    private readonly appId;
    private readonly appSecret;
    private readonly tokenCacheFile;
    private tokenCacheData;
    private tools;
    constructor();
    private loadConfig;
    /**
     * 加载本地缓存的access_token
     */
    private loadTokenCache;
    /**
     * 检查token缓存是否有效（未过期）
     */
    private isTokenCacheValid;
    /**
     * 保存access_token到本地缓存
     */
    private saveTokenCache;
    /**
     * 清除token缓存
     */
    private clearTokenCache;
    /**
     * 获取有效的access_token（优先使用缓存）
     */
    private getValidAccessToken;
    private refreshAccessToken;
    private setupHandlers;
    private generateSchema;
    private executeTool;
    private buildUrl;
    private buildHeaders;
    private processMultiParam;
    private buildBody;
    run(): Promise<void>;
}
//# sourceMappingURL=DingTalkMCPServer.d.ts.map