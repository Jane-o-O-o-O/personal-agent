import { cpSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const safeVersion = '5.0.12';
const piPackage = '@earendil-works/pi-coding-agent';
const readJson = path => JSON.parse(readFileSync(path, 'utf8'));
const writeJson = (path, value) => writeFileSync(path, JSON.stringify(value, null, 2) + '\n');

export function patchPiDependencies(projectRoot = fileURLToPath(new URL('..', import.meta.url))) {
  const root = realpathSync(resolve(projectRoot));
  const piDirectory = join(root, 'node_modules', piPackage);
  const piManifest = readJson(join(piDirectory, 'package.json'));
  if (piManifest.name !== piPackage || piManifest.version !== '1.0.0')
    throw new Error('Review the dependency patch before changing the pinned Pi SDK version.');

  const rootRequire = createRequire(join(root, 'package.json'));
  const sourceManifestPath = rootRequire.resolve('brace-expansion/package.json');
  const sourceDirectory = dirname(sourceManifestPath);
  const sourceManifest = readJson(sourceManifestPath);
  if (sourceManifest.name !== 'brace-expansion' || sourceManifest.version !== safeVersion)
    throw new Error(`The project must install brace-expansion@${safeVersion} before patching Pi.`);

  const piRequire = createRequire(join(piDirectory, 'package.json'));
  const minimatchRequire = createRequire(piRequire.resolve('minimatch/package.json'));
  const targetManifestPath = minimatchRequire.resolve('brace-expansion/package.json');
  const targetDirectory = dirname(targetManifestPath);
  const expectedTarget = join(piDirectory, 'node_modules', 'brace-expansion');
  if (targetDirectory !== sourceDirectory && targetDirectory !== expectedTarget)
    throw new Error('The Pi dependency layout changed; review brace-expansion resolution before patching.');

  const projectLock = readJson(join(root, 'package-lock.json'));
  const sourceKey = relative(root, sourceDirectory).replaceAll('\\', '/');
  const sourceEntry = projectLock.packages?.[sourceKey];
  if (sourceEntry?.version !== safeVersion || !sourceEntry.integrity || !sourceEntry.resolved)
    throw new Error('The safe brace-expansion package must have a matching locked registry integrity.');
  const shrinkwrapPath = join(piDirectory, 'npm-shrinkwrap.json');
  const shrinkwrap = readJson(shrinkwrapPath);
  const shrinkwrapEntry = shrinkwrap.packages?.['node_modules/brace-expansion'];
  if (!shrinkwrapEntry) throw new Error('The pinned Pi shrinkwrap no longer contains the expected dependency.');

  // Pi's published shrinkwrap bypasses root overrides, including during npm ci.
  if (targetDirectory !== sourceDirectory) cpSync(sourceDirectory, targetDirectory, { recursive: true });
  Object.assign(shrinkwrapEntry, { version: safeVersion, resolved: sourceEntry.resolved, integrity: sourceEntry.integrity });
  writeJson(shrinkwrapPath, shrinkwrap);
  const hiddenLockPath = join(root, 'node_modules', '.package-lock.json');
  try {
    const hiddenLock = readJson(hiddenLockPath);
    const targetKey = relative(root, targetDirectory).replaceAll('\\', '/');
    if (hiddenLock.packages?.[targetKey]) {
      Object.assign(hiddenLock.packages[targetKey], { version: safeVersion, resolved: sourceEntry.resolved, integrity: sourceEntry.integrity });
      writeJson(hiddenLockPath, hiddenLock);
    }
  } catch (error) { if (error.code !== 'ENOENT') throw error; }

  const installed = readJson(minimatchRequire.resolve('brace-expansion/package.json'));
  const actual = minimatchRequire('brace-expansion');
  if (installed.version !== safeVersion || actual.EXPANSION_MAX_DEPTH !== 1000 || actual.EXPANSION_MAX_REWRITES !== 1000)
    throw new Error('Pi did not resolve the patched brace-expansion implementation.');
  return { package: 'brace-expansion', version: installed.version };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = patchPiDependencies(process.argv[2]);
  console.log(`Patched Pi runtime dependency: ${result.package}@${result.version}`);
}
