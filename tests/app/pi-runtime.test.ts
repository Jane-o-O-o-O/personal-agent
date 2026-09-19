import { afterEach, expect, it } from 'vitest';
import { createServer, type Server } from 'node:http';
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync, statSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { createApp } from '../../src/server/app.js';
import type { AppConfig } from '../../src/server/config.js';
let server:Server|undefined;let directory:string|undefined;let closeApp:(()=>Promise<void>)|undefined;
afterEach(async()=>{await closeApp?.();if(server)await new Promise<void>(resolve=>server!.close(()=>resolve()));if(directory)rmSync(directory,{recursive:true,force:true});});

it('runs the real Pi SDK tool loop, streams text and restores its persistent session',async()=>{
  const requests:any[]=[];
  server=createServer(async(request,response)=>{
    let raw='';for await(const chunk of request) raw+=chunk;
    const payload=JSON.parse(raw);requests.push(payload);
    response.writeHead(200,{'Content-Type':'text/event-stream'});
    const chunk=(delta:unknown,finish_reason:string|null=null)=>response.write(`data: ${JSON.stringify({id:'test-completion',object:'chat.completion.chunk',created:Math.floor(Date.now()/1000),model:'test-model',choices:[{index:0,delta,finish_reason}]})}\n\n`);
    const lastUser=payload.messages.filter((message:any)=>message.role==='user').at(-1);
    const userText=Array.isArray(lastUser?.content) ? lastUser.content.map((part:any)=>part.text || '').join(''):String(lastUser?.content);
    const continuation=userText.includes('继续');
    const hasTool=payload.messages.some((message:any)=>message.role==='tool');
    chunk({role:'assistant'});
    if(!hasTool&&!continuation){chunk({tool_calls:[{index:0,id:'calendar-call-1',type:'function',function:{name:'calendar_query',arguments:JSON.stringify({date:'2026-10-03'})}}]});chunk({},'tool_calls');}
    else {chunk({content:continuation?'已恢复会话并继续。':'日历工具已返回结果。'});chunk({},'stop');}
    response.end('data: [DONE]\n\n');
  });
  await new Promise<void>(resolve=>server!.listen(0,'127.0.0.1',resolve));const address=server.address() as {port:number};
  directory=mkdtempSync(join(tmpdir(),'pa-pi-'));
  const config:AppConfig={host:'127.0.0.1',port:3420,dataDir:directory,password:'test-only',encryptionKey:randomBytes(32),cookieSecure:false,publicOrigin:'http://127.0.0.1:3420'};
  const services=await createApp(config,{background:false});closeApp=()=>services.app.close();
  services.models.update({provider:'custom',model:'test-model',apiKey:'test-key',baseUrl:`http://127.0.0.1:${address.port}/v1`});
  const task=services.tasks.create('用日历工具查询2026-10-03');
  const initialDelivery=services.tasks.message(task.id,'请仅查询当天日历。','initial-combined-input');
  const inputIds=JSON.parse(services.store.get<{json:string}>('SELECT json FROM tasks WHERE id=?',task.id)!.json).pendingInputs.map((input:{id:string})=>input.id);
  expect(inputIds).toHaveLength(2);await initialDelivery;
  const wait=async()=>{const deadline=Date.now()+20000;while(!['succeeded','failed'].includes(services.tasks.get(task.id)!.status)){if(Date.now()>deadline)throw new Error('Pi timeout');await new Promise(resolve=>setTimeout(resolve,20));}};
  await wait();const detail=services.tasks.detail(task.id);
  expect(detail.task.error).toBeUndefined();expect(detail.task.status).toBe('succeeded');expect(detail.task.result).toContain('日历工具');
  expect(detail.operations).toHaveLength(1);expect(detail.operations[0].name).toBe('calendar_query');expect(detail.operations[0].status).toBe('succeeded');
  expect(detail.task.sessionFile).toBeTruthy();expect(existsSync(detail.task.sessionFile!)).toBe(true);
  const initialUser=readFileSync(detail.task.sessionFile!,'utf8').trim().split('\n').map(line=>JSON.parse(line)).find(entry=>entry.type==='message'&&entry.message.role==='user');
  expect(initialUser.personalAgentInputIds).toEqual(inputIds);
  expect(services.store.eventsAfter(0,1000).some(event=>event.type==='message.delta')).toBe(true);
  await services.tasks.message(task.id,'请继续','continue-1');await wait();
  expect(services.tasks.get(task.id)!.sessionFile).toBe(detail.task.sessionFile);expect(services.tasks.get(task.id)!.result).toContain('恢复会话');
  expect(requests.at(-1).messages.some((message:any)=>message.role==='tool')).toBe(true);
},30000);

it('ACKs only persisted same-text inputs and retains a queued follow-up through pause, restart and resume',async()=>{
  const requests:any[]=[];const release=new Map<number,()=>void>();
  const initialText='Begin the interrupted personal task.';const sameText='Identical queued user input.';
  server=createServer(async(request,response)=>{
    let raw='';for await(const chunk of request)raw+=chunk;
    requests.push(JSON.parse(raw));const index=requests.length;
    response.writeHead(200,{'Content-Type':'text/event-stream'});
    const chunk=(delta:unknown,finish_reason:string|null=null)=>response.write(`data: ${JSON.stringify({id:`queue-${index}`,object:'chat.completion.chunk',created:Math.floor(Date.now()/1000),model:'test-model',choices:[{index:0,delta,finish_reason}]})}\n\n`);
    const finish=()=>{if(response.destroyed)return;chunk({content:'已核对并处理待办输入。'});chunk({},'stop');response.end('data: [DONE]\n\n');};
    chunk({role:'assistant'});
    if(index<=2)release.set(index,finish);else finish();
  });
  await new Promise<void>(resolve=>server!.listen(0,'127.0.0.1',resolve));const address=server.address() as {port:number};
  directory=mkdtempSync(join(tmpdir(),'pa-pi-input-ack-'));
  const config:AppConfig={host:'127.0.0.1',port:3420,dataDir:directory,password:'test-only',encryptionKey:randomBytes(32),cookieSecure:false,publicOrigin:'http://127.0.0.1:3420'};
  let services=await createApp(config,{background:false});closeApp=()=>services.app.close();
  services.models.update({provider:'custom',model:'test-model',apiKey:'queue-test-key',baseUrl:`http://127.0.0.1:${address.port}/v1`});
  const task=services.tasks.create(initialText);
  const stored=()=>JSON.parse(services.store.get<{json:string}>('SELECT json FROM tasks WHERE id=?',task.id)!.json);
  const initial=stored().pendingInputs[0];
  const wait=async(fn:()=>boolean)=>{const end=Date.now()+15000;while(!fn()){if(Date.now()>end)throw new Error('Pi queue timeout');await new Promise(resolve=>setTimeout(resolve,10));}};
  await wait(()=>requests.length===1);
  expect(stored().pendingInputs).toEqual([]);
  await services.tasks.message(task.id,sameText,'same-follow-up','follow_up');const followUp=stored().pendingInputs[0];
  await services.tasks.message(task.id,sameText,'same-steer','steer');const steer=stored().pendingInputs[1];
  expect(stored().pendingInputs).toEqual([followUp,steer]);
  release.get(1)!();await wait(()=>requests.length===2);
  expect(stored().pendingInputs).toEqual([followUp]);
  const sessionFile=services.tasks.get(task.id)!.sessionFile!;
  const users=()=>readFileSync(sessionFile,'utf8').trim().split('\n').map(line=>JSON.parse(line)).filter(entry=>entry.type==='message'&&entry.message.role==='user');
  expect(users().map(entry=>entry.personalAgentInputIds)).toEqual([[initial.id],[steer.id]]);
  await services.tasks.control(task.id,'pause');expect(services.tasks.get(task.id)!.status).toBe('paused');
  expect(stored().pendingInputs).toEqual([followUp]);

  // Recreate a crash between the durable JSONL commit and its SQLite acknowledgement.
  const stale=stored();stale.pendingInputs=[initial,followUp,steer];
  services.store.run('UPDATE tasks SET json=? WHERE id=?',JSON.stringify(stale),task.id);
  await services.app.close();closeApp=undefined;
  services=await createApp(config,{background:false});closeApp=()=>services.app.close();
  expect(services.tasks.get(task.id)!.status).toBe('paused');expect(stored().pendingInputs).toEqual([initial,followUp,steer]);
  await services.tasks.control(task.id,'resume');await wait(()=>['succeeded','failed'].includes(services.tasks.get(task.id)!.status));
  expect(services.tasks.get(task.id)!.error).toBeUndefined();expect(services.tasks.get(task.id)!.status).toBe('succeeded');
  expect(requests).toHaveLength(3);expect(stored().pendingInputs).toEqual([]);
  const texts=requests.at(-1).messages.filter((message:any)=>message.role==='user').map((message:any)=>Array.isArray(message.content)?message.content.map((part:any)=>part.text||'').join(''):String(message.content));
  expect(texts.filter((text:string)=>text.includes(initialText))).toHaveLength(1);
  expect(texts.filter((text:string)=>text.includes(sameText))).toHaveLength(2);
  expect(texts.at(-1)).toContain('先核对已有结果与外部操作状态');
  expect(users().map(entry=>entry.personalAgentInputIds)).toEqual([[initial.id],[steer.id],[followUp.id]]);
},30000);

it('restores a consumed prompt after a real provider failure without submitting it again',async()=>{
  const requests:any[]=[];const prompt='Run the provider failure recovery audit.';
  server=createServer(async(request,response)=>{
    let raw='';for await(const chunk of request)raw+=chunk;
    requests.push(JSON.parse(raw));
    if(requests.length===1){response.writeHead(401,{'Content-Type':'application/json'});response.end(JSON.stringify({error:{message:'Synthetic invalid API key',type:'invalid_request_error',code:'invalid_api_key'}}));return;}
    response.writeHead(200,{'Content-Type':'text/event-stream'});
    const chunk=(delta:unknown,finish_reason:string|null=null)=>response.write(`data: ${JSON.stringify({id:'failed-resume',object:'chat.completion.chunk',created:Math.floor(Date.now()/1000),model:'test-model',choices:[{index:0,delta,finish_reason}]})}\n\n`);
    chunk({role:'assistant'});chunk({content:'已恢复并核对任务。'});chunk({},'stop');response.end('data: [DONE]\n\n');
  });
  await new Promise<void>(resolve=>server!.listen(0,'127.0.0.1',resolve));const address=server.address() as {port:number};
  directory=mkdtempSync(join(tmpdir(),'pa-pi-failure-ack-'));
  const config:AppConfig={host:'127.0.0.1',port:3420,dataDir:directory,password:'test-only',encryptionKey:randomBytes(32),cookieSecure:false,publicOrigin:'http://127.0.0.1:3420'};
  let services=await createApp(config,{background:false});closeApp=()=>services.app.close();
  services.models.update({provider:'custom',model:'test-model',apiKey:'failure-test-key',baseUrl:`http://127.0.0.1:${address.port}/v1`});
  const task=services.tasks.create(prompt);
  const pending=()=>JSON.parse(services.store.get<{json:string}>('SELECT json FROM tasks WHERE id=?',task.id)!.json).pendingInputs;
  const inputId=pending()[0].id;
  const wait=async()=>{const end=Date.now()+15000;while(!['succeeded','failed'].includes(services.tasks.get(task.id)!.status)){if(Date.now()>end)throw new Error('Pi failure timeout');await new Promise(resolve=>setTimeout(resolve,10));}};
  await wait();expect(services.tasks.get(task.id)!.status).toBe('failed');expect(pending()).toEqual([]);expect(requests).toHaveLength(1);
  const sessionFile=services.tasks.get(task.id)!.sessionFile!;
  await services.app.close();closeApp=undefined;
  services=await createApp(config,{background:false});closeApp=()=>services.app.close();
  await services.tasks.control(task.id,'resume');await wait();
  expect(services.tasks.get(task.id)!.error).toBeUndefined();expect(services.tasks.get(task.id)!.status).toBe('succeeded');expect(requests).toHaveLength(2);
  const users=readFileSync(sessionFile,'utf8').trim().split('\n').map(line=>JSON.parse(line)).filter(entry=>entry.type==='message'&&entry.message.role==='user');
  expect(users.filter(entry=>entry.personalAgentInputIds?.includes(inputId))).toHaveLength(1);
  const messages=requests.at(-1).messages.filter((message:any)=>message.role==='user');
  expect(messages.filter((message:any)=>JSON.stringify(message.content).includes(prompt))).toHaveLength(1);
  expect(JSON.stringify(messages.at(-1).content)).toContain('先核对已有结果与外部操作状态');expect(pending()).toEqual([]);
},30000);

it('redacts fragmented model credentials before events and raw session persistence and safely restores legacy entries',async()=>{
  const credential='synthetic-model-credential-123456789';
  const connectorCredential='synthetic-connector-credential-987654321';
  const bearer='unlisted-bearer-value-12345';
  const queryToken='unlisted-query-value-98765';
  const privateText='user-provided-text-outside-configured-credentials';
  const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7V0AAAAASUVORK5CYII=';
  const requests:any[]=[];
  server=createServer(async(request,response)=>{
    let raw='';for await(const chunk of request) raw+=chunk;
    const payload=JSON.parse(raw);requests.push(payload);
    response.writeHead(200,{'Content-Type':'text/event-stream'});
    const chunk=(delta:unknown,finish_reason:string|null=null)=>response.write(`data: ${JSON.stringify({id:'privacy-completion',object:'chat.completion.chunk',created:Math.floor(Date.now()/1000),model:'test-model',choices:[{index:0,delta,finish_reason}]})}\n\n`);
    chunk({role:'assistant'});
    const continuation=JSON.stringify(payload.messages).includes('resume-privacy-audit');
    if(!payload.messages.some((message:any)=>message.role==='tool')) {
      chunk({tool_calls:[{index:0,id:'privacy-calendar-1',type:'function',function:{name:'calendar_query',arguments:JSON.stringify({date:'2026-10-03'})}}]});
      chunk({},'tool_calls');
    } else {
      const text=`${continuation?'Resumed':'Complete'}: ${credential} | ${connectorCredential} | Bearer ${bearer} | https://api.example/query?access_token=${queryToken}&date=2026-10-03`;
      for(let index=0;index<text.length;index+=5) chunk({content:text.slice(index,index+5)});
      chunk({},'stop');
    }
    response.end('data: [DONE]\n\n');
  });
  await new Promise<void>(resolve=>server!.listen(0,'127.0.0.1',resolve));const address=server.address() as {port:number};
  directory=mkdtempSync(join(tmpdir(),'pa-pi-redaction-'));
  const config:AppConfig={host:'127.0.0.1',port:3420,dataDir:directory,password:'test-only',encryptionKey:randomBytes(32),cookieSecure:false,publicOrigin:'http://127.0.0.1:3420'};
  const services=await createApp(config,{background:false});closeApp=()=>services.app.close();
  services.models.update({provider:'custom',model:'test-model',apiKey:credential,images:true,baseUrl:`http://127.0.0.1:${address.port}/v1`});
  services.settings.set('integration:privacy-fixture',{apiKey:connectorCredential});
  const task=services.tasks.create('Run the calendar privacy audit.');
  const wait=async()=>{const deadline=Date.now()+20000;while(!['succeeded','failed'].includes(services.tasks.get(task.id)!.status)){if(Date.now()>deadline)throw new Error('Pi timeout');await new Promise(resolve=>setTimeout(resolve,20));}};
  const assertPrivate=(text:string)=>{for(const value of [credential,connectorCredential,bearer,queryToken])expect(text).not.toContain(value);};
  await wait();
  const initial=services.tasks.detail(task.id);
  expect(initial.task.error).toBeUndefined();expect(initial.task.status).toBe('succeeded');
  assertPrivate(JSON.stringify(initial));
  const sessionFile=initial.task.sessionFile!;
  expect(sessionFile).toBeTruthy();
  const events=services.store.eventsAfter(0,1000);
  assertPrivate(JSON.stringify(events));
  const deltas=events.filter(event=>event.type==='message.delta').map(event=>(event.payload as {delta:string}).delta);
  expect(deltas.length).toBeGreaterThan(1);
  assertPrivate(deltas.join(''));expect(deltas.join('')).toBe(initial.task.result);
  const raw=readFileSync(sessionFile,'utf8');assertPrivate(raw);
  expect(statSync(sessionFile).mode&0o777).toBe(0o600);
  const entries=raw.trim().split('\n').map(line=>JSON.parse(line));
  const identities=entries.map(entry=>({type:entry.type,id:entry.id,parentId:entry.parentId}));
  const assistant=entries.findLast(entry=>entry.type==='message'&&entry.message.role==='assistant');
  assistant.message.content.push({type:'text',text:`Legacy ${credential} ${connectorCredential} Bearer ${bearer} https://api.example/?token=${queryToken} ${privateText}`});
  const toolResult=entries.find(entry=>entry.type==='message'&&entry.message.role==='toolResult');
  toolResult.message.content.push({type:'image',data:png,mimeType:'image/png'});
  toolResult.message.details={role:credential,blob:connectorCredential,token:privateText};
  const toolAssistant=entries.find(entry=>entry.type==='message'&&entry.message.role==='assistant'&&entry.message.content.some((block:any)=>block.type==='toolCall'));
  const toolCall=toolAssistant.message.content.find((block:any)=>block.type==='toolCall');
  toolCall.id+='|fc_privacy';toolResult.message.toolCallId=toolCall.id;
  toolAssistant.message.api='openai-responses';
  toolAssistant.message.content.unshift({type:'thinking',thinking:`Legacy thought ${credential}`,thinkingSignature:'opaque-signed-reasoning-item'});
  const opaqueSignature='Bearer opaque-provider-signature';
  assistant.message.content.push({type:'thinking',thinking:'Unmodified provider context',thinkingSignature:opaqueSignature});
  writeFileSync(sessionFile,entries.map(entry=>JSON.stringify(entry)).join('\n')+'\n'+`{"unfinished-tail":"${credential}`);
  expect(readFileSync(sessionFile,'utf8')).toContain(credential);

  await services.tasks.message(task.id,'resume-privacy-audit','privacy-resume-1');await wait();
  const resumed=services.tasks.detail(task.id);
  expect(resumed.task.error).toBeUndefined();expect(resumed.task.status).toBe('succeeded');
  expect(resumed.task.sessionFile).toBe(sessionFile);expect(resumed.task.result).toContain('Resumed');
  assertPrivate(JSON.stringify(resumed));assertPrivate(JSON.stringify(services.store.eventsAfter(0,1000)));
  const restoredRaw=readFileSync(sessionFile,'utf8');assertPrivate(restoredRaw);
  expect(restoredRaw).toContain(privateText);
  const restored=restoredRaw.trim().split('\n').map(line=>JSON.parse(line));
  expect(restored.slice(0,entries.length).map(entry=>({type:entry.type,id:entry.id,parentId:entry.parentId}))).toEqual(identities);
  const restoredTool=restored.find(entry=>entry.id===toolResult.id);
  expect(restoredTool.message.content).toContainEqual({type:'image',data:png,mimeType:'image/png'});
  expect(restoredTool.message.details).toEqual({role:'[redacted]',blob:'[redacted]',token:privateText});
  expect(restoredRaw).not.toContain('unfinished-tail');
  const restoredAssistant=restored.find(entry=>entry.id===toolAssistant.id);
  expect(restoredAssistant.message.content).toContainEqual({type:'text',text:'Legacy thought [redacted]'});
  const restoredCall=restoredAssistant.message.content.find((block:any)=>block.type==='toolCall');
  expect(restoredCall.id).not.toContain('|fc_');expect(restoredTool.message.toolCallId).toBe(restoredCall.id);
  expect(restored.find(entry=>entry.id===assistant.id).message.content).toContainEqual({type:'thinking',thinking:'Unmodified provider context',thinkingSignature:opaqueSignature});
  expect(statSync(sessionFile).mode&0o777).toBe(0o600);
  expect(readdirSync(dirname(sessionFile)).some(name=>name.endsWith('.redacted'))).toBe(false);
  assertPrivate(JSON.stringify(requests.at(-1).messages));
  expect(JSON.stringify(requests.at(-1).messages)).toContain(png);
},30000);
