import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const compile = (name) =>
  ts.transpileModule(readFileSync(new URL(name, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
const helpers = {};
vm.runInNewContext(compile('../src/lib/dm/openingMessages.ts'), { exports: helpers });
function mount(firstUnread = null) {
  const effects = [],
    refs = [],
    listeners = new Map();
  let observer,
    disconnected = false,
    anchorTop = 1400;
  const row = {
    dataset: { dmMessageId: '40' },
    offsetHeight: 40,
    getBoundingClientRect: () => ({ top: anchorTop - container.scrollTop }),
  };
  const container = {
    scrollTop: 0,
    scrollHeight: 2400,
    clientHeight: 600,
    clientTop: 0,
    children: [row],
    querySelectorAll: () => [row],
    getBoundingClientRect: () => ({ top: 0 }),
    scrollTo({ top }) {
      this.scrollTop = Math.min(top, this.scrollHeight - this.clientHeight);
    },
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name) => listeners.delete(name),
  };
  const exports = {};
  vm.runInNewContext(compile('../src/lib/dm/useDmThreadScroll.ts'), {
    exports,
    require: (name) =>
      name === 'react'
        ? {
            useRef(value) {
              const ref = { current: value };
              refs.push(ref);
              return ref;
            },
            useLayoutEffect(fn) {
              effects.push(fn);
            },
          }
        : helpers,
    ResizeObserver: class {
      constructor(fn) {
        observer = fn;
      }
      observe() {}
      disconnect() {
        disconnected = true;
      }
    },
  });
  exports.useDmThreadScroll('101', true, firstUnread, [{ id: '40', fromMe: false }], false);
  refs[0].current = container;
  const cleanups = effects.map((fn) => fn());
  return {
    container,
    grow(height, top = anchorTop) {
      container.scrollHeight = height;
      anchorTop = top;
      observer();
    },
    interact(top) {
      listeners.get('wheel')();
      container.scrollTop = top;
      listeners.get('scroll')();
    },
    close() {
      cleanups.forEach((fn) => fn?.());
      return { disconnected, listeners: listeners.size };
    },
  };
}
test('read room stays at bottom after delayed image growth and shrink', () => {
  const m = mount();
  assert.equal(m.container.scrollTop, 1800);
  m.grow(2800);
  assert.equal(m.container.scrollTop, 2200);
  m.grow(2600);
  assert.equal(m.container.scrollTop, 2000);
});
test('unread anchor recenters when an earlier shared image changes height', () => {
  const m = mount('40');
  assert.equal(m.container.scrollTop, 1120);
  m.grow(2800, 1800);
  assert.equal(m.container.scrollTop, 1520);
});
test('user scrolling up stops image-load correction', () => {
  const m = mount();
  m.interact(600);
  m.grow(2800);
  assert.equal(m.container.scrollTop, 600);
});
test('manual scroll cancels unread centering but bottom following resumes near bottom', () => {
  const m = mount('40');
  m.interact(500);
  m.grow(2800, 1800);
  assert.equal(m.container.scrollTop, 500);
  m.interact(2200);
  m.grow(3000);
  assert.equal(m.container.scrollTop, 2400);
});
test('leaving room disconnects observers and input handlers', () => {
  assert.deepEqual(mount().close(), { disconnected: true, listeners: 0 });
});
