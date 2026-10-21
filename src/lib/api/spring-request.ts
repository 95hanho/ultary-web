import 'server-only';

import { BFF_INTERNAL_KEY, isProd, SPRING_BASE_URL } from '@/lib/env.server';
import type { HttpInit } from '@/lib/api/http';

/** 키는 고정된 Spring 오리진에만 보낸다. 리다이렉트로 다른 서버에 전달하지 않는다. */
export function prepareSpringRequest(path: string, init?: HttpInit) {
  if (!BFF_INTERNAL_KEY || BFF_INTERNAL_KEY.length < 32 || BFF_INTERNAL_KEY.length > 256) {
    throw new Error('BFF_INTERNAL_KEY must be configured on the server');
  }
  const base = new URL(SPRING_BASE_URL);
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password
    || (isProd && base.protocol !== 'https:')) {
    throw new Error('Spring transport requires an HTTPS URL in production');
  }
  if (!path.startsWith('/') || path.startsWith('//')) throw new Error('Invalid Spring API path');
  const url = new URL(`${SPRING_BASE_URL.replace(/\/$/, '')}${path}`);
  if (url.origin !== base.origin) throw new Error('Invalid Spring API origin');
  const headers = new Headers(init?.headers);
  // 클라이언트가 넣은 같은 이름의 값은 신뢰하지 않고 서버 값으로 덮어쓴다.
  headers.set('X-BFF-Key', BFF_INTERNAL_KEY);
  const options = { ...init };
  delete options.baseUrl;
  return {
    url: url.toString(),
    init: { ...options, headers: Object.fromEntries(headers.entries()), redirect: 'manual' as const },
  };
}
