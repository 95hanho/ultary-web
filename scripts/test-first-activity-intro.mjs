import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const jsx = { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
const css = { default: new Proxy({}, { get: (_, key) => key }) };
function load(path, dependencies) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL('../src/' + path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { exports, console: { warn() {} }, require(name) {
    if (name === 'react/jsx-runtime') return jsx;
    if (name.endsWith('.module.scss')) return css;
    if (name in dependencies) return dependencies[name];
    throw new Error('Missing dependency: ' + name);
  } });
  return exports;
}
function nodes(tree, predicate) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(child => nodes(child, predicate));
  return [...(predicate(tree) ? [tree] : []), ...nodes(tree.props?.children, predicate)];
}
function stateHooks() {
  const states = []; let cursor = 0;
  return {
    reset: () => { cursor = 0; },
    useState: initial => {
      const i = cursor++;
      if (!(i in states)) states[i] = initial;
      return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }];
    },
  };
}
function loginFixture() {
  const hooks = stateHooks();
  const { default: Login } = load('app/(auth)/login/LoginClient.tsx', {
    react: { useState: hooks.useState, useTransition: () => [false, () => {}] },
    '@/stores/modal.store': { useModalStore: {} },
    '@/lib/nickname-tag': { nicknameTag: value => '@' + value },
    '@/lib/api/bffFetch': { bffPostJson: () => { throw Error('No login submission expected'); } },
    '@/lib/api/endpoints': { bffEndpoints: { auth: { google: '/google', kakao: '/kakao' } } },
    '@/lib/api/error': { isHttpError: () => false },
    '@/lib/auth/return-url': { toLoginRequest: () => ({}) },
    'next/image': { default: 'img' }, 'next/link': { default: 'a' },
  });
  return () => { hooks.reset(); return Login({}); };
}

test('login introduction switches once on focus or button interaction and retains typed values', () => {
  for (const interaction of ['onFocusCapture', 'onClickCapture']) {
    const render = loginFixture();
    assert.equal(nodes(render(), n => n.props?.['data-intro'] === true).length, 1);
    const form = nodes(render(), n => n.type === 'form')[0];
    form.props[interaction]();
    assert.equal(nodes(render(), n => n.props?.['data-intro'] === false).length, 1);
    nodes(render(), n => n.type === 'input' && n.props.name === 'loginId')[0].props.onChange({ target: { value: 'demo@example.com' } });
    assert.equal(nodes(render(), n => n.type === 'input' && n.props.name === 'loginId')[0].props.value, 'demo@example.com');
    assert.equal(nodes(render(), n => n.props?.['data-intro'] === false).length, 1);
    assert.equal(nodes(render(), n => n.type === 'img' && n.props.src === '/images/img/login_intro.png').length, 1);
  }
});

function guideFixture(profile, pets = [], fail = false) {
  const hooks = stateHooks(); let mounted = false; const effects = [], calls = [];
  const { FirstActivityGuide, firstActivityCopy } = load('components/feed/FirstActivityGuide.tsx', {
    react: { useState: hooks.useState, useEffect: fn => { if (!mounted) effects.push(fn); } },
    'next/link': { default: 'a' },
    '@/lib/api/bffFetch': { bffGet: async url => { calls.push(url); if (fail) throw Error('Offline'); return { data: url === '/profile' ? profile : pets }; } },
    '@/lib/api/endpoints': { bffEndpoints: { myUltary: { profile: '/profile' }, pets: { root: '/pets' } } },
    '@/lib/mock/ultary-accounts': { myUltaryPath: value => '/myultary/' + value },
  });
  return {
    calls, firstActivityCopy,
    render() { hooks.reset(); const tree = FirstActivityGuide({ nickname: 'demo' }); mounted = true; return tree; },
    async settle() { effects.splice(0).forEach(fn => fn()); for (let i = 0; i < 8; i++) await Promise.resolve(); },
  };
}

test('an empty account sees the pet registration introduction and its own Ultary link', async () => {
  const f = guideFixture({ petCount: 0, feedCount: 0 });
  assert.equal(f.render(), null); await f.settle(); const tree = f.render();
  assert.equal(nodes(tree, n => n.type === 'h2')[0].props.children, '우리 아이의 이야기를 시작해볼까요?');
  assert.equal(nodes(tree, n => n.type === 'a')[0].props.href, '/myultary/demo');
  assert.deepEqual(f.calls, ['/profile']);
});

test('a pet owner without posts sees the actual pet name', async () => {
  const f = guideFixture({ petCount: 1, feedCount: 0 }, [{ name: '초코' }]);
  f.render(); await f.settle();
  assert.equal(nodes(f.render(), n => n.type === 'h2')[0].props.children, '초코의 첫 번째 일상을 기다리고 있어요');
  assert.deepEqual(f.calls, ['/profile', '/pets']);
});

test('accounts with existing posts, including sellers without pets, have no introduction', async () => {
  for (const petCount of [0, 2]) {
    const f = guideFixture({ petCount, feedCount: 3 });
    f.render(); await f.settle(); assert.equal(f.render(), null); assert.deepEqual(f.calls, ['/profile']);
  }
});

test('optional introduction stays hidden on API failure or an incomplete profile', async () => {
  for (const [profile, fail] of [[null, false], [{ feedCount: 0 }, false], [null, true]]) {
    const f = guideFixture(profile, [], fail); f.render(); await f.settle(); assert.equal(f.render(), null);
  }
});
