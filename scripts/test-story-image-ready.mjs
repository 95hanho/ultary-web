import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports={};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/lib/story/image-ready.ts',import.meta.url),'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText,{exports});
function image(complete=false) {
  const listeners=new Map();let resolve;
  const decoded=new Promise(yes=>resolve=yes);
  return { complete,naturalWidth:complete?100:0, decode:()=>decoded, decoded:()=>resolve(),
    addEventListener:(type,handler)=>listeners.set(type,handler),
    removeEventListener:type=>listeners.delete(type),
    load(){this.complete=true;this.naturalWidth=100;listeners.get('load')?.();} };
}
const flush=async()=>{await Promise.resolve();await Promise.resolve();};
test('network load and image decode must both finish before playback starts, exactly once',async()=>{
  const img=image();let starts=0;
  exports.onStoryImageReady(img,()=>starts++);
  await flush();assert.equal(starts,0);
  img.load();await flush();assert.equal(starts,0);
  img.decoded();await flush();assert.equal(starts,1);
  img.load();await flush();assert.equal(starts,1);
});
test('cached images start after decode without needing another load event',async()=>{
  const img=image(true);let starts=0;
  exports.onStoryImageReady(img,()=>starts++);
  img.decoded();await flush();assert.equal(starts,1);
});
test('a previous story cannot start a timer after navigation disposes the image',async()=>{
  const img=image();let starts=0;
  const dispose=exports.onStoryImageReady(img,()=>starts++);
  img.load();dispose();img.decoded();await flush();assert.equal(starts,0);
});
test('broken or undecodable images never start automatic skipping',async()=>{
  let starts=0;const broken=image(true);broken.naturalWidth=0;
  exports.onStoryImageReady(broken,()=>starts++);broken.decoded();await flush();
  const undecodable=image(true);undecodable.decode=()=>Promise.reject(Error('decode failed'));
  exports.onStoryImageReady(undecodable,()=>starts++);await flush();assert.equal(starts,0);
});
