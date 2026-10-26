import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

function run(files = {}, command = 'build', serverValue) {
  const root = mkdtempSync(join(tmpdir(), 'ultary-env-test-'));
  try {
    mkdirSync(join(root, 'scripts'));
    cpSync(new URL('./run-next.mjs', import.meta.url), join(root, 'scripts/run-next.mjs'));
    const envPackage = join(root, 'node_modules/@next/env');
    mkdirSync(envPackage, { recursive: true });
    cpSync(fileURLToPath(new URL('../node_modules/@next/env/', import.meta.url)), envPackage, {
      recursive: true,
    });
    const nextBin = join(root, 'node_modules/next/dist/bin');
    mkdirSync(nextBin, { recursive: true });
    writeFileSync(
      join(nextBin, 'next'),
      `console.log(JSON.stringify({value:process.env.ULTARY_ENV_TEST_VALUE ?? null,args:process.argv.slice(2)}));`,
    );
    for (const [name, value] of Object.entries(files)) {
      if (value === null) mkdirSync(join(root, name));
      else writeFileSync(join(root, name), `ULTARY_ENV_TEST_VALUE=${value}\n`);
    }
    const env = { ...process.env };
    delete env.ULTARY_ENV_TEST_VALUE;
    delete env.__NEXT_PROCESSED_ENV;
    if (serverValue !== undefined) env.ULTARY_ENV_TEST_VALUE = serverValue;
    return spawnSync(process.execPath, ['scripts/run-next.mjs', command, '--test-option'], {
      cwd: root,
      env,
      encoding: 'utf8',
    });
  } finally {
    // Only this test's uniquely created temporary directory is removed.
    rmSync(root, { recursive: true, force: true });
  }
}

test('build/start/dev run without any env files and preserve host variables and CLI arguments', () => {
  for (const command of ['build', 'start', 'dev']) {
    const result = run({}, command, 'host');
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), {
      value: 'host',
      args: [command, '--test-option'],
    });
  }
});

test('common env is optional and works when production env is absent', () => {
  const result = run({ '.env': 'common' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).value, 'common');
});

test('host overrides production env, and production env overrides common env', () => {
  const files = { '.env.production': 'production', '.env': 'common' };
  for (const [host, expected] of [
    [undefined, 'production'],
    ['host', 'host'],
  ]) {
    const result = run(files, 'build', host);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).value, expected);
  }
});

test('development still loads local env before common env', () => {
  const result = run(
    { '.env.local': 'local', '.env.production': 'production', '.env': 'common' },
    'dev',
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).value, 'local');
});

test('unreadable env paths fail rather than being silently skipped', () => {
  const result = run({ '.env.production': null });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /EISDIR|EPERM|EACCES/);
});
