import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const exports = {};
vm.runInNewContext(
  ts.transpileModule(
    readFileSync(new URL('../src/lib/pet/name-rules.ts', import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  ).outputText,
  { exports },
);
const { isValidPetName, petNameLength } = exports;

test('pet names count English as one and Korean syllables as two', () => {
  assert.equal(petNameLength('초코Coco'), 8);
  for (const name of ['A', '초코', 'a'.repeat(30), '가'.repeat(15), '가'.repeat(14) + 'AB']) {
    assert.equal(isValidPetName(name), true, name);
  }
  for (const name of ['', ' ', 'a'.repeat(31), '가'.repeat(16), '가'.repeat(15) + 'A', '초코1', '초 코', 'Coco_', '코코🐶', 'ㄱ', 'é']) {
    assert.equal(isValidPetName(name), false, name);
  }
});
