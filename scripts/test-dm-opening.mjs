import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const exports = {};
vm.runInNewContext(
  ts.transpileModule(
    readFileSync(new URL('../src/lib/dm/openingMessages.ts', import.meta.url), 'utf8'),
    {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    },
  ).outputText,
  { exports },
);
const { loadDmOpeningMessages, dmOpeningScrollTop } = exports;
const messages = (...ids) => ids.map((id) => ({ id: String(id) }));

test('first unread is centered when there is enough content on each side', () => {
  assert.equal(dmOpeningScrollTop(4000, 600, 1400, 40), 1120);
});
test('one to three short unread messages near the end naturally clamp to the bottom', () => {
  for (const unread of [1, 2, 3])
    assert.equal(dmOpeningScrollTop(2000, 600, 2000 - unread * 50, 40), 1400);
});
test('already-read rooms open at the bottom and short threads never get a negative offset', () => {
  assert.equal(dmOpeningScrollTop(2000, 600), 1400);
  assert.equal(dmOpeningScrollTop(200, 600, 100, 40), 0);
  assert.equal(dmOpeningScrollTop(2000, 600, 0, 40), 0);
});
test('no extra history requests when the first unread is already loaded', async () => {
  let calls = 0;
  const page = { list: messages(40, 41), cursor: '40', firstUnread: '40' };
  const result = await loadDmOpeningMessages(
    async () => {
      calls++;
      return page;
    },
    () => true,
  );
  assert.equal(calls, 1);
  assert.equal(result.firstUnread, '40');
});
test('loads older pages until the original anchor appears, despite later responses marking everything read', async () => {
  const cursors = [];
  const pages = [
    { list: messages(40, 41), cursor: '40', firstUnread: '5', peerRead: '39' },
    { list: messages(20, 21, 40), cursor: '20', firstUnread: null, peerRead: '41' },
    { list: messages(4, 5, 6), cursor: '4', firstUnread: null, peerRead: '41' },
  ];
  const result = await loadDmOpeningMessages(
    async (cursor) => {
      cursors.push(cursor);
      return pages.shift();
    },
    () => true,
  );
  assert.deepEqual(cursors, [undefined, '40', '20']);
  assert.deepEqual(
    Array.from(result.list, (m) => m.id),
    ['4', '5', '6', '20', '21', '40', '41'],
  );
  assert.equal(result.firstUnread, '5');
  assert.equal(result.peerRead, '39');
  assert.equal(result.cursor, '4');
});
test('fully read rooms do not fetch unnecessary earlier history', async () => {
  let calls = 0;
  await loadDmOpeningMessages(
    async () => {
      calls++;
      return { list: messages(40), cursor: '40', firstUnread: null };
    },
    () => true,
  );
  assert.equal(calls, 1);
});
test('switching rooms during loading discards the old response', async () => {
  const result = await loadDmOpeningMessages(
    async () => ({ list: messages(40), cursor: '40', firstUnread: '1' }),
    () => false,
  );
  assert.equal(result, null);
});
test('a deleted anchor stops at exhausted history and a repeated cursor cannot loop forever', async () => {
  const pages = [
    { list: messages(40), cursor: '40', firstUnread: '5' },
    { list: messages(1), cursor: null, firstUnread: null },
  ];
  const result = await loadDmOpeningMessages(
    async () => pages.shift(),
    () => true,
  );
  assert.equal(result.cursor, null);
  await assert.rejects(
    loadDmOpeningMessages(
      async () => ({ list: messages(40), cursor: '40', firstUnread: '5' }),
      () => true,
    ),
    /cursor did not advance/,
  );
});
