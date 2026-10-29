import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function nodes(n,match){if(!n||typeof n!=='object')return[];if(Array.isArray(n))return n.flatMap(x=>nodes(x,match));return[...(match(n)?[n]:[]),...nodes(n.props?.children,match)];}
function fixture(own=true, post=async()=>{}, remove=async()=>{}, initialItems){
 const states=[],effects=[],calls=[],modals=[];let cursor=0,mounted=false;
 const items=initialItems??[{userNo:102,nickname:'nari_owner',available:true,petNames:['호두'],hasStory:true,hasUnviewed:true}];
 const exports={};const code=ts.transpileModule(readFileSync(new URL('../src/components/my-ultary/LinkedUltaries.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const deps={
  react:{useState:v=>{const i=cursor++;if(!(i in states))states[i]=v;return[states[i],x=>{states[i]=typeof x==='function'?x(states[i]):x;}];},useRef:v=>{const i=cursor++;return states[i]??={current:v};},useCallback:fn=>fn,useEffect:fn=>{if(!mounted)effects.push(fn);}},
  'react/jsx-runtime':{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})},
  'next/link':{default:'a'},'next/navigation':{useRouter:()=>({push:url=>calls.push({type:'navigate',url})})},
  'lucide-react':{X:'X',Search:'Search'},'./Profile':{Profile:'Profile'},
  '@/components/common/PetNamesAndNicknameTag':{PetNamesAndNicknameTag:'Identity'},
  '@/lib/api/fileUrl':{resolveFileDisplayUrl:f=>f?.filePath??null},'@/lib/profileImage':{NO_PROFILE_SRC:'/empty.svg'},
  '@/lib/api/error':{isRecord:v=>v!==null&&typeof v==='object'},
  '@/lib/api/bffFetch':{bffGet:async()=>{calls.push({type:'get'});return{data:items};},bffPostJson:async(url,body)=>{calls.push({type:'post',body});return post(url,body);},bffDelete:async(url,body)=>{calls.push({type:'delete',body});return remove(url,body);}},
  '@/lib/api/endpoints':{bffEndpoints:{users:{ultaryLinks:'/links'},myUltary:{link:'/link',links:'/links',linksSearch:'/search'}}},
  '@/lib/mock/ultary-accounts':{myUltaryPath:n=>'/myultary/'+n},'@/lib/nickname-tag':{nicknameTag:n=>'@'+n},
  '@/stores/modal.store':{useModalStore:{getState:()=>({open:o=>modals.push(o),close:()=>calls.push({type:'close'})})}},
  './LinkedUltaries.module.scss':{default:new Proxy({},{get:(_,k)=>k})},
 };
 vm.runInNewContext(code,{exports,require:n=>{if(!(n in deps))throw Error(n);return deps[n];}});
 return{calls,modals,render(){cursor=0;const tree=exports.LinkedUltaries({userNo:101,own});mounted=true;return tree;},async settle(){effects.splice(0).forEach(fn=>fn());for(let i=0;i<12;i++)await Promise.resolve();}};
}
test('linked accounts navigate directly, and X does not delete until confirmation',async()=>{
 const f=fixture();f.render();await f.settle();let tree=f.render();
 assert.equal(nodes(tree,n=>n.type==='a'&&n.props.href==='/myultary/nari_owner').length,1);
 nodes(tree,n=>n.type==='button'&&n.props['aria-label']==='@nari_owner 연결 해제')[0].props.onClick();
 assert.equal(f.modals.at(-1).variant,'confirm');assert.equal(f.calls.filter(c=>c.type==='delete').length,0);
 f.modals.at(-1).okButton.onClick();
 assert.equal(nodes(f.render(),n=>n.type==='a').length,0);
 await f.settle();assert.equal(f.calls.filter(c=>c.type==='delete').length,1);
 assert.equal(nodes(f.render(),n=>n.type==='a').length,0);
});
test('selecting a search result adds it immediately, closes and never navigates',async()=>{
 let complete;const f=fixture(true,()=>new Promise(resolve=>{complete=resolve;}));f.render();await f.settle();
 nodes(f.render(),n=>n.type==='button'&&n.props.children==='다른 울타리 +')[0].props.onClick();
 const pending=f.modals.at(-1).content.props.onPick({userNo:201,nickname:'visitor',available:true});
 assert.equal(nodes(f.render(),n=>n.type==='a'&&n.props.href==='/myultary/visitor').length,1);
 complete();await pending;
 const actions=f.calls.filter(c=>['post','close','navigate'].includes(c.type));
 assert.deepEqual(actions.map(a=>a.type),['close','post']);
 assert.equal(actions[1].body.targetUserNo,201);
 assert.equal(nodes(f.render(),n=>n.type==='a'&&n.props.href==='/myultary/visitor').length,1);
});

test('failed addition rolls back only that account and shows the server reason',async()=>{
 let fail;const f=fixture(true,()=>new Promise((_,reject)=>{fail=reject;}));f.render();await f.settle();
 nodes(f.render(),n=>n.type==='button'&&n.props.children==='다른 울타리 +')[0].props.onClick();
 const pending=f.modals.at(-1).content.props.onPick({userNo:201,nickname:'visitor',available:true});
 assert.equal(nodes(f.render(),n=>n.type==='a').length,2);
 fail({status:404,data:{detail:'공개되지 않은 울타리입니다.'}});await pending;
 assert.equal(nodes(f.render(),n=>n.type==='a'&&n.props.href==='/myultary/visitor').length,0);
 assert.equal(nodes(f.render(),n=>n.type==='a'&&n.props.href==='/myultary/nari_owner').length,1);
 assert.equal(f.modals.at(-1).title,'울타리 추가 실패!');
 assert.equal(f.modals.at(-1).content,'공개되지 않은 울타리입니다.');
});
test('visitors can follow the connected account link but cannot remove or add links',async()=>{
 const f=fixture(false);f.render();await f.settle();const tree=f.render();
 assert.equal(nodes(tree,n=>n.type==='a').length,1);assert.equal(nodes(tree,n=>n.type==='button').length,0);
});

test('failed deletion restores the original order and shows the API reason',async()=>{
 let fail;
 const initial=[{userNo:102,nickname:'nari_owner',available:true},{userNo:103,nickname:'walker',available:true},{userNo:209,nickname:'doggy',available:true}];
 const f=fixture(true,undefined,()=>new Promise((_,reject)=>{fail=reject;}),initial);
 f.render();await f.settle();
 nodes(f.render(),n=>n.type==='button'&&n.props['aria-label']==='@walker 연결 해제')[0].props.onClick();
 f.modals.at(-1).okButton.onClick();
 assert.deepEqual(nodes(f.render(),n=>n.type==='a').map(n=>n.props.href),['/myultary/nari_owner','/myultary/doggy']);
 fail({status:503,data:{detail:'서버가 일시적으로 요청을 처리할 수 없습니다.'}});await f.settle();
 assert.deepEqual(nodes(f.render(),n=>n.type==='a').map(n=>n.props.href),initial.map(i=>'/myultary/'+i.nickname));
 assert.equal(f.modals.at(-1).title,'울타리 삭제 실패!');
 assert.equal(f.modals.at(-1).content,'서버가 일시적으로 요청을 처리할 수 없습니다.');
 assert.equal(f.calls.filter(c=>c.type==='get').length,1,'Deletion must not depend on an unrelated refresh');
});
