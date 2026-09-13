import { McpClient, StdioTransport, StreamableHttpTransport } from '@earendil-works/pi-mcp';
import type { SettingsStore } from './settings.js';
import { cleanError } from './errors.js';

export async function testMcp(settings:SettingsStore):Promise<{ok:boolean;message:string}> {
  const config = settings.get<{servers?:string|object}>('integration:mcp',{});
  if (!config.servers) return {ok:false,message:'请先配置 MCP 服务'};
  const parsed = typeof config.servers === 'string' ? JSON.parse(config.servers):config.servers;
  const servers = (parsed as {mcpServers?:Record<string,Record<string,unknown>>}).mcpServers || parsed as Record<string,Record<string,unknown>>;
  const enabled = Object.entries(servers).filter(([,entry]) => entry.enabled !== false);
  if (!enabled.length) return {ok:false,message:'没有启用的 MCP 服务'};
  const results:string[] = [];
  let ok = true;
  for (const [name,entry] of enabled) {
    const client = new McpClient({name:'PersonalAgent',version:'0.1.0',requestTimeoutMs:15000});
    const expand = (value:string) => value.replace(/\$\{([A-Z_][A-Z0-9_]*)\}/g,(_all,key) => process.env[key] || '');
    const secrets = Object.values((entry.headers || entry.env || {}) as Record<string,string>);
    try {
      const transport = entry.url ? new StreamableHttpTransport({url:expand(String(entry.url)),headers:Object.fromEntries(Object.entries((entry.headers || {}) as Record<string,string>).map(([key,value]) => [key,expand(value)])),openGetStream:false}):new StdioTransport({command:String(entry.command),args:entry.args as string[] | undefined,cwd:entry.cwd as string | undefined,env:entry.env as Record<string,string> | undefined,inheritEnv:false});
      await client.connect(transport);
      const tools = await client.listTools({timeoutMs:15000});
      results.push(`${name}：已连接，${tools.length} 个工具`);
    } catch(error) { ok = false; results.push(`${name}：${cleanError(error,secrets)}`); }
    finally { await client.close().catch(() => {}); }
  }
  return {ok,message:results.join('\n')};
}
