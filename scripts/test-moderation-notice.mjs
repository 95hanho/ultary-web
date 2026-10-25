import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(path, dependencies = {}, expose = '') {
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code + expose, { exports, URLSearchParams, require: name => {
    if (!(name in dependencies)) throw new Error(name);
    return dependencies[name];
  } });
  return exports;
}
const target = load('lib/notification/openTarget.ts');
const { moderationNoticeParts } = load('lib/notification/moderationNotice.ts', { './openTarget': target });

test('moderation notices link posts, comments and replies to their exact destinations', () => {
  const destination = { feedId: '103', commentId: '815', replyId: '19' };
  for (const [word, href] of [
    ['게시글', '/posts/103'],
    ['댓글', '/posts/103?comments=103&comment=815'],
    ['답글', '/posts/103?comments=103&comment=815&reply=19'],
  ]) {
    const message = `관리자 확인 후 ${word}이 숨김 처리되었습니다.`;
    const parts = moderationNoticeParts(message, destination);
    assert.equal(parts.map(part => part.text).join(''), message);
    const link = parts.find(part => part.href);
    assert.equal(link.text, word);
    assert.equal(link.href, href);
  }
});

test('legacy notices without a destination remain readable without dead links', () => {
  assert.equal(moderationNoticeParts('댓글이 복구되었습니다.', {}).some(part => part.href), false);
  assert.equal(moderationNoticeParts('답글이 복구되었습니다.', { feedId: '103' }).some(part => part.href), false);
});

test('moderation socket events refresh content and badges without opening a modal', () => {
  const modals = [], events = [], badges = [];
  const socket = load('lib/ws/liveSocket.ts', {
    '@/lib/api/bffFetch': {}, '@/lib/api/endpoints': {}, '@/lib/env.client': {},
    '@/lib/api/error': { isRecord: value => value != null && typeof value === 'object' },
    '@/lib/notification/unreadBadge': { publishUnreadBadge: count => badges.push(count), readUnreadCount: raw => raw.unreadCount },
    '@/lib/dm/unreadBadge': {},
    '@/stores/modal.store': { useModalStore: { getState: () => ({ open: value => modals.push(value) }) } },
  }, '\nexports.handleFrame = handleFrame;');
  socket.subscribeContentModerated(event => events.push(event));
  socket.handleFrame(JSON.stringify({ type: 'CONTENT_MODERATED', jobId: 71, feedId: 103, targetId: 815, targetType: 'COMMENT', action: 'RESTORED' }));
  socket.handleFrame(JSON.stringify({ type: 'NOTIFICATION_UNREAD', unreadCount: 3 }));
  socket.handleFrame(JSON.stringify({ type: 'MODERATION_RESULT', message: '이전 서버 메시지' }));
  assert.equal(events.length, 1);
  assert.equal(events[0].targetId, '815');
  assert.equal(events[0].action, 'RESTORED');
  assert.deepEqual(badges, [3]);
  assert.equal(modals.length, 0);
});
