import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
function load(path, mocks, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(resolve(root, path), 'utf8'), {
    fileName: path,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, {
    exports,
    require: name => {
      if (!(name in mocks)) throw new Error(`Missing mock: ${name}`);
      return mocks[name];
    },
    console: { log() {}, error() {}, warn() {} }, URL, AbortController, Headers, DOMException,
    ...globals,
  }, { filename: path });
  return exports;
}

function springPreparation({ key = 'test-only-bff-key-not-for-production-123456789', prod = false, base = 'https://spring.test.invalid' } = {}) {
  return load('src/lib/api/spring-request.ts', {
    'server-only': {}, '@/lib/env.server': { BFF_INTERNAL_KEY: key, isProd: prod, SPRING_BASE_URL: base },
  });
}

function retryFixture(replies, timeout = false) {
  const calls = [], delays = [], cleared = [];
  const loaded = load('src/lib/auth/refresh-request.ts', {
    'server-only': {},
    '@/lib/api/spring-request': springPreparation(),
    '@/lib/auth/client-connection': { clientConnectionHeaders: async () => ({ 'user-agent': 'browser', 'x-forwarded-for': '192.0.2.1' }) },
  }, {
    setTimeout(fn, ms) {
      if (ms === 2000) { delays.push(ms); queueMicrotask(fn); }
      else if (timeout) queueMicrotask(fn);
      return ms;
    },
    clearTimeout: id => cleared.push(id),
    fetch: async (url, init) => {
      calls.push({ url, init });
      const value = replies[Math.min(calls.length - 1, replies.length - 1)];
      if (value instanceof Error) throw value;
      if (value === 'timeout') {
        if (init.signal.aborted) throw new Error('aborted');
        return new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted'))));
      }
      return {
        status: value.status, ok: value.status >= 200 && value.status < 300,
        json: async () => { if (value.invalidJson) throw new Error('invalid JSON'); return value.body; },
      };
    },
  });
  return { ...loaded, calls, delays, cleared };
}
const success = { status: 200, body: { success: true, data: { accessToken: 'test-access', refreshToken: 'test-refresh' } } };

test('503 responses retry twice with two-second waits and forward browser metadata', async () => {
  const fixture = retryFixture([{ status: 503 }, { status: 503 }, success]);
  const result = await fixture.requestRefreshTokens('/auth/refresh', 'refresh');
  assert.equal(result.ok, true);
  assert.equal(fixture.calls.length, 3);
  assert.deepEqual(fixture.delays, [2000, 2000]);
  assert.deepEqual(fixture.cleared, [4000, 4000, 4000]);
  assert.equal(fixture.calls[0].init.headers['user-agent'], 'browser');
  assert.equal(fixture.calls[0].init.headers['x-forwarded-for'], '192.0.2.1');
  assert.equal(JSON.parse(fixture.calls[0].init.body).refreshToken, 'refresh');
});

test('network failure recovers on retry without clearing authentication', async () => {
  const fixture = retryFixture([new TypeError('network unavailable'), success]);
  assert.equal((await fixture.requestRefreshTokens('/refresh', 'refresh')).ok, true);
  assert.equal(fixture.calls.length, 2);
  assert.deepEqual(fixture.delays, [2000]);
});

test('exhausted transient failures preserve authentication for the next reload', async () => {
  const fixture = retryFixture([{ status: 502 }]);
  const result = await fixture.requestRefreshTokens('/refresh', 'refresh');
  assert.equal(result.ok, false);
  assert.equal(result.clearCookies, false);
  assert.equal(result.message, 'REFRESH_RETRY_EXHAUSTED');
  assert.equal(fixture.calls.length, 3);
  assert.deepEqual(fixture.delays, [2000, 2000]);
});

for (const status of [401, 403, 400]) {
  test(`${status} rejection is terminal and is not retried`, async () => {
    const fixture = retryFixture([{ status }, success]);
    const result = await fixture.requestRefreshTokens('/refresh', 'refresh');
    assert.equal(result.message, 'REFRESH_UNAUTHORIZED');
    assert.equal(result.clearCookies, true);
    assert.equal(fixture.calls.length, 1);
    assert.deepEqual(fixture.delays, []);
  });
}

test('invalid JSON and missing tokens are retried as upstream failures', async () => {
  const fixture = retryFixture([{ status: 200, invalidJson: true }, { status: 200, body: {} }, success]);
  assert.equal((await fixture.requestRefreshTokens('/refresh', 'refresh')).ok, true);
  assert.equal(fixture.calls.length, 3);
});

test('408 and 429 are transient', async () => {
  const fixture = retryFixture([{ status: 408 }, { status: 429 }, success]);
  assert.equal((await fixture.requestRefreshTokens('/refresh', 'refresh')).ok, true);
  assert.equal(fixture.calls.length, 3);
});

test('each hung attempt is bounded by its abort signal', async () => {
  const fixture = retryFixture(['timeout'], true);
  const result = await fixture.requestRefreshTokens('/refresh', 'refresh');
  assert.equal(result.message, 'REFRESH_RETRY_EXHAUSTED');
  assert.equal(fixture.calls.length, 3);
  assert.ok(fixture.calls.every(call => call.init.signal.aborted));
});

for (const admin of [false, true]) {
  test(`${admin ? 'admin' : 'user'} concurrent callers share the whole retry sequence`, async () => {
    let calls = 0, complete;
    const pending = new Promise(resolve => { complete = resolve; });
    const loaded = load(`src/lib/auth/${admin ? 'admin-session' : 'session'}.ts`, {
      'server-only': {}, 'next/headers': {}, 'next/server': {},
      '@/lib/api/endpoints': { springEndpoints: { auth: { refresh: '/user/refresh' }, admin: { refresh: '/admin/refresh' } } },
      '@/lib/auth/cookie-names': {}, '@/lib/auth/cookies': {}, '@/lib/env.server': {},
      '@/lib/auth/refresh-request': { requestRefreshTokens: async () => { calls++; return pending; } },
    });
    const refresh = admin ? loaded.refreshAdminViaSpringLocked : loaded.refreshViaSpringLocked;
    const first = refresh('same-test-token'), second = refresh('same-test-token');
    assert.equal(calls, 1);
    complete({ ok: true, accessToken: 'access' });
    assert.equal((await first).ok, true);
    assert.equal((await second).ok, true);
    await refresh('same-test-token');
    assert.equal(calls, 2);
  });

  test(`${admin ? 'admin' : 'user'} logout sends refresh only, without access token or rotation`, async () => {
    const calls = [], cleared = [];
    const loaded = load(`src/app/api/${admin ? 'admin/' : ''}auth/logout/route.ts`, {
      'next/server': { NextResponse: { json: (body, init) => ({ body, status: init.status }) } },
      '@/lib/api/endpoints': { springEndpoints: { auth: { logout: '/user/logout' }, admin: { logout: '/admin/logout' } } },
      '@/lib/api/bffRoute': { handleBffError: error => { throw error; } },
      '@/lib/api/springFetch': { springPostJson: async (...args) => calls.push(args) },
      '@/lib/auth/cookies': {
        getRefreshToken: async () => 'user-refresh', getAdminRefreshToken: async () => 'admin-refresh',
        clearAuthCookies: () => cleared.push('user'), clearAdminAuthCookieJar: async () => {},
        clearAdminAuthCookies: () => cleared.push('admin'),
      },
    });
    assert.equal((await loaded.POST()).status, 200);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].length, 2);
    assert.equal(calls[0][1].refreshToken, admin ? 'admin-refresh' : 'user-refresh');
    assert.deepEqual(cleared, [admin ? 'admin' : 'user']);
  });
}

test('connection metadata takes browser agent and forwarded address from incoming headers', async () => {
  const loaded = load('src/lib/auth/client-connection.ts', {
    'server-only': {},
    'next/headers': { headers: async () => new Map([['user-agent', 'browser-agent'], ['x-forwarded-for', '192.0.2.5, 127.0.0.1']]) },
  });
  const result = await loaded.clientConnectionHeaders();
  assert.equal(result['user-agent'], 'browser-agent');
  assert.equal(result['x-forwarded-for'], '192.0.2.5, 127.0.0.1');
});

function recoveryFixture({ admin = false, currentAccess = 'expired', hasRefresh = true, failRefresh = false } = {}) {
  const calls = [], applied = [], cleared = [];
  const prefix = admin ? 'admin' : 'user';
  const values = new Map([
    [admin ? 'adminAccessToken' : 'accessToken', currentAccess],
    [admin ? 'adminRefreshToken' : 'refreshToken', hasRefresh ? 'refresh' : undefined],
  ]);
  const jar = { get: name => values.get(name) ? { value: values.get(name) } : undefined };
  const names = load('src/lib/auth/cookie-names.ts', {});
  const errors = load('src/lib/api/error.ts', {});
  const refresh = role => async () => {
    calls.push(role);
    if (failRefresh) return { ok: false, clearCookies: false, message: 'REFRESH_RETRY_EXHAUSTED' };
    return { ok: true, accessToken: 'renewed', tokens: { accessToken: 'renewed', refreshToken: 'rotated' } };
  };
  const recovery = load('src/lib/auth/access-recovery.ts', {
    'server-only': {}, 'next/headers': { cookies: async () => jar },
    '@/lib/api/error': errors, '@/lib/auth/cookie-names': names,
    '@/lib/auth/session': {
      refreshViaSpringLocked: refresh('user'), applyTokensToCookieJar: async tokens => applied.push(['user', tokens]),
      clearAuthCookieJar: async () => cleared.push('user'),
    },
    '@/lib/auth/admin-session': { refreshAdminViaSpringLocked: refresh('admin') },
    '@/lib/auth/cookies': {
      applyAdminTokensToCookieJar: async tokens => applied.push(['admin', tokens]),
      clearAdminAuthCookieJar: async () => cleared.push('admin'),
    },
  });
  const expired = { message: 'expired', status: 401, url: '/protected', data: { code: 'TOKEN_EXPIRED' } };
  return { ...recovery, calls, applied, cleared, expired, prefix, url: admin ? '/api/v1/admin/data' : '/api/v1/feeds', errors };
}

for (const admin of [false, true]) {
  test(`${admin ? 'admin' : 'user'} TOKEN_EXPIRED refreshes its own cookies and retries exactly once`, async () => {
    const fixture = recoveryFixture({ admin });
    const sent = [];
    const body = new FormData(); body.append('caption', 'preserved');
    const result = await fixture.recoverExpiredAccess(fixture.url,
      { method: 'POST', body, headers: { Authorization: 'Bearer expired', 'x-extra': 'preserved' } },
      async init => { sent.push(init); if (sent.length === 1) throw fixture.expired; return 'success'; });
    assert.equal(result, 'success');
    assert.equal(sent.length, 2);
    assert.equal(new Headers(sent[1].headers).get('authorization'), 'Bearer renewed');
    assert.equal(new Headers(sent[1].headers).get('x-extra'), 'preserved');
    assert.equal(sent[1].body, body);
    assert.deepEqual(fixture.calls, [fixture.prefix]);
    assert.equal(fixture.applied[0][0], fixture.prefix);
    assert.deepEqual(fixture.cleared, []);
  });
}

test('repeated TOKEN_EXPIRED after retry does not recurse', async () => {
  const fixture = recoveryFixture(); let sends = 0;
  await assert.rejects(fixture.recoverExpiredAccess(fixture.url, { headers: { Authorization: 'Bearer expired' } },
    async () => { sends++; throw fixture.expired; }), error => error === fixture.expired);
  assert.equal(sends, 2); assert.equal(fixture.calls.length, 1);
});

for (const [status, code] of [[401, 'INVALID_TOKEN'], [401, 'ACCOUNT_WITHDRAWN'], [403, 'ACCOUNT_SUSPENDED'], [500, 'SERVER_ERROR']]) {
  test(`${status} ${code} is never refreshed or replayed`, async () => {
    const fixture = recoveryFixture(); let sends = 0;
    const failure = { ...fixture.expired, status, data: { code } };
    await assert.rejects(fixture.recoverExpiredAccess(fixture.url, { headers: { Authorization: 'Bearer expired' } },
      async () => { sends++; throw failure; }), error => error === failure);
    assert.equal(sends, 1); assert.equal(fixture.calls.length, 0);
  });
}

test('unauthenticated endpoints never trigger refresh from a TOKEN_EXPIRED body error', async () => {
  const fixture = recoveryFixture();
  await assert.rejects(fixture.recoverExpiredAccess('/api/v1/auth/password', {}, async () => { throw fixture.expired; }));
  assert.equal(fixture.calls.length, 0);
});

test('already renewed cookie in the same request is reused without another rotation', async () => {
  const fixture = recoveryFixture({ currentAccess: 'already-renewed' }); let sends = 0;
  await fixture.recoverExpiredAccess(fixture.url, { headers: { Authorization: 'Bearer expired' } }, async init => {
    if (++sends === 1) throw fixture.expired;
    assert.equal(new Headers(init.headers).get('authorization'), 'Bearer already-renewed');
  });
  assert.equal(fixture.calls.length, 0); assert.equal(sends, 2);
});

test('missing refresh clears only the affected authentication cookies', async () => {
  const fixture = recoveryFixture({ hasRefresh: false });
  await assert.rejects(fixture.recoverExpiredAccess(fixture.url, { headers: { Authorization: 'Bearer expired' } },
    async () => { throw fixture.expired; }));
  assert.deepEqual(fixture.cleared, ['user']); assert.equal(fixture.calls.length, 0);
});

test('exhausted refresh preserves admin cookies and never replays the business request', async () => {
  const fixture = recoveryFixture({ admin: true, failRefresh: true }); let sends = 0;
  await assert.rejects(fixture.recoverExpiredAccess(fixture.url, { headers: { Authorization: 'Bearer expired' } },
    async () => { sends++; throw fixture.expired; }), error => error.status === 503 && error.data.code === 'REFRESH_RETRY_EXHAUSTED');
  assert.equal(sends, 1); assert.deepEqual(fixture.cleared, []);
});

test('Spring application/problem+json errors preserve TOKEN_EXPIRED for the recovery decision', async () => {
  const errors = load('src/lib/api/error.ts', {});
  const http = load('src/lib/api/http.ts', { '@/lib/api/error': errors }, {
    fetch: async () => new Response(JSON.stringify({ code: 'TOKEN_EXPIRED', detail: 'expired' }),
      { status: 401, headers: { 'Content-Type': 'application/problem+json' } }),
    setTimeout: () => 1, clearTimeout() {},
  }).http;
  await assert.rejects(http('/protected'), error => error.status === 401 && error.data.code === 'TOKEN_EXPIRED');
});

test('Spring transport unwraps retry success while SSR explicitly opts out of cookie recovery', async () => {
  let recoveries = 0;
  const http = async (_url, init) => { assert.equal(init.recoverExpiredAccess, undefined); return { success: true, data: 'ok' }; };
  const spring = load('src/lib/api/springFetch.ts', {
    'server-only': {}, '@/lib/api/spring-request': springPreparation(),
    '@/lib/api/http': { http, applyPathParams: url => [url], cloneParams: value => value },
    '@/lib/api/error': { isRecord: value => value !== null && typeof value === 'object' },
    '@/lib/auth/access-recovery': { recoverExpiredAccess: async (_url, init, send) => { recoveries++; return send(init); } },
  });
  assert.equal(await spring.springGet('/api/v1/feeds'), 'ok');
  assert.equal(recoveries, 1);
  assert.equal(await spring.springGet('/api/v1/feeds', undefined, undefined, { recoverExpiredAccess: false }), 'ok');
  assert.equal(recoveries, 1);
});

for (const kind of ['withAuth', 'withOptionalAuth', 'runAuthed']) {
  test(`${kind} applies initial rotation before the handler without overwriting later recovered cookies`, async () => {
    const events = [];
    const response = {};
    const session = { ok: true, accessToken: 'initial', tokens: { accessToken: 'initial', refreshToken: 'initial-refresh' } };
    const wrappers = load('src/lib/auth/withAuth.ts', {
      'server-only': {}, 'next/server': {},
      '@/lib/auth/session': {
        resolveSession: async () => session,
        applyTokensToCookieJar: async () => events.push('initial cookies'),
        sessionUnauthorized: () => { throw new Error('unexpected failure'); },
      },
    });
    const handler = async () => { events.push('handler updates recovered cookies'); return response; };
    const result = kind === 'runAuthed'
      ? await wrappers.runAuthed({}, handler) : await wrappers[kind](handler)({});
    assert.equal(result, response);
    assert.deepEqual(events, ['initial cookies', 'handler updates recovered cookies']);
  });
}

test('local BFF sends its server key over permitted local HTTP and overrides incoming key', () => {
  const prepared = springPreparation({ base: 'http://localhost:9377' }).prepareSpringRequest('/api/v1/auth/login',
    { headers: { 'X-BFF-Key': 'untrusted-browser-value', Authorization: 'Bearer user-token' }, redirect: 'follow', baseUrl: 'https://untrusted.invalid' });
  assert.equal(prepared.url, 'http://localhost:9377/api/v1/auth/login');
  const headers = new Headers(prepared.init.headers);
  assert.equal(headers.get('x-bff-key'), 'test-only-bff-key-not-for-production-123456789');
  assert.equal(headers.get('authorization'), 'Bearer user-token');
  assert.equal(prepared.init.redirect, 'manual');
  assert.equal(prepared.init.baseUrl, undefined);
});

test('production rejects HTTP before preparing any request with the secret', () => {
  const prepare = springPreparation({ base: 'http://spring.test.invalid', prod: true }).prepareSpringRequest;
  assert.throws(() => prepare('/api/v1/auth/login'), /HTTPS/);
});

test('production HTTPS request carries key but never exposes it in the URL', () => {
  const prepared = springPreparation({ prod: true }).prepareSpringRequest('/api/v1/auth/login');
  assert.equal(new URL(prepared.url).protocol, 'https:');
  assert.equal(prepared.url.includes('test-only-bff-key'), false);
  assert.equal(prepared.init.redirect, 'manual');
});

test('missing or too short BFF key fails closed', () => {
  assert.throws(() => springPreparation({ key: '' }).prepareSpringRequest('/api/v1/health'), /configured/);
  assert.throws(() => springPreparation({ key: 'short' }).prepareSpringRequest('/api/v1/health'), /configured/);
  assert.throws(() => springPreparation({ key: 'x'.repeat(257) }).prepareSpringRequest('/api/v1/health'), /configured/);
});

test('BFF key cannot be sent to an arbitrary URL through a path argument', () => {
  const prepare = springPreparation().prepareSpringRequest;
  for (const path of ['https://elsewhere.invalid/api', '//elsewhere.invalid/api', 'relative']) {
    assert.throws(() => prepare(path), /path/);
  }
  assert.throws(() => springPreparation({ base: 'https://user:password@spring.test.invalid' }).prepareSpringRequest('/api/v1/health'));
});

for (const accessToken of ['access', null]) test(`file streaming proxy keeps BFF key server-side (${accessToken ? 'member' : 'guest'})`, async () => {
  const sent = [];
  const route = load('src/app/api/files/[fileId]/content/route.ts', {
    'next/server': { NextResponse: Response }, '@/lib/api/spring-request': springPreparation(),
    '@/lib/api/endpoints': { springEndpoints: { files: { content: '/api/v1/files/:fileId/content' } } },
    '@/lib/api/bffRoute': {
      withOptionalAuth: handler => async (request, ctx) => handler({ request, accessToken, params: await ctx.params }),
      handleBffError: error => { throw error; },
    },
    '@/lib/api/http': { applyPathParams: (path, params) => [path.replace(':fileId', params.fileId)] },
    '@/lib/api/error': { isHttpError: () => true },
  }, {
    fetch: async (url, init) => { sent.push({ url, init }); return new Response('file-content', { headers: { 'Content-Type': 'image/jpeg' } }); },
  });
  const response = await route.GET({}, { params: Promise.resolve({ fileId: '42' }) });
  assert.equal(new Headers(sent[0].init.headers).get('x-bff-key'), 'test-only-bff-key-not-for-production-123456789');
  assert.equal(response.headers.has('X-BFF-Key'), false);
  assert.equal(new Headers(sent[0].init.headers).get('authorization'), accessToken ? 'Bearer access' : null);
  if (!accessToken) assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(await response.text(), 'file-content');
});

test('production browser refuses an insecure WebSocket URL before requesting a ticket', async () => {
  let tickets = 0;
  const socket = load('src/lib/ws/liveSocket.ts', {
    '@/lib/api/bffFetch': { bffPostJson: async () => { tickets++; throw new Error('must not call'); } },
    '@/lib/api/endpoints': { bffEndpoints: { ws: { ticket: '/api/ws/ticket' } } },
    '@/lib/api/error': {}, '@/lib/env.client': { SPRING_WS_URL: 'ws://backend.test.invalid/api/v1/ws' },
    '@/lib/notification/unreadBadge': {}, '@/lib/dm/unreadBadge': {}, '@/stores/modal.store': {},
  }, { window: {}, process: { env: { NODE_ENV: 'production' } } });
  socket.ensureLiveSocket();
  await Promise.resolve();
  assert.equal(tickets, 0);
});

test('public profile page exception never opens protected profile subpages', () => {
  const paths = load('src/lib/auth/paths.ts', {});
  assert.equal(paths.isAuthPublicPath('/myultary/someone'), true);
  for (const path of ['/myultary', '/myultary/someone/write/compose', '/myultary/someone/residents', '/myultary/someone/posts/101']) {
    assert.equal(paths.isAuthPublicPath(path), false);
  }
});

const pageErrors = load('src/lib/api/page-load-error.ts', { './error': load('src/lib/api/error.ts', {}) });
for (const status of [404, 410]) test(`page load ${status} uses the unavailable screen`, () => {
  assert.equal(pageErrors.isUnavailablePageError({ status, message: 'failed', data: null, url: '/api/test' }), true);
});
for (const status of [0, 400, 401, 403, 408, 429, 500, 502, 503, 504]) test(`page load ${status} keeps the retry screen`, () => {
  assert.equal(pageErrors.isUnavailablePageError({ status, message: 'failed', data: null, url: '/api/test' }), false);
});
test('unstructured errors do not masquerade as permission or missing-page responses', () => {
  for (const error of [null, new Error('network'), { status: 404 }, '404']) {
    assert.equal(pageErrors.isUnavailablePageError(error), false);
  }
});

function pageGuard(pathname, cookies = {}) {
  const response = (type, url, options = {}) => ({ type, url: url?.toString(), ...options, headers: new Headers() });
  const { proxy } = load('src/proxy.ts', {
    '@/lib/auth/cookie-names': { ACCESS_TOKEN_COOKIE: 'access', REFRESH_TOKEN_COOKIE: 'refresh' },
    '@/lib/auth/paths': load('src/lib/auth/paths.ts', {}),
    '@/lib/auth/member-page-paths': load('src/lib/auth/member-page-paths.ts', {}),
    'next/server': { NextResponse: {
      next: () => response('next'), redirect: url => response('redirect', url),
      rewrite: (url, options) => response('rewrite', url, options),
    } },
  });
  return proxy({ url: `https://ultary.test${pathname}`, nextUrl: { pathname: pathname.split('?')[0] }, cookies: { get: name => cookies[name] ? { value: cookies[name] } : undefined } });
}
for (const path of ['/', '/settings', '/dm', '/myultary/test/residents?userNo=101']) {
  test(`guest protected page ${path} redirects to login`, () => {
    const result = pageGuard(path);
    assert.equal(result.type, 'redirect');
    assert.equal(result.url, 'https://ultary.test/login');
  });
}
for (const path of ['/login', '/signup', '/feeds/101', '/myultary/test', '/unavailable', '/admin/reports']) {
  test(`guest public or separate-auth page ${path} still reaches its own handler`, () => {
    assert.equal(pageGuard(path).type, 'next');
  });
}
test('member access and refresh cookies still pass the page guard', () => {
  assert.equal(pageGuard('/settings', { access: 'access' }).type, 'next');
  assert.equal(pageGuard('/settings', { refresh: 'refresh' }).type, 'next');
  assert.equal(pageGuard('/login', { access: 'access' }).type, 'redirect');
});

for (const path of ['/does-not-exist', '/settings/does-not-exist', '/dm/1/does-not-exist']) test(`unknown URL ${path} reaches Next 404 instead of login`, () => {
  assert.equal(pageGuard(path).type, 'next');
});
test('the member page guard covers every real main page and contains no stale routes', () => {
  function pages(dir, prefix = '') {
    return readdirSync(resolve(root, dir), { withFileTypes: true }).flatMap(entry => entry.isDirectory()
      ? pages(`${dir}/${entry.name}`, `${prefix}/${entry.name}`)
      : entry.name === 'page.tsx' ? [prefix || '/'] : []);
  }
  const actual = pages('src/app/(main)').sort();
  const { MEMBER_PAGE_PATHS, isMemberPagePath } = load('src/lib/auth/member-page-paths.ts', {});
  assert.deepEqual(Array.from(MEMBER_PAGE_PATHS).sort(), actual);
  for (const path of actual) assert.equal(isMemberPagePath(path.replace(/\[[^\]]+\]/g, 'test')), true, path);
});
test('a failed refresh does not prevent the next reload from trying again', async () => {
  const fixture = retryFixture([{ status: 503 }, { status: 503 }, { status: 503 }, success]);
  const first = await fixture.requestRefreshTokens('/refresh', 'refresh');
  assert.equal(first.clearCookies, false);
  assert.equal((await fixture.requestRefreshTokens('/refresh', 'refresh')).ok, true);
  assert.equal(fixture.calls.length, 4);
});
for (const admin of [false, true]) test(`${admin ? 'admin' : 'user'} explicit refresh returns 503 without clearing cookies on an outage`, async () => {
  const cleared = [];
  const route = load(`src/app/api/${admin ? 'admin/' : ''}auth/refresh/route.ts`, {
    'next/server': { NextResponse: { json: (body, init) => ({ body, status: init.status }) } },
    '@/lib/api/bffRoute': { handleBffError: error => { throw error; } },
    '@/lib/auth/cookies': {
      getRefreshToken: async () => 'refresh', getAdminRefreshToken: async () => 'refresh',
      clearAdminAuthCookieJar: async () => cleared.push('admin'),
    },
    '@/lib/auth/session': { refreshViaSpringLocked: async () => ({ ok: false, message: 'REFRESH_RETRY_EXHAUSTED', clearCookies: false }), clearAuthCookieJar: async () => cleared.push('user') },
    '@/lib/auth/admin-session': { refreshAdminViaSpringLocked: async () => ({ ok: false, message: 'REFRESH_RETRY_EXHAUSTED', clearCookies: false }) },
  });
  assert.equal((await route.POST()).status, 503);
  assert.deepEqual(cleared, []);
});
test('optional auth does not downgrade a refresh outage into anonymous access', async () => {
  let reached = false;
  const wrappers = load('src/lib/auth/withAuth.ts', {
    'server-only': {}, 'next/server': {},
    '@/lib/auth/session': {
      resolveSession: async () => ({ ok: false, message: 'REFRESH_RETRY_EXHAUSTED', clearCookies: false }),
      sessionUnauthorized: () => ({ status: 503 }),
    },
  });
  const response = await wrappers.withOptionalAuth(async () => { reached = true; })({});
  assert.equal(response.status, 503);
  assert.equal(reached, false);
});

for (const failure of [
  { message: 'REFRESH_RETRY_EXHAUSTED', clearCookies: false, status: 503 },
  { message: 'REFRESH_UNAUTHORIZED', clearCookies: true, status: 401 },
]) test(`session failure ${failure.message} returns ${failure.status} and clears cookies only for rejected authentication`, () => {
  let clears = 0;
  const session = load('src/lib/auth/session.ts', {
    'server-only': {}, 'next/headers': {},
    'next/server': { NextResponse: { json: (body, init) => ({ body, status: init.status }) } },
    '@/lib/api/endpoints': {}, '@/lib/auth/cookie-names': {}, '@/lib/env.server': {},
    '@/lib/auth/cookies': { clearAuthCookies: () => clears++ }, '@/lib/auth/refresh-request': {},
  });
  const result = session.sessionUnauthorized({ ok: false, ...failure });
  assert.equal(result.status, failure.status);
  assert.equal(clears, failure.clearCookies ? 1 : 0);
});
for (const status of [404, 405, 408, 429, 500]) test(`unexpected or transient refresh HTTP ${status} never logs out the user`, async () => {
  const f = retryFixture([{ status }]);
  const result = await f.requestRefreshTokens('/refresh', 'refresh');
  assert.equal(result.clearCookies, false);
  assert.equal(f.calls.length, 3);
});
for (const status of [401, 503]) test(`BFF refresh failure ${status} redirects only an invalid refresh session`, async () => {
  const redirected = [];
  const error = { status, message: status === 401 ? 'REFRESH_UNAUTHORIZED' : 'REFRESH_RETRY_EXHAUSTED', data: null, url: '/api/test' };
  const bff = load('src/lib/api/bffFetch.ts', {
    '@/lib/env.client': { BFF_BASE_URL: '' },
    '@/lib/api/error': load('src/lib/api/error.ts', {}),
    '@/lib/api/http': { http: async () => { throw error; }, applyPathParams: url => [url] },
  }, { window: { location: { replace: url => redirected.push(url) } } });
  await assert.rejects(bff.bffGet('/api/test'), value => value === error);
  assert.deepEqual(redirected, status === 401 ? ['/login'] : []);
});

const errorTools = load('src/lib/api/error.ts', {});
for (const status of [403, 404, 500, 502, 503, 504]) test(`API error ${status} keeps its HTTP status and supplies a machine-readable code`, () => {
  const response = errorTools.toErrorResponse({ status, message: '조회 실패', url: '/api/test', data: null });
  assert.equal(response.status, status);
  assert.equal(response.payload.status, status);
  assert.equal(typeof response.payload.code, 'string');
  assert.notEqual(response.payload.code, '조회 실패');
});
test('Spring business error code and validation fields survive BFF normalization', () => {
  const data = { code: 'USER_NOT_FOUND', message: '사용자를 찾을 수 없습니다.', data: { nickname: 'invalid' } };
  const result = errorTools.toErrorResponse({ status: 404, message: data.message, data, url: '/api/test' });
  assert.equal(result.payload.code, 'USER_NOT_FOUND');
  assert.equal(result.payload.data, data.data);
  assert.equal(data.status, undefined);
});
test('upstream body status cannot override the actual HTTP response', () => {
  const result = errorTools.toErrorResponse({ status: 503, message: 'SERVICE_UNAVAILABLE', data: { status: 404 }, url: '/api/test' });
  assert.equal(result.payload.status, 503);
});
for (const [message, expected] of [['NETWORK_ERROR', 502], ['REQUEST_TIMEOUT', 504]]) test(`browser ${message} is displayed as ${expected}`, () => {
  const error = { status: 0, message, url: '/api/test', data: null };
  assert.equal(errorTools.httpErrorStatus(error), expected);
  assert.equal(errorTools.toErrorResponse(error).payload.status, expected);
});
test('unclassified failures become 500 with INTERNAL_SERVER_ERROR', () => {
  assert.equal(errorTools.toErrorResponse(new Error('failed')).payload.code, 'INTERNAL_SERVER_ERROR');
  assert.equal(errorTools.httpErrorStatus(new Error('failed')), 500);
});
function loadErrorScreen() {
  const jsx = (type, props) => ({ type, props });
  return load('src/components/common/PageLoadError.tsx', {
    'react/jsx-runtime': { jsx, jsxs: jsx }, 'lucide-react': { RefreshCw: 'icon' },
    'next/navigation': { notFound: () => { throw new Error('NOT_FOUND'); }, redirect: url => { throw new Error(`REDIRECT:${url}`); } },
    '@/lib/api/error': errorTools, '@/lib/api/page-load-error': pageErrors,
    './PageLoadError.module.scss': { default: {} },
  });
}
for (const status of [403, 500, 502, 503, 504]) test(`page error ${status} displays its number and keeps retry UI`, () => {
  const { PageLoadError } = loadErrorScreen();
  const node = PageLoadError({ error: { status, message: 'error', data: null, url: '/api/test' } });
  assert.equal(node.props.children[0].props.children, status);
  assert.equal(node.props.children[1].props.children, '일시적인 오류가 발생했습니다.');
  assert.equal(node.props.children[3].type, 'button');
});
test('404 keeps the branded not-found page while 401 still redirects to login', () => {
  const { PageLoadError } = loadErrorScreen();
  assert.throws(() => PageLoadError({ error: { status: 404, message: 'missing', data: null, url: '/api/test' } }), /NOT_FOUND/);
  assert.throws(() => PageLoadError({ error: { status: 401, message: 'login', data: null, url: '/api/test' } }), /REDIRECT:\/login/);
});
test('invalid refresh is recognized by code even when the error message is translated', async () => {
  const redirects = [];
  const error = { status: 401, message: '세션이 만료되었습니다.', data: { code: 'REFRESH_UNAUTHORIZED' }, url: '/api/test' };
  const bff = load('src/lib/api/bffFetch.ts', {
    '@/lib/env.client': { BFF_BASE_URL: '' }, '@/lib/api/error': errorTools,
    '@/lib/api/http': { http: async () => { throw error; }, applyPathParams: url => [url] },
  }, { window: { location: { replace: url => redirects.push(url) } } });
  await assert.rejects(bff.bffGet('/api/test'));
  assert.deepEqual(redirects, ['/login']);
});
