import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import websocket from '@fastify/websocket';
import staticFiles from '@fastify/static';
import { createReadStream, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import type { AppConfig } from './config.js';
import { Store } from './store.js';
import { SettingsStore } from './settings.js';
import { registerAuth } from './auth.js';
import { TaskService } from './tasks.js';
import { ModelConfigService } from './model-config.js';
import { MemoryService } from './memories.js';
import { GoalService } from './goals.js';
import { ApprovalService } from './approvals.js';
import { ArtifactService } from './artifacts.js';
import { PiRunner } from './pi-runtime.js';
import { createBrowserService } from './browser/index.js';
import { createFrameSender } from './browser/frame-stream.js';
import { createIntegrationService } from './integrations/index.js';
import { createEcosystemService } from './ecosystem/index.js';
import { createResendMailService } from './mail/resend.js';
import { createWeixinService } from './channels/weixin.js';
import { testMcp } from './mcp-test.js';
import { AppError, asObject, cleanError, textInput } from './errors.js';
import type { AppEvent, Approval, BrowserFrame, BrowserInput } from '../shared/contracts.js';
import type { ServerResponse } from 'node:http';

export async function createApp(config:AppConfig, options:{background?:boolean;ecosystemEndpointOverrides?:Partial<Record<'mcp-didi'|'mcp-luckin'|'mcp-variflight-aviation'|'mcp-variflight-tripmatch',string>>} = {}) {
  const app = Fastify({logger:false,bodyLimit:3 * 1024 * 1024,trustProxy:'127.0.0.1'});
  const eventStreams=new Set<ServerResponse>();
  const store = new Store(join(config.dataDir,'agent.sqlite'));
  const settings = new SettingsStore(store,config.encryptionKey);
  const models = new ModelConfigService(settings,config.dataDir);
  const tasks = new TaskService(store,() => models.state().configured);
  const memories = new MemoryService(store);
  const artifacts = new ArtifactService(store,config.dataDir);
  const approvals = new ApprovalService(store,(id,waiting) => tasks.waitingApproval(id,waiting));
  const goals = new GoalService(store,tasks);
  const browser = createBrowserService({dataDir:config.dataDir,onChange:state => store.publish('browser.updated','browser',state),beforeTakeover:() => tasks.pauseCurrent()});
  const integrations = createIntegrationService({store,settings,dataDir:config.dataDir});
  const ecosystem = createEcosystemService({store,settings,integrations,configuredMcpNames:()=>models.configuredMcpNames(),
    beforeMutation:()=>{if(tasks.list().some(task=>['running','waiting_approval','waiting_external'].includes(task.status)))
      throw new AppError('ECOSYSTEM_TASK_ACTIVE','有正在运行或等待外部结果的任务；请完成、暂停或取消任务后再安装、测试或卸载扩展。',409);},
    endpointOverrides:options.ecosystemEndpointOverrides});
  const mail = createResendMailService({store,settings,approvals});
  const weixin = createWeixinService({store,settings,createTask:(prompt,options) => tasks.create(prompt,options),cancelTask:id => tasks.control(id,'cancel'),getTasks:() => tasks.list(),getTask:id => tasks.get(id),getApprovals:()=>approvals.list(),decideApproval:(id,decision,hash,version)=>approvals.decide(id,decision,hash,version)});
  const unsubscribeApprovals=store.subscribe(event=>{if(event.type==='approval.created')weixin.enqueueApproval(event.payload as Approval);});
  tasks.setRunner(new PiRunner({dataDir:config.dataDir,models,browser,approvals,memories,artifacts,mail,
    integrationTools:() => integrations.activeTools(),
    mailEnabled:() => {const resend=integrations.list().find(item=>item.id==='resend');return Boolean(resend?.secretFields.apiKey && resend.config.enabled !== false);},
    managedMcp:() => ecosystem.managedConfigs(),
    sensitiveStrings:()=>[...settings.sensitiveStrings(),config.password,process.env.BROWSER_SERVICE_TOKEN || '']}));
  tasks.onCompleted = task => weixin.enqueueResult(task);
  approvals.recover(); tasks.recover();
  await app.register(cookie);
  await app.register(websocket,{options:{maxPayload:65536}});
  await registerAuth(app,store,config);
  app.addHook('onSend',async (_request,reply,payload) => {
    reply.header('X-Content-Type-Options','nosniff');
    reply.header('Referrer-Policy','same-origin');
    reply.header('X-Frame-Options','DENY');
    reply.header('Content-Security-Policy',"default-src 'self'; img-src 'self' data:; connect-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; frame-ancestors 'none'");
    if (_request.routeOptions.url?.startsWith('/api/')) reply.header('Cache-Control','no-store');
    return payload;
  });
  app.setErrorHandler((error,request,reply) => {
    const statusCode = (error as {statusCode?:number}).statusCode;
    const status = typeof statusCode === 'number' ? statusCode:500;
    reply.status(status).send({error:{code:error instanceof AppError ? error.code:(error as {code?:string}).code || 'INTERNAL_ERROR',message:cleanError(error,[...settings.sensitiveStrings(),models.config().apiKey])},requestId:request.id});
  });
  const integrationList = () => [models.integration(),...integrations.list(),weixin.integration(),models.mcpIntegration()];
  app.get('/api/health',async () => ({ok:true,version:'0.1.0',agent:'pi',modelConfigured:models.state().configured}));
  app.get('/api/bootstrap',async () => ({cursor:store.cursor(),model:models.state(),tasks:tasks.list(),integrations:integrationList(),pendingApprovals:approvals.list().filter(item => item.status === 'pending'),browser:await browser.status()}));
  app.get('/api/tasks',async () => tasks.list());
  app.post('/api/tasks',async request => {
    const input = asObject(request.body);
    return tasks.create(textInput(input.prompt,'prompt'),{title:typeof input.title === 'string' ? input.title:undefined,requestId:textInput(input.clientRequestId,'clientRequestId',200)});
  });
  app.get<{Params:{id:string}}>('/api/tasks/:id',async request => tasks.detail(request.params.id));
  app.post<{Params:{id:string}}>('/api/tasks/:id/messages',async request => {
    const input = asObject(request.body);
    if (input.mode !== undefined && !['follow_up','steer'].includes(String(input.mode))) throw new AppError('INVALID_INPUT','消息类型不正确');
    return tasks.message(request.params.id,textInput(input.text,'text'),textInput(input.clientRequestId,'clientRequestId',200),input.mode as 'follow_up'|'steer'|undefined);
  });
  for (const action of ['cancel','pause','resume'] as const) app.post<{Params:{id:string}}>(`/api/tasks/:id/${action}`,async request => {
    const input = request.body ? asObject(request.body):{};
    return tasks.control(request.params.id,action,typeof input.version === 'number' ? input.version:undefined);
  });
  app.get<{Querystring:{after?:string}}>('/api/events',async (request,reply) => {
    const rawId = request.headers['last-event-id'] || request.query.after || '0';
    let last = Number(rawId);
    if (!Number.isSafeInteger(last) || last < 0) throw new AppError('INVALID_CURSOR','事件游标不正确');
    reply.hijack();
    eventStreams.add(reply.raw);
    reply.raw.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no'});
    const write = (event:AppEvent) => {
      if (event.id <= last || reply.raw.destroyed) return;
      last = event.id;
      if (!reply.raw.write(`id: ${event.id}\ndata: ${JSON.stringify(event)}\n\n`) && reply.raw.writableLength > 4 * 1024 * 1024) reply.raw.destroy();
    };
    if (last > store.cursor()) { reply.raw.write('event: resync_required\ndata: {}\n\n'); last = 0; }
    const unsubscribe = store.subscribe(write);
    let backlog;
    do { backlog = store.eventsAfter(last); for (const event of backlog) write(event); } while (backlog.length === 1000 && !reply.raw.destroyed);
    reply.raw.write(': connected\n\n');
    const ping = setInterval(() => { if (!reply.raw.destroyed) reply.raw.write(': heartbeat\n\n'); },20000);
    ping.unref();
    reply.raw.on('close',() => { clearInterval(ping); unsubscribe(); eventStreams.delete(reply.raw); });
  });
  app.get('/api/integrations',async () => integrationList());
  app.get('/api/ecosystem',async () => ({items:ecosystem.list()}));
  app.post<{Params:{id:string}}>('/api/ecosystem/:id/install',async request => {
    const body=request.body ? asObject(request.body):{};
    return ecosystem.install(request.params.id,body.config === undefined ? {}:asObject(body.config));
  });
  app.delete<{Params:{id:string}}>('/api/ecosystem/:id',async request => ecosystem.uninstall(request.params.id));
  app.post<{Params:{id:string}}>('/api/ecosystem/:id/test',async request => ecosystem.test(request.params.id));
  app.patch<{Params:{id:string}}>('/api/integrations/:id',async request => {
    const input = asObject(request.body); const patch = asObject(input.config);
    const id = request.params.id;
    const result = id === 'model' ? models.update(patch):id === 'mcp' ? models.updateMcp(patch,ecosystem.reservedMcpNames()):integrations.update(id,patch);
    store.publish('integration.updated',id,result); return result;
  });
  app.post<{Params:{id:string}}>('/api/integrations/:id/test',async request => {
    const id = request.params.id;
    const result = id === 'model' ? await models.test():id === 'mcp' ? await testMcp(settings):await integrations.test(id);
    const integration = integrationList().find(item => item.id === id);
    if (integration) store.publish('integration.updated',id,integration);
    return result;
  });
  app.post('/api/integrations/weixin/connect',async () => weixin.connect());
  app.get('/api/integrations/weixin/login',async () => weixin.login());
  app.post('/api/integrations/weixin/verify',async request => weixin.verify(textInput(asObject(request.body).code,'code',30)));
  app.post('/api/integrations/weixin/disconnect',async () => { await weixin.disconnect(); return weixin.login(); });
  app.get('/api/memories',async () => memories.list());
  app.post('/api/memories',async request => {const input = asObject(request.body);return memories.create(textInput(input.content,'content',12000),typeof input.source === 'string' ? input.source:undefined);});
  app.patch<{Params:{id:string}}>('/api/memories/:id',async request => {const input=asObject(request.body);return memories.update(request.params.id,textInput(input.content,'content',12000),typeof input.version === 'number' ? input.version:undefined);});
  app.delete<{Params:{id:string}}>('/api/memories/:id',async request => {memories.delete(request.params.id);return {ok:true};});
  app.get('/api/goals',async () => goals.list());
  app.post('/api/goals',async request => goals.create(asObject(request.body)));
  app.patch<{Params:{id:string}}>('/api/goals/:id',async request => goals.update(request.params.id,asObject(request.body)));
  app.delete<{Params:{id:string}}>('/api/goals/:id',async request => {goals.delete(request.params.id);return {ok:true};});
  app.get('/api/approvals',async () => approvals.list().filter(item => item.status === 'pending'));
  app.post<{Params:{id:string}}>('/api/approvals/:id/decision',async request => {
    const input = asObject(request.body);
    if (input.decision !== 'approve' && input.decision !== 'reject') throw new AppError('INVALID_INPUT','批准决定不正确');
    return approvals.decide(request.params.id,input.decision,textInput(input.parametersHash,'parametersHash',100),typeof input.version === 'number' ? input.version:undefined);
  });
  app.get<{Params:{id:string}}>('/api/artifacts/:id/download',async (request,reply) => {
    const {artifact,path} = artifacts.get(request.params.id);
    reply.type(artifact.mimeType).header('Content-Disposition',`attachment; filename*=UTF-8''${encodeURIComponent(artifact.name)}`).header('Content-Length',artifact.size);
    return reply.send(createReadStream(path));
  });
  app.get('/api/browser',async () => browser.status());
  app.post('/api/browser/start',async () => browser.start());
  app.post('/api/browser/takeover',async request => browser.takeover(request.body ? asObject(request.body).generation as number|undefined:undefined));
  app.post('/api/browser/release',async request => browser.release(request.body ? asObject(request.body).generation as number|undefined:undefined));
  app.post('/api/browser/navigate',async request => {const input=asObject(request.body);return browser.navigate(textInput(input.url,'url',4000),input.generation as number|undefined);});
  app.post('/api/browser/tab',async request => {const input=asObject(request.body);return browser.selectTab(textInput(input.tabId,'tabId',200),input.generation as number|undefined);});
  app.post('/api/browser/history',async request => {const input=asObject(request.body);return browser.history(input.direction as 'back'|'forward',input.generation as number|undefined);});
  app.post('/api/browser/reload',async request => {const input=asObject(request.body);return browser.reload(input.generation as number|undefined);});
  app.post('/api/browser/tab/new',async request => {const input=asObject(request.body);return browser.newTab(input.url === undefined ? undefined:textInput(input.url,'url',4000),input.generation as number|undefined);});
  app.post('/api/browser/tab/close',async request => {const input=asObject(request.body);return browser.closeTab(textInput(input.tabId,'tabId',200),input.generation as number|undefined);});
  app.post('/api/browser/input',async request => {await browser.input(asObject(request.body) as unknown as BrowserInput);return {ok:true};});
  app.post('/api/browser/dialog',async request => {const input=asObject(request.body);if(typeof input.accept !== 'boolean' || typeof input.generation !== 'number') throw new AppError('INVALID_INPUT','弹窗请求不正确');await browser.handleDialog({accept:input.accept,generation:input.generation,promptText:typeof input.promptText === 'string' ? input.promptText:undefined});return {ok:true};});
  app.get<{Querystring:{ack?:string}}>('/api/browser/stream',{websocket:true},(socket,request) => {
    let unsubscribe:()=>void = () => {};
    const frames = createFrameSender(socket,request.query.ack === '1');
    const send = (value:unknown) => {
      const frame = value as { type?: string; generation?: number };
      const accepted = socket.readyState === 1 && socket.bufferedAmount < 2 * 1024 * 1024;
      if (frame.type === 'frame' && process.env.BROWSER_STREAM_DIAGNOSTICS === 'true')
        console.error(JSON.stringify({ browserRelay: { event: 'public-frame-offered', at: Date.now(), generation: frame.generation, accepted, bufferedAmount: socket.bufferedAmount } }));
      if (frame.type === 'frame') frames.send(value as BrowserFrame);
      else if (accepted) socket.send(JSON.stringify(value));
    };
    unsubscribe = browser.subscribeFrames(send);
    void browser.status().then(state => send({type:'state',state}));
    socket.on('message',async bytes => {
      try {
        const input = asObject(JSON.parse(bytes.toString()));
        if (input.type === 'frame_ack') frames.acknowledge(input.sequence);
        else await browser.input(input as unknown as BrowserInput);
      }
      catch(error) {send({type:'error',message:cleanError(error)});}
    });
    socket.on('close',() => unsubscribe());
    socket.on('error',() => unsubscribe());
  });
  const staticRoot = resolve('dist/client');
  if (existsSync(staticRoot)) {
    await app.register(staticFiles,{root:staticRoot,prefix:'/',index:'index.html'});
    app.setNotFoundHandler((request,reply) => {
      if (request.url.startsWith('/api/')) return reply.status(404).send({error:{code:'NOT_FOUND',message:'接口不存在'}});
      return reply.type('text/html').sendFile('index.html');
    });
  }
  app.addHook('preClose',async () => {for(const stream of eventStreams) stream.end();goals.stop();await weixin.stop();await tasks.dispose();});
  app.addHook('onClose',async () => { unsubscribeApprovals();await browser.dispose(); store.close(); });
  if (options.background !== false) {
    goals.start(); tasks.kick(); void weixin.start().catch(() => {});
  }
  return {app,store,settings,models,tasks,memories,goals,approvals,artifacts,browser,integrations,ecosystem,weixin};
}
