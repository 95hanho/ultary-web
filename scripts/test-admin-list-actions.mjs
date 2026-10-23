import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function fixture(path, overrides = {}) {
  const calls = [], changed = [], notices = [], events = [], hooks = [];
  let cursor = 0;
  const element = (type, props) => ({ type, props });
  const mocks = {
    react: {
      useRef: initial => { const i = cursor++; return hooks[i] ??= { current: initial }; },
      useState: initial => { const i = cursor++; if (!(i in hooks)) hooks[i] = initial; return [hooks[i], value => { hooks[i] = typeof value === 'function' ? value(hooks[i]) : value; }]; },
    },
    'react/jsx-runtime': { jsx: element, jsxs: element },
    '@/lib/api/bffFetch': { bffPostJson: async (url, body) => { calls.push({url,body}); return {data:{...body,requestId:17,tagId:4,status:body.status ?? 'APPROVED'}}; } },
    '@/lib/api/endpoints': { bffEndpoints: { admin: {tagApprove:'/approve',tagPending:'/pending',tagReject:'/reject',aiLogs:'/logs'} } },
    '@/lib/api/error': { isRecord: value => value != null && typeof value === 'object', isHttpError: value => typeof value?.status === 'number' },
    '@/stores/modal.store': { useModalStore: {getState:()=>({open:options=>notices.push(options)})} },
    './tagRequestData': {readTagRequest: value=>value},
    './admin.module.scss': {default:new Proxy({}, {get:(_,key)=>key})},
    ...overrides,
  };
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL(`../src/${path}`, import.meta.url),'utf8'), {
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX},
  }).outputText;
  vm.runInNewContext(code,{exports,Event:class {constructor(type){this.type=type;}},window:{dispatchEvent:event=>events.push(event.type)},require:name=>{if(!(name in mocks))throw new Error(name);return mocks[name];}});
  return {calls,changed,notices,events,exports,render: props=>{cursor=0;return exports.default({...props,onChange:item=>changed.push(item)});}};
}
function nodes(tree, type) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(child=>nodes(child,type));
  return [...(tree.type===type?[tree]:[]),...nodes(tree.props?.children,type)];
}
const settle = () => new Promise(setImmediate);
const tag = {requestId:17,tagId:4,status:'PENDING',rejectMessage:''};

test('list tag approval uses request ID, guards duplicate submissions and refreshes menu counts', async()=>{
 const f=fixture('app/admin/TagStatusControl.tsx'); const select=nodes(f.render({item:tag}),'select')[0];
 select.props.onChange({target:{value:'APPROVED'}});select.props.onChange({target:{value:'APPROVED'}});await settle();
 assert.equal(f.calls.length,1);assert.equal(f.calls[0].body.requestId,17);assert.equal(f.calls[0].body.tagId,4);
 assert.equal(f.changed[0].status,'APPROVED');assert.deepEqual(f.events,['admin-status-changed']);
});
test('choosing rejection waits for a reason and submission; choosing pending calls its own endpoint',async()=>{
 const f=fixture('app/admin/TagStatusControl.tsx');
 nodes(f.render({item:tag}),'select')[0].props.onChange({target:{value:'REJECTED'}});
 assert.equal(f.calls.length,0);
 let view=f.render({item:tag});nodes(view,'button')[1].props.onClick();await settle();
 assert.equal(f.calls.length,0);assert.match(f.notices[0].content,/거절 메시지/);
 nodes(view,'textarea')[0].props.onChange({target:{value:'사유'}});
 view=f.render({item:tag});nodes(view,'button')[1].props.onClick();await settle();
 assert.equal(f.calls[0].url,'/reject');assert.equal(f.calls[0].body.rejectMessage,'사유');
 const p=fixture('app/admin/TagStatusControl.tsx');nodes(p.render({item:{...tag,status:'REJECTED'}}),'select')[0].props.onChange({target:{value:'PENDING'}});await settle();
 assert.equal(p.calls[0].url,'/pending');
});
test('AI review updates the row; completed deletion is disabled',async()=>{
 const f=fixture('app/admin/AiReviewControl.tsx');
 nodes(f.render({item:{aiRequestId:189,adminReviewStatus:'PENDING'}}),'select')[0].props.onChange({target:{value:'KEPT'}});await settle();
 assert.equal(f.calls[0].url,'/logs/189/review');assert.equal(f.calls[0].body.status,'KEPT');assert.equal(f.changed[0].status,'KEPT');
 assert.equal(nodes(f.render({item:{aiRequestId:189,adminReviewStatus:'DELETED'}}),'select')[0].props.disabled,true);
});
test('report list uses the selected action and report identity',async()=>{
 const f=fixture('app/admin/ReportStatusControl.tsx',{'./reportStatusActions':{
  ACTION_URL:{DELETED:'/delete'},actionOptions:()=>[{value:'CONFIRMED',label:'확인'},{value:'DELETED',label:'삭제조치'}],mergeReport:(item,raw,next)=>({...item,status:next}),actionError:()=> '실패',
 }});
 nodes(f.render({item:{reportId:105,status:'CONFIRMED'}}),'select')[0].props.onChange({target:{value:'DELETED'}});await settle();
 assert.equal(f.calls[0].url,'/delete');assert.equal(f.calls[0].body.reportId,105);assert.equal(f.changed[0].status,'DELETED');
});
test('failed mutations keep the current item and show an error',async()=>{
 const f=fixture('app/admin/AiReviewControl.tsx',{'@/lib/api/bffFetch':{bffPostJson:async()=>{throw {status:409,message:'본문이 변경되었습니다.'};}}});
 nodes(f.render({item:{aiRequestId:189,adminReviewStatus:'PENDING'}}),'select')[0].props.onChange({target:{value:'DELETED'}});await settle();
 assert.equal(f.changed.length,0);assert.equal(f.events.length,0);assert.match(f.notices[0].content,/본문이 변경/);
});
test('blocked-content alert retains the server reason and invokes focus callback only when closed',()=>{
 const f=fixture('lib/ai/content-blocked.ts');let focused=false;
 assert.equal(f.exports.notifyAiContentBlocked({status:400,data:{code:'AI_CONTENT_BLOCKED',detail:'욕설·비방 표현'},message:'blocked'},()=>{focused=true;}),true);
 assert.equal(focused,false);assert.equal(f.notices[0].content,'욕설·비방 표현');f.notices[0].onClose();assert.equal(focused,true);
});
