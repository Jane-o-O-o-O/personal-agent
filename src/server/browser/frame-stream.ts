import type WebSocket from 'ws';
import type { BrowserFrame } from '../../shared/contracts.js';

export function createFrameSender(socket: WebSocket, acknowledged: boolean) {
  let pending: BrowserFrame | undefined;
  let inFlight: number | undefined;
  let sequence = 0;
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const flush = () => {
    if (!pending || inFlight !== undefined || socket.readyState !== 1) return;
    const frame = pending;
    pending = undefined;
    inFlight = ++sequence;
    timeout = setTimeout(() => socket.close(1013, 'Browser frame acknowledgment timed out.'), 15_000);
    timeout.unref();
    if (process.env.BROWSER_STREAM_DIAGNOSTICS === 'true')
      console.error(JSON.stringify({ browserRelay: { event: 'public-frame', at: Date.now(), generation: frame.generation, sequence: inFlight, bufferedAmount: socket.bufferedAmount } }));
    socket.send(JSON.stringify({ ...frame, sequence: inFlight }), error => {
      if (error) socket.close();
    });
  };

  const close = () => {
    clearTimeout(timeout);
    pending = undefined;
    inFlight = undefined;
  };
  socket.on('close', close);
  socket.on('error', close);

  return {
    send(frame: BrowserFrame) {
      if (!acknowledged) {
        if (socket.readyState === 1 && socket.bufferedAmount < 2 * 1024 * 1024)
          socket.send(JSON.stringify(frame));
        return;
      }
      // A client ACK bounds the queue even when TCP or a proxy has hidden buffers.
      pending = frame;
      flush();
    },
    acknowledge(value: unknown) {
      if (!acknowledged || !Number.isSafeInteger(value) || value !== inFlight) return;
      clearTimeout(timeout);
      inFlight = undefined;
      flush();
    },
  };
}
