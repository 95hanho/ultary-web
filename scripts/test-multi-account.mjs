import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as jsx from 'react/jsx-runtime';

function fixture(result) {
  const calls = [], cookies = [], exports = {};
  const mocks = {
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
    '@/lib/api/endpoints': { springEndpoints: { auth: { login: '/login' } } },
    '@/lib/api/bffRoute': { handleBffError: error => ({ status: 500, error }) },
    '@/lib/api/springFetch': { springPostJson: async (...args) => { calls.push(args); return result; } },
    '@/lib/auth/cookies': { setAuthCookies: (...args) => cookies.push(args) },
    '@/lib/auth/client-connection': { clientConnectionHeaders: async () => ({}) },
  };
  const source = readFileSync(new URL('../src/app/api/auth/login/route.ts', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, require: name => { if (!(name in mocks)) throw Error(name); return mocks[name]; }, console: { log() {} } });
  return { post: body => exports.POST({ json: async () => body }), calls, cookies };
}
test('account choices expose no tokens and never write authentication cookies', async () => {
  const f = fixture({ selectionRequired: true, accounts: [{ userNo: 1, nickname: 'first' }, { userNo: 2, nickname: 'second' }], accessToken: 'must-not-leak' });
  const response = await f.post({ email: 'shared@test.invalid', password: 'password' });
  assert.equal(response.status, 200);
  assert.equal(response.body.data.selectionRequired, true);
  assert.equal(response.body.data.accessToken, undefined);
  assert.equal(f.cookies.length, 0);
});
test('selected account is forwarded for server password validation before issuing cookies', async () => {
  const tokens = { accessToken: 'access', refreshToken: 'refresh' };
  const f = fixture(tokens);
  const body = { phone: '01012345678', password: 'password', userNo: 2 };
  const response = await f.post(body);
  assert.equal(response.status, 200);
  assert.equal(f.calls[0][1], body);
  assert.equal(f.cookies.length, 1);
  assert.equal(f.cookies[0][1], tokens);
});

test('login action modal shows nickname tags and resubmits the selected account with the original password', async () => {
  const exports = {}, calls = [], tasks = [], navigations = [];
  let modal, stateIndex = 0;
  const state = ['shared@test.invalid', 'original-password', null, false];
  const mocks = {
    'react/jsx-runtime': jsx,
    'react': { useState: initial => [stateIndex < state.length ? state[stateIndex++] : initial, () => {}], useTransition: () => [false, callback => tasks.push(callback())] },
    '@/stores/modal.store': { useModalStore: { getState: () => ({ open: options => { modal = options; } }) } },
    '@/lib/nickname-tag': { nicknameTag: value => '@' + value },
    '@/lib/api/bffFetch': { bffPostJson: async (_url, body) => { calls.push(body); return body.userNo ? { success: true } : { data: { selectionRequired: true, accounts: [{ userNo: 1, nickname: 'first' }, { userNo: 2, nickname: 'second' }] } }; } },
    '@/lib/api/endpoints': { bffEndpoints: { auth: { login: '/login' } } },
    '@/lib/api/error': { isHttpError: () => false },
    '@/lib/auth/return-url': { toLoginRequest: (email, password) => ({ email, password }) },
    'next/image': { default: 'img' }, 'next/link': { default: 'a' }, './login.module.scss': { default: {} },
  };
  const source = readFileSync(new URL('../src/app/(auth)/login/LoginClient.tsx', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(code, { exports, require: name => { if (!(name in mocks)) throw Error(name); return mocks[name]; }, window: { location: { replace: path => navigations.push(path) } } });
  const tree = exports.default({});
  function find(node) { if (node?.type === 'form') return node; for (const child of [node?.props?.children].flat(Infinity)) { if (child && typeof child === 'object') { const found = find(child); if (found) return found; } } }
  find(tree).props.onSubmit({ preventDefault() {} });
  await tasks.shift();
  assert.equal(modal.variant, 'action');
  assert.deepEqual(Array.from(modal.items, item => item.label), ['@first', '@second']);
  assert.equal(navigations.length, 0);
  modal.items[1].onClick(); await tasks.shift();
  assert.equal(calls[1].userNo, 2);
  assert.equal(calls[1].password, 'original-password');
  assert.deepEqual(navigations, ['/']);
});
