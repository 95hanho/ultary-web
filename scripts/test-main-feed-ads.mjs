import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/lib/feed/main-feed-ads.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports });
const insert = exports.insertFeedAdvertisements;
const posts = count => Array.from({length: count}, (_, i) => ({ id: String(i+1) }));
const ads = [{id:'a',advertisement:true},{id:'b',advertisement:true},{id:'c',advertisement:true}];
const ids = rows => Array.from(rows, row => row.id);

test('inserts unique ads after four then five normal posts across pagination boundaries', () => {
  const first = insert(posts(10), ads), full = insert(posts(20), ads);
  assert.deepEqual(ids(first), ['1','2','3','4','a','5','6','7','8','9','b','10']);
  assert.deepEqual(ids(full).slice(0, first.length), ids(first));
  assert.equal(ids(full)[15], 'c');
  assert.equal(new Set(ids(full)).size, full.length);
});
test('empty, exhausted, duplicate and already-present candidates never replace normal feeds', () => {
  assert.deepEqual(ids(insert(posts(3), ads)), ['1','2','3']);
  assert.deepEqual(ids(insert(posts(20), [])), ids(posts(20)));
  const result = insert(posts(20), [...ads,ads[0],{id:'1',advertisement:true},{id:'no',advertisement:false}]);
  assert.equal(result.length,23);
  assert.equal(new Set(ids(result)).size, result.length);
});
