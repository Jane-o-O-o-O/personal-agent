import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { Store } from '../../src/server/store.js';
import { SettingsStore } from '../../src/server/settings.js';
import { TaskService, type AgentInput, type AgentRunner, type RunCallbacks } from '../../src/server/tasks.js';
import { ApprovalService } from '../../src/server/approvals.js';
import { MemoryService } from '../../src/server/memories.js';
import { GoalService, nextScheduledAt } from '../../src/server/goals.js';
import { createApp } from '../../src/server/app.js';
import type { AppConfig } from '../../src/server/config.js';

const resources: {directory:string;store?:Store;close?:()=>Promise<void>}[] = [];
function fixture() {
  const directory = mkdtempSync(join(tmpdir(),'pa-core-')); const store = new Store(join(directory,'test.sqlite'));
  resources.push({directory,store}); return {directory,store};
}
afterEach(async () => {for(const resource of resources.splice(0)) {await resource.close?.();resource.store?.close();rmSync(resource.directory,{recursive:true,force:true});}});
const until = async (fn:()=>boolean) => {const end=Date.now()+5000;while(!fn()){if(Date.now()>end) throw new Error('Timed out');await new Promise(resolve=>setTimeout(resolve,10));}};
const pendingInputs=(store:Store,id:string):AgentInput[] => JSON.parse(store.get<{json:string}>('SELECT json FROM tasks WHERE id=?',id)!.json).pendingInputs;

describe('durable task service',() => {
  it('deduplicates requests and retains unconfigured tasks',() => {
    const {store}=fixture(); const tasks=new TaskService(store,()=>false);
    const first=tasks.create('查询今天的天气',{requestId:'same'}); const second=tasks.create('查询今天的天气',{requestId:'same'});
    expect(first.id).toBe(second.id);expect(tasks.list()).toHaveLength(1);expect(first.status).toBe('waiting_user');
    expect(()=>tasks.create('different',{requestId:'same'})).toThrow('不同内容');
    expect(tasks.detail(first.id).messages).toHaveLength(1);
  });
  it('cancels in-flight tools and does not start later actions',async () => {
    const {store}=fixture();let started=false;let completed=false;
    const runner:AgentRunner={async run(_task,inputs,callbacks,signal){callbacks.inputConsumed(inputs.map(input=>input.id));started=true;await new Promise<void>((_resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('cancelled')),{once:true}));completed=true;return 'bad';},async dispose(){}};
    const tasks=new TaskService(store,()=>true);tasks.setRunner(runner);const task=tasks.create('slow');await until(()=>started);
    await tasks.control(task.id,'cancel');expect(tasks.get(task.id)?.status).toBe('cancelled');expect(completed).toBe(false);await tasks.dispose();
  });
  it('pauses interrupted runs after a restart without replay',() => {
    const {store}=fixture();const tasks=new TaskService(store,()=>true);const task=tasks.create('write');tasks.update(task.id,{status:'running'});
    const restored=new TaskService(store,()=>true);restored.recover();expect(restored.get(task.id)?.status).toBe('paused');expect(restored.get(task.id)?.waitingReason).toBe('server_restart');
  });
  it('retains a message arriving before the Pi session is ready',async () => {
    const {store}=fixture();const inputs:string[]=[];let release:()=>void=()=>{};
    const first=new Promise<void>(resolve=>{release=resolve;});
    const runner:AgentRunner={async run(_task,pending,callbacks){const input=pending.map(item=>item.text).join('\n\n');inputs.push(input);callbacks.inputConsumed(pending.map(item=>item.id));if(inputs.length===1)await first;return input;},async send(){throw new (await import('../../src/server/errors.js')).AppError('TASK_NOT_RUNNING','still starting',409);},async dispose(){}};
    const tasks=new TaskService(store,()=>true);tasks.setRunner(runner);const task=tasks.create('first');await until(()=>inputs.length===1);
    await tasks.message(task.id,'second','early-follow-up');release();await until(()=>tasks.get(task.id)?.status==='succeeded');
    expect(inputs).toEqual(['first','second']);expect(tasks.detail(task.id).messages.filter(message=>message.role==='user')).toHaveLength(2);await tasks.dispose();
  });
  it('waits for in-flight deliveries before finalizing the remaining queue',async()=>{
    const {store}=fixture();const inputs:string[]=[];let releaseRun:()=>void=()=>{};let acknowledgeSend:()=>void=()=>{};
    const runDone=new Promise<void>(resolve=>{releaseRun=resolve;});const sendDone=new Promise<void>(resolve=>{acknowledgeSend=resolve;});
    let activeCallbacks:RunCallbacks;
    const runner:AgentRunner={async run(_task,pending,callbacks){activeCallbacks=callbacks;inputs.push(pending.map(item=>item.text).join('\n\n'));callbacks.inputConsumed(pending.map(item=>item.id));await runDone;return 'complete';},async send(input){await sendDone;activeCallbacks.inputConsumed([input.id]);},async dispose(){}};
    const tasks=new TaskService(store,()=>true);tasks.setRunner(runner);const task=tasks.create('first');await until(()=>inputs.length===1);
    const delivery=tasks.message(task.id,'follow-up','race-follow-up');releaseRun();await new Promise(resolve=>setTimeout(resolve,20));
    expect(tasks.get(task.id)?.status).toBe('running');acknowledgeSend();await delivery;await until(()=>tasks.get(task.id)?.status==='succeeded');
    expect(inputs).toEqual(['first']);await tasks.dispose();
  });
  it('preserves accepted but unconsumed follow-ups after failure and resumes only those inputs',async()=>{
    const {store}=fixture();const inputs:string[]=[];let failRun:(error:Error)=>void=()=>{};
    const failure=new Promise<void>((_resolve,reject)=>{failRun=reject;});
    const runner:AgentRunner={async run(_task,pending,callbacks){inputs.push(pending.map(item=>item.text).join('\n\n'));callbacks.inputConsumed(pending.map(item=>item.id));if(inputs.length===1)await failure;return 'complete';},async send(){},async dispose(){}};
    const tasks=new TaskService(store,()=>true);tasks.setRunner(runner);const task=tasks.create('first');await until(()=>inputs.length===1);
    await tasks.message(task.id,'unconsumed','queued-follow-up');
    const pending=pendingInputs(store,task.id);expect(pending.map(input=>input.text)).toEqual(['unconsumed']);
    failRun(new Error('provider failed'));await until(()=>tasks.get(task.id)?.status==='failed');
    expect(pendingInputs(store,task.id)).toEqual(pending);
    await tasks.control(task.id,'resume');await until(()=>tasks.get(task.id)?.status==='succeeded');
    expect(inputs).toEqual(['first','unconsumed']);expect(pendingInputs(store,task.id)).toEqual([]);await tasks.dispose();
  });
  it('commits events with state and emits nothing on rollback',() => {
    const {store}=fixture();const events:unknown[]=[];store.subscribe(event=>events.push(event));
    expect(()=>store.transaction(()=>{store.publish('test','entity',{});throw new Error('rollback');})).toThrow();
    expect(store.cursor()).toBe(0);expect(events).toHaveLength(0);
    store.transaction(()=>store.publish('test','entity',{}));expect(events).toHaveLength(1);
  });
});
describe('approvals, memory and schedules',() => {
  it('binds approvals to exact parameters and cancellation',async () => {
    const {store}=fixture();const tasks=new TaskService(store,()=>true);const task=tasks.create('browser');
    const approvals=new ApprovalService(store,()=>{});const controller=new AbortController();let executed=false;
    const waiting=approvals.request(task.id,'browser_execute',{code:'click()'},controller.signal).then(()=>{executed=true;});
    const approval=approvals.list()[0];expect(()=>approvals.decide(approval.id,'approve','wrong')).toThrow('核对');
    controller.abort();await expect(waiting).rejects.toThrow();expect(executed).toBe(false);expect(approvals.list()[0].status).toBe('cancelled');
  });
  it('approves once and rejects duplicate decisions',async () => {
    const {store}=fixture();const task=new TaskService(store,()=>true).create('browser');const approvals=new ApprovalService(store,()=>{});
    const waiting=approvals.request(task.id,'action',{item:1},new AbortController().signal);const approval=approvals.list()[0];
    approvals.decide(approval.id,'approve',approval.parametersHash,approval.version);await waiting;
    expect(()=>approvals.decide(approval.id,'approve',approval.parametersHash)).toThrow('核对');
  });
  it('updates and deletes current memory results',() => {
    const {store}=fixture();const memories=new MemoryService(store);const memory=memories.create('上海出发');expect(memories.search('上海')).toHaveLength(1);
    memories.update(memory.id,'北京出发',memory.version);expect(memories.search('上海')).toHaveLength(0);memories.delete(memory.id);expect(memories.search('北京')).toHaveLength(0);
  });
  it('uses Shanghai time and deduplicates a schedule instance',() => {
    const {store}=fixture();const tasks=new TaskService(store,()=>false);const goals=new GoalService(store,tasks);
    expect(nextScheduledAt({type:'daily',time:'08:30'},Date.parse('2026-10-03T23:00:00Z'))).toBe('2026-10-04T00:30:00.000Z');
    const goal=goals.create({title:'日历',prompt:'今天上班吗',schedule:{type:'once',at:'2026-10-03T00:00:00Z'}});
    goals.tick(Date.parse('2026-10-03T01:00:00Z'));goals.tick(Date.parse('2026-10-03T01:00:00Z'));
    expect(tasks.list()).toHaveLength(1);expect(goals.list()[0].enabled).toBe(false);expect(tasks.list()[0].goalId).toBe(goal.id);
  });
});
describe('authenticated API',() => {
  it('protects APIs, rejects cross-origin mutations and never returns a configured key',async () => {
    const directory=mkdtempSync(join(tmpdir(),'pa-http-'));mkdirSync(directory,{recursive:true});
    const config:AppConfig={host:'127.0.0.1',port:3420,dataDir:directory,password:'test-password-only',encryptionKey:randomBytes(32),cookieSecure:false,publicOrigin:'http://127.0.0.1:3420'};
    const {app,store,settings}=await createApp(config,{background:false});resources.push({directory,close:()=>app.close()});
    expect((await app.inject({url:'/api/tasks'})).statusCode).toBe(401);
    const rejected=await app.inject({method:'POST',url:'/api/auth/login',headers:{origin:'https://wrong.example'},payload:{password:config.password}});expect(rejected.statusCode).toBe(403);
    const login=await app.inject({method:'POST',url:'/api/auth/login',payload:{password:config.password}});expect(login.statusCode).toBe(200);
    const cookie=String(login.headers['set-cookie']).split(';')[0];
    const secret='test-only-private-key-not-a-real-credential';
    const updated=await app.inject({method:'PATCH',url:'/api/integrations/model',headers:{cookie},payload:{config:{provider:'custom',model:'test',baseUrl:'https://model.example/v1',apiKey:secret}}});
    expect(updated.statusCode).toBe(200);expect(updated.body).not.toContain(secret);expect(updated.json().secretFields.apiKey).toBe(true);
    const bootstrap=await app.inject({url:'/api/bootstrap',headers:{cookie}});expect(bootstrap.statusCode).toBe(200);expect(bootstrap.body).not.toContain(secret);
    expect(store.get<{value:string}>('SELECT value FROM settings WHERE key=?','integration:model')!.value).not.toContain(secret);
    expect(settings.get<{apiKey:string}>('integration:model',{apiKey:''}).apiKey).toBe(secret);
  });
});
