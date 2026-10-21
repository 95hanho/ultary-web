import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
function load(path, mocks, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(resolve(root, path), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
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

test('only exhausted transient failures become authentication failure', async () => {
  const fixture = retryFixture([{ status: 502 }]);
  const result = await fixture.requestRefreshTokens('/refresh', 'refresh');
  assert.equal(result.ok, false);
  assert.equal(result.clearCookies, true);
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
    if (failRefresh) return { ok: false, clearCookies: true, message: 'REFRESH_RETRY_EXHAUSTED' };
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

test('exhausted refresh clears matching admin cookies and never replays the business request', async () => {
  const fixture = recoveryFixture({ admin: true, failRefresh: true }); let sends = 0;
  await assert.rejects(fixture.recoverExpiredAccess(fixture.url, { headers: { Authorization: 'Bearer expired' } },
    async () => { sends++; throw fixture.expired; }), error => error.data.code === 'REFRESH_RETRY_EXHAUSTED');
  assert.equal(sends, 1); assert.deepEqual(fixture.cleared, ['admin']);
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

test('file streaming proxy includes key upstream without returning it to the browser', async () => {
  const sent = [];
  const route = load('src/app/api/files/[fileId]/content/route.ts', {
    'next/server': { NextResponse: Response }, '@/lib/api/spring-request': springPreparation(),
    '@/lib/api/endpoints': { springEndpoints: { files: { content: '/api/v1/files/:fileId/content' } } },
    '@/lib/api/bffRoute': { requireAccessToken: async () => 'access', isUnauthorized: () => false, handleBffError: error => { throw error; } },
    '@/lib/api/http': { applyPathParams: (path, params) => [path.replace(':fileId', params.fileId)] },
    '@/lib/api/error': { isHttpError: () => true },
  }, {
    fetch: async (url, init) => { sent.push({ url, init }); return new Response('file-content', { headers: { 'Content-Type': 'image/jpeg' } }); },
  });
  const response = await route.GET({}, { params: Promise.resolve({ fileId: '42' }) });
  assert.equal(new Headers(sent[0].init.headers).get('x-bff-key'), 'test-only-bff-key-not-for-production-123456789');
  assert.equal(response.headers.has('X-BFF-Key'), false);
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
