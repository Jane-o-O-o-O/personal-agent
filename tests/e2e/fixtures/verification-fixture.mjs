import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

export function createVerificationFixture(marker) {
  if (!/^[a-z0-9-]{1,80}$/i.test(marker)) throw new Error('Invalid verification marker');
  const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const cookieName = 'pa_verify_profile';
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1:3999');
    response.setHeader('Cache-Control', 'no-store');
    if (url.pathname === '/health') {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      return response.end(JSON.stringify({ ok: true, marker }));
    }
    if (url.pathname === '/shutdown' && request.method === 'POST') {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end('{"ok":true}');
      response.once('finish', () => setTimeout(() => {
        server.closeAllConnections();
        server.close();
      }, 100).unref());
      return;
    }
    if (url.pathname === '/seed' || url.pathname === '/clear') {
      response.setHeader('Set-Cookie', `${cookieName}=${url.pathname === '/seed' ? marker : ''}; Max-Age=${url.pathname === '/seed' ? 604800 : 0}; Path=/; SameSite=Lax`);
      response.writeHead(303, { Location: '/' });
      return response.end();
    }
    const profile = (request.headers.cookie ?? '').split(';').map(value => value.trim()).find(value => value.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1) ?? '';
    const saved = url.pathname === '/save' ? url.searchParams.get('name') ?? '' : '';
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>部署验收</title>
      <style>body{margin:0;font:18px system-ui;color:#153b2b;background:#fff}header{height:42px;background:#e7f2ec;padding:12px 24px;box-sizing:border-box;font-size:14px}input,button{font:20px system-ui;box-sizing:border-box}input{position:absolute;left:40px;top:80px;width:300px;height:42px}button{position:absolute;left:40px;top:150px;width:100px;height:42px}section{position:absolute;left:40px;top:230px}p{margin:8px 0;overflow-wrap:anywhere}</style>
      <header>Personal Agent 部署验收</header>
      <form method="get" action="/save" onsubmit="return confirm('确认保存中文表单？')"><input name="name" aria-label="姓名"><button>保存</button></form>
      <section><h1>${saved ? '已保存' : '浏览器表单'}</h1><p id="saved-name">${escape(saved)}</p><p>Profile：<span id="profile-marker">${escape(profile)}</span></p></section></html>`);
  });
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const fixture = createVerificationFixture(process.argv[2] ?? '');
  fixture.listen(3999, '127.0.0.1');
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { fixture.closeAllConnections(); fixture.close(); });
}
