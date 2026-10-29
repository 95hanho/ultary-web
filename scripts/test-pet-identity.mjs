import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as jsx from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';

const css = new Proxy({}, { get: (_, key) => String(key) });
function load(path, dependencies = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL('../src/' + path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { exports, require(name) {
    if (name === 'react/jsx-runtime') return jsx;
    if (name === 'clsx') return { default: (...values) => values.filter(Boolean).join(' ') };
    if (name.endsWith('.module.scss')) return { default: css };
    if (name in dependencies) return dependencies[name];
    throw new Error('Unmocked dependency: ' + name);
  }});
  return exports;
}
const nickname = load('lib/nickname-tag.ts');
const highlight = { highlightMatch: (text) => text };
const { PetNamesAndNicknameTag } = load('components/common/PetNamesAndNicknameTag.tsx', {
  '@/lib/nickname-tag': nickname, '@/lib/search/highlight': highlight,
});
test('shared identity shows comma-separated pet names above a single nickname tag', () => {
  const html = renderToStaticMarkup(jsx.jsx(PetNamesAndNicknameTag, { nickname: 'ultary', petNames: ['초코', '달이'] }));
  assert.match(html, /초코.*?, .*?달이/);
  assert.equal((html.match(/@ultary/g) ?? []).length, 1);
  assert.ok(html.indexOf('초코') < html.indexOf('@ultary'));
  const empty = renderToStaticMarkup(jsx.jsx(PetNamesAndNicknameTag, { nickname: 'shop', petNames: [] }));
  assert.match(empty, /@shop/);
  assert.doesNotMatch(empty, /class="names"/);
});
function collect(node, predicate, found = []) {
  if (!node || typeof node !== 'object') return found;
  if (predicate(node)) found.push(node);
  for (const child of [node.props?.children].flat(Infinity)) collect(child, predicate, found);
  return found;
}
test('each displayed pet name preserves its own selection and the account is a separate action', () => {
  const picked = [];
  const element = PetNamesAndNicknameTag({ nickname: 'owner', petNames: ['초코', '달이'],
    onPetSelect: index => picked.push(index), onNicknameSelect: () => picked.push('account') });
  const buttons = collect(element, node => node.type === 'button');
  buttons.forEach(button => button.props.onClick());
  assert.deepEqual(picked, [0, 1, 'account']);
});
const images = {
  '@/components/common/MediaImage': { MediaImage: props => jsx.jsx('img', Object.fromEntries(Object.entries(props).filter(([name]) => name !== 'key'))) },
  '@/lib/api/fileUrl': { resolveFileDisplayUrl: file => file?.filePath ?? null },
  '@/lib/profileImage': { NO_PROFILE_SRC: '/empty.svg' },
};
const profile = load('components/my-ultary/Profile.tsx', images);
const { PetProfileGroup } = load('components/my-ultary/PetProfileGroup.tsx', { ...images, './Profile': profile });
const pets = [
  { petId: 1, name: '초코', profileFile: { filePath: '/first.png' } },
  { petId: 2, name: '달이', profileFile: { filePath: '/second.png' } },
  { petId: 3, name: '멍이', profileFile: null },
];
test('feed profile group keeps each selected pet inside one story frame', () => {
  const html = renderToStaticMarkup(jsx.jsx(PetProfileGroup, { pets, fallbackImage: '/account.png', size: 36, story: 'read' }));
  assert.match(html, /class="row storyRead"/);
  assert.equal((html.match(/<img/g) ?? []).length, 3);
  assert.ok(html.indexOf('/first.png') < html.indexOf('/second.png'));
  assert.match(html, /\/empty.svg/);
  assert.doesNotMatch(html, /\/account.png/);
});
test('story stack places the first management pet in front with offset cards behind it', () => {
  const element = PetProfileGroup({ pets, fallbackImage: '/account.png', size: 80, layout: 'stack', story: 'unread' });
  const cards = element.props.children;
  assert.equal(cards.length, 3);
  assert.ok(cards[0].props.style.zIndex > cards[1].props.style.zIndex);
  assert.notEqual(cards[0].props.style.left, cards[1].props.style.left);
  assert.notEqual(cards[0].props.style.top, cards[1].props.style.top);
  const html = renderToStaticMarkup(element);
  assert.match(html, /storyUnread/);
});

test('all stacked pet cards follow the same story state when unread becomes read', () => {
  for (const story of ['unread', 'read', 'none']) {
    const html = renderToStaticMarkup(jsx.jsx(PetProfileGroup, {
      pets, fallbackImage: '/account.png', size: 80, layout: 'stack', story,
    }));
    const expected = { unread: 'storyUnread', read: 'storyRead', none: 'storyNone' }[story];
    assert.equal((html.match(new RegExp(expected, 'g')) ?? []).length, pets.length);
    for (const other of ['storyUnread', 'storyRead', 'storyNone'].filter(value => value !== expected))
      assert.ok(!html.includes(other));
  }
});

test('feed pet profiles without stories have no read or unread ring, including the default', () => {
  for (const story of [undefined, 'none']) {
    const html = renderToStaticMarkup(jsx.jsx(PetProfileGroup, {
      pets, fallbackImage: '/account.png', size: 41, story,
    }));
    assert.match(html, /class="row"/);
    assert.doesNotMatch(html, /storyRead|storyUnread/);
    assert.equal((html.match(/<img/g) ?? []).length, pets.length);
  }
});
test('search mapping retains real pet names and account representative profile separately', () => {
  const { mapSearchUsers } = load('lib/search/accounts.ts', {
    '@/lib/api/error': { isRecord: value => value != null && typeof value === 'object' && !Array.isArray(value) },
    ...images,
  });
  const result = mapSearchUsers({ users: [{ userNo: 1, nickname: 'owner', petTags: ['pet_tag'], petNames: ['초코'], profileFile: { filePath: '/representative.png' } }] });
  assert.deepEqual(Array.from(result[0].petNames), ['초코']);
  assert.equal(result[0].imageUrl, '/representative.png');
  assert.deepEqual(Array.from(result[0].petTags), []);
});
