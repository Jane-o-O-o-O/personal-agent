import { createServer } from 'node:http';

const marker = process.argv[2];
if (!/^[a-z0-9-]{1,80}$/i.test(marker || '')) throw new Error('Invalid verification marker');
const port = Number(process.argv[3] || 4099);
const profileCookie = 'pa_full_verify_profile';
const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const state = { marker, input: '', lastKey: '', scrollY: 0, promptResult: null, confirmResult: null, savedName: '', savedCity: '', saves: 0, mcpCalls: [] };
const json = (response, value, status = 200) => { response.writeHead(status, { 'Content-Type': 'application/json' }); response.end(JSON.stringify(value)); };
async function body(request) {
  let result = '';
  for await (const chunk of request) { result += chunk; if (result.length > 100000) throw new Error('Body too large'); }
  return result ? JSON.parse(result) : {};
}
const html = (response, title, content) => {
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end(`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>${escape(title)}</title>
    <style>body{margin:0;font:18px system-ui;color:#222;background:#fff}header{height:42px;padding:12px 24px;box-sizing:border-box;font-size:14px;background:#e7f2ec;border-bottom:1px solid #789889}input,button,a{font:20px system-ui;box-sizing:border-box}input{position:absolute;left:40px;top:80px;width:300px;height:42px}button{position:absolute;left:40px;top:150px;width:120px;height:42px}section{position:absolute;left:40px;top:280px;max-width:1100px}p{margin:8px 0;overflow-wrap:anywhere}</style>
    <header>Personal Agent 全量实测 · ${escape(marker)}</header>${content}</html>`);
};
const server = createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://127.0.0.1:${port}`);
  response.setHeader('Cache-Control', 'no-store');
  try {
    if (url.pathname === '/health') return json(response, { ok: true, marker });
    if (url.pathname === '/state') return json(response, state);
    if (url.pathname === '/event' && request.method === 'POST') {
      const value = await body(request);
      for (const key of ['input', 'lastKey', 'scrollY', 'promptResult', 'confirmResult']) if (value[key] !== undefined) state[key] = value[key];
      return json(response, { ok: true });
    }
    if (url.pathname === '/shutdown' && request.method === 'POST') {
      json(response, { ok: true });
      response.once('finish', () => setTimeout(() => { server.closeAllConnections(); server.close(); }, 100).unref());
      return;
    }
    if (url.pathname === '/mcp') {
      if (request.method !== 'POST') return json(response, { error: 'POST required' }, 405);
      const rpc = await body(request);
      if (rpc.id === undefined) { response.writeHead(202); return response.end(); }
      let result;
      if (rpc.method === 'initialize') result = { protocolVersion: rpc.params.protocolVersion, capabilities: { tools: {} }, serverInfo: { name: 'personal-agent-verification', version: '1.0.0' } };
      else if (rpc.method === 'tools/list') result = { tools: [{ name: 'daily_budget', description: 'Verification-only: calculate a daily budget from known fixed expenses; no external transaction.', inputSchema: { type: 'object', properties: { label: { type: 'string' }, transport: { type: 'number' }, lunch: { type: 'number' } }, required: ['label', 'transport', 'lunch'] } }] };
      else if (rpc.method === 'tools/call' && rpc.params.name === 'daily_budget') {
        const { label, transport, lunch } = rpc.params.arguments || {};
        if (typeof label !== 'string' || !Number.isFinite(transport) || !Number.isFinite(lunch)) return json(response, { jsonrpc: '2.0', id: rpc.id, error: { code: -32602, message: 'Invalid budget arguments' } });
        const value = { label, transport, lunch, total: transport + lunch, marker };
        state.mcpCalls.push(value);
        result = { content: [{ type: 'text', text: JSON.stringify(value) }] };
      } else return json(response, { jsonrpc: '2.0', id: rpc.id, error: { code: -32601, message: 'Method not found' } });
      return json(response, { jsonrpc: '2.0', id: rpc.id, result });
    }
    if (url.pathname === '/seed' || url.pathname === '/clear') {
      response.setHeader('Set-Cookie', `${profileCookie}=${url.pathname === '/seed' ? marker : ''}; Max-Age=${url.pathname === '/seed' ? 604800 : 0}; Path=/; SameSite=Lax`);
      response.writeHead(303, { Location: '/' }); return response.end();
    }
    const profile = (request.headers.cookie || '').split(';').map(value => value.trim()).find(value => value.startsWith(`${profileCookie}=`))?.slice(profileCookie.length + 1) || '';
    if (url.pathname === '/interaction') return html(response, '浏览器真实交互实测', `
      <input name="name" aria-label="姓名" autocomplete="off"><button id="prompt">输入备注</button><button id="confirm" style="left:180px">确认测试</button>
      <a href="/second-tab" target="_blank" rel="noopener" style="position:absolute;left:40px;top:220px">打开第二页</a>
      <section><h1>浏览器真实交互</h1><p>本轮标记：${escape(marker)}</p><p id="profile-marker">${escape(profile)}</p>${Array.from({ length: 70 }, (_, index) => `<p style="padding:5px 0;border-bottom:1px solid #ccc">页面记录 ${index + 1}：日常事务测试</p>`).join('')}</section>
      <script>
        const report = value => fetch('/event', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)});
        document.querySelector('input').addEventListener('input', event => report({input:event.target.value}));
        document.addEventListener('keydown', event => report({lastKey:event.key}));
        document.addEventListener('scroll', () => report({scrollY:window.scrollY}));
        document.querySelector('#prompt').onclick = () => report({promptResult:prompt('请输入中文备注','')});
        document.querySelector('#confirm').onclick = () => report({confirmResult:confirm('确认本次浏览器测试？')});
      </script>`);
    if (url.pathname === '/second-tab') return html(response, '第二个测试页面', `<section><h1>第二个测试页面</h1><p id="second-tab-marker">${escape(marker)}</p></section>`);
    if (url.pathname === '/agent-form') return html(response, '代理填写偏好', `
      <form action="/saved" method="get"><input name="name" aria-label="姓名"><input name="city" aria-label="城市" style="top:150px"><button style="top:220px;width:160px">保存偏好</button></form>
      <section style="top:320px"><h1>偏好登记</h1><p>本轮标记：${escape(marker)}</p><p>仅为本地测试表单，不产生订单或支付。</p></section>`);
    if (url.pathname === '/saved' || url.pathname === '/save') {
      state.savedName = url.searchParams.get('name') || ''; state.savedCity = url.searchParams.get('city') || ''; state.saves++;
      return html(response, '偏好已保存', `<section><h1>已保存</h1><p id="saved-name">${escape(state.savedName)}</p><p id="saved-city">${escape(state.savedCity)}</p><p id="profile-marker">${escape(profile)}</p><p>${escape(marker)}</p></section>`);
    }
    return html(response, '浏览器表单验收', `<form action="/save" method="get" onsubmit="return confirm('确认保存中文表单？')"><input name="name" aria-label="姓名"><button>保存</button></form><section><h1>浏览器表单</h1><p id="profile-marker">${escape(profile)}</p><p>本轮标记：${escape(marker)}</p></section>`);
  } catch { if (!response.headersSent) json(response, { error: 'Fixture request failed' }, 400); else response.end(); }
});
server.listen(port, '0.0.0.0');
for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, () => { server.closeAllConnections(); server.close(); });
