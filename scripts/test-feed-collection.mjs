import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(source, mocks = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL('../src/' + source, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, require: name => { if (!(name in mocks)) throw Error(name); return mocks[name]; } });
  return exports;
}
const errors = load('lib/api/error.ts');
function fixture(failures) {
  return load('lib/myultary/loadCollectionFeeds.ts', {
    '@/lib/api/error': errors,
    '@/lib/api/endpoints': { bffEndpoints: { feeds: { detail: '/feeds/:feedId' } } },
    '@/lib/api/bffFetch': { bffGet: async (_url, { feedId }) => {
      if (failures[feedId]) throw failures[feedId];
      return { data: { feedId } };
    } },
    '@/lib/feed/toFeedData': { toFeedData: (raw, id) => ({ id, raw }) },
  }).loadCollectionFeeds;
}
const http = status => ({ status, message: 'UNAVAILABLE', data: {}, url: '/feeds/test' });
test('an inaccessible sibling cannot prevent the selected tagged post from opening', async () => {
  const load = fixture({ 129: http(404), 136: http(403), 141: http(410) });
  const result = await load(['118', '129', '136', '141', '143'], '118');
  assert.deepEqual(Array.from(result, item => item.id), ['118', '143']);
});
test('a missing or blocked selected post still shows its actual error', async () => {
  for (const status of [403, 404, 410]) {
    const error = http(status);
    await assert.rejects(fixture({ 118: error })(['118', '143'], '118'), value => value === error);
  }
});
test('authentication, server and transport failures are never silently discarded', async () => {
  for (const status of [0, 401, 429, 500, 502, 503, 504]) {
    const error = http(status);
    await assert.rejects(fixture({ 143: error })(['118', '143'], '118'), value => value === error);
  }
});
