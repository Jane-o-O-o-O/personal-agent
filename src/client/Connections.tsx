import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, CheckCircle2, Circle, KeyRound, Link2, LoaderCircle, LogOut, QrCode, RefreshCw, Save, ShieldCheck, Trash2, Unplug } from 'lucide-react';
import type { Integration, WeixinLogin } from '../shared/contracts';
import { api, errorMessage } from './api';
import type { RunAction } from './Chat';
import { formatTime, IconButton } from './ui';

const integrationLabels: Record<Integration['status'], string> = {
  unconfigured: '未配置', configured: '已配置', connected: '已连接', error: '连接异常', requires_reauth: '需要重新授权',
};
const weixinLabels: Record<WeixinLogin['status'], string> = {
  unconfigured: '未授权', qr_pending: '等待扫码', scanned: '已扫码', verification_required: '需要验证码',
  connected: '已连接', expired: '二维码已过期', error: '授权失败', requires_reauth: '需要重新授权',
};

export function ConnectionsView({ integrations, run, busy, refresh }: {
  integrations: Integration[]; run: RunAction; busy: Set<string>; refresh: () => Promise<void>;
}) {
  const [selected, setSelected] = useState('model');
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [login, setLogin] = useState<WeixinLogin | null>(null);
  const [code, setCode] = useState('');
  const [qrError, setQrError] = useState<string | null>(null);
  const polling = useRef(false);
  const integration = integrations.find(item => item.id === selected) ?? integrations[0];
  const key = integration ? `integration:${integration.id}` : 'integration';

  useEffect(() => {
    if (!integration) return;
    setValues(Object.fromEntries(integration.fields.map(field => {
      const value = integration.config[field.name];
      const secret = field.type === 'password' || field.name in integration.secretFields;
      return [field.name, secret ? '' : field.type === 'boolean' ? Boolean(value) : value === undefined || value === null ? '' : typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)];
    })));
    setDirty(new Set());
  }, [integration]);
  useEffect(() => { setTestResult(null); }, [integration?.id]);

  useEffect(() => {
    if (integration?.id !== 'weixin') return;
    let active = true;
    const poll = async () => {
      if (polling.current) return;
      polling.current = true;
      try { const value = await api<WeixinLogin>('/integrations/weixin/login'); if (active) { setLogin(value); setQrError(null); } }
      catch (error) { if (active) setQrError(errorMessage(error)); }
      finally { polling.current = false; }
    };
    void poll();
    const timer = setInterval(() => void poll(), 3000);
    return () => { active = false; clearInterval(timer); };
  }, [integration?.id]);

  const setValue = (name: string, value: string | boolean) => {
    setValues(previous => ({ ...previous, [name]: value })); setDirty(previous => new Set(previous).add(name));
  };
  const save = async () => {
    if (!integration) return;
    await run(key, async () => {
      const config: Record<string, unknown> = {};
      for (const field of integration.fields) {
        if (!dirty.has(field.name)) continue;
        const value = values[field.name];
        const secret = field.type === 'password' || field.name in integration.secretFields;
        if (secret && value === '' && !dirty.has(`clear:${field.name}`)) continue;
        config[field.name] = field.type === 'number' && value !== '' ? Number(value) : value;
      }
      await api(`/integrations/${encodeURIComponent(integration.id)}`, { method: 'PATCH', body: { config } });
      await refresh();
    });
  };
  const test = () => {
    if (!integration) return;
    void run(key, async () => {
      if (dirty.size) {
        const config: Record<string, unknown> = {};
        for (const field of integration.fields) {
          if (!dirty.has(field.name)) continue;
          const value = values[field.name];
          if ((field.type === 'password' || field.name in integration.secretFields) && value === '' && !dirty.has(`clear:${field.name}`)) continue;
          config[field.name] = field.type === 'number' && value !== '' ? Number(value) : value;
        }
        await api(`/integrations/${encodeURIComponent(integration.id)}`, { method: 'PATCH', body: { config } });
      }
      const result = await api<{ ok: boolean; message: string }>(`/integrations/${encodeURIComponent(integration.id)}/test`, { method: 'POST', body: {} });
      await refresh(); setTestResult(result);
    });
  };
  const connectWeixin = () => void run(key, async () => {
    const response = await api<WeixinLogin>('/integrations/weixin/connect', { method: 'POST', body: {} });
    setLogin(response); setQrError(null); await refresh();
  });

  return <section className="resource-page"><header className="page-heading"><div><h1>连接</h1><span className="heading-meta">{integrations.filter(item => item.status === 'connected').length} 个已连接</span></div>
    <IconButton icon={RefreshCw} label="刷新连接" onClick={() => void run('refresh', refresh)} busy={busy.has('refresh')} /></header>
    <div className="connections-layout"><nav className="integration-nav" aria-label="连接列表">{integrations.map(item => <button key={item.id} className={integration?.id === item.id ? 'selected' : ''} onClick={() => setSelected(item.id)}>
      <span className={`connection-dot ${item.status}`} /><span>{item.name}</span>{item.status === 'connected' && <CheckCircle2 size={15} />}
    </button>)}</nav>
      <div className="integration-detail">{integration ? <>
        <div className="integration-heading"><div><h2>{integration.name}</h2><span className={`connection-status ${integration.status}`}><Circle size={10} fill="currentColor" />{integrationLabels[integration.status]}</span></div>
          {integration.lastCheckedAt && <span className="muted">{formatTime(integration.lastCheckedAt, true)}</span>}</div>
        {integration.lastError && <div className="notice error" role="alert">{integration.lastError}</div>}
        {integration.capabilities.length > 0 && <div className="capability-list">{integration.capabilities.map(capability => <span key={capability}>{capability}</span>)}</div>}
        {integration.id === 'weixin' && <div className="weixin-auth">
          <div className="weixin-heading"><QrCode size={18} /><h3>微信授权</h3><span className="muted">{login ? weixinLabels[login.status] : '获取授权状态中'}</span></div>
          {qrError && <div className="notice error" role="alert">{qrError}</div>}
          {login?.message && <p className="muted">{login.message}</p>}
          {login?.qrcodeImage && ['qr_pending', 'scanned', 'verification_required'].includes(login.status) && <div className="qr-area"><img src={login.qrcodeImage} alt="微信授权二维码" width={200} height={200} />{login.expiresAt && <span className="muted">有效至 {formatTime(login.expiresAt)}</span>}</div>}
          {login?.status === 'verification_required' && <form className="verification-form" onSubmit={event => {
            event.preventDefault(); void run(key, async () => { setLogin(await api<WeixinLogin>('/integrations/weixin/verify', { method: 'POST', body: { code } })); setCode(''); });
          }}><label>验证码<input required inputMode="numeric" autoComplete="one-time-code" value={code} onChange={event => setCode(event.target.value)} /></label><button className="button" disabled={busy.has(key)}><ShieldCheck size={16} />确认</button></form>}
          <div className="button-row">
            <button className="button secondary" onClick={connectWeixin} disabled={busy.has(key)}>{busy.has(key) ? <LoaderCircle size={16} className="spin" /> : <QrCode size={16} />}{login?.status === 'connected' ? '重新授权' : login?.qrcodeImage ? '刷新二维码' : '扫码连接'}</button>
            {login?.verificationUrl && <a className="button secondary" target="_blank" rel="noreferrer" href={login.verificationUrl}><ArrowUpRight size={16} />验证</a>}
            {login?.status === 'connected' && <button className="button secondary" disabled={busy.has(key)} onClick={() => void run(key, async () => {
              await api('/integrations/weixin/disconnect', { method: 'POST', body: {} }); setLogin({ status: 'unconfigured' }); await refresh();
            })}><LogOut size={16} />断开</button>}
          </div>
        </div>}
        {integration.fields.length > 0 && <form className="form-layout integration-form" onSubmit={event => { event.preventDefault(); void save(); }}>
          {integration.fields.map(field => {
            const secret = field.type === 'password' || field.name in integration.secretFields;
            const value = values[field.name] ?? '';
            const required = field.required && !integration.secretFields[field.name];
            return field.type === 'boolean' ? <label key={field.name} className="checkbox-label"><input type="checkbox" checked={Boolean(value)} onChange={event => setValue(field.name, event.target.checked)} />{field.label}</label> : <label key={field.name}>
              <span className="form-label"><span>{field.label}{field.required && <span className="required-mark">*</span>}</span>{secret && <span className="secret-state"><KeyRound size={12} />{integration.secretFields[field.name] ? '已设置' : '未设置'}</span>}</span>
              <div className="field-input-row">{field.type === 'select' ? <select aria-label={field.label} value={String(value)} required={required} onChange={event => setValue(field.name, event.target.value)}>
                {!field.options?.some(option => option.value === '') && <option value="">选择...</option>}{field.options?.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select> : field.type === 'textarea' ? <textarea aria-label={field.label} className={integration.id === 'mcp' ? 'code-input' : ''} rows={integration.id === 'mcp' ? 10 : 4} value={String(value)} required={required} placeholder={field.placeholder} spellCheck={false} onChange={event => setValue(field.name, event.target.value)} />
                : <input aria-label={field.label} type={field.type === 'password' ? 'password' : field.type === 'number' ? 'number' : 'text'} step={field.type === 'number' ? 'any' : undefined} value={String(value)} required={required} placeholder={field.placeholder} autoComplete={secret ? 'new-password' : 'off'} onChange={event => setValue(field.name, event.target.value)} />}
                {secret && integration.secretFields[field.name] && <IconButton icon={Trash2} label={`清除${field.label}`} className={dirty.has(`clear:${field.name}`) ? 'danger-icon active' : ''} onClick={() => {
                  setValue(field.name, ''); setDirty(previous => new Set(previous).add(`clear:${field.name}`));
                }} />}
              </div>
            </label>;
          })}
          <div className="form-actions"><button type="button" className="button secondary" disabled={busy.has(key)} onClick={test}><Link2 size={16} />测试连接</button><button className="button" disabled={busy.has(key) || !dirty.size}>{busy.has(key) ? <LoaderCircle size={16} className="spin" /> : <Save size={16} />}保存</button></div>
        </form>}
        {!integration.fields.length && integration.id !== 'weixin' && <button className="button secondary" onClick={test} disabled={busy.has(key)}><Link2 size={16} />测试连接</button>}
        {testResult && <div className={`notice ${testResult.ok ? 'success' : 'error'}`} role="status">{testResult.ok ? <CheckCircle2 size={16} /> : <Unplug size={16} />}<span>{testResult.message}</span></div>}
      </> : <div className="empty-state"><Link2 size={26} />暂无连接</div>}</div>
    </div>
  </section>;
}
