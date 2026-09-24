import { randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const directory=resolve('.runtime');
mkdirSync(directory,{recursive:true,mode:0o700});
const output=join(directory,'deployment.env');
if (!existsSync(output)) {
  const localPassword=join(resolve('data'),'admin-password');
  const password=existsSync(localPassword) ? readFileSync(localPassword,'utf8').trim():randomBytes(24).toString('base64url');
  const values={ADMIN_PASSWORD:password,ENCRYPTION_KEY:randomBytes(32).toString('base64url'),BROWSER_SERVICE_TOKEN:randomBytes(32).toString('base64url'),PUBLIC_ORIGIN:process.env.DEPLOY_ORIGIN || 'https://39.107.111.115:8443'};
  writeFileSync(output,Object.entries(values).map(([key,value])=>`${key}=${value}`).join('\n')+'\n',{mode:0o600,flag:'wx'});
}
console.log('Deployment configuration prepared in .runtime/deployment.env');
