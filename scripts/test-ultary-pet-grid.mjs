import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports = {};
const source = readFileSync(new URL('../src/lib/myultary/petFeedSelection.ts', import.meta.url), 'utf8');
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports });
const { selectGridPet, selectGridTab } = exports;
test('a pet filters either normal or mentioned feeds and clicking it again clears the filter', () => {
  for (const tab of ['feed', 'tagged']) {
    const selected = selectGridPet({ tab, petId: '' }, '101');
    assert.equal(selected.tab, tab); assert.equal(selected.petId, '101');
    assert.equal(selectGridPet(selected, '102').petId, '102');
    assert.equal(selectGridPet(selected, '101').petId, '');
  }
});
test('every actual tab transition clears the selected pet', () => {
  for (const from of ['feed', 'tagged', 'pinned']) for (const to of ['feed', 'tagged', 'pinned']) {
    const state = { tab: from, petId: '101' };
    const next = selectGridTab(state, to);
    assert.equal(next.tab, to); assert.equal(next.petId, from === to ? '101' : '');
  }
});
test('choosing a pet on the pinned tab always opens its normal feed', () => {
  const next = selectGridPet({ tab: 'pinned', petId: '' }, '101');
  assert.equal(next.tab, 'feed'); assert.equal(next.petId, '101');
});
