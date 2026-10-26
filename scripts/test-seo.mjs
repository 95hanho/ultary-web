import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(path,mocks={}){
 const exports={};const code=ts.transpileModule(readFileSync(new URL('../src/'+path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(code,{exports,URL,require:name=>{if(!(name in mocks))throw new Error('Missing mock: '+name);return mocks[name];}});return exports;
}
const meta=load('lib/seo/metadata.ts');const origin='https://ultary.example.test';
const pathMock={myUltaryPath:name=>'/myultary/'+encodeURIComponent(name)};
const base={'@/lib/seo/metadata':meta,'@/lib/seo/site':{SEO_ORIGIN:origin}};

test('only configured HTTPS origins can enable search indexing',()=>{
 for(const value of ['', 'http://localhost:3000','https://localhost','https://127.0.0.1','https://[::1]','https://user:password@example.test','https://example.test/path','https://example.test/?q=1'])assert.equal(meta.indexableOrigin(value),null);
 assert.equal(meta.indexableOrigin(origin),origin);
});
test('public metadata has canonical, description, actual image and social cards',()=>{
 const value=meta.publicPageMetadata({origin,path:'/feeds/120',title:'울타리님의 게시글 - Ultary',description:'산책\n  함께 해요',image:'/api/files/8/content'});
 assert.equal(value.robots.index,true);assert.equal(value.alternates.canonical,origin+'/feeds/120');assert.equal(value.openGraph.url,origin+'/feeds/120');
 assert.equal(value.description,'산책 함께 해요');assert.equal(value.openGraph.images[0].url,'/api/files/8/content');assert.equal(value.twitter.card,'summary_large_image');
});
test('unconfigured metadata stays noindex and invalid image URLs use the common OG image',()=>{
 const value=meta.publicPageMetadata({origin:null,path:'/login',title:'Ultary',description:'demo',image:'javascript:alert(1)'});
 assert.equal(value.robots.index,false);assert.equal(value.alternates,undefined);assert.equal(value.openGraph.images[0].url,'/images/og-image.png');
});
test('login is an explicit indexing exception but signup/password pages have no exception',()=>{
 const value=load('app/(auth)/login/page.tsx',{...base,'react/jsx-runtime':{jsx:()=>null},'./LoginClient':{default:()=>null}}).metadata;
 assert.equal(value.robots.index,true);assert.equal(value.alternates.canonical,origin+'/login');
 for(const path of ['app/(auth)/signup/page.tsx','app/(auth)/login/password/page.tsx']){
  const source=readFileSync(new URL('../src/'+path,import.meta.url),'utf8');assert.doesNotMatch(source,/index:\s*true|publicPageMetadata/);
 }
 assert.match(readFileSync(new URL('../src/app/layout.tsx',import.meta.url),'utf8'),/robots:\s*NO_INDEX/);
});
function feedFixture({member=false,fail=false}={}){
 const calls=[];const jsx=(type,props)=>({type,props});
 const result=load('app/(main)/feeds/[feedId]/page.tsx',{
 ...base,'react/jsx-runtime':{jsx,jsxs:jsx},'@/lib/seo/publicFeed':{loadPublicFeed:async id=>{calls.push(id);if(fail)throw {status:404};return {feedId:120,authorNickname:'울타리',content:'공개 산책',media:[{sortOrder:1,file:{fileId:2,filePath:'https://cdn.example.test/second.jpg'}},{sortOrder:0,file:{fileId:1,filePath:'https://cdn.example.test/first.jpg'}}]};}},
 '@/lib/api/fileUrl':{resolveFileDisplayUrl:file=>file?.filePath??null},'@/lib/auth/cookies':{getAccessToken:async()=>member?'token':null,getRefreshToken:async()=>null},
 '@/components/auth/GuestFeedView':{GuestFeedView:'guest'},'@/components/common/PageLoadError':{PageLoadError:'error'},'../../posts/[id]/PostClient':{default:'post'},
 '@/lib/feed/toFeedData':{toFeedData:()=>({images:['image']})},'next/navigation':{notFound:()=>{throw Error('NOT_FOUND');}},'@/lib/api/page-load-error':{isUnavailablePageError:()=>true},
 });return {...result,calls};
}
test('shared feed canonical and OG image are independent of mediaIndex',async()=>{
 const f=feedFixture();const value=await f.generateMetadata({params:Promise.resolve({feedId:'120'}),searchParams:Promise.resolve({mediaIndex:'1'})});
 assert.equal(value.alternates.canonical,origin+'/feeds/120');assert.equal(value.openGraph.images[0].url,'https://cdn.example.test/first.jpg');assert.equal(value.description,'공개 산책');
});
test('member metadata never performs an anonymous lookup that could bypass a block',async()=>{
 const f=feedFixture({member:true});const value=await f.generateMetadata({params:Promise.resolve({feedId:'120'})});assert.equal(value.robots.index,false);assert.equal(f.calls.length,0);
});
test('missing or inaccessible feed has no title/content leak and remains noindex',async()=>{
 const f=feedFixture({fail:true});const value=await f.generateMetadata({params:Promise.resolve({feedId:'120'})});assert.equal(value.robots.index,false);assert.equal(value.title,'Ultary');assert.equal(value.description,undefined);
 await assert.rejects(f.default({params:Promise.resolve({feedId:'120'}),searchParams:Promise.resolve({})}),/NOT_FOUND/);
});
test('sitemap paginates only public profile and feed IDs with no mediaIndex variants',async()=>{
 const calls=[];const f=load('lib/seo/sitemap.ts',{'@/lib/mock/ultary-accounts':pathMock});
 const result=await f.buildSitemap(origin,async(type,cursor)=>{calls.push([type,cursor]);return type==='PROFILE'?(cursor===0?{items:[{id:1,nickname:'울타리'}],nextCursorId:1}:{items:[{id:2,nickname:'펫'}],nextCursorId:null}):{items:[{id:120}],nextCursorId:null};});
 assert.deepEqual(Array.from(result,row=>row.url),[origin+'/login',origin+'/myultary/'+encodeURIComponent('울타리'),origin+'/myultary/'+encodeURIComponent('펫'),origin+'/feeds/120']);
 assert.equal(calls.length,3);assert.ok(result.every(row=>!row.url.includes('?')));
});
test('sitemap does not query DB without a domain and propagates upstream failure rather than publishing an incomplete list',async()=>{
 const f=load('lib/seo/sitemap.ts',{'@/lib/mock/ultary-accounts':pathMock});let calls=0;
 assert.equal((await f.buildSitemap(null,async()=>{calls++;})).length,0);assert.equal(calls,0);
 await assert.rejects(f.buildSitemap(origin,async()=>{throw Error('DB unavailable');}),/DB unavailable/);
 await assert.rejects(f.buildSitemap(origin,async()=>({items:[{id:1,nickname:'test'}],nextCursorId:2})),/cursor/);
});
test('robots permits crawling noindex pages and public file images; localhost blocks all crawling',()=>{
 const real=load('app/robots.ts',base).default();assert.ok(real.rules.allow.includes('/'));assert.ok(real.rules.allow.includes('/api/files/'));assert.equal(real.sitemap,origin+'/sitemap.xml');
 const local=load('app/robots.ts',{'@/lib/seo/site':{SEO_ORIGIN:null}}).default();assert.equal(local.rules.disallow,'/');assert.equal(local.sitemap,undefined);
});
