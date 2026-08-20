import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, test } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const OPS_DIR = path.join(ROOT_DIR, 'config', 'source', 'skills', 'ops-inspector');

function readOps(...segments) {
  return fs.readFileSync(path.join(OPS_DIR, ...segments), 'utf8');
}

describe('ops-inspector v3 (alarm interpretation + fault playbooks)', () => {
  const skill = readOps('SKILL.md');
  const alarm = readOps('references', 'alarm-interpretation.md');
  const playbooks = readOps('references', 'fault-playbooks.md');
  const combined = `${skill}\n${alarm}\n${playbooks}`;

  test('frontmatter marks v3 metrics / playbook triggers', () => {
    expect(skill).toMatch(/^name:\s+ops-inspector$/m);
    expect(skill).toMatch(/^version:\s+\d+\.\d+\.\d+/m);
    expect(skill).toMatch(/queryEnv\(action=metrics\)|queryEnv\(action="metrics"\)/);
    expect(skill).toMatch(/峰值 QPS/);
    expect(skill).toMatch(/告警/);
  });

  test('routes metrics through queryEnv and forbids callCloudApi for monitor curves', () => {
    expect(combined).toContain('queryEnv(action="metrics"');
    expect(combined).toMatch(/Never.*callCloudApi|never.*callCloudApi|禁止.*callCloudApi/i);
    expect(alarm).toContain('GatewayTraceEnvQPS');
    expect(alarm).toContain('MysqlCpuUsageRate');
    expect(alarm).toContain('FunctionInvocation');
    expect(alarm).toContain('Summary');
  });

  test('defines alarm-interpretation baselines for CPU and QPS answers', () => {
    expect(alarm).toMatch(/告警解读|Alarm Interpretation/);
    expect(alarm).toContain('80');
    expect(alarm).toContain('90');
    expect(alarm).toContain('500');
    expect(alarm).toMatch(/CPU 告警是否正常/);
    expect(alarm).toMatch(/峰值 QPS/);
    expect(skill).toContain('references/alarm-interpretation.md');
    expect(skill).toContain('## 告警解读');
  });

  test('includes four fault playbooks with MCP-first steps', () => {
    expect(skill).toContain('references/fault-playbooks.md');
    expect(playbooks).toMatch(/Playbook 1[\s\S]*429/);
    expect(playbooks).toMatch(/Playbook 2[\s\S]*404/);
    expect(playbooks).toMatch(/Playbook 3[\s\S]*ACCESS_TOKEN_INVALID/);
    expect(playbooks).toMatch(/Playbook 4[\s\S]*调用量为 0|zero/i);
    expect(playbooks).toContain('FunctionThrottle');
    expect(playbooks).toContain('FunctionInvocation');
    expect(playbooks).toContain('queryFunctions');
    expect(playbooks).toMatch(/auth-tool/);
  });

  test('full inspection workflow includes a metrics snapshot step', () => {
    expect(skill).toMatch(/Step 2 — Metrics snapshot/);
    expect(skill).toContain('metricName="GatewayTraceEnvQPS"');
    expect(skill).toContain('metricName="MysqlCpuUsageRate"');
  });
});
