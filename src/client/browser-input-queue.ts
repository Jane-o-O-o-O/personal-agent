import type { BrowserInput } from '../shared/contracts';

type Entry = { input: BrowserInput; resolve: (sent: boolean) => void; result: Promise<boolean> };

// Keep discrete actions in order while avoiding one network round trip for
// every trackpad or drag sample. Only adjacent, equivalent gestures may merge.
export class BrowserInputQueue {
  private pending: Entry[] = [];
  private running = false;
  private scheduled = false;
  private idleWaiters: (() => void)[] = [];

  constructor(private readonly dispatch: (input: BrowserInput) => Promise<boolean>, private readonly onOverflow: () => void = () => {}) {}

  get busy() { return this.running || this.pending.length > 0; }

  enqueue(input: BrowserInput): Promise<boolean> {
    const previous = this.pending.at(-1);
    const sameContext = previous && previous.input.generation === input.generation
      && previous.input.tabId === input.tabId && (previous.input.modifiers ?? 0) === (input.modifiers ?? 0);
    if (sameContext && previous.input.type === 'scroll' && input.type === 'scroll'
          && previous.input.x === input.x && previous.input.y === input.y
          && Math.abs((previous.input.deltaX ?? 0) + (input.deltaX ?? 0))
            + Math.abs((previous.input.deltaY ?? 0) + (input.deltaY ?? 0)) <= 100_000) {
      previous.input.deltaX = (previous.input.deltaX ?? 0) + (input.deltaX ?? 0);
      previous.input.deltaY = (previous.input.deltaY ?? 0) + (input.deltaY ?? 0);
      return previous.result;
    } else if (sameContext && previous.input.type === 'move' && input.type === 'move'
          && (previous.input.buttons ?? 0) === (input.buttons ?? 0)) {
      previous.input = input;
      return previous.result;
    }
    // Reserve one slot for releasing a held mouse button even after a burst.
    if (this.pending.length >= (input.type === 'mouse_up' ? 256 : 255)) {
      this.onOverflow();
      return Promise.resolve(false);
    }
    let resolve!: (sent: boolean) => void;
    const result = new Promise<boolean>(done => { resolve = done; });
    this.pending.push({ input, resolve, result });
    if (!this.running && !this.scheduled) {
      this.scheduled = true;
      queueMicrotask(() => { this.scheduled = false; void this.pump(); });
    }
    return result;
  }

  idle(): Promise<void> {
    if (!this.busy) return Promise.resolve();
    return new Promise(resolve => this.idleWaiters.push(resolve));
  }

  cancelPending({ preserveMouseUp = false }: { preserveMouseUp?: boolean } = {}) {
    const discarded = this.pending.splice(0);
    for (const entry of discarded) {
      if (preserveMouseUp && entry.input.type === 'mouse_up') this.pending.push(entry);
      else entry.resolve(false);
    }
    if (!this.running && !this.pending.length) for (const resolve of this.idleWaiters.splice(0)) resolve();
  }

  private async pump() {
    if (this.running) return;
    this.running = true;
    try {
      while (this.pending.length) {
        const entry = this.pending.shift()!;
        let sent = false;
        try { sent = await this.dispatch(entry.input); } catch { /* The caller reports delivery errors. */ }
        entry.resolve(sent);
      }
    } finally {
      this.running = false;
      for (const resolve of this.idleWaiters.splice(0)) resolve();
    }
  }
}
