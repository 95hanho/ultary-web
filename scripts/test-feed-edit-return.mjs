import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function fixture(browser = true) {
  const values = new Map(), frames = new Map(), listeners = new Map();
  let serial = 0, now = 0, maxScroll = 10_000, anchor = 3500;
  const exports = {};
  const window = {
    location: { origin: 'https://app.test', pathname: '/search', search: '?q=cat', hash: '#results' },
    scrollY: 4000,
    sessionStorage: { getItem: key => values.get(key) ?? null, setItem: (k,v) => values.set(k,v), removeItem: k => values.delete(k) },
    addEventListener: (k,v) => listeners.set(k,v), removeEventListener: k => listeners.delete(k),
    scrollTo: ({top}) => { window.scrollY = Math.min(maxScroll, Math.max(0, top)); },
  };
  const document = { getElementById: () => anchor == null ? null : {
    getBoundingClientRect: () => ({ top: anchor - window.scrollY }), getClientRects: () => [1],
  } };
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/lib/feed/edit-return.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, URL, ...(browser ? { window, document } : {}),
    performance: { now: () => now }, requestAnimationFrame: fn => { frames.set(++serial,fn); return serial; }, cancelAnimationFrame: id => frames.delete(id),
  });
  return { ...exports, window, values, listeners,
    setPage: (height, position) => { maxScroll = height; anchor = position; },
    tick: () => { now += 16; const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn()); },
  };
}

test('edit keeps the exact source URL/query/hash and restores only the matching feed', () => {
  const f = fixture();
  f.saveFeedEditReturn('12');
  assert.equal(f.readPendingFeedEditReturn(), null);
  assert.equal(f.requestFeedEditReturn('other'), null);
  assert.equal(f.requestFeedEditReturn('12'), '/search?q=cat#results');
  assert.equal(f.readPendingFeedEditReturn().scrollY, 4000);
  f.window.location.search = '?q=other';
  assert.equal(f.readPendingFeedEditReturn(), null);
});

test('a photo-tag detour preserves the page that originally opened editing', () => {
  const f = fixture(); f.saveFeedEditReturn('12');
  f.window.location.pathname = '/myultary/me/write/tags';
  assert.equal(f.requestFeedEditReturn('12'), '/search?q=cat#results');
  assert.equal(f.readPendingFeedEditReturn(), null);
});

test('restoration waits for async/infinite feed content and restores the card viewport offset', () => {
  const f = fixture(); f.saveFeedEditReturn('12'); f.requestFeedEditReturn('12');
  const saved = f.readPendingFeedEditReturn();
  f.window.scrollY = 0; f.setPage(100, null);
  f.restoreFeedEditScroll(saved);
  for(let i=0;i<3;i++) f.tick();
  assert.equal(f.window.scrollY, 100);
  assert.ok(f.readPendingFeedEditReturn());
  // Content above the edited card changed height by 200px.
  f.setPage(10_000, 3700);
  for(let i=0;i<8;i++) f.tick();
  assert.equal(f.window.scrollY, 4200);
  assert.equal(f.readPendingFeedEditReturn(), null);
});

test('manual scrolling cancels automatic restoration', () => {
  const f = fixture(); f.saveFeedEditReturn('12'); f.requestFeedEditReturn('12');
  f.setPage(100, null); f.restoreFeedEditScroll(f.readPendingFeedEditReturn());
  f.listeners.get('wheel')(); f.window.scrollY = 20; f.tick();
  assert.equal(f.window.scrollY, 20);
  assert.equal(f.readPendingFeedEditReturn(), null);
});

test('unsafe stored URLs are rejected and SSR has no browser dependency', () => {
  const f = fixture();
  f.values.set('ultaryFeedEditReturn', JSON.stringify({ feedId:'12',url:'//outside.test',scrollY:1,anchorTop:null,pending:true }));
  assert.equal(f.requestFeedEditReturn('12'), null);
  const server = fixture(false);
  assert.doesNotThrow(() => server.saveFeedEditReturn('12'));
  assert.equal(server.requestFeedEditReturn('12'), null);
});
