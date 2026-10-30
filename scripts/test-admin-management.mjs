import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(file, deps = {}, globals = {}) {
  const exports = {};
  const source = ts.transpileModule(
    readFileSync(new URL('../src/' + file, import.meta.url), 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    },
  ).outputText;
  vm.runInNewContext(source, {
    exports,
    console,
    ...globals,
    require(name) {
      if (!(name in deps)) throw Error(name);
      return deps[name];
    },
  });
  return exports;
}
function nodes(node, match) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap((n) => nodes(n, match));
  return [...(match(node) ? [node] : []), ...nodes(node.props?.children, match)];
}
const jsx = { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
const styles = { default: new Proxy({}, { get: (_, key) => key }) };
const counts = {
  useMenuCounts: () => ({
    pendingTagRequestCount: 1,
    requestedReportCount: 2,
    failedAiRequestCount: 11,
  }),
  withCount: (label, count) => (count == null ? label : `${label} (${count})`),
};

test('admin home places members first and history separately after the other menus', () => {
  const Menu = load('app/admin/AdminMenuClient.tsx', {
    'react/jsx-runtime': jsx,
    'next/link': { default: 'Link' },
    './AdminLogoutButton': { default: 'Logout' },
    './admin.module.scss': styles,
    './useMenuCounts': counts,
  }).default;
  const links = nodes(Menu(), (n) => n.type === 'Link');
  assert.deepEqual(
    links.map((n) => n.props.href),
    ['/admin/users', '/admin/tags', '/admin/reports', '/admin/ai/logs', '/admin/actions'],
  );
  assert.equal(links[0].props.children, '회원 관리');
  assert.match(links.at(-1).props.className, /menuHistory/);
});

test('sidebar keeps history directly above logout and does not give members the AI count', () => {
  const Shell = load('app/admin/AdminShell.tsx', {
    'react/jsx-runtime': jsx,
    react: {},
    'next/link': { default: 'Link' },
    'next/navigation': { usePathname: () => '/admin/users/101' },
    'lucide-react': { ChevronLeft: 'Left', ChevronRight: 'Right' },
    './AdminLogoutButton': { default: 'Logout' },
    './admin.module.scss': styles,
    './useMenuCounts': counts,
    '@/lib/react/useResettableState': { useResettableState: () => [true, () => {}] },
    '@/lib/react/useHydrated': { useHydrated: () => true },
  }).default;
  const tree = Shell({ children: 'page' });
  const member = nodes(tree, (n) => n.type === 'Link' && n.props.href === '/admin/users')[0];
  assert.equal(member.props.children, '회원 관리');
  assert.equal(member.props['aria-current'], 'page');
  const bottom = nodes(tree, (n) => n.props?.className === 'sideBottom')[0];
  assert.equal(bottom.props.children[0].props.href, '/admin/actions');
  assert.equal(bottom.props.children[1].type, 'Logout');
});

test('member action requires a reason and confirmation before posting, and withdrawn members have no control', async () => {
  const states = [],
    modals = [],
    calls = [],
    jobs = [];
  let cursor = 0;
  const component = load(
    'app/admin/UserStatusControl.tsx',
    {
      'react/jsx-runtime': jsx,
      react: {
        useState: (value) => {
          const i = cursor++;
          if (!(i in states)) states[i] = value;
          return [
            states[i],
            (next) => {
              states[i] = next;
            },
          ];
        },
        useRef: (value) => {
          const i = cursor++;
          return (states[i] ??= { current: value });
        },
      },
      '@/components/common/FullScreenLoading': { FullScreenLoading: 'Loading' },
      '@/lib/api/bffFetch': {
        bffPostJson: async (url, body) => {
          calls.push({ url, body });
        },
      },
      '@/lib/api/endpoints': {
        bffEndpoints: { admin: { userSuspend: '/suspend', userUnsuspend: '/unsuspend' } },
      },
      '@/lib/api/error': { isHttpError: () => false, isRecord: () => false },
      '@/lib/nickname-tag': { nicknameTag: (n) => '@' + n },
      '@/stores/modal.store': {
        useModalStore: { getState: () => ({ open: (modal) => modals.push(modal) }) },
      },
      './admin.module.scss': styles,
    },
    { Event: class {}, window: { dispatchEvent() {} } },
  ).default;
  const user = { userNo: 101, nickname: 'ultary', status: 'ACTIVE' };
  const render = (value = user) => {
    cursor = 0;
    return component({ user: value, onChange: () => jobs.push('refresh') });
  };
  assert.equal(nodes(render(), (n) => n.type === 'button')[0].props.disabled, true);
  nodes(render(), (n) => n.type === 'input')[0].props.onChange({ target: { value: '반복 광고' } });
  nodes(render(), (n) => n.type === 'button')[0].props.onClick();
  assert.equal(calls.length, 0);
  assert.equal(modals[0].variant, 'confirm');
  modals[0].okButton.onClick();
  for (let i = 0; i < 8; i++) await Promise.resolve();
  assert.equal(calls[0].body.userNo, 101);
  assert.equal(calls[0].body.reason, '반복 광고');
  assert.equal(jobs.length, 1);
  assert.equal(
    nodes(render({ ...user, status: 'WITHDRAWN' }), (n) => n.type === 'button').length,
    0,
  );
});

test('audit targets only link to administrator pages and relative profile media use admin authorization', () => {
  const data = load('app/admin/adminManagementData.ts');
  for (const [targetType, href] of [
    ['USER', '/admin/users/101'],
    ['REPORT', '/admin/reports/101'],
    ['AI_REVIEW', '/admin/ai/logs/101'],
    ['TAG', '/admin/tags'],
  ]) {
    assert.equal(data.actionHref({ targetType, targetId: 101 }), href);
  }
  const images = load('app/admin/adminProfileUrl.ts');
  assert.equal(
    images.adminProfileUrl(101, { fileId: 2, filePath: 'images/private.png' }),
    '/api/admin/users/101/files/2/content',
  );
  assert.equal(
    images.adminProfileUrl(101, { fileId: 2, filePath: 'https://cdn.example/image.png' }),
    'https://cdn.example/image.png',
  );
});

test('new BFF list routes reject unauthenticated requests before contacting Spring', async () => {
  for (const route of ['app/api/admin/users/route.ts', 'app/api/admin/actions/route.ts']) {
    let upstreamCalls = 0;
    const denied = { status: 401 };
    const { GET } = load(route, {
      'next/server': {},
      '@/lib/api/endpoints': {
        springEndpoints: { admin: { users: '/users', actions: '/actions' } },
      },
      '@/lib/api/bffRoute': {
        requireAdminAccessToken: async () => denied,
        isUnauthorized: (v) => v === denied,
        bearer: () => ({}),
        handleBffError: (e) => {
          throw e;
        },
        ok: (v) => v,
        queryParams: () => ({}),
      },
      '@/lib/api/springFetch': {
        springGet: async () => {
          upstreamCalls++;
        },
      },
    });
    assert.equal(await GET({}), denied);
    assert.equal(upstreamCalls, 0);
  }
});
