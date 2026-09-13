import { randomUUID } from 'node:crypto';
import type { Goal, Schedule } from '../shared/contracts.js';
import type { Store } from './store.js';
import type { TaskService } from './tasks.js';
import { AppError, asObject, textInput } from './errors.js';

export function validateSchedule(value: unknown): Schedule {
  const input = asObject(value);
  if (input.type === 'once') {
    if (typeof input.at !== 'string' || !Number.isFinite(Date.parse(input.at))) throw new AppError('INVALID_SCHEDULE','时间不正确');
    return {type:'once',at:new Date(input.at).toISOString()};
  }
  if (input.type === 'daily' && typeof input.time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(input.time)) return {type:'daily',time:input.time};
  if (input.type === 'interval' && Number.isInteger(input.minutes) && Number(input.minutes) >= 1 && Number(input.minutes) <= 525600) return {type:'interval',minutes:Number(input.minutes)};
  throw new AppError('INVALID_SCHEDULE','计划不正确');
}
export function nextScheduledAt(schedule: Schedule, after = Date.now()): string {
  if (schedule.type === 'once') return schedule.at;
  if (schedule.type === 'interval') return new Date(after + schedule.minutes * 60000).toISOString();
  const local = new Date(after + 8 * 3600000);
  const [hour,minute] = schedule.time.split(':').map(Number);
  let next = Date.UTC(local.getUTCFullYear(),local.getUTCMonth(),local.getUTCDate(),hour,minute) - 8 * 3600000;
  if (next <= after) next += 86400000;
  return new Date(next).toISOString();
}
export class GoalService {
  private timer?: ReturnType<typeof setInterval>;
  constructor(private store:Store, private tasks:TaskService) {}
  list(): Goal[] { return this.store.all<{json:string}>('SELECT json FROM goals ORDER BY rowid DESC').map(row => JSON.parse(row.json)); }
  private save(goal:Goal) { this.store.run('INSERT INTO goals(id,json) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json',goal.id,JSON.stringify(goal)); this.store.publish('goal.updated',goal.id,goal); }
  create(input:Record<string,unknown>): Goal {
    const now = new Date().toISOString(); const schedule = validateSchedule(input.schedule);
    const maxRuns = input.maxRuns === undefined ? 100 : Number(input.maxRuns);
    if (!Number.isInteger(maxRuns) || maxRuns < 1 || maxRuns > 10000) throw new AppError('INVALID_INPUT','执行次数应在 1 至 10000 之间');
    const goal:Goal = {id:randomUUID(),title:textInput(input.title,'title',120),prompt:textInput(input.prompt,'prompt'),schedule,enabled:input.enabled !== false,maxRuns,runCount:0,nextRunAt:input.enabled === false ? null:nextScheduledAt(schedule),version:1,createdAt:now,updatedAt:now};
    this.store.transaction(() => this.save(goal)); return goal;
  }
  update(id:string,input:Record<string,unknown>): Goal {
    const goal = this.list().find(item => item.id === id);
    if (!goal) throw new AppError('NOT_FOUND','目标不存在',404);
    if (input.version !== undefined && input.version !== goal.version) throw new AppError('VERSION_CONFLICT','目标已更新',409);
    if (input.title !== undefined) goal.title = textInput(input.title,'title',120);
    if (input.prompt !== undefined) goal.prompt = textInput(input.prompt,'prompt');
    if (input.schedule !== undefined) goal.schedule = validateSchedule(input.schedule);
    if (input.enabled !== undefined) {
      if (typeof input.enabled !== 'boolean') throw new AppError('INVALID_INPUT','enabled 不正确'); goal.enabled = input.enabled;
    }
    if (input.maxRuns !== undefined) {
      const maxRuns = Number(input.maxRuns);
      if (!Number.isInteger(maxRuns) || maxRuns < 1 || maxRuns > 10000) throw new AppError('INVALID_INPUT','执行次数不正确'); goal.maxRuns = maxRuns;
    }
    if (goal.runCount >= goal.maxRuns) goal.enabled = false;
    if (!goal.enabled) goal.nextRunAt = null;
    else if (input.schedule !== undefined || input.enabled === true) goal.nextRunAt = nextScheduledAt(goal.schedule);
    goal.version++; goal.updatedAt = new Date().toISOString();
    this.store.transaction(() => this.save(goal)); return goal;
  }
  delete(id:string) { this.store.transaction(() => { this.store.run('DELETE FROM goals WHERE id=?',id); this.store.publish('goal.updated',id,{id,deleted:true}); }); }
  tick(now = Date.now()) {
    for (const goal of this.list()) {
      if (!goal.enabled || !goal.nextRunAt || Date.parse(goal.nextRunAt) > now) continue;
      const scheduledFor = goal.nextRunAt;
      this.store.transaction(() => {
        this.tasks.create(goal.prompt,{title:goal.title,goalId:goal.id,scheduledFor,channel:'schedule',requestId:`${goal.id}:${scheduledFor}`});
        goal.runCount++; goal.version++; goal.updatedAt = new Date(now).toISOString();
        if (goal.schedule.type === 'once' || goal.runCount >= goal.maxRuns) { goal.enabled = false; goal.nextRunAt = null; }
        else goal.nextRunAt = nextScheduledAt(goal.schedule,now);
        this.save(goal);
      });
    }
  }
  start() { this.tick(); this.timer = setInterval(() => this.tick(),1000); this.timer.unref(); }
  stop() { if (this.timer) clearInterval(this.timer); }
}
