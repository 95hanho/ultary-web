import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports = {};
vm.runInNewContext(
  ts.transpileModule(
    readFileSync(new URL('../src/lib/search/mention-input.ts', import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  ).outputText,
  { exports },
);
const { activeMention, mentionTokens, mentionDeletion, replaceMention } = exports;
test('Korean nicknames and bare @ open suggestions, emails do not', () => {
  assert.equal(activeMention('@', 1).term, '');
  assert.equal(activeMention('안녕 @나리', 6).term, '나리');
  assert.equal(activeMention('a@b.com', 3), null);
  assert.equal(activeMention('@나리 ', 4), null);
});
test('picking a user replaces the whole active token with exactly one separator', () => {
  const value = '안녕 @나리집사   반가워';
  const result = replaceMention(value, activeMention(value, 6), '울타리');
  assert.equal(result.value, '@울타리 안녕 반가워');
  assert.equal(result.caret, 8);
});
test('completed Korean mentions delete as a whole with Backspace and Delete', () => {
  const value = '@나리집사 안녕';
  assert.equal(mentionDeletion(value, 6, 6, true).start, 0);
  assert.equal(mentionDeletion(value, 0, 0, false).end, 6);
  assert.equal(mentionDeletion(value, 3, 3, true).end, 6);
});
test('partial selection touching a mention expands to the whole block', () => {
  const r = mentionDeletion('안녕 @울타리 반가워', 5, 6, true);
  assert.equal(r.start, 3);
  assert.equal(r.end, 8);
});
test('unfinished input remains editable letter by letter', () => {
  assert.equal(mentionDeletion('@울타', 3, 3, true), null);
  assert.equal(mentionTokens('@울타리 @나리집사 ').length, 2);
});

test('committed mentions collect at the front in selection order without duplicates', () => {
  const original = '@나리집사 본문 중간 @울타리 남은 내용';
  const result = replaceMention(
    original,
    activeMention(original, original.indexOf('@울타리') + '@울타리'.length),
    '울타리',
  );
  assert.equal(result.value, '@나리집사 @울타리 본문 중간 남은 내용');
  const dup = '@나리집사 본문 @나리집사';
  assert.equal(
    replaceMention(dup, activeMention(dup, dup.length), '나리집사').value,
    '@나리집사 본문 ',
  );
});
test('only the beginning or whitespace before @ enables suggestions', () => {
  for (const value of ['본문@울타리', '.@울타리', '@@울타리'])
    assert.equal(activeMention(value, value.length), null);
  for (const value of ['@', '@울', '본문 @', '본문  @울'])
    assert.ok(activeMention(value, value.length));
});
test('only IDs whose nickname remains in the submitted text are sent, without duplicates', () => {
  const people = [
    { userNo: 1, nickname: '나리집사' },
    { userNo: 2, nickname: '울타리' },
    { userNo: 1, nickname: '나리집사' },
  ];
  assert.equal(
    JSON.stringify(exports.mentionPayload('@나리집사 본문', people)),
    JSON.stringify([{ userNo: 1 }]),
  );
});

test('caret returns to the original body position after a trailing mention moves', () => {
  const value = '@나리집사 본문 끝 @울타리';
  const result = replaceMention(value, activeMention(value, value.length), '울타리');
  assert.equal(result.caret, result.value.length);
});
test('caret returns to the insertion point in the middle of existing prose', () => {
  const value = '@나리집사 앞쪽 @울타리 뒤쪽';
  const result = replaceMention(
    value,
    activeMention(value, value.indexOf('@울타리') + 4),
    '울타리',
  );
  assert.equal(result.value.slice(result.caret), '뒤쪽');
  assert.equal(result.value.slice(0, result.caret), '@나리집사 @울타리 앞쪽 ');
});

test('plain typed names have no selected highlight or atomic deletion', () => {
  assert.equal(exports.selectedMentionTokens('@나리집사 ', []).length, 0);
  assert.equal(mentionDeletion('@나리집사 ', 6, 6, true, []), null);
  assert.equal(
    exports.selectedMentionTokens('@나리집사 ', [{ userNo: 1, nickname: '나리집사' }]).length,
    1,
  );
});
test('selecting another person does not promote an earlier unselected @text', () => {
  const value = '@일반텍스트 본문 @나리';
  const result = replaceMention(value, activeMention(value, value.length), '나리집사', []);
  assert.equal(result.value, '@나리집사 @일반텍스트 본문 ');
});
test('editing or removing a selected nickname clears its identity so retyping is plain', () => {
  const people = [{ userNo: 1, nickname: '나리집사' }];
  assert.equal(exports.retainMentionUsers('@나리집사 본문', '본문', people).length, 0);
  assert.equal(exports.retainMentionUsers('@나리집사 본문', '@나리집 본문', people).length, 0);
  assert.equal(
    exports.retainMentionUsers('@나리집사 본문', '@나리집사 다른 본문', people).length,
    1,
  );
});
