import { afterEach, expect, it, vi } from 'vitest';
import { createServer, type Server } from 'node:http';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { createApp } from '../../src/server/app.js';
import type { AppConfig } from '../../src/server/config.js';

let server:Server|undefined;
let directory:string|undefined;
let closeApp:(()=>Promise<void>)|undefined;
afterEach(async()=>{
  await closeApp?.();closeApp=undefined;
  if(server){server.closeAllConnections();await new Promise<void>(resolve=>server!.close(()=>resolve()));server=undefined;}
  if(directory){rmSync(directory,{recursive:true,force:true});directory=undefined;}
  vi.unstubAllEnvs();
});

it.each(['approve','reject'] as const)('loads only the application MCP tools into the real Pi SDK and enforces %s before HTTP execution',async decision=>{
  const modelRequests:any[]=[];
  const mcpRequests:any[]=[];
  const calls:any[]=[];
  let hostRequests=0;
  const toolName='mcp__daily_fixture__budget';
  const argumentsValue={label:'day-out',transport:8,lunch:25};
  server=createServer(async(request,response)=>{
    let raw='';for await(const chunk of request)raw+=chunk;
    if(request.url === '/host-mcp'){hostRequests++;response.writeHead(503);response.end();return;}
    if(request.url === '/mcp'){
      if(request.method !== 'POST'){response.writeHead(405);response.end();return;}
      const rpc=JSON.parse(raw);mcpRequests.push(rpc);
      if(rpc.id === undefined){response.writeHead(202);response.end();return;}
      let result;
      if(rpc.method === 'initialize')result={protocolVersion:rpc.params.protocolVersion,capabilities:{tools:{}},serverInfo:{name:'daily-fixture',version:'1.0.0'}};
      else if(rpc.method === 'tools/list')result={tools:[{name:'budget',description:'Calculate a fixed daily budget.',inputSchema:{type:'object',properties:{label:{type:'string'},transport:{type:'number'},lunch:{type:'number'}},required:['label','transport','lunch']}}]};
      else if(rpc.method === 'tools/call'){
        calls.push(rpc.params);
        const {label,transport,lunch}=rpc.params.arguments;
        result={content:[{type:'text',text:JSON.stringify({label,total:transport+lunch})}]};
      } else {response.writeHead(400);response.end();return;}
      response.writeHead(200,{'Content-Type':'application/json'});response.end(JSON.stringify({jsonrpc:'2.0',id:rpc.id,result}));return;
    }
    const payload=JSON.parse(raw);modelRequests.push(payload);
    response.writeHead(200,{'Content-Type':'text/event-stream'});
    const chunk=(delta:unknown,finish_reason:string|null=null)=>response.write(`data: ${JSON.stringify({id:'mcp-completion',object:'chat.completion.chunk',created:Math.floor(Date.now()/1000),model:'test-model',choices:[{index:0,delta,finish_reason}]})}\n\n`);
    chunk({role:'assistant'});
    if(payload.messages.some((message:any)=>message.role === 'tool')){
      chunk({content:decision === 'approve'?'预算为 33 元。':'用户拒绝了预算查询，未执行。'});chunk({},'stop');
    } else if(payload.tools.some((tool:any)=>tool.function.name === toolName)){
      chunk({tool_calls:[{index:0,id:'daily-budget-call',type:'function',function:{name:toolName,arguments:JSON.stringify(argumentsValue)}}]});chunk({},'tool_calls');
    } else {chunk({content:'No configured MCP tool was declared.'});chunk({},'stop');}
    response.end('data: [DONE]\n\n');
  });
  await new Promise<void>(resolve=>server!.listen(0,'127.0.0.1',resolve));
  const {port}=server.address() as {port:number};
  directory=mkdtempSync(join(tmpdir(),'pa-pi-mcp-'));
  const hostDir=join(directory,'unrelated-host-pi');mkdirSync(hostDir,{recursive:true});
  const hostConfig=JSON.stringify({mcpServers:{'host-only':{url:`http://127.0.0.1:${port}/host-mcp`,exposure:'direct'}}});
  writeFileSync(join(hostDir,'mcp.json'),hostConfig);
  vi.stubEnv('PI_CODING_AGENT_DIR',hostDir);
  const config:AppConfig={host:'127.0.0.1',port:3420,dataDir:directory,password:'test-only',encryptionKey:randomBytes(32),cookieSecure:false,publicOrigin:'http://127.0.0.1:3420'};
  const services=await createApp(config,{background:false});closeApp=()=>services.app.close();
  services.models.update({provider:'custom',model:'test-model',apiKey:'mcp-test-key',baseUrl:`http://127.0.0.1:${port}/v1`});
  services.models.updateMcp({servers:{mcpServers:{'daily-fixture':{url:`http://127.0.0.1:${port}/mcp`}}}});
  const task=services.tasks.create('使用 MCP 工具计算外出预算，等用户决定后再执行。');
  const wait=async(predicate:()=>boolean)=>{const end=Date.now()+15000;while(!predicate()){if(Date.now()>end)throw new Error('Pi MCP timeout');await new Promise(resolve=>setTimeout(resolve,10));}};
  await wait(()=>services.approvals.list(task.id).some(item=>item.status === 'pending')||['failed','succeeded'].includes(services.tasks.get(task.id)!.status));
  expect(modelRequests).toHaveLength(1);
  expect(modelRequests[0].tools.map((tool:any)=>tool.function.name)).toContain(toolName);
  expect(modelRequests[0].tools.some((tool:any)=>tool.function.name.startsWith('mcp__host_only__'))).toBe(false);
  const browserDescription=modelRequests[0].tools.find((tool:any)=>tool.function.name === 'browser_execute').function.description;
  expect(browserDescription).toContain('console.log(value)');
  expect(browserDescription).not.toContain('text(value)');expect(browserDescription).not.toContain('image(bytes)');
  expect(mcpRequests.filter(item=>item.method === 'initialize')).toHaveLength(1);
  expect(mcpRequests.filter(item=>item.method === 'tools/list')).toHaveLength(1);
  expect(hostRequests).toBe(0);expect(calls).toEqual([]);
  expect(services.tasks.get(task.id)!.status).toBe('waiting_approval');
  const approval=services.approvals.list(task.id).find(item=>item.status === 'pending')!;
  expect(approval.action).toBe(toolName);expect(approval.parameters).toEqual(argumentsValue);
  services.approvals.decide(approval.id,decision,approval.parametersHash,approval.version);
  await wait(()=>['failed','succeeded'].includes(services.tasks.get(task.id)!.status));
  const detail=services.tasks.detail(task.id);
  expect(detail.task.error).toBeUndefined();expect(detail.task.status).toBe('succeeded');
  expect(modelRequests).toHaveLength(2);
  expect(calls).toHaveLength(decision === 'approve'?1:0);
  const toolResult=modelRequests[1].messages.find((message:any)=>message.role === 'tool');
  if(decision === 'approve'){
    expect(calls[0].name).toBe('budget');expect(calls[0].arguments).toEqual(argumentsValue);
    expect(JSON.parse(toolResult.content)).toEqual({label:'day-out',total:33});
  } else expect(toolResult.content).toContain('用户拒绝了该操作');
  expect(detail.approvals[0].status).toBe(decision === 'approve'?'approved':'rejected');
  expect(hostRequests).toBe(0);expect(readFileSync(join(hostDir,'mcp.json'),'utf8')).toBe(hostConfig);
},30000);
