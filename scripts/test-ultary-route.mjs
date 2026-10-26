import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const seoExports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/lib/seo/metadata.ts', import.meta.url), 'utf8'), {
 compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
}).outputText, {exports: seoExports, URL});

function fixture(member) {
  const calls = [];
  const client = () => null;
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL('../src/app/(main)/myultary/[nickname]/page.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const jsx = (type, props, key) => ({ type, props, key });
  const mocks = {
    'react/jsx-runtime': { jsx, jsxs: jsx },
    '@/lib/seo/metadata': seoExports,
    '@/lib/seo/site': {SEO_ORIGIN: 'https://ultary.example.test'},
    '@/lib/profileImage': {NO_PROFILE_SRC: '/no-profile.svg'},
    'next/link': { default: 'link' },
    '../MyUltaryClient': { default: client },
    '@/lib/auth/cookies': { getAccessToken: async () => member === 'access' ? 'access' : null, getRefreshToken: async () => member === 'refresh' ? 'refresh' : null },
    '@/lib/myultary/publicProfile': { loadPublicUltary: async nickname => {
      calls.push(nickname);
      return { profile: { nickname, bio: '' }, pets: [] };
    } },
    '@/lib/myultary/title': { ultaryTitle: nickname => `${nickname}님의 울타리 - Ultary` },
    '@/lib/mock/ultary-accounts': { myUltaryPath: nickname => `/myultary/${nickname}` },
    '@/components/common/LogoHeader': { LogoHeader: 'header' },
    '@/components/common/PageLoadError': { PageLoadError: 'retry' },
    '@/components/common/PageLoadError.module.scss': { default: {} },
    'next/navigation': { notFound: () => { throw new Error('NOT_FOUND'); } },
    '@/lib/api/page-load-error': { isUnavailablePageError: () => false },
  };
  vm.runInNewContext(code, { exports, require: name => {
    if (!(name in mocks)) throw new Error(`Missing mock: ${name}`);
    return mocks[name];
  } });
  return { ...exports, calls, client };
}

for (const member of ['access', 'refresh']) test(`${member} session receives decoded Korean nickname for own-profile matching`, async () => {
  const f = fixture(member);
  const result = await f.default({ params: Promise.resolve({ nickname: encodeURIComponent('울타리') }) });
  assert.equal(result.type, f.client);
  assert.equal(result.props.nickname, '울타리');
  assert.equal(result.key, '울타리:member');
  assert.equal(f.calls.length, 0);
});
test('guest profile lookup and metadata receive the same decoded nickname', async () => {
  const f = fixture(null);
  const props = { params: Promise.resolve({ nickname: encodeURIComponent('울타리') }) };
  const result = await f.default(props);
  const metadata = await f.generateMetadata(props);
  assert.equal(result.props.nickname, '울타리');
  assert.equal(result.props.guestData.profile.nickname, '울타리');
  assert.deepEqual(f.calls, ['울타리', '울타리']);
  assert.equal(metadata.title, '울타리님의 울타리 - Ultary');
});
test('ASCII nicknames stay intact and malformed encoding becomes 404', async () => {
  const f = fixture('access');
  const result = await f.default({ params: Promise.resolve({ nickname: 'pet_owner' }) });
  assert.equal(result.props.nickname, 'pet_owner');
  await assert.rejects(f.default({ params: Promise.resolve({ nickname: '%broken' }) }), /NOT_FOUND/);
});

test('member metadata never reads the public profile to bypass an incoming block', async () => {
  for (const member of ['access', 'refresh']) {
    const f = fixture(member);
    const result = await f.generateMetadata({ params: Promise.resolve({ nickname: encodeURIComponent('울타리') }) });
    assert.equal(result.title, 'Ultary');
    assert.equal(f.calls.length, 0);
    assert.equal(result.robots.index, false);
  }
});
