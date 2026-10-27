import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const compile = (name) =>
  ts.transpileModule(readFileSync(new URL(name, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
function env(mode, flag) {
  const exports = {};
  vm.runInNewContext(compile('../src/lib/env.client.ts'), {
    exports,
    process: { env: { NODE_ENV: mode, NEXT_PUBLIC_ENABLE_WEBSOCKET: flag } },
  });
  return exports;
}
test('development defaults on, production defaults off, explicit flag wins', () => {
  assert.equal(env('development').ENABLE_WEBSOCKET, true);
  assert.equal(env('production').ENABLE_WEBSOCKET, false);
  assert.equal(env('development', 'false').ENABLE_WEBSOCKET, false);
  assert.equal(env('production', 'true').ENABLE_WEBSOCKET, true);
});
function socket(enabled) {
  let tickets = 0,
    connections = 0;
  const exports = {};
  vm.runInNewContext(compile('../src/lib/ws/liveSocket.ts'), {
    exports,
    window: {},
    process: { env: { NODE_ENV: 'production' } },
    setTimeout,
    clearTimeout,
    console,
    WebSocket: class {
      static OPEN = 1;
      static CONNECTING = 0;
      constructor() {
        connections++;
      }
    },
    require(name) {
      if (name === '@/lib/env.client')
        return { ENABLE_WEBSOCKET: enabled, SPRING_WS_URL: 'wss://example.test/ws' };
      if (name === '@/lib/api/bffFetch')
        return {
          bffPostJson: async () => {
            tickets++;
            return { data: { ticket: 'test-ticket' } };
          },
        };
      if (name === '@/lib/api/endpoints')
        return { bffEndpoints: { ws: { ticket: '/api/ws/ticket' } } };
      return { isRecord: (v) => v !== null && typeof v === 'object', isHttpError: () => false };
    },
  });
  return { start: exports.ensureLiveSocket, counts: () => ({ tickets, connections }) };
}
test('disabled mode sends no ticket request and opens no socket', async () => {
  const s = socket(false);
  s.start();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(s.counts(), { tickets: 0, connections: 0 });
});
test('enabled mode preserves ticket and websocket connection flow', async () => {
  const s = socket(true);
  s.start();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(s.counts(), { tickets: 1, connections: 1 });
});
