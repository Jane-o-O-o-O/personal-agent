import { expect, it } from 'vitest';
import { BrowserInputQueue } from '../../src/client/browser-input-queue';
import type { BrowserInput } from '../../src/shared/contracts';

const context = { generation: 1, tabId: 'one' };
const scroll = (deltaY: number): BrowserInput => ({ ...context, type: 'scroll', x: 100, y: 100, deltaX: 0, deltaY });

it('coalesces queued scrolling during a slow request and preserves the exact total', async () => {
  const sent: BrowserInput[] = [];
  let release!: () => void;
  const queue = new BrowserInputQueue(async input => {
    sent.push({ ...input });
    if (sent.length === 1) await new Promise<void>(resolve => { release = resolve; });
    return true;
  });
  const results = [queue.enqueue(scroll(5))];
  await Promise.resolve();
  for (let index = 0; index < 40; index++) results.push(queue.enqueue(scroll(5)));
  expect(sent).toHaveLength(1);
  const idle = queue.idle();
  release();
  await idle;
  expect(await Promise.all(results)).toEqual(Array(41).fill(true));
  expect(sent.map(input => input.deltaY)).toEqual([5, 200]);
});

it('never merges gestures across clicks, keys, contexts, modifiers, or scroll targets', async () => {
  const sent: BrowserInput[] = [];
  const queue = new BrowserInputQueue(async input => { sent.push(input); return true; });
  const inputs: BrowserInput[] = [scroll(1), scroll(2), { ...context, type: 'click', x: 100, y: 100 }, scroll(3),
    { ...context, type: 'key', key: 'A', code: 'KeyA', text: 'A', modifiers: 8 }, scroll(4),
    { ...scroll(5), modifiers: 2 }, { ...scroll(6), x: 101 }, { ...scroll(7), generation: 2 }, { ...scroll(8), tabId: 'two' }];
  await Promise.all(inputs.map(input => queue.enqueue(input)));
  expect(sent).toEqual([{ ...scroll(3) }, ...inputs.slice(2)]);
});

it('coalesces drag moves to the latest coordinate without crossing a button release', async () => {
  const sent: BrowserInput[] = [];
  const queue = new BrowserInputQueue(async input => { sent.push(input); return true; });
  const inputs: BrowserInput[] = [{ ...context, type: 'mouse_down', x: 0, y: 0, button: 'left', buttons: 1 },
    { ...context, type: 'move', x: 10, y: 10, buttons: 1 }, { ...context, type: 'move', x: 20, y: 20, buttons: 1 },
    { ...context, type: 'mouse_up', x: 20, y: 20, button: 'left', buttons: 0 },
    { ...context, type: 'move', x: 30, y: 30, buttons: 0 }];
  await Promise.all(inputs.map(input => queue.enqueue(input)));
  expect(sent).toEqual([inputs[0], inputs[2], inputs[3], inputs[4]]);
});

it('bounds distinct pending actions, reports overflow, and does not strand later delivery', async () => {
  const sent: BrowserInput[] = [];
  let overflow = 0;
  const queue = new BrowserInputQueue(async input => { sent.push(input); return true; }, () => { overflow++; });
  const results = Array.from({ length: 256 }, () => queue.enqueue({ ...context, type: 'key', key: 'a', code: 'KeyA', text: 'a' }));
  const released = queue.enqueue({ ...context, type: 'mouse_up', x: 0, y: 0, button: 'left', buttons: 0 });
  expect(overflow).toBe(1);
  expect((await Promise.all(results)).filter(Boolean)).toHaveLength(255);
  expect(await released).toBe(true);
  await queue.idle();
  expect(sent).toHaveLength(256);
  expect(await queue.enqueue(scroll(1))).toBe(true);
});

it('cancels unsent actions on unmount without claiming an in-flight request was cancelled', async () => {
  const sent: BrowserInput[] = [];
  let release!: () => void;
  const queue = new BrowserInputQueue(async input => {
    sent.push(input);
    await new Promise<void>(resolve => { release = resolve; });
    return true;
  });
  const inFlight = queue.enqueue(scroll(1));
  await Promise.resolve();
  const pending = queue.enqueue({ ...context, type: 'click', x: 50, y: 50 });
  queue.cancelPending();
  expect(await pending).toBe(false);
  expect(sent).toHaveLength(1);
  release();
  expect(await inFlight).toBe(true);
  await queue.idle();
});

it('preserves a queued mouse release on unmount after its pointer gesture has already ended', async () => {
  const sent: BrowserInput[] = [];
  let release!: () => void;
  const queue = new BrowserInputQueue(async input => {
    sent.push(input);
    if (sent.length === 1) await new Promise<void>(resolve => { release = resolve; });
    return true;
  });
  const inFlight = queue.enqueue({ ...context, type: 'move', x: 30, y: 30, buttons: 1 });
  await Promise.resolve();
  const discarded = queue.enqueue({ ...context, type: 'key', key: 'x', code: 'KeyX', text: 'x' });
  const mouseUp = queue.enqueue({ ...context, type: 'mouse_up', x: 30, y: 30, button: 'left', buttons: 0 });
  queue.cancelPending({ preserveMouseUp: true });
  expect(await discarded).toBe(false);
  release();
  expect(await inFlight).toBe(true);
  expect(await mouseUp).toBe(true);
  await queue.idle();
  expect(sent.map(input => input.type)).toEqual(['move', 'mouse_up']);
});
