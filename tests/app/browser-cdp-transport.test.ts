import { once } from 'node:events';
import { expect, it } from 'vitest';
import WebSocket, { WebSocketServer } from 'ws';
import { CDP } from '../../vendor/browser-use/src/cdp.js';

it('receives fragmented Unicode CDP events and large responses before further commands', async () => {
  const server = new WebSocketServer({ host: '127.0.0.1', port: 0 });
  await once(server, 'listening');
  const address = server.address();
  if (typeof address === 'string' || !address) throw new Error('CDP fixture did not bind');
  const connected = once(server, 'connection');
  const connection = await CDP.connect(`ws://127.0.0.1:${address.port}`, 3000);
  const [socket] = await connected as [WebSocket];
  const text = '浏览器验证码页面'.repeat(20_000);
  const messages: string[] = [];
  socket.on('message', data => {
    const command = JSON.parse(String(data));
    messages.push(command.method);
    if (command.method === 'Runtime.enable') {
      const event = JSON.stringify({ method: 'Runtime.consoleAPICalled', sessionId: 'page-session', params: { type: 'log', args: [{ type: 'string', value: text }], executionContextId: 1, timestamp: 1 } });
      const bytes = Buffer.from(event);
      socket.send(bytes.subarray(0, 17), { binary: false, fin: false });
      socket.send(bytes.subarray(17, 121_123), { binary: false, fin: false });
      socket.send(bytes.subarray(121_123), { binary: false, fin: true });
      socket.send(JSON.stringify({ id: command.id, result: {} }));
    } else socket.send(JSON.stringify({ id: command.id, result: { result: { type: 'string', value: text } } }));
  });
  try {
    const event = connection.waitFor('Runtime.consoleAPICalled', { sessionId: 'page-session' });
    await connection.send('Runtime.enable', undefined, 'page-session');
    expect((await event).args[0].value).toBe(text);
    const result = await connection.send('Runtime.evaluate', { expression: JSON.stringify('人工输入'.repeat(1000)), returnByValue: true }, 'page-session');
    expect(result.result.value).toBe(text);
    expect(messages).toEqual(['Runtime.enable', 'Runtime.evaluate']);
  } finally {
    connection.close();
    socket.terminate();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});

it('rejects pending CDP work after transport loss and never resends it', async () => {
  const server = new WebSocketServer({ host: '127.0.0.1', port: 0 });
  await once(server, 'listening');
  const address = server.address();
  if (typeof address === 'string' || !address) throw new Error('CDP fixture did not bind');
  const connected = once(server, 'connection');
  const connection = await CDP.connect(`ws://127.0.0.1:${address.port}`, 3000);
  const [socket] = await connected as [WebSocket];
  const commands: string[] = [];
  socket.on('message', data => { commands.push(JSON.parse(String(data)).method); socket.terminate(); });
  try {
    await expect(connection.send('Runtime.evaluate', { expression: 'void 0' }, 'page-session')).rejects.toThrow(/closed|failed/);
    await expect(connection.send('Runtime.evaluate', { expression: 'void 0' }, 'page-session')).rejects.toThrow(/closed/);
    expect(commands).toEqual(['Runtime.evaluate']);
  } finally {
    connection.close(); socket.terminate();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
