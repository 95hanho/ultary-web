import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(file, calls, rejected = false) {
  const exports = {};
  const mocks = {
    '@/lib/api/endpoints': { bffEndpoints: { files: { root: '/files' }, feeds: { root: '/feeds', detail: '/feeds/detail' } } },
    '@/lib/api/error': { isRecord: value => value != null && typeof value === 'object' },
    '@/lib/api/bffFetch': {
      bffGet: async () => { throw Error('Unexpected separate tag/detail lookup'); },
      bffPostJson: async (url, body) => { calls.push({ url, body }); if (rejected) throw Error('AI_CONTENT_BLOCKED'); return { success: true }; },
      bffPatchJson: async (url, body) => { calls.push({ url, body }); if (rejected) throw Error('AI_CONTENT_BLOCKED'); return { success: true }; },
    },
    '@/lib/api/fileUrl': {}, '@/lib/auth/myUserNo': {}, '@/lib/auth/contentEdit': {}, './petLabels': {},
    './main-session': { updateMainFeed() {} },
  };
  const code = ts.transpileModule(readFileSync(new URL(`../src/lib/feed/${file}.ts`, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, {
    exports, File: class {}, FormData: class { append() {} },
    fetch: async url => url === '/files'
      ? { ok: true, json: async () => ({ success: true, data: { fileId: 9 } }) }
      : { blob: async () => ({ type: 'image/jpeg' }) },
    require: name => { if (!(name in mocks)) throw Error(`Missing mock: ${name}`); return mocks[name]; },
  });
  return exports;
}

for (const rejected of [false, true]) {
  test(`create sends the whole caption only to the feed API (rejected=${rejected})`, async () => {
    const calls = [], api = load('createFeed', calls, rejected);
    const pending = api.createFeedFromDraft({ caption: '본문 #새태그', items: [{ kind: 'image', sourceUrl: 'data:mock', fileName: 'a.jpg', mimeType: 'image/jpeg' }] });
    if (rejected) await assert.rejects(pending, /AI_CONTENT_BLOCKED/); else await pending;
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, '/feeds');
    assert.equal(calls[0].body.content, '본문 #새태그');
    assert.equal(calls[0].body.tagIds, undefined);
  });
  test(`edit never creates tags before the feed verdict (rejected=${rejected})`, async () => {
    const calls = [], api = load('editFeed', calls, rejected);
    const pending = api.updateFeedFromDraft('1', '수정 #새태그', [{ feedMediaId: 2 }], 'PUBLIC');
    if (rejected) await assert.rejects(pending, /AI_CONTENT_BLOCKED/); else await pending;
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, '/feeds/detail');
    assert.equal(calls[0].body.content, '수정 #새태그');
    assert.equal(calls[0].body.tagIds, undefined);
  });
}
