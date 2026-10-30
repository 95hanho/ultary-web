import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const exports = {};
vm.runInNewContext(
  ts.transpileModule(
    readFileSync(new URL('../src/lib/search/mention-input.ts', import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  ).outputText,
  { exports },
);
const { activeMention, mentionTokens, mentionDeletion, replaceMention } = exports;

test('the real input renders reply-button mentions with the selected highlight markup', () => {
  const require = createRequire(import.meta.url);
  const component = {};
  vm.runInNewContext(
    ts.transpileModule(
      readFileSync(new URL('../src/components/common/MentionInput.tsx', import.meta.url), 'utf8'),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
          jsx: ts.JsxEmit.ReactJSX,
        },
      },
    ).outputText,
    {
      exports: component,
      require(name) {
        if (name === '@/lib/search/mention-input') return exports;
        if (name.endsWith('.scss')) return { default: {} };
        return require(name);
      },
    },
  );
  const draft = exports.replyMentionDraft('', [], { userNo: 2, nickname: 'walker' }, 1);
  const props = {
    value: draft.value,
    selectedUsers: draft.mentions,
    onValueChange() {},
    onMentionChange() {},
  };
  const html = renderToStaticMarkup(createElement(component.MentionInput, props));
  assert.match(html, /<strong>@walker<\/strong>/);
  const plain = renderToStaticMarkup(
    createElement(component.MentionInput, { ...props, selectedUsers: [] }),
  );
  assert.doesNotMatch(plain, /<strong>/);
});

test('already entered identities are absent from suggestions, active completion still matches', () => {
  const accounts = [
    { userNo: 1, nickname: 'walker' },
    { userNo: 2, nickname: 'doggy' },
    { userNo: 3, nickname: 'ultary' },
  ];
  const value = '@walker @doggy 안녕하세요. @ultary';
  const active = activeMention(value, value.length);
  assert.equal(
    exports
      .availableMentionAccounts('@walker ', { start: 0, end: 7, term: 'walker' }, accounts, [
        accounts[0],
      ])
      .some((user) => user.userNo === 1),
    false,
  );
  assert.equal(
    JSON.stringify(exports.availableMentionAccounts(value, active, accounts)),
    JSON.stringify([accounts[2]]),
  );
  const duplicate = '@walker 본문 @walker';
  assert.equal(
    exports
      .availableMentionAccounts(duplicate, activeMention(duplicate, duplicate.length), accounts)
      .some((user) => user.userNo === 1),
    false,
  );
  assert.equal(
    exports.availableMentionAccounts('본문 @', activeMention('본문 @', 4), accounts).length,
    3,
  );
  assert.equal(exports.availableMentionAccounts('본문', null, accounts).length, 3);
});

test('reply action selects an atomic mention and sends its identity, self reply adds none', () => {
  const target = { userNo: 2, nickname: 'walker' };
  const result = exports.replyMentionDraft('', [], target, 1);
  assert.equal(result.value, '@walker ');
  assert.equal(exports.selectedMentionTokens(result.value, result.mentions).length, 1);
  assert.equal(
    JSON.stringify(exports.mentionPayload(result.value, result.mentions)),
    JSON.stringify([{ userNo: 2 }]),
  );
  assert.ok(
    mentionDeletion(result.value, result.value.length, result.value.length, true, result.mentions),
  );
  assert.equal(exports.replyMentionDraft('', [], target, 2).value, '');
  assert.equal(exports.replyMentionDraft('', [], { nickname: 'unknown' }, 1).mentions.length, 0);
  const retained = exports.replyMentionDraft(
    '@walker @doggy 본문',
    [{ userNo: 3, nickname: 'doggy' }],
    target,
    1,
  );
  assert.equal(retained.mentions.length, 2);
  assert.equal(
    exports.replyMentionDraft(
      retained.value,
      retained.mentions,
      { userNo: 4, nickname: 'other' },
      1,
    ).mentions.length,
    1,
  );
});
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
