import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as jsx from 'react/jsx-runtime';

function load(path, require, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL('../src/' + path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { exports, require, ...globals });
  return exports;
}
const errors = load('lib/api/error.ts', () => { throw Error('Unexpected dependency'); });
const paths = { myUltaryPath: nickname => '/myultary/' + nickname };
const file = { resolveFileDisplayUrl: value => value?.filePath ?? null };
const noop = () => {};
const report = { readMyReport: () => null, canCancelReport: () => false };
const dataDependencies = {
  '@/lib/api/error': errors, '@/lib/api/fileUrl': file,
  '@/lib/report/openReport': report, '@/lib/profileImage': { NO_PROFILE_SRC: '/empty.svg' },
};
const dataRequire = name => { if (!(name in dataDependencies)) throw Error(name); return dataDependencies[name]; };
const mapping = load('lib/myultary/fromApi.ts', dataRequire);
const search = load('lib/search/accounts.ts', dataRequire);
const petFeedSelection = load('lib/myultary/petFeedSelection.ts', dataRequire);
const { bffEndpoints } = load('lib/api/endpoints.ts', () => { throw Error('Unexpected dependency'); });
const fixturePets = [
  { petId: 104, name: '코코', profileFile: { fileId: 163, filePath: 'https://cdn.test/coco.jpg' } },
  { petId: 105, name: '토리', profileFile: { fileId: 112, filePath: 'https://cdn.test/tori.jpg' } },
];
const fixtureFeeds = [
  { feedId: 152, coverFile: { fileId: 1, filePath: 'https://cdn.test/feed-one.jpg' } },
  { feedId: 151, coverFile: { fileId: 2, filePath: 'https://cdn.test/feed-two.jpg' } },
];
function fixture(me, fail = false, data = {}) {
  const slots = [], effects = [], calls = []; let cursor = 0;
  const useState = initial => {
    const index = cursor++;
    if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
    return [slots[index], next => { slots[index] = typeof next === 'function' ? next(slots[index]) : next; }];
  };
  const hooks = {
    useState, useRef: initial => useState(() => ({ current: initial }))[0],
    useEffect: callback => effects.push(callback), useLayoutEffect: callback => effects.push(callback),
    useCallback: callback => callback,
  };
  const component = load('app/(main)/myultary/MyUltaryClient.tsx', name => {
    const mocks = {
      'react/jsx-runtime': jsx, react: hooks, clsx: { default: (...items) => items.filter(Boolean).join(' ') },
      '@/lib/react/useResettableState': { useResettableState: useState },
      '@/lib/react/useHydrated': { useHydrated: () => false },
      '@/lib/mock/ultary-accounts': paths,
      '@/lib/myultary/fromApi': mapping, '@/lib/search/accounts': search,
      '@/lib/myultary/petFeedSelection': petFeedSelection,
      '@/lib/api/error': errors, '@/lib/api/endpoints': { bffEndpoints },
      '@/lib/report/openReport': report,
      '@/lib/nickname-tag': { nicknameTag: value => '@' + value.replace(/^@+/, '') },
      '@/lib/myultary/title': { ultaryTitle: nickname => nickname },
      '@/lib/myultary/gridScroll': {}, '@/lib/profileImage': { NO_PROFILE_SRC: '/empty.svg' },
      '@/stores/modal.store': { useModalStore: selector => selector({ open: noop }) },
      '@/stores/write-draft.store': { useWriteDraftStore: selector => selector({ setItems: noop, clear: noop }) },
      '@/stores/story-draft.store': { useStoryDraftStore: selector => selector({ setMedia: noop, clear: noop }) },
      'next/navigation': { useRouter: () => ({ push: noop }), notFound: () => { throw Error('NOT_FOUND'); } },
      '@/lib/api/bffFetch': { bffGet: async (url, params) => {
        calls.push({ url, params });
        if (fail) throw { status: 503, message: 'UNAVAILABLE', url, data: {} };
        if (url === bffEndpoints.myUltary.profile) return { data: me };
        if (url === bffEndpoints.main.search) return { data: { users: [{ userNo: 103, nickname: params.q }] } };
        if (url === bffEndpoints.users.ultary) return { data: { userNo: 103, nickname: 'walker', feedCount: 2 } };
        if ([bffEndpoints.pets.root, bffEndpoints.users.pets].includes(url)) return { data: data.pets ?? fixturePets };
        if ([bffEndpoints.myUltary.feeds, bffEndpoints.users.feeds].includes(url)) return { data: data.feeds ?? fixtureFeeds };
        throw Error('Unexpected API ' + url);
      } },
    };
    if (name in mocks) return mocks[name];
    if (name === '@/lib/mock/feeds') throw Error('Live profile must never import fixture feeds');
    if (name.endsWith('.scss')) return { default: new Proxy({}, { get: (_, key) => key }) };
    return new Proxy({}, { get: (_, key) => key === 'default' ? name : String(key) });
  }, { window: { setTimeout, clearTimeout }, document: { title: '' }, console: { error: noop } }).default;
  return {
    calls,
    render(nickname) { cursor = 0; effects.length = 0; return component({ nickname }); },
    async runEffects() { effects.slice().forEach(effect => effect()); for (let i = 0; i < 30; i++) await Promise.resolve(); },
  };
}
function descendants(tree, predicate) {
  if (!tree || typeof tree !== 'object') return [];
  return [...(predicate(tree) ? [tree] : []), ...[tree.props?.children].flat(Infinity).flatMap(child => descendants(child, predicate))];
}
test('walker uses its real account, two pet portraits and distinct API feed images', async () => {
  const f = fixture({ userNo: 101, nickname: 'ultary' });
  f.render('walker'); await f.runEffects(); const tree = f.render('walker');
  assert.ok(f.calls.some(call => call.url === bffEndpoints.users.pets && call.params.userNo === 103));
  assert.equal(descendants(tree, node => node.type === 'SwiperSlide').length, 2);
  const grid = descendants(tree, node => node.type === 'FeedGrid')[0];
  assert.deepEqual(Array.from(grid.props.posts, post => post.imageUrl), ['https://cdn.test/feed-one.jpg', 'https://cdn.test/feed-two.jpg']);
  const pictures = descendants(tree, node => node.type === 'MediaImage').map(node => node.props.src);
  assert.ok(pictures.includes('https://cdn.test/coco.jpg')); assert.ok(pictures.includes('https://cdn.test/tori.jpg'));
});
test('the ultary nickname is not treated as an alias for a different logged-in account', async () => {
  const f = fixture({ userNo: 102, nickname: 'nari_owner' });
  f.render('ultary'); await f.runEffects();
  assert.ok(f.calls.some(call => call.url === bffEndpoints.main.search && call.params.q === 'ultary'));
  assert.ok(!f.calls.some(call => call.url === bffEndpoints.pets.root));
});
test('a failed real request shows the error screen instead of sample pets and repeated photos', async () => {
  const f = fixture({ userNo: 101, nickname: 'ultary' }, true);
  f.render('walker'); await f.runEffects(); const tree = f.render('walker');
  assert.equal(tree.type, 'PageLoadError');
  assert.equal(tree.props.error.status, 503);
});

test('own empty Ultary links to pet management and starts the existing photo-first write flow', async () => {
  const f = fixture({ userNo: 304, nickname: 'googlegjxk', feedCount: 0 }, false, { pets: [], feeds: [] });
  f.render('googlegjxk'); await f.runEffects(); const tree = f.render('googlegjxk');
  assert.equal(descendants(tree, node => node.props?.href === '/settings/pets' && node.props.children === '반려동물 관리로 가기').length, 1);
  const write = descendants(tree, node => node.type === 'button' && node.props.children === '게시글 작성하기');
  assert.equal(write.length, 1);
  const fileInput = descendants(tree, node => node.type === 'input' && node.props.type === 'file' && node.props.multiple)[0];
  let opened = 0;
  fileInput.props.ref.current = { click: () => { opened++; } };
  write[0].props.onClick();
  assert.equal(opened, 1);
  descendants(tree, node => node.type === 'button' && node.props['aria-label'] === '태그됨')[0].props.onClick();
  assert.equal(descendants(f.render('googlegjxk'), node => node.type === 'button' && node.props.children === '게시글 작성하기').length, 0);
});

test('another users empty Ultary has neither pet management nor write actions', async () => {
  const f = fixture({ userNo: 101, nickname: 'ultary' }, false, { pets: [], feeds: [] });
  f.render('walker'); await f.runEffects(); const tree = f.render('walker');
  assert.equal(descendants(tree, node => ['반려동물 관리로 가기', '게시글 작성하기'].includes(node.props?.children)).length, 0);
});
