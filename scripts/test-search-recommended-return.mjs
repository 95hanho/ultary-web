import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function fixture(browser = true) {
  const exports = {};
  let serial = 0;
  const window = {
    location: { pathname: '/search', search: '' },
    scrollY: 580,
    history: {
      state: { __NA: true, tree: ['existing-router-state'] },
      replaceState(state) {
        this.state = state;
      },
    },
  };
  vm.runInNewContext(
    ts.transpileModule(
      readFileSync(new URL('../src/lib/search/recommended-return.ts', import.meta.url), 'utf8'),
      {
        compilerOptions: { module: ts.ModuleKind.CommonJS },
      },
    ).outputText,
    { exports, ...(browser ? { window } : {}), crypto: { randomUUID: () => `entry-${++serial}` } },
  );
  return { window, ...exports };
}

test('back to the originating history entry restores the exact grid and scroll position', () => {
  const f = fixture();
  const posts = [
    { id: '2764', imageUrl: '/photo-a.png', href: '/posts/2764' },
    { id: '2761', imageUrl: '/photo-b.png', href: '/posts/2761' },
  ];
  f.saveRecommendedReturn(posts, 'remaining-page-cursor');
  const searchEntry = f.window.history.state;
  assert.equal(searchEntry.__NA, true);
  assert.deepEqual(searchEntry.tree, ['existing-router-state']);
  posts[0].id = 'changed-after-navigation';
  f.window.location.pathname = '/posts/2764';
  f.window.scrollY = 0;
  assert.equal(f.readRecommendedReturn(), null);
  f.window.location.pathname = '/search';
  f.window.history.state = searchEntry;
  const restored = f.readRecommendedReturn();
  assert.equal(restored.scrollY, 580);
  assert.equal(restored.nextCursor, 'remaining-page-cursor');
  assert.equal(restored.posts.map((p) => p.id).join(','), '2764,2761');
  assert.equal(restored.posts[0].href, '/posts/2764');
});

test('a fresh search entry or a different search query cannot reuse the previous grid', () => {
  const f = fixture();
  assert.equal(f.readRecommendedReturn(), null);
  f.saveRecommendedReturn([{ id: '1', href: '/posts/1' }]);
  const entry = f.window.history.state;
  f.window.history.state = { __NA: true };
  assert.equal(f.readRecommendedReturn(), null);
  f.window.history.state = entry;
  f.window.location.search = '?q=other';
  assert.equal(f.readRecommendedReturn(), null);
});

test('the next post visit updates the return position and server rendering has no browser dependency', () => {
  const f = fixture();
  f.saveRecommendedReturn([{ id: '1' }]);
  f.window.scrollY = 900;
  f.saveRecommendedReturn([{ id: '2' }]);
  assert.equal(f.readRecommendedReturn().scrollY, 900);
  assert.equal(f.readRecommendedReturn().posts[0].id, '2');
  const server = fixture(false);
  assert.equal(server.readRecommendedReturn(), null);
  assert.doesNotThrow(() => server.saveRecommendedReturn([]));
});
