import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function fixture(data={likedByMe:true,likeCount:8}){
 const exports={},calls=[];
 const request=method=>async(url,params)=>{calls.push({method,url,params});if(data instanceof Error)throw data;return {data};};
 const mocks={
  '@/lib/api/bffFetch':{bffPostJson:request('POST'),bffDelete:request('DELETE')},
  '@/lib/api/endpoints':{bffEndpoints:{feeds:{commentLike:'comment-like',replyLike:'reply-like'}}},
  '@/lib/api/error':{isRecord:value=>value!==null&&typeof value==='object'&&!Array.isArray(value)},
 };
 vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/lib/feed/comment-likes.ts',import.meta.url),'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
 }).outputText,{exports,require:name=>mocks[name]});
 return {...exports,calls};
}
test('comment and reply likes use their own POST/DELETE APIs and accept authoritative server state',async()=>{
 const f=fixture();
 const saved=await f.saveCommentLike('2762',{commentId:'10'},true);
 assert.equal(saved.isLiked,true);assert.equal(saved.likeCount,8);
 await f.saveCommentLike('2762',{commentId:'10',replyId:'20'},false);
 assert.deepEqual(f.calls.map(c=>[c.method,c.url]),[['POST','comment-like'],['DELETE','reply-like']]);
 assert.equal(f.calls[1].params.replyId,'20');assert.equal(f.calls[1].params.commentId,'10');
});
test('like updates and rollback affect only their target and preserve thread content and sibling state',()=>{
 const f=fixture();
 const original=[{id:'10',content:'comment',isLiked:false,likeCount:3,replies:[{id:'20',content:'reply',isLiked:false,likeCount:2},{id:'21',likeCount:5}]}];
 const optimistic=f.patchCommentLike(original,{commentId:'10',replyId:'20'},{isLiked:true,likeCount:3});
 assert.equal(optimistic[0].replies[0].isLiked,true);assert.equal(optimistic[0].replies[1].likeCount,5);
 assert.equal(optimistic[0].likeCount,3);assert.equal(optimistic[0].content,'comment');
 const reverted=f.patchCommentLike(optimistic,{commentId:'10',replyId:'20'},{isLiked:false,likeCount:2});
 assert.equal(reverted[0].replies[0].likeCount,2);assert.equal(original[0].replies[0].isLiked,false);
});
test('failed and malformed API responses reject rather than pretending the like was saved',async()=>{
 await assert.rejects(fixture(Error('offline')).saveCommentLike('2762',{commentId:'10'},true),/offline/);
 await assert.rejects(fixture({}).saveCommentLike('2762',{commentId:'10'},true),/응답/);
});
