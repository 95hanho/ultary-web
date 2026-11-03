import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports={};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/lib/story/main-story-order.ts',import.meta.url),'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText,{exports});
const order=exports.orderMainStoryOwners;
const owner=(userNo,hasUnviewed,hour)=>({userNo,hasUnviewed,latestStoryAt:`2026-11-03T${hour}:00:00`});
const ids=rows=>Array.from(rows,r=>r.userNo);
test('unread own story stays first even when another unread story is newer',()=>{
  assert.deepEqual(ids(order([owner(2,true,'12'),owner(1,true,'10'),owner(3,false,'13')],1)),[1,2,3]);
});
test('read own story uses normal unread-first and newest-within-group ordering',()=>{
  const source=[owner(1,false,'11'),owner(2,false,'12'),owner(3,true,'10')];
  assert.deepEqual(ids(order(source,1)),[3,2,1]);
  assert.deepEqual(ids(source),[1,2,3]);
  assert.deepEqual(ids(order(source.map(o=>({...o,hasUnviewed:false})),1)),[2,1,3]);
});
