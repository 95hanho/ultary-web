import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(path, mocks) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/' + path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, console: { log() {} }, require(name) {
    if (!(name in mocks)) throw Error('Missing mock: ' + name);
    return mocks[name];
  } });
  return exports;
}

test('create and update BFF preserve single-character hashtag text for server-side classification', async () => {
  const calls = [];
  const body = { content: '일상 #글 #a #1 #산책', tagIds: [7] };
  const mocks = {
    '@/lib/api/endpoints': { springEndpoints: { feeds: { root: '/feeds', detail: '/feeds/:feedId' } } },
    '@/lib/api/bffRoute': {
      requireAccessToken: async () => 'fixture', isUnauthorized: () => false,
      readJsonBody: async () => body, bearer: () => ({}), ok: data => data,
      handleBffError: error => { throw error; },
      withAuth: handler => handler, withOptionalAuth: handler => handler,
    },
    '@/lib/api/springFetch': {
      springPostJson: async (path, data) => { calls.push(data); return data; },
      springPatchJson: async (path, data) => { calls.push(data); return data; },
    },
  };
  await load('app/api/feeds/route.ts', mocks).POST({});
  await load('app/api/feeds/[feedId]/route.ts', mocks).PATCH({ request: {}, accessToken: 'fixture', params: { feedId: '118' } });
  assert.equal(calls.length, 2);
  for (const data of calls) {
    assert.equal(data.content, body.content);
    assert.deepEqual(data.tagIds, [7]);
  }
});

test('published captions leave single-character tokens plain while editors highlight from #', () => {
  const input = load('lib/search/hashtag-input.ts', {});
  const { splitCaptionTags } = load('lib/mock/tags.ts', { '@/lib/search/hashtag-input': input });
  const caption = '일상 #글 #a #1 #산책';
  assert.deepEqual(Array.from(splitCaptionTags(caption).filter(part => part.type === 'tag'), part => part.value), ['#산책']);
  for (const token of ['#', '#ㄱ', '#글']) {
    assert.equal(splitCaptionTags(token, true)[0].type, 'tag');
  }
  assert.equal(splitCaptionTags(caption).map(part => part.value).join(''), caption);
});
