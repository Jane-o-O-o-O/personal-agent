import { once } from 'node:events';
import { createServer, type Server } from 'node:http';
import WebSocket, { WebSocketServer } from 'ws';
import { afterEach, beforeEach, expect, it } from 'vitest';
import type { BrowserFrame } from '../../src/shared/contracts.js';
import { createFrameSender } from '../../src/server/browser/frame-stream.js';

let server: Server;
let sockets: WebSocketServer;
let client: WebSocket;

beforeEach(async () => {
  server = createServer();
  sockets = new WebSocketServer({ server });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
});

afterEach(async () => {
  client?.terminate();
  for (const socket of sockets.clients) socket.terminate();
  await new Promise<void>(resolve => sockets.close(() => resolve()));
  await new Promise<void>(resolve => server.close(() => resolve()));
});

async function connection(acknowledged: boolean) {
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Fixture address unavailable');
  const connected = once(sockets, 'connection');
  client = new WebSocket(`ws://127.0.0.1:${address.port}`);
  const frames: (BrowserFrame & { sequence?: number })[] = [];
  client.on('message', data => frames.push(JSON.parse(data.toString())));
  const [socket] = await connected as [WebSocket];
  if (client.readyState !== WebSocket.OPEN) await once(client, 'open');
  const sender = createFrameSender(socket, acknowledged);
  socket.on('message', data => sender.acknowledge(JSON.parse(data.toString()).sequence));
  const acknowledge = async (sequence: number) => {
    const received = once(socket, 'message');
    client.send(JSON.stringify({ type: 'frame_ack', sequence }));
    await received;
  };
  return { sender, frames, acknowledge };
}

function frame(generation: number): BrowserFrame {
  return { type: 'frame', generation, data: Buffer.from(`frame-${generation}`).toString('base64'), mimeType: 'image/jpeg', width: 1440, height: 900 };
}

it('keeps one in-flight frame and delivers the newest queued generation after an exact ACK', async () => {
  const { sender, frames, acknowledge } = await connection(true);
  sender.send(frame(1));
  await expect.poll(() => frames.length).toBe(1);
  expect(frames[0]).toMatchObject({ generation: 1, sequence: 1 });
  for (let generation = 2; generation <= 40; generation++) sender.send(frame(generation));
  await acknowledge(2);
  expect(frames).toHaveLength(1);
  await acknowledge(1);
  await expect.poll(() => frames.length).toBe(2);
  expect(frames[1]).toMatchObject({ generation: 40, sequence: 2 });
  sender.send(frame(41));
  await acknowledge(1);
  expect(frames).toHaveLength(2);
  await acknowledge(2);
  await expect.poll(() => frames.length).toBe(3);
  expect(frames[2]).toMatchObject({ generation: 41, sequence: 3 });
  await acknowledge(3);
  expect(frames).toHaveLength(3);
});

it('preserves the original stream for clients that have not opted into acknowledgment', async () => {
  const { sender, frames, acknowledge } = await connection(false);
  sender.send(frame(1));
  sender.send(frame(2));
  sender.send(frame(3));
  await expect.poll(() => frames.length).toBe(3);
  expect(frames.map(item => item.generation)).toEqual([1, 2, 3]);
  expect(frames.every(item => !Object.hasOwn(item, 'sequence'))).toBe(true);
  await acknowledge(1);
  expect(frames).toHaveLength(3);
});
