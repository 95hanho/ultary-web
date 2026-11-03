import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const deferred = () => { let resolve, reject; const promise = new Promise((yes,no) => { resolve=yes; reject=no; }); return {promise,resolve,reject}; };
const feed = (id, content = `post-${id}`) => ({ feedId:id, content });

function fixture({ handler, browser = true } = {}) {
  const calls = [], exports = {};
  const window = { location: {pathname:'/'}, scrollY:0, scrollTo({top}) { this.scrollY=top; } };
  const convert = raw => ({ id:String(raw.feedId), advertisement:raw.advertisement===true, caption:raw.content, commentCount:raw.commentCount ?? 0 });
  const mocks = {
    '@/lib/api/endpoints': { bffEndpoints: { main: { feeds:'timeline', storyOwners:'stories', feedsRecommended:'recommended', feedAdvertisements:'ads' }, auth:{me:'me'} } },
    '@/lib/api/bffFetch': { bffGet: async (url, params) => {
      calls.push({url,params});
      if (handler) return handler(url,params);
      if (url==='timeline') return {data:params.cursorFeedId ? {items:[feed(1),feed(2)],nextCursorFeedId:null} : {items:[feed(1)],nextCursorFeedId:1}};
      if (url==='recommended') return {data:params.cursor ? {items:[feed(4)],nextCursor:null} : {items:[feed(3)],nextCursor:'next'}};
      if (url==='ads') return {data:[{...feed(900),advertisement:true}]};
      if (url==='stories') return {data:[{userNo:10,nickname:'me'}]};
      return {data:{userNo:10,nickname:'me'}};
    } },
    '@/lib/feed/toFeedData': { toFeedData:convert, toFeedDataList:raw=>(Array.isArray(raw)?raw:raw.items).map(convert) },
    '@/lib/feed/edit-return': { clearFeedEditReturn() {} },
  };
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/lib/feed/main-session.ts',import.meta.url),'utf8'), {
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
  }).outputText, { exports, ...(browser?{window}:{}), require:name=>{ if (!(name in mocks)) throw Error(`Missing mock ${name}`); return mocks[name]; } });
  return { ...exports,calls,window };
}

test('SPA returns reuse the loaded list, cursors, stories, identity and scroll without requests', async()=>{
  const f=fixture();
  await Promise.all([f.ensureMainFeedSession(),f.ensureMainFeedSession()]);
  assert.equal(f.calls.length,5);
  await f.loadMoreMainFeeds();
  f.saveMainScroll(2800); f.window.location.pathname='/search';
  f.saveMainScroll(0); f.window.location.pathname='/';
  await f.ensureMainFeedSession();
  const state=f.getMainFeedSession();
  assert.equal(f.calls.length,6);
  assert.equal(state.feeds.map(x=>x.id).join(','),'1,2');
  assert.equal(state.timelineCursor,null);
  assert.equal(state.recommendedCursor,'next');
  assert.equal(state.owners[0].userNo,10);
  assert.equal(state.me.userNo,10);
  assert.equal(f.getMainScroll(),2800);
});

test('next page uses the retained cursor and an idle home press replaces the whole snapshot', async()=>{
  const f=fixture();await f.ensureMainFeedSession();await f.loadMoreMainFeeds();await f.loadMoreMainFeeds();
  assert.equal(f.calls.at(-1).params.cursor,'next');
  assert.equal(f.getMainFeedSession().recommended.map(x=>x.id).join(','),'3,4');
  f.saveMainScroll(2800);await f.refreshMainFeedSession();
  const state=f.getMainFeedSession();
  assert.equal(state.feeds.map(x=>x.id).join(','),'1');
  assert.equal(state.recommended.map(x=>x.id).join(','),'3');
  assert.equal(state.timelineCursor,1);
  assert.equal(state.recommendedCursor,'next');
  assert.equal(f.getMainScroll(),0);
  assert.equal(f.window.scrollY,0);
});

test('home requests stay blocked until all initial requests settle after an early error', async()=>{
  const pending=deferred();
  const f=fixture({handler:(url)=>url==='timeline'?Promise.reject(Error('offline')):pending.promise});
  const request=f.ensureMainFeedSession();
  await Promise.resolve();await Promise.resolve();
  assert.equal(f.getMainFeedSession().loading,true);
  assert.equal(f.refreshMainFeedSession(),null);
  assert.equal(f.calls.length,5);
  pending.resolve({data:{}});await request;
  assert.equal(f.getMainFeedSession().loading,false);
  assert.match(f.getMainFeedSession().error.message,/offline/);
});

test('double home presses and pagination cannot overlap a refresh', async()=>{
  const gates=[];
  const f=fixture({handler:()=>{const gate=deferred();gates.push(gate);return gate.promise;}});
  const first=f.refreshMainFeedSession();
  assert.equal(f.refreshMainFeedSession(),null);
  f.loadMoreMainFeeds();assert.equal(f.calls.length,5);
  gates[0].resolve({data:{items:[feed(1)],nextCursorFeedId:null}});
  gates[1].resolve({data:[]});gates[2].resolve({data:{userNo:10}});
  gates[3].resolve({data:{items:[],nextCursor:null}});gates[4].resolve({data:[]});await first;
  assert.equal(f.getMainFeedSession().error,null);
});

test('home clicks during pagination do not clear the current list or reset scroll', async()=>{
  const gate=deferred();let pagination=false;
  const f=fixture({handler:(url,params)=>{
    if(url==='timeline'&&params.cursorFeedId){pagination=true;return gate.promise;}
    if(url==='timeline')return {data:{items:[feed(1)],nextCursorFeedId:1}};
    if(url==='recommended')return {data:{items:[],nextCursor:null}};
    return {data:url==='stories'?[]:{userNo:10}};
  }});
  await f.ensureMainFeedSession();f.saveMainScroll(800);
  const request=f.loadMoreMainFeeds();f.loadMoreMainFeeds();
  assert.ok(pagination);assert.equal(f.refreshMainFeedSession(),null);
  assert.equal(f.calls.length,6);assert.equal(f.getMainScroll(),800);
  gate.resolve({data:{items:[feed(2)],nextCursorFeedId:null}});await request;
  assert.equal(f.getMainFeedSession().feeds.length,2);
});

test('successful edits and deletes update only their cached cards without refetching', async()=>{
  const f=fixture();await f.ensureMainFeedSession();await f.loadMoreMainFeeds();
  f.updateMainFeed({data:feed(2,'edited')});f.adjustMainCommentCount('2',1);
  f.removeMainFeed('1');
  assert.equal(f.getMainFeedSession().feeds.map(x=>x.id).join(','),'2');
  assert.equal(f.getMainFeedSession().feeds[0].caption,'edited');
  assert.equal(f.getMainFeedSession().feeds[0].commentCount,1);
  assert.equal(f.getMainFeedSession().recommendedCursor,'next');
  assert.equal(f.calls.length,6);
});

test('ad cards retain changes and disappear after deletion without refetching the pool', async()=>{
  const f=fixture();await f.ensureMainFeedSession();
  f.updateMainFeed({data:{...feed(900,'changed ad'),advertisement:true}});
  f.adjustMainCommentCount('900',1);
  assert.equal(f.getMainFeedSession().advertisements[0].caption,'changed ad');
  assert.equal(f.getMainFeedSession().advertisements[0].commentCount,1);
  f.removeMainFeed('900');
  assert.equal(f.getMainFeedSession().advertisements.length,0);
  assert.equal(f.calls.length,5);
});

test('ad-only request failure does not prevent the normal main feed from loading', async()=>{
  const f=fixture({handler:(url)=>{
    if(url==='ads')throw Error('ad request unavailable');
    if(url==='timeline')return {data:{items:[feed(1)],nextCursorFeedId:null}};
    if(url==='recommended')return {data:{items:[],nextCursor:null}};
    return {data:url==='stories'?[]:{userNo:10}};
  }});
  await f.ensureMainFeedSession();
  assert.equal(f.getMainFeedSession().error,null);
  assert.equal(f.getMainFeedSession().feeds.length,1);
  assert.equal(f.getMainFeedSession().advertisements.length,0);
});

test('browser refresh starts a new empty runtime and SSR never sees browser data', async()=>{
  const f=fixture();await f.ensureMainFeedSession();
  const reloaded=fixture();assert.equal(reloaded.getMainFeedSession().ready,false);
  await reloaded.ensureMainFeedSession();assert.equal(reloaded.calls.length,5);
  const server=fixture({browser:false});await server.ensureMainFeedSession();
  assert.equal(server.calls.length,0);assert.equal(server.getMainFeedSession().feeds.length,0);
  assert.equal(f.getMainFeedServerSnapshot().feeds.length,0);
});

test('returning after reading stories refreshes only ring metadata and preserves feeds and scroll',async()=>{
  const f=fixture();await f.ensureMainFeedSession();
  f.saveMainScroll(2400);f.window.location.pathname='/stories';
  f.invalidateMainStoryOwners();
  assert.equal(f.calls.length,5);
  f.window.location.pathname='/';
  await Promise.all([f.ensureMainFeedSession(),f.ensureMainFeedSession()]);
  assert.equal(f.calls.length,6);
  assert.equal(f.calls.at(-1).url,'stories');
  assert.equal(f.getMainScroll(),2400);
  assert.equal(f.getMainFeedSession().feeds[0].id,'1');
});

test('home handles same-page normal clicks only, keeping modified and other-page links intact', async()=>{
  const f=fixture();await f.ensureMainFeedSession();let prevented=0;
  const event={button:0,metaKey:false,ctrlKey:false,shiftKey:false,altKey:false,preventDefault(){prevented++;}};
  f.window.location.pathname='/search';f.handleMainHomeClick(event);
  f.window.location.pathname='/';f.handleMainHomeClick({...event,ctrlKey:true});
  assert.equal(prevented,0);assert.equal(f.calls.length,5);
  f.handleMainHomeClick(event);assert.equal(prevented,1);assert.equal(f.calls.length,10);
  await f.ensureMainFeedSession();
});

test('cached main scroll waits for layout, and user scrolling stops restoration',()=>{
  const exports={}, frames=new Map(), listeners=new Map();let serial=0,now=0,max=100;
  const window={location:{pathname:'/'},scrollY:0,scrollTo({top}){this.scrollY=Math.min(max,top);},
    addEventListener:(key,fn)=>listeners.set(key,fn),removeEventListener:key=>listeners.delete(key)};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/lib/feed/main-scroll.ts',import.meta.url),'utf8'),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
  }).outputText,{exports,window,performance:{now:()=>now},
    requestAnimationFrame:fn=>{frames.set(++serial,fn);return serial;},cancelAnimationFrame:id=>frames.delete(id)});
  const tick=()=>{now+=16;const current=[...frames.values()];frames.clear();current.forEach(fn=>fn());};
  exports.restoreMainScroll(2800);tick();assert.equal(window.scrollY,100);
  max=8000;for(let i=0;i<8;i++)tick();assert.equal(window.scrollY,2800);
  exports.restoreMainScroll(4000);listeners.get('wheel')();window.scrollY=200;tick();
  assert.equal(window.scrollY,200);
});
