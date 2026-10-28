import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(path) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports });
  return exports;
}
const { validateNickname, filterNickname } = load('../src/lib/auth/signup-rules.ts');
const { nicknameTag } = load('../src/lib/nickname-tag.ts');
test('nickname tags enforce the shared alphabet, uniqueness remains server-owned', () => {
  for (const name of ['a', '_', 'nari_owner', 'abcdefghij']) assert.equal(validateNickname(name), null);
  for (const name of ['', 'Upper', 'user1', '울타리', '@ultary', 'a-b', 'two words', 'abcdefghijk']) {
    assert.equal(typeof validateNickname(name), 'string', name);
  }
  assert.equal(filterNickname('@Nari_Owner123'), 'nari_owner');
  assert.equal(nicknameTag('ultary'), '@ultary');
  assert.equal(nicknameTag('@ultary'), '@ultary');
});
