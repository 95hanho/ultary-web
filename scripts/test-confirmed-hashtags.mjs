import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(path,require=()=>({})){
 const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/lib/search/'+path,import.meta.url),'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
 }).outputText,{exports,require});return exports;
}
const input=load('hashtag-input.ts');
const {ConfirmedHashtags}=load('confirmed-hashtags.ts',()=>input);
const confirmed=(editor,value,caret)=>editor.isConfirmed(input.getActiveHashtag(value,caret));
const range=value=>value&&[value.start,value.end];

test('typing stays editable; a space confirms every caret position inside or at the end',()=>{
 const editor=new ConfirmedHashtags('');editor.edit('#고양이',4);
 assert.equal(confirmed(editor,'#고양이',4),false);
 editor.edit('#고양이 ',5);
 for(const caret of [1,2,3,4])assert.equal(confirmed(editor,'#고양이 ',caret),true);
 assert.equal(editor.deletionRange('Backspace',5),null);
 assert.deepEqual(range(editor.deletionRange('Backspace',4)),[0,5]);
 assert.deepEqual(range(editor.deletionRange('Delete',2)),[0,5]);
 assert.deepEqual(range(editor.deletionRange('Backspace',1,2)),[0,5]);
});

test('unfinished new drafts remain editable while published edit captions are confirmed',()=>{
 const draft=new ConfirmedHashtags('#cat',false);
 assert.equal(confirmed(draft,'#cat',4),false);
 const published=new ConfirmedHashtags('#cat',true);
 assert.equal(confirmed(published,'#cat',4),true);
});
test('selected tags remain confirmed at end of text after a separator is deleted',()=>{
 const editor=new ConfirmedHashtags('');editor.edit('#cat ',5);editor.confirmAt(0);
 editor.edit('#cat',4,'deleteContentForward');
 assert.equal(confirmed(editor,'#cat',4),true);
 assert.deepEqual(range(editor.deletionRange('Backspace',4)),[0,4]);
});
test('extending a confirmed tag reopens editing even when an old trailing space remains',()=>{
 const editor=new ConfirmedHashtags('#고양이 ');
 editor.edit('#고양이일상 ',6,'insertText');
 assert.equal(confirmed(editor,'#고양이일상 ',6),false);
 assert.equal(editor.deletionRange('Backspace',6),null);
 editor.edit('#고양이일상  ',7,'insertText');
 assert.equal(confirmed(editor,'#고양이일상  ',6),true);
});
test('confirmation is occurrence-specific and follows shifts without treating normal words as tags',()=>{
 const editor=new ConfirmedHashtags('#cat ');
 editor.edit('#cat #cat',9,'insertText');
 assert.equal(confirmed(editor,'#cat #cat',4),true);
 assert.equal(confirmed(editor,'#cat #cat',9),false);
 editor.edit('안녕 #cat #cat',12,'insertText');
 assert.equal(confirmed(editor,'안녕 #cat #cat',7),true);
 assert.equal(confirmed(editor,'안녕 #cat #cat',12),false);
});
test('backspace removes only trailing space on desktop and touch, then atomically removes the tag',()=>{
 const editor=new ConfirmedHashtags('#cat ');
 assert.equal(editor.deletionRange('Backspace',5),null);
 const removed=editor.edit('#cat',4,'deleteContentBackward');
 assert.equal(removed.next,'#cat');assert.equal(removed.caret,4);
 assert.equal(confirmed(editor,'#cat',4),true);
 assert.equal(editor.edit('#ca',3,'deleteContentBackward').next,'');
 const middle=new ConfirmedHashtags('#cat text');
 assert.equal(middle.edit('#cattext',4,'deleteContentBackward').next,'#cattext');
});
test('touch deletion inside a tag and partial cuts are atomic; editing tokens delete normally',()=>{
 const editor=new ConfirmedHashtags('#cat ');
 assert.equal(editor.edit('#ca ',3,'deleteContentBackward').next,'');
 const cut=new ConfirmedHashtags('hello #cat world');
 assert.equal(cut.edit('hello #ct world',8,'deleteByCut').next,'hello world');
 const typing=new ConfirmedHashtags('');typing.edit('#cat',4);
 assert.equal(typing.edit('#ca',3,'deleteContentBackward').next,'#ca');
});
test('replacing a suggestion before existing whitespace explicitly confirms it',()=>{
 const editor=new ConfirmedHashtags('');editor.edit('#catlover ',9);
 editor.edit('#cat ',5,'insertReplacementText');editor.confirmAt(0);
 assert.equal(confirmed(editor,'#cat ',4),true);
});

test('deleting the first of identical tokens does not transfer its confirmation to an editing copy',()=>{
 const editor=new ConfirmedHashtags('#cat ');editor.edit('#cat #cat',9,'insertText');
 const target=editor.deletionRange('Backspace',4);editor.remove(target);
 assert.equal(confirmed(editor,'#cat',4),false);
 const touch=new ConfirmedHashtags('#cat ');touch.edit('#cat #cat',9,'insertText');
 touch.edit('#cat',0,'deleteByCut');
 assert.equal(confirmed(touch,'#cat',4),false);
});
