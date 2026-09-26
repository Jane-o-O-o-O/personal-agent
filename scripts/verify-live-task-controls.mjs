import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const terminal = new Set(['succeeded', 'failed', 'cancelled']);
const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const userMessages = detail => detail.messages.filter(message => message.role === 'user');
const lastLine = text => text.trim().split(/\r?\n/).filter(line => line.trim()).at(-1)?.trim();

function assertFinalLabel(detail, label) {
  assert.equal(detail.task.status, 'succeeded', 'Real model task must succeed');
  assert.equal(lastLine(detail.task.result || ''), label, 'Final reply must end with the exact scenario label');
  assert.equal((detail.task.result || '').split(label).length - 1, 1, 'Scenario label must occur exactly once');
  assert.ok(detail.messages.some(message => message.role === 'assistant' && message.status === 'complete' && message.text.includes(label)), 'Persisted assistant reply must contain the scenario label');
}

function taskSummary(detail) {
  return {
    taskId: detail.task.id,
    status: detail.task.status,
    runCount: detail.task.runCount,
    sessionFile: detail.task.sessionFile,
    userMessages: userMessages(detail).length,
    assistantMessages: detail.messages.filter(message => message.role === 'assistant').length,
  };
}

export async function runTaskControls(client, record, context) {
  const { marker, createTask, waitTask, waitFor } = context;
  const prefix = marker.replace(/[^a-z0-9]/gi, '').slice(-30);
  const label = kind => `VERIFY_${kind}_${prefix}`;
  const detail = id => client.request('GET', `/tasks/${encodeURIComponent(id)}`);
  const control = (id, action) => client.request('POST', `/tasks/${encodeURIComponent(id)}/${action}`, {});
  const send = (id, text, mode, clientRequestId) => client.request('POST', `/tasks/${encodeURIComponent(id)}/messages`, { text, mode, clientRequestId });
  const goals = () => client.request('GET', '/goals');
  const goalTasks = async id => (await client.request('GET', '/tasks')).filter(task => task.goalId === id);
  const createGoal = input => client.request('POST', '/goals', input);
  const patchGoal = (id, input) => client.request('PATCH', `/goals/${encodeURIComponent(id)}`, input);

  async function releaseTask(id) {
    if (!id) return;
    const current = await detail(id);
    if (!terminal.has(current.task.status)) {
      const stopped = await control(id, 'cancel');
      assert.ok(terminal.has(stopped.status), 'Scenario cleanup must release the task execution slot');
    }
  }

  async function releaseGoal(id) {
    if (!id) return;
    // Delete first so the scheduler cannot add another task during cleanup.
    await client.request('DELETE', `/goals/${encodeURIComponent(id)}`);
    for (const task of await goalTasks(id)) await releaseTask(task.id);
    assert.ok(!(await goals()).some(goal => goal.id === id), 'Test goal must be deleted');
  }

  async function streamingTask(id) {
    const observed = await waitFor(async () => {
      const current = await detail(id);
      const streaming = current.messages.find(message => message.role === 'assistant' && message.status === 'streaming' && message.text.length > 0);
      return current.task.sessionFile && current.task.status === 'running' && streaming
        ? { current, streaming }
        : terminal.has(current.task.status) ? { current } : false;
    }, { timeoutMs: 90000 });
    assert.equal(observed.current.task.status, 'running', 'Control must be exercised while a real model is running');
    assert.ok(observed.streaming, 'A nonempty assistant stream must be observed before control');
    return observed;
  }

  await record('live assistant stream and steering change the itinerary', async () => {
    let taskId;
    try {
      const originalLabel = label('ORIGINAL');
      const finalLabel = label('STEER');
      const task = await createTask(`请帮我制定杭州两天亲子城市步行行程，适合带8岁孩子和长辈，考虑休息、下雨替代活动和低预算用餐。给出约600字的通用规划建议，不查询实时票价或营业时间，也不使用浏览器、记忆或文件工具。先写一小段规划原则，再分早中晚写具体安排。答复最后一行必须只有 ${originalLabel}，不要在其他位置重复标签。`, `${marker} 真实流式行程改向`);
      taskId = task.id;
      const observed = await streamingTask(taskId);
      await send(taskId, `更改计划：实际目的地是成都，只有半天，不要继续杭州两天方案。请按带孩子和长辈、步行少、休息多的要求给出约200字的成都半天通用安排，方案标题明确写“成都半天行程”，不查询实时信息，不使用工具。新的最终答复最后一行必须只有 ${finalLabel}，不要重复旧标签或在其他位置重复新标签。`, 'steer', randomUUID());
      const completed = await waitTask(taskId, { timeoutMs: 150000 });
      assertFinalLabel(completed, finalLabel);
      assert.ok(completed.task.result.includes('成都'), 'Steering must affect the final destination');
      assert.ok(!completed.task.result.includes(originalLabel), 'Final result must use the updated scenario label');
      assert.equal(userMessages(completed).length, 2, 'Steering must add one persisted user message');
      return { ...taskSummary(completed), observedStream: { messageId: observed.streaming.id, characters: observed.streaming.text.length }, destination: '成都', finalLabel };
    } finally { await releaseTask(taskId); }
  });

  await record('live follow-up runs once and duplicate messages preserve the result', async () => {
    let taskId;
    try {
      const firstLabel = label('BASE');
      const finalLabel = label('FOLLOWUP');
      const task = await createTask(`请为周末在上海市区独自放松的人安排一份约100字的通用半日待办，不查询实时信息，不调用工具。最后一行必须只有 ${firstLabel}，标签仅出现一次。`, `${marker} 真实追加待办`);
      taskId = task.id;
      const before = await waitTask(taskId, { timeoutMs: 120000 });
      assertFinalLabel(before, firstLabel);
      const requestId = randomUUID();
      const text = `追加需求：周末下雨，请将刚才的安排改成以室内活动和休息为主的约150字半日待办，直接给出修订方案，不调用工具。最后一行必须只有 ${finalLabel}，标签仅出现一次。`;
      await send(taskId, text, 'follow_up', requestId);
      await send(taskId, text, 'follow_up', requestId);
      const completed = await waitTask(taskId, { timeoutMs: 120000 });
      assertFinalLabel(completed, finalLabel);
      assert.match(completed.task.result, /室内|下雨|雨天|避雨/, 'Follow-up must change the practical plan');
      assert.equal(userMessages(completed).length, userMessages(before).length + 1, 'Duplicate request must not add another user message');
      assert.equal(completed.task.runCount, before.task.runCount + 1, 'Completed-task follow-up must run once');
      const replay = await send(taskId, text, 'follow_up', requestId);
      assert.equal(replay.result, completed.task.result, 'Post-completion duplicate must preserve the completed result');
      assert.equal(replay.runCount, completed.task.runCount, 'Post-completion duplicate must not rerun the model');
      const after = await detail(taskId);
      assert.equal(after.task.version, completed.task.version, 'Idempotent replay must not mutate task state');
      assert.deepEqual(after.messages, completed.messages, 'Idempotent replay must preserve the message history');
      const conflict = await client.rawRequest('POST', `/tasks/${encodeURIComponent(taskId)}/messages`, { text: `${text} 修改内容`, mode: 'follow_up', clientRequestId: requestId });
      assert.equal(conflict.status(), 409, 'Reusing a message request ID for changed content must conflict');
      assert.equal((await conflict.json()).error.code, 'IDEMPOTENCY_CONFLICT');
      return { ...taskSummary(after), repeatedRequests: 3, conflictingRequestStatus: 409, finalLabel };
    } finally { await releaseTask(taskId); }
  });

  await record('live pause and resume retain the same Pi session', async () => {
    let taskId;
    try {
      const finalLabel = label('RESUME');
      const task = await createTask(`请为计划在苏州度过一个周末的上班族做一份约600字的通用休息行程，按周五晚、周六早中晚、周日早中晚组织，考虑少步行、安静活动、下雨替代安排和收拾返程。不需要当前价格或营业时间，不调用工具。任务可能被我暂停，恢复后请结合已有内容给出完整精简方案。完整答复最后一行必须只有 ${finalLabel}，标签仅出现一次。`, `${marker} 真实暂停恢复行程`);
      taskId = task.id;
      const observed = await streamingTask(taskId);
      const paused = await control(taskId, 'pause');
      assert.equal(paused.status, 'paused');
      assert.equal(paused.waitingReason, 'user_pause');
      const stopped = await detail(taskId);
      assert.equal(stopped.task.runCount, observed.current.task.runCount);
      assert.equal(stopped.task.sessionFile, observed.current.task.sessionFile);
      assert.ok(!stopped.messages.some(message => message.status === 'streaming'), 'Pause must close in-progress assistant messages');
      assert.ok(!stopped.operations.some(operation => operation.status === 'running'), 'Pause must close in-progress operations');
      await control(taskId, 'resume');
      const completed = await waitTask(taskId, { timeoutMs: 150000 });
      assertFinalLabel(completed, finalLabel);
      assert.equal(completed.task.runCount, stopped.task.runCount + 1, 'Resume must start exactly one new run');
      assert.equal(completed.task.sessionFile, stopped.task.sessionFile, 'Resume must open the same persistent Pi session');
      assert.equal(userMessages(completed).length, 1, 'Pause/resume must not duplicate the original user message');
      return { ...taskSummary(completed), pausedRunCount: stopped.task.runCount, sameSession: true, finalLabel };
    } finally { await releaseTask(taskId); }
  });

  await record('live cancellation stops output and leaves the task cancelled', async () => {
    let taskId;
    try {
      const task = await createTask('请为一个第一次独自搬家的上班族制定约600字的实用搬家清单，按提前一周、前一天、搬家当天、入住后整理，考虑租赁交接、生活用品、休息和小预算。只给出通用建议，不调用任何工具。', `${marker} 真实取消搬家清单`);
      taskId = task.id;
      const observed = await streamingTask(taskId);
      const cancelled = await control(taskId, 'cancel');
      assert.equal(cancelled.status, 'cancelled');
      const before = await detail(taskId);
      assert.ok(!before.messages.some(message => message.status === 'streaming'), 'Cancel must close the assistant stream');
      assert.ok(!before.operations.some(operation => operation.status === 'running'), 'Cancel must close running operations');
      await sleep(3000);
      const after = await detail(taskId);
      assert.equal(after.task.status, 'cancelled');
      assert.equal(after.task.runCount, before.task.runCount, 'Cancelled task must not start another run');
      assert.equal(after.task.version, before.task.version, 'Cancelled task state must remain stable');
      assert.deepEqual(after.messages, before.messages, 'No assistant delta may arrive after cancellation completes');
      assert.deepEqual(after.operations, before.operations, 'No operation may complete after cancellation completes');
      return { ...taskSummary(after), observedStreamCharacters: observed.streaming.text.length, stableAfterMs: 3000 };
    } finally { await releaseTask(taskId); }
  });

  await record('live task creation is idempotent and changed parameters conflict', async () => {
    let taskId;
    try {
      const finalLabel = label('CREATE');
      const body = { prompt: `请给出三条约50字的日常通勤准备建议，不调用工具。最后一行必须只有 ${finalLabel}，标签仅出现一次。`, title: `${marker} 创建幂等通勤任务`, clientRequestId: randomUUID() };
      const first = await client.request('POST', '/tasks', body);
      taskId = first.id;
      const second = await client.request('POST', '/tasks', body);
      assert.equal(second.id, first.id, 'Duplicate create request must return the same task');
      const conflict = await client.rawRequest('POST', '/tasks', { ...body, prompt: `${body.prompt} 内容已经变化。` });
      assert.equal(conflict.status(), 409, 'Reused create request ID with changed input must conflict');
      assert.equal((await conflict.json()).error.code, 'IDEMPOTENCY_CONFLICT');
      const completed = await waitTask(taskId, { timeoutMs: 120000 });
      assertFinalLabel(completed, finalLabel);
      assert.equal(userMessages(completed).length, 1);
      assert.equal(completed.task.runCount, 1);
      const replay = await client.request('POST', '/tasks', body);
      assert.equal(replay.id, first.id);
      assert.equal(replay.result, completed.task.result);
      assert.equal(replay.runCount, completed.task.runCount);
      return { ...taskSummary(completed), repeatedRequests: 3, conflictingRequestStatus: 409, finalLabel };
    } finally { await releaseTask(taskId); }
  });

  await record('one-time goal automatically invokes the real model and calendar tool once', async () => {
    let goalId;
    try {
      const finalLabel = label('ONCE');
      const date = '2026-10-03';
      const at = new Date(Date.now() + 4000).toISOString();
      const goal = await createGoal({ title: `${marker} 自动单次日历提醒`, prompt: `请实际调用 calendar_query 查询 ${date} 的中国日历，再给出一条约80字的休息日准备提醒，明确日期，不使用浏览器或其他工具。最后一行必须只有 ${finalLabel}，标签仅出现一次。`, schedule: { type: 'once', at }, maxRuns: 1, enabled: true });
      goalId = goal.id;
      const spawned = await waitFor(async () => {
        const tasks = await goalTasks(goalId);
        return tasks.length ? tasks : false;
      }, { timeoutMs: 30000 });
      assert.equal(spawned.length, 1, 'Once goal must create exactly one task');
      assert.equal(spawned[0].channel, 'schedule');
      assert.equal(spawned[0].goalId, goalId);
      assert.equal(spawned[0].scheduledFor, at);
      const completed = await waitTask(spawned[0].id, { timeoutMs: 120000 });
      assertFinalLabel(completed, finalLabel);
      assert.ok(completed.operations.some(operation => operation.name === 'calendar_query' && operation.status === 'succeeded' && operation.parameters.date === date), 'Scheduled task must actually query the requested calendar date');
      const after = (await goals()).find(item => item.id === goalId);
      assert.equal(after.runCount, 1);
      assert.equal(after.enabled, false);
      assert.equal(after.nextRunAt, null);
      await sleep(2200);
      assert.equal((await goalTasks(goalId)).length, 1, 'Disabled once goal must not fire on subsequent ticks');
      return { goalId, scheduledFor: at, ...taskSummary(completed), goalRunCount: 1, automaticallyDisabled: true, finalLabel };
    } finally { await releaseGoal(goalId); }
  });

  await record('one-minute recurring goal creates exactly two real tasks and stops at maxRuns', async () => {
    let goalId;
    try {
      const finalLabel = label('INTERVAL');
      const goal = await createGoal({ title: `${marker} 每分钟两次生活提醒`, prompt: `请实际调用 calendar_query 查询今天的中国日历，并给我一条约50字的喝水与休息提醒，不调用其他工具。最后一行必须只有 ${finalLabel}，标签仅出现一次。`, schedule: { type: 'interval', minutes: 1 }, maxRuns: 2, enabled: true });
      goalId = goal.id;
      const firstAt = goal.nextRunAt;
      const spawned = await waitFor(async () => {
        const tasks = await goalTasks(goalId);
        const current = (await goals()).find(item => item.id === goalId);
        assert.ok(current, 'Recurring test goal must still exist');
        assert.ok(tasks.length <= 2, 'Recurring goal must never exceed maxRuns');
        return tasks.length === 2 && current.enabled === false ? { tasks, goal: current } : false;
      }, { timeoutMs: 155000 });
      assert.equal(spawned.goal.runCount, 2);
      assert.equal(spawned.goal.nextRunAt, null);
      assert.equal(spawned.goal.enabled, false);
      const sorted = spawned.tasks.toSorted((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
      assert.equal(sorted[0].scheduledFor, firstAt);
      const gap = Date.parse(sorted[1].scheduledFor) - Date.parse(sorted[0].scheduledFor);
      assert.ok(gap >= 60000 && gap < 70000, 'Recurring schedule must advance by a real minute');
      const completed = [];
      for (const task of sorted) {
        assert.equal(task.channel, 'schedule');
        assert.equal(task.goalId, goalId);
        const result = await waitTask(task.id, { timeoutMs: 120000 });
        assertFinalLabel(result, finalLabel);
        assert.ok(result.operations.some(operation => operation.name === 'calendar_query' && operation.status === 'succeeded'), 'Every recurring task must really invoke the calendar tool');
        completed.push({ ...taskSummary(result), scheduledFor: task.scheduledFor });
      }
      assert.equal(new Set(sorted.map(task => task.id)).size, 2, 'Recurring executions must use distinct task IDs');
      assert.equal(new Set(sorted.map(task => task.scheduledFor)).size, 2, 'Each scheduled slot must be unique');
      await sleep(2200);
      assert.equal((await goalTasks(goalId)).length, 2, 'Reached maxRuns must stop further task creation');
      return { goalId, tasks: completed, scheduledGapMs: gap, goalRunCount: 2, automaticallyDisabled: true, finalLabel };
    } finally { await releaseGoal(goalId); }
  });

  await record('daily goal supports a valid China-time schedule and enable/disable/delete', async () => {
    let goalId;
    try {
      const chinaNow = new Date(Date.now() + 8 * 3600000);
      const time = `${String((chinaNow.getUTCHours() + 5) % 24).padStart(2, '0')}:${String(chinaNow.getUTCMinutes()).padStart(2, '0')}`;
      const goal = await createGoal({ title: `${marker} 每日生活计划`, prompt: '每天帮我整理一条通用生活待办提醒，不查询实时信息。', schedule: { type: 'daily', time }, maxRuns: 2, enabled: false });
      goalId = goal.id;
      assert.equal(goal.enabled, false);
      assert.equal(goal.nextRunAt, null);
      const enabled = await patchGoal(goalId, { enabled: true, version: goal.version });
      assert.equal(enabled.enabled, true);
      assert.ok(Date.parse(enabled.nextRunAt) > Date.now() + 4 * 3600000, 'Daily test schedule must be safely in the future');
      const nextChina = new Date(Date.parse(enabled.nextRunAt) + 8 * 3600000).toISOString().slice(11, 16);
      assert.equal(nextChina, time, 'Daily schedule must use the stated Asia/Shanghai time');
      const paused = await patchGoal(goalId, { enabled: false, version: enabled.version });
      assert.equal(paused.enabled, false);
      assert.equal(paused.nextRunAt, null);
      const resumed = await patchGoal(goalId, { enabled: true, version: paused.version });
      assert.equal(resumed.enabled, true);
      assert.equal(resumed.schedule.type, 'daily');
      assert.equal(resumed.schedule.time, time);
      assert.equal(resumed.runCount, 0);
      assert.equal((await goalTasks(goalId)).length, 0, 'Daily lifecycle test must not create an immediate task');
      await releaseGoal(goalId);
      goalId = undefined;
      return { schedule: { type: 'daily', time }, timezone: 'Asia/Shanghai', enableDisablePassed: true, deleted: true, actualDailyTrigger: 'Not observed; cross-day waiting intentionally excluded.' };
    } finally { await releaseGoal(goalId); }
  });
}
