import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const directories: string[] = [];
const project = resolve('.');
const rootRequire = createRequire(join(project, 'package.json'));
const script = join(project, 'scripts', 'patch-pi-dependencies.mjs');
const readJson = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const writeJson = (path: string, value: unknown) => writeFileSync(path, JSON.stringify(value, null, 2) + '\n');
afterEach(() => { for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }); });

function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'pa-pi-patch-'));
  directories.push(directory);
  const piName = '@earendil-works/pi-coding-agent';
  const piSource = join(project, 'node_modules', piName);
  const piTarget = join(directory, 'node_modules', piName);
  mkdirSync(join(piTarget, 'node_modules'), { recursive: true });
  writeJson(join(directory, 'package.json'), { name: 'pi-patch-fixture', private: true });
  cpSync(join(piSource, 'package.json'), join(piTarget, 'package.json'));
  cpSync(join(piSource, 'npm-shrinkwrap.json'), join(piTarget, 'npm-shrinkwrap.json'));
  for (const name of ['brace-expansion', 'balanced-match', 'minimatch']) {
    const source = dirname(createRequire(join(piSource, 'package.json')).resolve(`${name}/package.json`));
    cpSync(source, join(piTarget, 'node_modules', name), { recursive: true });
  }
  for (const name of ['brace-expansion', 'balanced-match']) {
    const source = dirname(rootRequire.resolve(`${name}/package.json`));
    cpSync(source, join(directory, 'node_modules', name), { recursive: true });
  }
  const sourceEntry = readJson(join(project, 'package-lock.json')).packages['node_modules/brace-expansion'];
  const targetKey = `node_modules/${piName}/node_modules/brace-expansion`;
  const lock = { packages: { 'node_modules/brace-expansion': sourceEntry, [targetKey]: { version: '5.0.9' } } };
  writeJson(join(directory, 'package-lock.json'), lock);
  writeJson(join(directory, 'node_modules', '.package-lock.json'), lock);
  const piRequire = createRequire(join(piTarget, 'node_modules', 'minimatch', 'package.json'));
  return { directory, piTarget, piRequire, targetKey };
}

describe('pinned Pi dependency patch', () => {
  it('verifies the real installed Pi dependency, independently of its lockfile', () => {
    const piDirectory = join(project, 'node_modules', '@earendil-works', 'pi-coding-agent');
    const piRequire = createRequire(join(piDirectory, 'package.json'));
    const loader = createRequire(piRequire.resolve('minimatch/package.json'));
    expect(readJson(loader.resolve('brace-expansion/package.json')).version).toBe('5.0.12');
    expect(loader('brace-expansion').EXPANSION_MAX_DEPTH).toBe(1000);
    expect(loader('brace-expansion').EXPANSION_MAX_REWRITES).toBe(1000);
  });

  it('patches actual Pi resolution and its installed locks without changing the project lock', () => {
    const { directory, piTarget, piRequire, targetKey } = fixture();
    const originalLock = readFileSync(join(directory, 'package-lock.json'), 'utf8');
    execFileSync(process.execPath, [script, directory]);
    expect(readJson(piRequire.resolve('brace-expansion/package.json')).version).toBe('5.0.12');
    const actual = piRequire('brace-expansion');
    expect(actual.EXPANSION_MAX_DEPTH).toBe(1000);
    expect(actual.EXPANSION_MAX_REWRITES).toBe(1000);
    expect(actual.expand('{a,b}')).toEqual(['a', 'b']);
    expect(readJson(join(piTarget, 'npm-shrinkwrap.json')).packages['node_modules/brace-expansion'].version).toBe('5.0.12');
    expect(readJson(join(directory, 'node_modules', '.package-lock.json')).packages[targetKey].version).toBe('5.0.12');
    expect(readFileSync(join(directory, 'package-lock.json'), 'utf8')).toBe(originalLock);
    expect(() => execFileSync(process.execPath, [script, directory])).not.toThrow();
  });

  it('refuses to copy a source whose installed version is still vulnerable', () => {
    const { directory, piRequire } = fixture();
    const original = readJson(piRequire.resolve('brace-expansion/package.json')).version;
    const sourcePath = join(directory, 'node_modules', 'brace-expansion', 'package.json');
    const source = readJson(sourcePath); source.version = '5.0.11'; writeJson(sourcePath, source);
    expect(() => execFileSync(process.execPath, [script, directory], { stdio: 'pipe' })).toThrow();
    expect(readJson(piRequire.resolve('brace-expansion/package.json')).version).toBe(original);
  });
});
