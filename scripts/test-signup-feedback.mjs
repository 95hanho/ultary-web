import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const error = {isRecord:v=>v!==null&&typeof v==='object',isHttpError:v=>typeof v?.status==='number'};
function load(path,mocks) {
 const exports={};
 const code=ts.transpileModule(readFileSync(new URL(`../src/${path}`,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(code,{exports,require:name=>{if(!(name in mocks))throw new Error(name);return mocks[name];}});return exports;
}
const fieldErrors=load('lib/auth/signup-errors.ts',{'@/lib/api/error':error}).signupFieldErrors;
const rules=load('lib/auth/signup-rules.ts',{});
function fixture(request=async()=>({data:{phoneAuthToken:'requested',demoCode:'123456'}})) {
 const slots=[], jobs=[];let cursor=0;
 const component=load('app/(auth)/signup/SignupClient.tsx',{
  react:{useState:value=>{const i=cursor++;if(!(i in slots))slots[i]=value;return[slots[i],next=>{slots[i]=typeof next==='function'?next(slots[i]):next;}];},useRef:value=>{const i=cursor++;return slots[i]??={current:value};},useTransition:()=>[false,fn=>jobs.push(fn())]},
  'react/jsx-runtime':{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})},
  '@/components/common/PageHeader':{PageHeader:()=>null},'@/components/auth/PhoneDemoCode':{PhoneDemoCode:()=>null},
  '@/lib/api/bffFetch':{bffPostJson:request},'@/lib/api/endpoints':{bffEndpoints:{auth:{phone:'/phone',phoneVerify:'/verify',signup:'/signup'}}},
  '@/lib/api/error':error,'@/lib/auth/signup-errors':{signupFieldErrors:fieldErrors},'@/lib/auth/signup-rules':rules,
  '@/lib/region':{getSigunguOptions:()=>[],isSigunguDisabled:()=>false,REGION_NONE:'선택',SIDO_OPTIONS:['선택']},
  clsx:{default:(...v)=>v.join(' ')},'next/navigation':{useRouter:()=>({replace:()=>{},refresh:()=>{}})},
  './signup.module.scss':{default:new Proxy({},{get:(_,key)=>key})},
 }).default;
 return {render:()=>{cursor=0;return component();},flush:()=>Promise.all(jobs.splice(0))};
}
function nodes(tree,predicate) {
 if(!tree||typeof tree!=='object')return[];
 if(Array.isArray(tree))return tree.flatMap(v=>nodes(v,predicate));
 return[...(predicate(tree)?[tree]:[]),...nodes(tree.props?.children,predicate)];
}
const input=(tree,text)=>nodes(tree,n=>n.type==='input'&&n.props.placeholder?.includes(text))[0];
const button=(tree,text)=>nodes(tree,n=>n.type==='button'&&n.props.children===text)[0];
const banners=tree=>nodes(tree,n=>n.props?.className==='errorBanner'||n.props?.className==='infoBanner');
const hints=tree=>nodes(tree,n=>typeof n.type==='function'&&n.type.name==='FieldHint').map(n=>n.props.message).filter(Boolean);
async function requested(f) {input(f.render(),'연락처').props.onChange({target:{value:'01012345678'}});button(f.render(),'인증요청').props.onClick();await f.flush();return f.render();}

test('demo request only displays the code and never a duplicate banner',async()=>{
 const f=fixture();const tree=await requested(f);assert.equal(banners(tree).length,0);
 assert.equal(nodes(tree,n=>n.props?.code==='123456').length,1);
 assert.equal(nodes(tree,n=>n.props?.children==='데모 인증번호를 확인해 주세요.').length,0);
});
test('normal request success appears as a field status',async()=>{
 const f=fixture(async()=>({data:{phoneAuthToken:'requested'}}));const tree=await requested(f);
 assert.equal(banners(tree).length,0);assert.equal(nodes(tree,n=>n.props?.role==='status')[0].props.children,'인증번호를 발송했습니다.');
});
test('request and verify errors appear as input hints instead of banners',async()=>{
 const failure={status:400,data:{message:'인증 요청 실패'}};
 const f=fixture(async()=>{throw failure;});const tree=await requested(f);
 assert.equal(banners(tree).length,0);assert.ok(hints(tree).includes('인증 요청 실패'));
 const v=fixture(async url=>{if(url==='/verify')throw {status:400,data:{message:'인증번호 불일치'}};return {data:{phoneAuthToken:'requested',demoCode:'123456'}};});
 await requested(v);input(v.render(),'인증번호').props.onChange({target:{value:'000000'}});button(v.render(),'확인').props.onClick();await v.flush();
 assert.equal(banners(v.render()).length,0);assert.ok(hints(v.render()).includes('인증번호 불일치'));
});
test('verified success appears below the phone and clears after the phone is changed',async()=>{
 const f=fixture(async url=>({data:url==='/verify'?{phoneAuthCompleteToken:'complete'}:{phoneAuthToken:'requested',demoCode:'123456'}}));
 await requested(f);input(f.render(),'인증번호').props.onChange({target:{value:'123456'}});button(f.render(),'확인').props.onClick();await f.flush();
 let tree=f.render();assert.equal(banners(tree).length,0);assert.equal(nodes(tree,n=>n.props?.role==='status')[0].props.children,'휴대폰 인증이 완료되었습니다.');
 input(tree,'연락처').props.onChange({target:{value:'01099999999'}});tree=f.render();assert.equal(nodes(tree,n=>n.props?.role==='status').length,0);assert.equal(nodes(tree,n=>n.props?.code==='123456').length,0);
});
test('late request response for the previous phone number cannot resurrect its code',async()=>{
 let resolve;const f=fixture(()=>new Promise(done=>{resolve=done;}));
 input(f.render(),'연락처').props.onChange({target:{value:'01012345678'}});button(f.render(),'인증요청').props.onClick();
 input(f.render(),'연락처').props.onChange({target:{value:'01099999999'}});resolve({data:{phoneAuthToken:'old',demoCode:'123456'}});await f.flush();
 assert.equal(nodes(f.render(),n=>n.props?.code==='123456').length,0);
});
test('required-field errors remain next to inputs',()=>{
 const f=fixture();nodes(f.render(),n=>typeof n.props?.onSubmit==='function')[0].props.onSubmit();
 assert.equal(banners(f.render()).length,0);assert.ok(hints(f.render()).includes(rules.MSG.phoneRequired));
});
test('server validation and duplicate errors map to inputs while transport errors remain form-wide',()=>{
 const result=fieldErrors({status:400,data:{code:'INVALID_INPUT',data:{password:'비밀번호 형식',phoneAuthCompleteToken:'인증 필요',unknown:'무시'}}});
 assert.equal(result.password,'비밀번호 형식');assert.equal(result.phone,'인증 필요');assert.equal(result.unknown,undefined);
 assert.ok(fieldErrors({status:409,data:{code:'NICKNAME_DUPLICATED'}}).nickname);
 assert.equal(Object.keys(fieldErrors({status:503,data:{code:'SERVICE_UNAVAILABLE'}})).length,0);
});

test('signup accepts the null Spring success payload without issuing auth cookies', async () => {
 const calls=[];
 const route=load('app/api/auth/signup/route.ts',{
  'next/server':{NextResponse:{json:(body,init)=>({body,status:init.status})}},
  '@/lib/api/bffRoute':{handleBffError:err=>{throw err;}},
  '@/lib/api/endpoints':{springEndpoints:{auth:{signup:'/signup'}}},
  '@/lib/api/springFetch':{springPostJson:async(...args)=>{calls.push(args);return null;}},
  '@/lib/auth/signup-rules':{validateNickname:()=>null},
 });
 const response=await route.POST({json:async()=>({phoneAuthCompleteToken:'verified',password:'Test1234!',nickname:'tester'})});
 assert.equal(calls.length,1);
 assert.equal(response.status,200);
 assert.equal(response.body.success,true);
 assert.equal(response.body.message,'SIGNUP_SUCCESS');
});
