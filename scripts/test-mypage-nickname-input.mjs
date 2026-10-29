import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(path, deps) {
 const exports={};
 const source=ts.transpileModule(readFileSync(new URL('../src/'+path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(source,{exports,console,require(name){if(!(name in deps))throw Error(name);return deps[name];}});
 return exports;
}
const rules=load('lib/auth/signup-rules.ts',{});
function nodes(node,test){if(!node||typeof node!=='object')return[];if(Array.isArray(node))return node.flatMap(n=>nodes(n,test));return[...(test(node)?[node]:[]),...nodes(node.props?.children,test)];}
function fixture(){
 const states=[],effects=[],jobs=[],calls=[];let cursor=0,mounted=false;
 const me={userNo:101,nickname:'ultary',name:'테스터',email:'test@example.com',phone:'01012345678',regionSido:'서울특별시',regionSigungu:'강남구'};
 const request=async(url,body)=>{calls.push({url,body});return{data:{...me,nickname:body?.nickname??me.nickname}};};
 const Component=load('app/(main)/settings/mypage/edit/MyPageEditClient.tsx',{
  react:{useState:initial=>{const i=cursor++;if(!(i in states))states[i]=initial;return[states[i],v=>{states[i]=typeof v==='function'?v(states[i]):v;}];},useRef:initial=>{const i=cursor++;return states[i]??={current:initial};},useEffect:fn=>{if(!mounted)effects.push(fn);},useTransition:()=>[false,fn=>jobs.push(fn())]},
  'react/jsx-runtime':{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})},
  '@/components/auth/PhoneDemoCode':{PhoneDemoCode:()=>null},'@/components/common/PageLoadError':{PageLoadError:()=>null},'@/components/common/PageHeader':{PageHeader:()=>null},'@/components/dev/MyPageEditDevTools':{MyPageEditDevTools:()=>null},
  '@/lib/api/bffFetch':{bffGet:request,bffPatchJson:request,bffPostJson:request},
  '@/lib/api/endpoints':{bffEndpoints:{auth:{me:'/me',meNickname:'/nickname'}}},
  '@/lib/api/error':{isHttpError:()=>false},'@/lib/auth/signup-rules':rules,
  '@/lib/region':{REGION_NONE:'선택',SIDO_OPTIONS:['선택','서울특별시'],getSigunguOptions:()=>['강남구'],isSigunguDisabled:()=>false},
  clsx:{default:(...values)=>values.filter(Boolean).join(' ')},'next/navigation':{useRouter:()=>({push:()=>{},refresh:()=>{}})},'../mypage.module.scss':{default:new Proxy({},{get:(_,key)=>key})},
 }).default;
 return{calls,render(){cursor=0;const tree=Component();mounted=true;return tree;},async mount(){this.render();effects.splice(0).forEach(fn=>fn());for(let i=0;i<8;i++)await Promise.resolve();},flush:()=>Promise.all(jobs.splice(0))};
}
const nicknameInput=tree=>nodes(tree,n=>n.type==='input'&&n.props.placeholder==='닉네임태그를 입력해주세요.')[0];
const submit=tree=>nodes(tree,n=>typeof n.props?.onSubmit==='function')[0].props.onSubmit();
const hints=tree=>nodes(tree,n=>n.type?.name==='FieldHint').map(n=>n.props.message);

test('member nickname input is bare text with a separate prefix and preserves invalid edits until submit',async()=>{
 const f=fixture();await f.mount();
 assert.equal(nicknameInput(f.render()).props.value,'ultary');
 assert.equal(nicknameInput(f.render()).props.maxLength,undefined);
 assert.equal(nodes(f.render(),n=>n.type==='span'&&n.props.className==='nicknamePrefix')[0].props.children,'@');
 for(const raw of ['Upper','한글123!','abcdefghijk','@ultary','ultary ']){
  nicknameInput(f.render()).props.onChange({target:{value:raw}});
  assert.equal(nicknameInput(f.render()).props.value,raw);
  assert.ok(!hints(f.render()).includes(rules.MSG.nickname));
  submit(f.render());await f.flush();
  assert.ok(hints(f.render()).includes(rules.MSG.nickname));
 }
 assert.equal(f.calls.length,1,'Invalid nicknames must never reach a mutation API');
});
