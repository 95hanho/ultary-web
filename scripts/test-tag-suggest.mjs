import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function fixture(token='token', failure=false) {
  const exports={},calls=[];
  const hits=[{tagId:1,hashtag:'산책',feedCount:0},{tagId:2,hashtag:'산책코스',feedCount:20},{tagId:3,hashtag:'주말산책',feedCount:10}];
  const mocks={
    '@/lib/api/endpoints':{springEndpoints:{tags:{suggest:'/api/v1/tags/suggest'}}},
    '@/lib/api/bffRoute':{
      requireAccessToken:async()=>token,isUnauthorized:t=>t==='unauthorized',bearer:t=>({Authorization:`Bearer ${t}`}),
      queryParams:request=>request.params,ok:data=>({data}),handleBffError:()=>({error:true}),
    },
    '@/lib/api/springFetch':{springGet:async(...args)=>{calls.push(args);if(failure)throw Error('offline');return hits;}},
  };
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/app/api/tags/suggest/route.ts',import.meta.url),'utf8'),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
  }).outputText,{exports,require:name=>{if(!(name in mocks))throw Error(`Missing mock ${name}`);return mocks[name];}});
  return {GET:exports.GET,calls};
}

test('suggestion BFF forwards the query/limit and preserves server order and POST counts',async()=>{
  const f=fixture();const params={q:'산책',limit:'10'};
  const result=await f.GET({params});
  assert.equal(f.calls[0][0],'/api/v1/tags/suggest');assert.equal(f.calls[0][1],params);
  assert.equal(f.calls[0][2].Authorization,'Bearer token');
  assert.equal(result.data.map(x=>x.hashtag).join(','),'산책,산책코스,주말산책');
  assert.equal(result.data[0].feedCount,0);assert.equal(result.data[1].feedCount,20);
});
test('unauthorized suggestions never reach Spring',async()=>{
  const f=fixture('unauthorized');assert.equal(await f.GET({params:{q:'산책'}}),'unauthorized');assert.equal(f.calls.length,0);
});
test('suggestion failures use the common BFF error response',async()=>{
  const f=fixture('token',true);assert.equal((await f.GET({params:{q:'산책'}})).error,true);
});
