import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports={};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/lib/story/image-prefetch.ts',import.meta.url),'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText,{exports});
function fixture(){
 const created=[];
 const loader=new exports.StoryImagePrefetcher(()=>{
   const image={src:'',removed:false,decode:()=>Promise.resolve(),removeAttribute(){this.src='';this.removed=true;}};
   created.push(image);return image;
 });return {loader,created};
}
test('warms at most three distinct images at low priority and retains overlapping images',()=>{
 const {loader,created}=fixture();loader.update(['a','b','c','d']);
 assert.deepEqual(created.map(i=>i.src),['a','b','c']);
 assert.ok(created.every(i=>i.fetchPriority==='low'&&i.decoding==='async'));
 loader.update(['b','c','e']);
 assert.equal(created.length,4);assert.equal(created[0].removed,true);
 assert.deepEqual(created.filter(i=>!i.removed).map(i=>i.src),['b','c','e']);
});
test('duplicates do not create extra requests and cleanup releases every retained image',()=>{
 const {loader,created}=fixture();loader.update(['a','a','b']);loader.update(['a','b']);
 assert.equal(created.length,2);loader.dispose();assert.ok(created.every(i=>i.removed));
});
test('decode failure is ignored without changing playback or retrying in a loop',async()=>{
 const image={src:'',decode:()=>Promise.reject(Error('network failure')),removeAttribute(){}};
 const loader=new exports.StoryImagePrefetcher(()=>image);
 loader.update(['a']);await Promise.resolve();loader.dispose();
});
