import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports={};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/lib/report/openReport.ts',import.meta.url),'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText,{exports,require:()=>({})});
test('indicator remains for requested/confirmed reports but only requested reports are cancellable',()=>{
 const requested={reportId:1,status:'REQUESTED'},confirmed={reportId:1,status:'CONFIRMED'};
 assert.equal(exports.hasActiveReport(requested),true);
 assert.equal(exports.hasActiveReport(confirmed),true);
 assert.equal(exports.canCancelReport(requested),true);
 assert.equal(exports.canCancelReport(confirmed),false);
});
test('rejected, completed, absent and unknown reports cannot keep the emergency icon visible',()=>{
 for(const status of ['REJECTED','DELETED','SUSPENDED','UNKNOWN']){
  const report={reportId:1,status};
  assert.equal(exports.hasActiveReport(report),false,status);
  assert.equal(exports.canCancelReport(report),false,status);
 }
 assert.equal(exports.hasActiveReport(null),false);
 assert.equal(exports.hasActiveReport(undefined),false);
});
