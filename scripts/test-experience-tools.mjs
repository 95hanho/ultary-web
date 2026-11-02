import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

for (const [file, method, path] of [
  ['story-views', 'DELETE', '/api/v1/test/story-views'],
  ['nickname-cooldown', 'POST', '/api/v1/test/nickname-cooldown'],
]) {
  function load(authorized) {
    const exports = {},
      calls = [];
    const denied = { status: 401 };
    vm.runInNewContext(
      ts.transpileModule(
        readFileSync(new URL(`../src/app/api/test/${file}/route.ts`, import.meta.url), 'utf8'),
        {
          compilerOptions: { module: ts.ModuleKind.CommonJS },
        },
      ).outputText,
      {
        exports,
        process: { env: { NODE_ENV: 'production' } },
        console: { log() {} },
        require(name) {
          if (name === '@/lib/api/endpoints')
            return { springEndpoints: { test: { storyViews: path, nicknameCooldown: path } } };
          if (name === '@/lib/api/bffRoute')
            return {
              requireAccessToken: async () => (authorized ? 'user-token' : denied),
              isUnauthorized: (value) => value === denied,
              bearer: (token) => ({ Authorization: `Bearer ${token}` }),
              ok: (data) => ({ status: 200, data }),
              handleBffError: (error) => {
                throw error;
              },
            };
          if (name === '@/lib/api/springFetch')
            return {
              springDelete: async (...args) => {
                calls.push(args);
                return { deletedCount: 2 };
              },
              springPostJson: async (...args) => {
                calls.push(args);
                return { userNo: 1 };
              },
            };
          throw Error(`Unexpected dependency ${name}`);
        },
      },
    );
    return { run: exports[method], calls };
  }
  test(`${file} forwards authenticated production requests with user token`, async () => {
    const route = load(true);
    assert.equal((await route.run()).status, 200);
    assert.equal(route.calls.length, 1);
    assert.equal(route.calls[0][0], path);
    assert.equal(route.calls[0][2].Authorization, 'Bearer user-token');
  });
  test(`${file} refuses anonymous production requests without reaching Spring`, async () => {
    const route = load(false);
    assert.equal((await route.run()).status, 401);
    assert.equal(route.calls.length, 0);
  });
}
