import {Server} from '@modelcontextprotocol/sdk/server/index.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {CallToolRequestSchema, ListToolsRequestSchema} from '@modelcontextprotocol/sdk/types.js';
import {ServiceWindowMessageBuilder} from './utils/messageBuilder.js'
import {LogMessageBuilder} from './utils/logBuilder.js'
import {LocalTools} from './utils/localTools.js'
import axios from 'axios';
import * as yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {ifError} from "node:assert";
import {resolveObjectURL} from "node:buffer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



export class DingTalkMCPServer {
    constructor() {
        this.accessToken = null;
        this.tokenCacheData = null;
        this.tools = [];

        this.accessToken = process.env.DINGTALK_ACCESS_TOKEN || null;
        this.appId = process.env.DINGTALK_Client_ID;
        this.appSecret = process.env.DINGTALK_Client_Secret;
        this.debug = process.env.DEBUG;
        // Token缓存配置
        this.tokenCacheFile = path.join(__dirname, '..', '.dingtalk_token_cache.json');
        this.loadConfig(path.join(__dirname, '..'));
        // 测试状态
        if (process.env.STAGING) {
            this.loadConfig(path.join(__dirname, '../staging'));
        }
        this.server = new Server({
            name: 'Dingtalk MCP Server',
            description: "Dingtalk MCP Server, inclued tasks, contacts, calendar, robot etc.",
            version: '1.0.0',
            capabilities: {
                tools: {},
            },
        });
        this.loadTokenCache();
        this.setupHandlers();
    }

    loadConfig(dirname) {
        try {
            //激活的profile
            const profiles = process.env.ACTIVE_PROFILES;
            let profiles_list = [];
            if (profiles) {
                profiles_list = profiles.split(',');
            }

            const configDir = path.join(dirname);
            fs.readdirSync(configDir).forEach(
                (file) => {
                    if (file.endsWith('mcp_server.yaml')) {
                        console.error("found mcp config file:", file);

                        const configContent = fs.readFileSync(path.join(configDir, file), 'utf8');
                        const config = yaml.load(configContent);
                        if (!config) {
                            throw new Error('Config is empty');
                        }
                        if (profiles_list.includes("ALL") || profiles_list.includes(config.server.name) || (profiles_list.length == 0 && config.server.default_active)) {

                            (config.tools || []).forEach(tool => {
                                if (this.tools.includes(tool.name)) {
                                    throw new Error('Dulipict tool name: ' + tool.name);
                                }
                                this.tools.push(tool);
                            });

                        }

                    }

                }
            );

            if (this.tools && this.tools.length > 0) {
                console.error(`Loaded ${this.tools.length} tools from config`);
                console.error(`Tools:\r\n${this.tools.map(t => t.name + ', ' + t.description).join('\r\n')}`);
            }
        } catch (error) {
            const err = error;
            console.error('Failed to load config:', err.message);
            this.tools = [];
            throw error;
        }
    }

    /**
     * 加载本地缓存的access_token
     */
    loadTokenCache() {
        try {
            if (fs.existsSync(this.tokenCacheFile)) {
                const cacheContent = fs.readFileSync(this.tokenCacheFile, 'utf8');
                const cacheData = JSON.parse(cacheContent);
                // 检查缓存是否有效
                if (this.isTokenCacheValid(cacheData)) {
                    this.tokenCacheData = cacheData;
                    this.accessToken = cacheData.access_token;
                    console.error('Loaded valid access token from cache');
                    console.error(`Token expires at: ${new Date(cacheData.expires_at).toISOString()}`);
                } else {
                    console.error('Cached token expired, will refresh when needed');
                    this.clearTokenCache();
                }
            } else {
                console.error('No token cache found');
            }
        } catch (error) {
            const err = error;
            console.error('Failed to load token cache:', err.message);
            this.clearTokenCache();
        }
    }

    /**
     * 检查token缓存是否有效（未过期）
     */
    isTokenCacheValid(cacheData) {
        if (!cacheData || !cacheData.access_token || !cacheData.expires_at || cacheData.app_id !== this.appId) {
            return false;
        }
        // 提前5分钟刷新token，避免在请求过程中过期
        const bufferTime = 5 * 60 * 1000; // 5分钟
        const now = Date.now();
        return now < (cacheData.expires_at - bufferTime);
    }

    /**
     * 保存access_token到本地缓存
     */
    saveTokenCache(accessToken, expiresIn = 7200) {
        try {
            const now = Date.now();
            const expiresAt = now + (expiresIn * 1000); // 转换为毫秒
            this.tokenCacheData = {
                access_token: accessToken,
                expires_in: expiresIn,
                expires_at: expiresAt,
                created_at: now,
                app_id: this.appId
            };
            fs.writeFileSync(this.tokenCacheFile, JSON.stringify(this.tokenCacheData, null, 2));
            console.error('Access token saved to cache');
            console.error(`Token expires at: ${new Date(expiresAt).toISOString()}`);
        } catch (error) {
            const err = error;
            console.error('Failed to save token cache:', err.message);
        }
    }

    /**
     * 清除token缓存
     */
    clearTokenCache() {
        try {
            if (fs.existsSync(this.tokenCacheFile)) {
                fs.unlinkSync(this.tokenCacheFile);
                console.error('Token cache cleared');
            }
            this.tokenCacheData = null;
        } catch (error) {
            const err = error;
            console.error('Failed to clear token cache:', err.message);
        }
    }

    /**
     * 获取有效的access_token（优先使用缓存）
     */
    async getValidAccessToken() {
        // 如果环境变量中有token，直接使用
        if (process.env.DINGTALK_ACCESS_TOKEN) {
            return process.env.DINGTALK_ACCESS_TOKEN;
        }
        // 检查当前缓存的token是否有效
        if (this.tokenCacheData && this.isTokenCacheValid(this.tokenCacheData)) {
            console.error('Using cached access token');
            return this.tokenCacheData.access_token;
        }
        // 缓存无效或不存在，刷新token
        console.error('Token cache invalid or missing, refreshing...');
        return await this.refreshAccessToken();
    }

    async refreshAccessToken() {
        if (!this.appId || !this.appSecret) {
            throw new Error('DINGTALK_APP_ID and DINGTALK_APP_SECRET are required');
        }
        try {
            console.error('Requesting new access token from DingTalk API...');
            const response = await axios.get('https://oapi.dingtalk.com/gettoken', {
                params: {
                    appkey: this.appId,
                    appsecret: this.appSecret
                },
                timeout: 10000 // 10秒超时
            });
            if (response.data.errcode === 0) {
                this.accessToken = response.data.access_token;
                const expiresIn = response.data.expires_in || 7200;
                // 保存到缓存
                this.saveTokenCache(this.accessToken, expiresIn);
                console.error('Access token refreshed successfully');
                return this.accessToken;
            } else {
                throw new Error(`Token refresh failed: ${response.data.errmsg} (errcode: ${response.data.errcode})`);
            }
        } catch (error) {
            // 刷新失败时清除缓存
            this.clearTokenCache();
            if (axios.isAxiosError(error) && error.response) {
                throw new Error(`Failed to refresh access token: HTTP ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            } else {
                const err = error;
                throw new Error(`Failed to refresh access token: ${err.message}`);
            }
        }
    }

    setupHandlers() {
        // 列出可用工具
        if (this.debug) {
            const tools = this.tools.map(tool => ({
                name: tool.name,
                description: tool.description,
                inputSchema: {
                    type: 'object',
                    properties: this.generateSchema(tool.args || []),
                    required: (tool.args || []).filter(arg => arg.required).map(arg => arg.name)
                }
            }));
            console.error(JSON.stringify(tools, null, 2));

        }
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            const tools = this.tools.map(tool => ({
                name: tool.name,
                description: tool.description,
                inputSchema: {
                    type: 'object',
                    properties: this.generateSchema(tool.args || []),
                    required: (tool.args || []).filter(arg => arg.required).map(arg => arg.name)
                }
            }));

            return {tools};
        });
        // 执行工具调用
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const {name, arguments: args} = request.params;

            const result = await this.executeTool(name, args || {});
            // 转换为 MCP SDK 期望的格式
            return {
                content: result.content,
                isError: result.isError
            };

        });
    }

    generateSchema(args) {
        const schema = {};
        args.forEach(arg => {
            if (arg.system) {
                // 如果 system 属性有值，则跳过本次循环，不给大模型构造这个参数
                return;
            }
            if (arg.not_need_model_transform) {
                // 如果 need_model_transform 属性有值，则跳过本次循环，不给大模型构造这个参数
                return;
            }
            schema[arg.name] = {
                type: arg.type,
                description: arg.description
            };
            // array 类型添加 items 属性
            if (arg.type === 'array' && arg.items) {
                schema[arg.name].items = arg.items;
            }
            // object 类型处理：如果有 properties，直接添加；如果有 items，将 items 的属性赋值到 schema
            if (arg.type === 'object') {
                if (arg.properties) {
                    schema[arg.name].properties = arg.properties;
                } else if (arg.items) {
                    // 配置文件约定：object 类型使用 items 定义结构
                    if (arg.items.properties) {
                        schema[arg.name].properties = arg.items.properties;
                    }
                    if (arg.items.required) {
                        schema[arg.name].required = arg.items.required;
                    }
                }
            }
        });
        return schema;
    }

    async executeTool(toolName, args) {
        const tool = this.tools.find(t => t.name === toolName);
        if (!tool) {
            return {
                content: [{
                    type: 'text',
                    text: `Tool ${toolName} not found. Available tools: ${this.tools.map(t => t.name).join(', ')}`
                }],
                isError: true
            };
        }
        try {
            if (LocalTools.isLocalTool(toolName)){
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify(LocalTools.callTool(tool), null, 2)
                    }]
                };
            }

            // 获取有效的访问令牌（使用缓存机制）
            const accessToken = await this.getValidAccessToken();
            if (!accessToken) {
                throw new Error('No access token available. Please set DINGTALK_ACCESS_TOKEN or DINGTALK_APP_ID/DINGTALK_APP_SECRET');
            }
            // 更新当前token
            this.accessToken = accessToken;
            // 构建请求
            const url = this.buildUrl(tool.requestTemplate.url, args);
            const headers = this.buildHeaders(tool);
            const body = this.buildBody(tool, args);
            console.error(`Calling ${tool.requestTemplate.method} ${url}`);
            console.error(`Headers:`, headers);
            if (body)
                console.error(`Body:`, JSON.stringify(body, null, 2));
            // 执行API调用
            const response = await axios({
                method: tool.requestTemplate.method,
                url: url,
                headers: headers,
                data: body,
                timeout: 30000
            });
            if (this.debug) {
                console.error(response)
            }

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify(response.data, null, 2)
                }]
            };
        } catch (error) {
            if (this.debug) {
                console.error(error)
            }
            let errorMessage = error.message;
            if (axios.isAxiosError(error) && error.response) {
                // 如果是token相关错误，清除缓存
                if (error.response.status === 401 ||
                    (error.response.data && error.response.data.errcode === 40014)) {
                    console.error('Token authentication failed, clearing cache...');
                    this.clearTokenCache();
                    this.accessToken = null;
                }
                errorMessage = `API Error ${error.response.status}: ${JSON.stringify(error.response.data, null, 2)}`;
            }
            console.error('Tool execution error:', errorMessage);
            return {
                content: [{
                    type: 'text',
                    text: `Error executing ${toolName}: ${errorMessage}`
                }],
                isError: true
            };
        }
    }

    buildUrl(template, args) {
        let url = template;
        // 替换路径参数
        Object.keys(args).forEach(key => {
            const regex = new RegExp(`\\{${key}\\}`, 'g');
            if (regex.test(url)) {
                url = url.replace(regex, encodeURIComponent(String(args[key])));
            }
        });
        // 处理查询参数
        const [baseUrl, queryString] = url.split('?');
        if (queryString) {
            const queryParams = new URLSearchParams();
            // 解析模板中的查询参数
            const templateParams = new URLSearchParams(queryString);
            for (const [key, value] of templateParams.entries()) {
                // 检查是否为模板占位符
                if (value.includes('String') || value.includes('Long') || value.includes('Boolean') || value.includes('Integer')) {
                    if (args[key] !== undefined) {
                        queryParams.set(key, String(args[key]));
                    }
                } else {
                    // 处理系统参数，如自动化机器人access_token
                    if (process.env[value]) {
                        queryParams.set(key, process.env[value]);
                    } else {
                        queryParams.set(key, value);
                    }
                }
            }
            const finalQuery = queryParams.toString();
            return finalQuery ? `${baseUrl}?${finalQuery}` : baseUrl;
        }
        // 特殊处理oapi.dingtalk.com接口且配置了security（自定义机器人发消息不使用这个），将access_token作为URL参数传递
        if (url.includes('oapi.dingtalk.com') && this.accessToken) {
            const separator = url.includes('?') ? '&' : '?';
            return `${url}${separator}access_token=${encodeURIComponent(this.accessToken)}`;
        }
        return url;
    }

    buildHeaders(tool) {
        if (tool.requestTemplate.url && !tool.requestTemplate.url.includes('dingtalk.com')) {
            return;
        }

        const headers = {
            'Content-Type': 'application/json'
        };
        // 只有对新版API (api.dingtalk.com) 才添加token到header
        if (tool.requestTemplate.url && tool.requestTemplate.url.includes('https://api.dingtalk.com') && this.accessToken) {
            headers['x-acs-dingtalk-access-token'] = this.accessToken;
        }
        if (tool.requestTemplate.headers) {
            tool.requestTemplate.headers.forEach(header => {
                headers[header.key] = header.value;
            });
        }
        return headers;
    }

    processMultiParam(body, name, value) {
        let objParmas = name.split('.');
        if (objParmas && objParmas.length > 1) {
            if (objParmas.length == 2) {
                if (!body[objParmas[0]]) {
                    body[objParmas[0]] = {};
                }
                body[objParmas[0]][objParmas[1]] = value;
            }
            if (objParmas.length == 3) {
                if (!body[objParmas[0]]) {
                    body[objParmas[0]] = {};
                }
                if (!body[objParmas[0]][objParmas[1]]) {
                    body[objParmas[0]][objParmas[1]] = {};
                }
                body[objParmas[0]][objParmas[1]][objParmas[2]] = value;
            }
            return true;
        } else {
            body[name] = value;
        }
        return false;
    }

    buildBody(tool, args) {
        if (tool.requestTemplate.method === 'GET' || tool.requestTemplate.method === 'DELETE') {
            return undefined;
        }

        if (tool.name === 'sendServiceWindowMessage') {
            return ServiceWindowMessageBuilder.buildSendServiceWindowMarkdownBody(args);
        } else if (tool.name === 'batchSendServiceWindowMessage') {
            return ServiceWindowMessageBuilder.buildBatchSendServiceWindowMarkdownBody(args);
        } else if (tool.name === 'createReport' || tool.name === 'saveReportDraft') {
            return LogMessageBuilder.buildBody(args);
        }


        const body = {};
        (tool.args || []).forEach(arg => {
            if (arg.position === 'body') {
                // 系统参数，从环境变量读取
                if (arg.system) {
                    if (!process.env[arg.system]) {
                        throw new Error(`System parameter ${arg.system} is required， please check your environment variables`);
                    }
                    body[arg.name] = process.env[arg.system];
                    return;
                }
                // 不需要模型处理，直接取默认值赋值
                if (arg.not_need_model_transform) {
                    this.processMultiParam(body, arg.name, arg.default);
                    return;
                }

                // 如果模型没有对应提参，则不赋值给API对应的入参
                if (args[arg.name] == null) {
                    return;
                }

                if (arg.extendType === 'json') {
                    body[arg.name] = JSON.stringify(args[arg.name]);
                    return;
                }

                //打平Object类型参数，递归处理
                this.processMultiParam(body, arg.name, args[arg.name]);

                // // userIds参数直接传递为数组类型，保证请求体为正确的JSON对象
                // if (arg.name === 'userIds' && Array.isArray(args[arg.name])) {
                //     body[arg.name] = args[arg.name];
                // }
                // // 搜索用户API参数名称转换，从snake_case转为camelCase
                // else if (tool.name === 'searchUser') {
                //     // Convert snake_case to camelCase for the search user API
                //     const camelCaseName = arg.name.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
                //     body[camelCaseName] = args[arg.name];
                // }
                // else {
                //     body[arg.name] = args[arg.name];
                // }
            }
        });
        // 为searchUser/searchDepartment添加默认的分页参数

        // 设置默认的offset为0
        if (tool.name === 'searchDepartment' || tool.name === 'searchUser') {
            if (body.offset === undefined) {
                body.offset = 0;
            }
            // 设置默认的size为20
            if (body.size === undefined) {
                body.size = 20;
            }
        }
        console.error(`SearchUser API with params: offset=${body.offset}, size=${body.size}`);

        return Object.keys(body).length > 0 ? body : undefined;
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('DingTalk MCP server running on stdio');
    }
}

//# sourceMappingURL=DingTalkMCPServer.js.map