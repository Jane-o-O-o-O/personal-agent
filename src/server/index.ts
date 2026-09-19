import { createApp } from './app.js';
import { loadConfig } from './config.js';

const config = loadConfig();
const {app} = await createApp(config);
await app.listen({host:config.host,port:config.port});
console.log(`Personal Agent listening on ${config.host}:${config.port}`);
let shuttingDown = false;
for (const signal of ['SIGINT','SIGTERM'] as const) process.on(signal,async () => {
  if (shuttingDown) return;
  shuttingDown = true;
  await app.close();
  process.exit(0);
});
