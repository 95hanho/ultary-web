import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const FLOW = '12345678-1234-4234-8234-123456789abc';
function fixture(blocked = false) {
  const channels = [], navigations = [], results = [], timers = new Map();
  let nextTimer = 0, closes = 0;
  const popup = {
    closed: false, opener: {},
    location: { replace: (url) => navigations.push(url) },
    close() { this.closed = true; closes++; },
  };
  class BroadcastChannel {
    constructor(name) { this.name = name; this.closed = false; channels.push(this); }
    postMessage(data) {
      for (const channel of channels) {
        if (channel !== this && !channel.closed && channel.name === this.name) channel.onmessage?.({ data });
      }
    }
    close() { this.closed = true; }
  }
  const context = {
    exports: {}, URL, BroadcastChannel, crypto: { randomUUID: () => FLOW },
    window: {
      location: { origin: 'https://ultary-web.vercel.app' },
      open: () => blocked ? null : popup,
      setTimeout: (fn) => { timers.set(++nextTimer, fn); return nextTimer; },
      clearTimeout: (id) => timers.delete(id),
      close: () => { closes++; },
    },
  };
  const code = ts.transpileModule(readFileSync(new URL('../src/lib/auth/social-link-window.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, context);
  return { ...context.exports, channels, popup, navigations, results, timers,
    get closes() { return closes; }, result: (value) => results.push(value) };
}

for (const provider of ['GOOGLE', 'KAKAO']) {
  test(`${provider}: linking stays in a separate window and completion updates the original page`, () => {
    const f = fixture();
    f.openSocialLinkWindow(`/api/auth/social/${provider.toLowerCase()}?intent=link`, provider, f.result);
    const url = new URL(f.navigations[0]);
    assert.equal(url.searchParams.get('intent'), 'link');
    assert.equal(url.searchParams.get('returnUrl'), `/settings/mypage?socialLinkFlow=${FLOW}`);
    assert.equal(f.popup.opener, null);
    assert.equal(f.completeSocialLinkWindow(FLOW, { linked: provider }), true);
    assert.equal(f.results.length, 1);
    assert.equal(f.results[0].linked, provider);
    assert.ok(f.closes > 0);
    assert.equal(f.timers.size, 0);
    assert.ok(f.channels.every((channel) => channel.closed));
    // The helper receives no parent navigation/history methods: OAuth navigation is popup-only.
    assert.equal(f.navigations.length, 1);
  });
}

test('provider cancellation and link failures are delivered to the original page', () => {
  const f = fixture();
  f.openSocialLinkWindow('/api/auth/social/google?intent=link', 'GOOGLE', f.result);
  f.completeSocialLinkWindow(FLOW, { error: 'SOCIAL_ACCOUNT_IN_USE' });
  assert.equal(f.results[0].error, 'SOCIAL_ACCOUNT_IN_USE');
  assert.ok(f.popup.closed);
});

test('a blocked popup never redirects the current page and closes its channel', () => {
  const f = fixture(true);
  assert.equal(f.openSocialLinkWindow('/api/auth/social/google?intent=link', 'GOOGLE', f.result), null);
  assert.equal(f.navigations.length, 0);
  assert.ok(f.channels.every((channel) => channel.closed));
});

test('unrelated messages and mismatched providers cannot finish a flow', () => {
  const f = fixture();
  const dispose = f.openSocialLinkWindow('/api/auth/social/google?intent=link', 'GOOGLE', f.result);
  for (const data of [null, 'GOOGLE', { linked: 'GOOGLE' }, { type: 'social-link-result', linked: 'KAKAO' }]) {
    f.channels[0].onmessage({ data });
  }
  assert.equal(f.results.length, 0);
  assert.equal(f.popup.closed, false);
  dispose();
  assert.ok(f.popup.closed);
  assert.equal(f.timers.size, 0);
});

test('ordinary login returns do not close the current tab', () => {
  const f = fixture();
  for (const flow of [null, '', 'invalid-flow']) assert.equal(f.completeSocialLinkWindow(flow, { linked: 'GOOGLE' }), false);
  assert.equal(f.completeSocialLinkWindow(FLOW, {}), false);
  assert.equal(f.closes, 0);
});

test('messages still arrive when OAuth has severed the popup opener reference', () => {
  const f = fixture();
  f.openSocialLinkWindow('/api/auth/social/google?intent=link', 'GOOGLE', f.result);
  f.popup.closed = true; // Cross-Origin-Opener-Policy can report the old WindowProxy as closed.
  f.completeSocialLinkWindow(FLOW, { linked: 'GOOGLE' });
  assert.equal(f.results[0].linked, 'GOOGLE');
});

function nodes(node, match) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap((n) => nodes(n, match));
  return [...(match(node) ? [node] : []), ...nodes(node.props?.children, match)];
}

test('mypage opens the link window, refreshes the SNS button and keeps its existing back route', async () => {
  const states = [], effects = [], calls = [];
  let cursor = 0, mounted = false, resultHandler;
  let googleLinked = false;
  const jsx = (type, props) => ({ type, props });
  const deps = {
    react: {
      useState: (value) => {
        const i = cursor++;
        if (!(i in states)) states[i] = value;
        return [states[i], (next) => { states[i] = typeof next === 'function' ? next(states[i]) : next; }];
      },
      useRef: (value) => { const i = cursor++; return states[i] ??= { current: value }; },
      useCallback: (fn) => fn,
      useEffect: (fn) => { if (!mounted) effects.push(fn); },
    },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'next/navigation': {
      useRouter: () => ({ replace: (url) => calls.push({ type: 'navigate', url }), refresh: () => {} }),
      useSearchParams: () => new URLSearchParams(),
    },
    'next/link': { default: 'Link' }, 'next/image': { default: 'Image' },
    clsx: { default: (...args) => args.join(' ') },
    '@/lib/nickname-tag': { nicknameTag: (name) => '@' + name },
    '@/components/common/PageLoadError': { PageLoadError: 'LoadError' },
    '@/components/common/FooterMenu': { FooterMenu: 'Footer' },
    '@/components/common/PageHeader': { PageHeader: 'Header' },
    '@/lib/api/bffFetch': {
      bffGet: async () => {
        calls.push({ type: 'get' });
        return { data: { nickname: 'ultary', googleLinked, hasPassword: true } };
      },
      bffPostJson: async () => {},
    },
    '@/lib/api/endpoints': { bffEndpoints: { auth: { me: '/me', google: '/google', kakao: '/kakao' } } },
    '@/lib/api/error': { isHttpError: () => false },
    '@/lib/mock/mypage': { formatPhoneDisplay: (v) => v, formatRegionDisplay: () => '-' },
    '@/lib/auth/social-link-window': {
      completeSocialLinkWindow: () => false,
      openSocialLinkWindow: (href, provider, onResult) => {
        calls.push({ type: 'popup', href, provider });
        resultHandler = onResult;
        return () => {};
      },
    },
    './mypage.module.scss': { default: new Proxy({}, { get: (_, key) => key }) },
  };
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL('../src/app/(main)/settings/mypage/MyPageClient.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { exports, console, URLSearchParams, window: { addEventListener() {}, removeEventListener() {} }, require: (name) => {
    if (!(name in deps)) throw Error(name);
    return deps[name];
  } });
  const render = () => { cursor = 0; const tree = exports.default(); mounted = true; return tree; };
  const settle = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
  render(); effects.splice(0).forEach((fn) => fn()); await settle();
  let prevented = false;
  nodes(render(), (n) => n.type === 'a' && n.props['aria-label'] === '구글 연동하기')[0].props.onClick({ preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(calls.find((c) => c.type === 'popup').provider, 'GOOGLE');
  googleLinked = true;
  resultHandler({ linked: 'GOOGLE' }); await settle();
  const tree = render();
  assert.equal(nodes(tree, (n) => n.props?.['aria-label'] === '구글 연동됨').length, 1);
  assert.equal(calls.filter((c) => c.type === 'get').length, 2);
  assert.equal(calls.filter((c) => c.type === 'navigate').length, 0);
  const header = nodes(tree, (n) => n.type === 'Header')[0];
  assert.equal(header.props.backMode, 'history');
  assert.equal(header.props.backHref, '/settings');
});
