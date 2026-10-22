import { spawn } from 'node:child_process';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';

const [command, ...args] = process.argv.slice(2);
if (!['dev', 'build', 'start'].includes(command)) {
  throw new Error('Usage: node scripts/run-next.mjs <dev|build|start> [options]');
}

const root = fileURLToPath(new URL('../', import.meta.url));
const environmentFile = command === 'dev' ? '.env.local' : '.env.production';

// loadEnvFile은 기존 환경변수를 덮어쓰지 않으므로 환경별 파일을 먼저 읽는다.
// 우선순위: 서버 환경변수 > 환경별 파일 > 공통 파일.
for (const name of [environmentFile, '.env']) {
  loadEnvFile(new URL(name, new URL('../', import.meta.url)));
}

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
