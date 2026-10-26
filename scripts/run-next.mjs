import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import nextEnv from '@next/env';

const [command, ...args] = process.argv.slice(2);
if (!['dev', 'build', 'start'].includes(command)) {
  throw new Error('Usage: node scripts/run-next.mjs <dev|build|start> [options]');
}

const root = fileURLToPath(new URL('../', import.meta.url));
const environmentFile = command === 'dev' ? '.env.local' : '.env.production';

// Next에 포함된 로더를 사용해 Node 20.11에서도 환경 파일을 읽는다.
// 우선순위: 서버 환경변수 > 환경별 파일 > 공통 파일.
nextEnv.processEnv(
  [environmentFile, '.env'].flatMap((name) => {
    let contents;
    try {
      contents = readFileSync(new URL(name, new URL('../', import.meta.url)), 'utf8');
    } catch (error) {
      // Hosting providers inject env directly; local env files are optional.
      if (error.code === 'ENOENT') return [];
      throw error;
    }
    return [
      {
        path: name,
        contents,
        env: {},
      },
    ];
  }),
  root,
);

// --env-file을 execArgv에 넣지 않아 Next가 NODE_OPTIONS로 전달하지 않게 한다.
const child = spawn(
  process.execPath,
  [fileURLToPath(new URL('../node_modules/next/dist/bin/next', import.meta.url)), command, ...args],
  { cwd: root, stdio: 'inherit', env: process.env },
);

child.on('error', (error) => {
  console.error('[next] Failed to start:', error.message);
  process.exitCode = 1;
});
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
