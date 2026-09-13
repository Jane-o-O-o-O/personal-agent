import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { ModelRuntime, createAgentSession, createExtensionRuntime, SessionManager, SettingsManager, type ResourceLoader } from '@earendil-works/pi-coding-agent';
import type { Model, Api } from '@earendil-works/pi-ai';
import type { Integration, ModelState } from '../shared/contracts.js';
import type { SettingsStore } from './settings.js';
import { AppError, cleanError } from './errors.js';

export interface ModelConfig {
  provider: string; model: string; baseUrl: string; apiKey: string; api: Api;
  contextWindow: number; maxTokens: number; reasoning: boolean; images: boolean;
}
const defaults: ModelConfig = { provider: 'custom', model: '', baseUrl: '', apiKey: '', api: 'openai-completions', contextWindow: 64000, maxTokens: 8192, reasoning: false, images: false };
export function minimalResources(prompt: string): ResourceLoader {
  return {
    getExtensions: () => ({ extensions: [], errors: [], runtime: createExtensionRuntime() }),
    getSkills: () => ({ skills: [], diagnostics: [] }), getPrompts: () => ({ prompts: [], diagnostics: [] }),
    getThemes: () => ({ themes: [], diagnostics: [] }), getAgentsFiles: () => ({ agentsFiles: [] }),
    getSystemPrompt: () => prompt, getSystemPromptSource: () => undefined, getAppendSystemPrompt: () => [],
    getAppendSystemPromptSources: () => [], extendResources: () => {}, reload: async () => {},
  };
}

export class ModelConfigService {
  constructor(private settings: SettingsStore, private dataDir: string) {}
  config(): ModelConfig { return { ...defaults, ...this.settings.get<Partial<ModelConfig>>('integration:model', {}) }; }
  state(): ModelState {
    const c = this.config();
    return { configured: Boolean(c.model && c.apiKey && (c.provider !== 'custom' || c.baseUrl)), provider: c.provider, model: c.model, baseUrl: c.baseUrl };
  }
  integration(): Integration {
    const { apiKey, ...config } = this.config();
    const check = this.settings.get<{at?:string;error?:string}>('check:model', {});
    return { id: 'model', name: '模型', description: 'Pi 模型连接', status: check.error ? 'error' : this.state().configured ? 'configured' : 'unconfigured', capabilities: ['对话', '工具调用'], config, secretFields: { apiKey: Boolean(apiKey) }, lastCheckedAt: check.at, lastError: check.error, fields: [
      { name:'provider',label:'供应商',type:'select',options:[{value:'custom',label:'自定义兼容接口'},{value:'deepseek',label:'DeepSeek'},{value:'openai',label:'OpenAI'},{value:'anthropic',label:'Anthropic'},{value:'google',label:'Google'}] },
      { name:'model',label:'模型 ID',type:'text',required:true,placeholder:'deepseek-chat' },
      { name:'baseUrl',label:'API 地址',type:'text',placeholder:'https://api.deepseek.com/v1' },
      { name:'apiKey',label:'API Key',type:'password',required:true },
      { name:'api',label:'接口协议',type:'select',options:[{value:'openai-completions',label:'Chat Completions'},{value:'openai-responses',label:'Responses'},{value:'anthropic-messages',label:'Anthropic Messages'}] },
      { name:'contextWindow',label:'上下文 Tokens',type:'number' }, { name:'maxTokens',label:'输出 Tokens',type:'number' },
      { name:'reasoning',label:'支持推理',type:'boolean' }, { name:'images',label:'支持图片',type:'boolean' },
    ] };
  }
  update(patch: Record<string, unknown>): Integration {
    const c = this.config();
    for (const key of ['provider','model','baseUrl','apiKey','api'] as const) if (patch[key] !== undefined) {
      if (typeof patch[key] !== 'string' || (patch[key] as string).length > 12000) throw new AppError('INVALID_INPUT', `Invalid ${key}`);
      (c as unknown as Record<string, unknown>)[key] = (patch[key] as string).trim();
    }
    if (!['custom','deepseek','openai','anthropic','google'].includes(c.provider)) throw new AppError('INVALID_PROVIDER','未知模型供应商');
    if (!['openai-completions','openai-responses','anthropic-messages'].includes(c.api)) throw new AppError('INVALID_API','未知模型协议');
    if (c.baseUrl) {
      let url: URL;
      try { url = new URL(c.baseUrl); } catch { throw new AppError('INVALID_URL','API 地址不正确'); }
      if (!['http:','https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new AppError('INVALID_URL','API 地址不正确');
      c.baseUrl = c.baseUrl.replace(/\/$/, '');
    }
    for (const key of ['contextWindow','maxTokens'] as const) if (patch[key] !== undefined) {
      const n = Number(patch[key]);
      if (!Number.isInteger(n) || n < 256 || n > 2000000) throw new AppError('INVALID_INPUT', `Invalid ${key}`);
      c[key] = n;
    }
    if (c.maxTokens > c.contextWindow) throw new AppError('INVALID_INPUT', '输出上限不能大于上下文');
    for (const key of ['reasoning','images'] as const) if (patch[key] !== undefined) {
      if (typeof patch[key] !== 'boolean') throw new AppError('INVALID_INPUT', `Invalid ${key}`);
      c[key] = patch[key];
    }
    this.settings.set('integration:model', c);
    this.settings.delete('check:model');
    return this.integration();
  }
  async runtime(): Promise<{runtime:ModelRuntime;model:Model<Api>;config:ModelConfig}> {
    if (!this.state().configured) throw new AppError('MODEL_UNCONFIGURED', '请在连接页配置模型', 409);
    const config = this.config();
    const runtimeDir = join(this.dataDir, 'pi');
    mkdirSync(runtimeDir, { recursive: true, mode: 0o700 });
    const runtime = await ModelRuntime.create({ authPath: join(runtimeDir, 'auth.json'), modelsPath: join(runtimeDir, 'models.json'), allowModelNetwork: false });
    const provider = config.provider === 'custom' ? 'personal-agent' : config.provider;
    if (config.provider === 'custom') {
      runtime.registerProvider(provider, { baseUrl:config.baseUrl,api:config.api,apiKey:'runtime-credential',models:[{
        id:config.model,name:config.model,input:config.images ? ['text','image'] : ['text'],reasoning:config.reasoning,
        contextWindow:config.contextWindow,maxTokens:config.maxTokens,cost:{input:0,output:0,cacheRead:0,cacheWrite:0},
      }] });
    } else if (config.baseUrl) runtime.registerProvider(provider, { baseUrl: config.baseUrl });
    await runtime.setRuntimeApiKey(provider, config.apiKey);
    const model = runtime.getModel(provider, config.model);
    if (!model) throw new AppError('MODEL_NOT_FOUND', 'Pi 未找到该模型，请核对模型 ID 或使用自定义接口', 409);
    return { runtime, model, config };
  }
  async test(): Promise<{ok:boolean;message:string}> {
    let runtime: ModelRuntime | undefined;
    let abortTimer: ReturnType<typeof setTimeout> | undefined;
    let dispose: (() => void) | undefined;
    try {
      const setup = await this.runtime(); runtime = setup.runtime;
      const { session } = await createAgentSession({ modelRuntime: runtime, model:setup.model, tools:[], resourceLoader:minimalResources('Reply briefly.'), sessionManager:SessionManager.inMemory(), settingsManager:SettingsManager.inMemory({retry:{enabled:false}}) });
      dispose = () => session.dispose();
      abortTimer = setTimeout(() => { void session.abort(); }, 25000);
      await session.prompt('只回答：连接成功');
      const last = session.state.messages.filter(message => message.role === 'assistant').at(-1);
      if (!last || last.stopReason === 'error' || last.stopReason === 'aborted') throw new Error(last?.errorMessage || '模型未返回有效回复');
      this.settings.set('check:model', { at:new Date().toISOString() });
      return { ok:true, message:'模型连接成功' };
    } catch (error) {
      const message = cleanError(error, [this.config().apiKey]);
      this.settings.set('check:model', { at:new Date().toISOString(), error:message });
      return { ok:false, message };
    } finally { if (abortTimer) clearTimeout(abortTimer); dispose?.(); }
  }
  writeMcp(agentDir: string): boolean {
    const config = this.settings.get<{servers?:string|object}>('integration:mcp', {});
    const path = join(agentDir, 'mcp.json');
    if (!config.servers) { rmSync(path, { force:true }); return false; }
    const servers = this.configuredMcpServers();
    const direct = Object.fromEntries(Object.entries(servers).map(([name, entry]) => [name, { ...entry, exposure:'direct', toolExposure:undefined }]));
    writeFileSync(path, JSON.stringify({mcpServers:direct,autoEnableCodemode:false}), {mode:0o600});
    return true;
  }
  configuredMcpServers(): Record<string, Record<string, unknown>> {
    const saved = this.settings.get<{servers?:string|object}>('integration:mcp', {}).servers;
    if (!saved) return {};
    const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved;
    return (parsed as {mcpServers?:Record<string,Record<string,unknown>>}).mcpServers || parsed as Record<string,Record<string,unknown>>;
  }
  configuredMcpNames(): string[] { return Object.keys(this.configuredMcpServers()); }
  mcpIntegration(): Integration {
    const servers = this.settings.get<{servers?:string|object}>('integration:mcp', {}).servers;
    return { id:'mcp', name:'MCP',description:'自定义工具连接',status:servers ? 'configured':'unconfigured',capabilities:['扩展工具'],config:{},secretFields:{servers:Boolean(servers)},fields:[{name:'servers',label:'MCP 配置 JSON',type:'textarea',placeholder:'{"mcpServers":{}}'}] };
  }
  updateMcp(patch:Record<string,unknown>, reservedNames:readonly string[] = []): Integration {
    if (patch.servers !== undefined) {
      const value = patch.servers;
      if (value !== '') {
        let parsed:unknown;
        try { parsed = typeof value === 'string' ? JSON.parse(value) : value; } catch { throw new AppError('INVALID_MCP','MCP JSON 格式不正确'); }
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new AppError('INVALID_MCP','MCP 配置必须是对象');
        const servers = (parsed as {mcpServers?:unknown}).mcpServers || parsed;
        if (!servers || typeof servers !== 'object' || Array.isArray(servers) || Object.keys(servers).length > 20) throw new AppError('INVALID_MCP','MCP 服务配置不正确');
        for (const [name,entry] of Object.entries(servers)) {
          if (!/^[\w-]+$/.test(name) || !entry || typeof entry !== 'object' || (!entry.url && !entry.command)) throw new AppError('INVALID_MCP','MCP 服务配置不正确');
          if (entry.type === 'sse') throw new AppError('INVALID_MCP','需要 Streamable HTTP 或 stdio');
          if (reservedNames.some(reserved => reserved.replace(/-/g,'_') === name.replace(/-/g,'_')))
            throw new AppError('MCP_NAME_CONFLICT','自定义 MCP 名称与已安装扩展冲突',409);
        }
      }
      this.settings.set('integration:mcp', {servers:value});
    }
    return this.mcpIntegration();
  }
}
