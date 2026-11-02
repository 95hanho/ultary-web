import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(path, mocks) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, Date, require: name => {
    if (!(name in mocks)) throw new Error(`Missing mock: ${name}`);
    return mocks[name];
  } });
  return exports;
}

const common = {
  '@/lib/api/error': { isRecord: value => value != null && typeof value === 'object' && !Array.isArray(value) },
  '@/lib/api/fileUrl': { resolveFileDisplayUrl: file => file?.filePath ?? null },
  '@/lib/profileImage': { NO_PROFILE_SRC: '/profile.svg' },
  '@/lib/report/openReport': { readMyReport: () => null },
};

for (const [has, unviewed, expected] of [[false, false, 'none'], [true, false, 'read'], [true, true, 'unread']]) {
  test(`feed, comment and reply preserve author story state: ${expected}`, async () => {
    const flags = { authorHasStory: has, authorHasUnviewedStory: unviewed };
    const feed = load('lib/feed/toFeedData.ts', common).toFeedData({ feedId: 1, userNo: 2, ...flags }, '1');
    assert.equal(feed.story, expected);
    const comments = load('lib/feed/toComments.ts', {
      ...common,
      '@/lib/api/endpoints': { bffEndpoints: { feeds: { comments: '/comments' } } },
      '@/lib/api/bffFetch': { bffGet: async () => ({ data: [{ feedCommentId: 3, ...flags, replies: [{ feedReplyId: 4, ...flags }] }] }) },
    });
    const rows = await comments.loadFeedComments('1');
    assert.equal(rows[0].story, expected);
    assert.equal(rows[0].replies[0].story, expected);
  });
}

test('reopening a tag explanation sees its latest plain-tag response after rejection', async () => {
  let approved = true;
  let calls = 0;
  const f = load('lib/tag/explain.ts', {
    ...common,
    '@/lib/api/endpoints': { bffEndpoints: { tags: { search: '/search', detail: '/detail' } } },
    '@/lib/api/bffFetch': { bffGet: async () => {
      calls += 1;
      return { data: [{ tagId: 17, hashtag: 'review',
        title: approved ? '승인된 설명' : null, content: approved ? '설명 내용' : null,
        images: approved ? [{ fileId: 1, filePath: '/approved.jpg' }] : [],
      }] };
    } },
  });
  assert.equal(f.tagHasExplainPopup(await f.loadTagExplain('#review')), true);
  approved = false;
  assert.equal(f.tagHasExplainPopup(await f.loadTagExplain('#review')), false);
  assert.equal(calls, 2);
});
