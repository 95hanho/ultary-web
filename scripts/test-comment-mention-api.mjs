import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const calls = [];
const exports = {};
const request = async (url, body) => {
  calls.push({ url, body });
  return {
    data: {
      feedCommentId: 11,
      feedReplyId: 22,
      userNo: 1,
      nickname: '작성자',
      content: body.content,
      mentions: [{ type: 'USER', userNo: 2, nickname: '나리집사' }],
    },
  };
};
vm.runInNewContext(
  ts.transpileModule(
    readFileSync(new URL('../src/lib/feed/toComments.ts', import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  ).outputText,
  {
    exports,
    require(name) {
      if (name === '@/lib/api/bffFetch') return { bffPostJson: request, bffPatchJson: request };
      if (name === '@/lib/api/endpoints')
        return {
          bffEndpoints: {
            feeds: { comments: 'comments', comment: 'comment', replies: 'replies', reply: 'reply' },
          },
        };
      if (name === '@/lib/api/error')
        return { isRecord: (v) => v !== null && typeof v === 'object' };
      if (name === '@/lib/api/fileUrl') return { resolveFileDisplayUrl: () => null };
      if (name === '@/lib/report/openReport') return { readMyReport: () => null };
      return {};
    },
  },
);
test('comment and reply create/edit all transmit mention IDs and read stored identity', async () => {
  const mentions = [{ userNo: 2 }];
  const content = '@나리집사 안녕';
  const comment = await exports.createFeedComment('1', content, mentions);
  const reply = await exports.createFeedReply('1', '11', content, mentions);
  await exports.updateFeedComment('1', '11', content, mentions);
  await exports.updateFeedReply('1', '11', '22', content, mentions);
  assert.equal(calls.length, 4);
  for (const call of calls) assert.deepEqual(call.body.mentions, mentions);
  for (const item of [comment, reply])
    assert.equal(
      JSON.stringify(item.mentionedUsers),
      JSON.stringify([{ userNo: 2, nickname: '나리집사' }]),
    );
});
