"""Read-only exact-key scan; the credential is accepted only through stdin."""

import json
import os
from pathlib import Path
import sqlite3
import stat
import subprocess
import sys
from urllib.parse import quote


CHUNK_SIZE = 65536
CONFIG_NAMES = {'auth.json', 'models.json', 'models-store.json', 'mcp.json', 'settings.json'}
REPORT_SUFFIXES = {'.json', '.jsonl', '.log', '.md', '.txt', '.mjs', '.ts', '.patch'}
EXCLUDED_SUFFIXES = {'.gz', '.tgz', '.tar', '.zip', '.7z', '.rar', '.xz', '.bz2', '.zst',
                     '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.ico', '.avif',
                     '.heic', '.heif', '.tif', '.tiff'}


def category():
    return {'present': False, 'filesScanned': 0, 'bytesScanned': 0, 'matchedFiles': 0,
            'occurrences': 0, 'errors': 0, 'symlinksSkipped': 0, 'filesExcluded': 0}


def occurrences(stream, needle):
    retained = b''
    found = 0
    size = 0
    while True:
        chunk = stream.read(CHUNK_SIZE)
        if not chunk:
            break
        size += len(chunk)
        combined = retained + chunk
        found += combined.count(needle)
        retained = combined[-(len(needle) - 1):]
    return found, size


def files(path, counts):
    if path.is_symlink():
        counts['symlinksSkipped'] += 1
        return
    if not path.exists():
        return
    counts['present'] = True
    if path.is_file():
        yield path
        return
    for current, directories, names in os.walk(path, followlinks=False, onerror=lambda _: record_error(counts)):
        current_path = Path(current)
        for name in list(directories):
            if (current_path / name).is_symlink():
                directories.remove(name)
                counts['symlinksSkipped'] += 1
        for name in names:
            item = current_path / name
            if item.is_symlink():
                counts['symlinksSkipped'] += 1
            else:
                yield item


def record_error(counts):
    counts['errors'] += 1


def scan_files(paths, needle, predicate=lambda _: True):
    counts = category()
    seen = set()
    for path in paths:
        for item in files(path, counts):
            if item in seen:
                continue
            seen.add(item)
            if item.suffix.lower() in EXCLUDED_SUFFIXES or not predicate(item):
                counts['filesExcluded'] += 1
                continue
            try:
                metadata = item.stat()
                if not stat.S_ISREG(metadata.st_mode):
                    counts['filesExcluded'] += 1
                    continue
                with item.open('rb') as source:
                    found, size = occurrences(source, needle)
                counts['filesScanned'] += 1
                counts['bytesScanned'] += size
                counts['occurrences'] += found
                counts['matchedFiles'] += int(found > 0)
            except (OSError, ValueError):
                counts['errors'] += 1
    return counts


def database_scan(path, needle):
    result = {'present': path.exists(), 'readOnly': True, 'tablesScanned': 0, 'rowsScanned': 0,
              'cellsScanned': 0, 'matchedRows': 0, 'matchedCells': 0, 'errors': 0}
    connection = None
    try:
        connection = sqlite3.connect('file:' + quote(str(path)) + '?mode=ro', uri=True, timeout=1)
        connection.execute('PRAGMA query_only=1')
        tables = connection.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
        for (name,) in tables:
            result['tablesScanned'] += 1
            identifier = '"' + name.replace('"', '""') + '"'
            for row in connection.execute('SELECT * FROM ' + identifier):
                result['rowsScanned'] += 1
                matched = 0
                for value in row:
                    if isinstance(value, str):
                        value = value.encode('utf-8')
                    if isinstance(value, bytes):
                        result['cellsScanned'] += 1
                        matched += int(needle in value)
                result['matchedRows'] += int(matched > 0)
                result['matchedCells'] += matched
    except (OSError, sqlite3.Error, ValueError):
        result['errors'] += 1
    finally:
        if connection:
            connection.close()
    return result


def permission_group(paths, expected):
    result = {'presentCount': 0, 'absentCount': 0, 'expectedMode': oct(expected)[2:],
              'matchingModeCount': 0, 'otherModeCount': 0, 'groupOrWorldAccessibleCount': 0,
              'errors': 0}
    for path in paths:
        try:
            if not path.exists():
                result['absentCount'] += 1
                continue
            mode = stat.S_IMODE(path.stat().st_mode)
            result['presentCount'] += 1
            result['matchingModeCount'] += int(mode == expected)
            result['otherModeCount'] += int(mode != expected)
            result['groupOrWorldAccessibleCount'] += int(bool(mode & 0o077))
        except OSError:
            result['errors'] += 1
    return result


def docker_command(project):
    return ['docker', 'compose', '--project-directory', str(project / 'deploy'),
            '--env-file', str(project / '.env'), '-f', str(project / 'deploy' / 'compose.yaml')]


def container_source_scan(compose, service, needle):
    try:
        container = subprocess.check_output(compose + ['ps', '-q', service], stderr=subprocess.DEVNULL, timeout=10).strip()
        if not container:
            raise ValueError()
        pid = subprocess.check_output(['docker', 'inspect', '--format', '{{.State.Pid}}', container.decode()],
                                      stderr=subprocess.DEVNULL, timeout=10).strip()
        if not pid.isdigit() or int(pid) < 1:
            raise ValueError()
        root = Path('/proc') / pid.decode() / 'root' / 'app'
        return scan_files([root / 'src', root / 'dist', root / 'vendor'], needle)
    except (OSError, ValueError, subprocess.SubprocessError):
        result = category()
        result['errors'] = 1
        return result


def docker_logs_scan(compose, service, needle):
    result = category()
    try:
        child = subprocess.Popen(compose + ['logs', '--no-color', '--timestamps', service],
                                 stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
        with child.stdout as source:
            found, size = occurrences(source, needle)
        code = child.wait(timeout=10)
        result.update({'present': code == 0, 'filesScanned': int(code == 0), 'bytesScanned': size,
                       'matchedFiles': int(found > 0), 'occurrences': found, 'errors': int(code != 0)})
    except (OSError, ValueError, subprocess.SubprocessError):
        result['errors'] += 1
    return result


def scan(options):
    project = Path(options['projectRoot'])
    data = Path(options['dataDir'])
    browser = Path(options.get('browserDataDir', str(data / 'browser')))
    workspace = Path(options.get('workspaceDir', str(data / 'workspaces')))
    needle = options.pop('apiKey').encode('utf-8')
    if len(needle) < 12:
        raise ValueError()
    database = data / 'agent.sqlite'
    pi = data / 'pi'
    credential_paths = [project / '.env', project / 'deployment.env', project / '.runtime' / 'deployment.env',
                        data / 'master-key', data / 'admin-password']
    categories = {
        'databaseFiles': scan_files([database, Path(str(database) + '-wal'), Path(str(database) + '-shm')], needle),
        'piSessions': scan_files([data / 'sessions'], needle),
        'modelConfiguration': scan_files([pi], needle),
        'source': scan_files([project / 'src'], needle),
        'vendoredSources': scan_files([project / 'vendor'], needle),
        'buildArtifacts': scan_files([project / 'dist'], needle),
        'testsAndTestArtifacts': scan_files([project / 'tests', project / 'test-results',
                                            project / 'playwright-report', project / 'coverage'], needle),
        'documentation': scan_files([project / 'docs'], needle),
        'scripts': scan_files([project / 'scripts'], needle),
        'runtimeReports': scan_files([project / '.runtime'], needle,
                                    lambda path: path.suffix in REPORT_SUFFIXES and path.suffix != '.log'),
        'localApplicationLogs': scan_files([project / '.runtime', project / 'logs'], needle,
                                          lambda path: path.suffix == '.log'),
        'localBrowserLogs': scan_files([browser], needle, lambda path: path.suffix == '.log'),
        'workspacesAndArtifacts': scan_files([workspace, data / 'artifacts'], needle),
        'credentialFiles': scan_files(credential_paths, needle),
    }
    permissions = {
        'credentialFiles': permission_group(credential_paths, 0o600),
        'piConfigurationFiles': permission_group([pi / name for name in sorted(CONFIG_NAMES)], 0o600),
        'databaseFiles': permission_group([database, Path(str(database) + '-wal'), Path(str(database) + '-shm')], 0o600),
        'privateDirectories': permission_group([data, pi, data / 'sessions', workspace, browser], 0o700),
    }
    if options.get('deployment'):
        compose = docker_command(project)
        for service in ['app', 'browser']:
            categories[service + 'ContainerSources'] = container_source_scan(compose, service, needle)
            categories[service + 'ContainerLogs'] = docker_logs_scan(compose, service, needle)
    return {'database': database_scan(database, needle), 'categories': categories, 'permissions': permissions,
            'readOnly': True, 'keyProvidedThroughStdin': True, 'infrastructureErrors': 0,
            'scope': {'currentFullApiKeyBytesOnly': True, 'historicalKeysScanned': False,
                      'encodedSecretsScanned': False, 'compressedArchivesScanned': False,
                      'binaryImagesScanned': False, 'removedContainerLogsScanned': False,
                      'permissionResultsAreSeparate': True}}


try:
    result = scan(json.load(sys.stdin))
    print(json.dumps(result, separators=(',', ':')))
except Exception:
    print(json.dumps({'verificationError': True}))
    sys.exit(1)
