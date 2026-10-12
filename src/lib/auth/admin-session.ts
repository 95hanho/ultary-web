import 'server-only';

import { cookies } from 'next/headers';
import { springEndpoints } from '@/lib/api/endpoints';
import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_REFRESH_TOKEN_COOKIE,
} from '@/lib/auth/cookie-names';
import {
  applyAdminTokensToCookieJar,
  clearAdminAuthCookieJar,
} from '@/lib/auth/cookies';
import { SPRING_BASE_URL } from '@/lib/env.server';
import type { RefreshTokenRequest, TokenResponse } from '@/types/api';

export type AdminSessionOk = {
  ok: true;
  accessToken: string;
  tokens?: TokenResponse;
};

export type AdminSessionFail = {
  ok: false;
  clearCookies: boolean;
  message: string;
};

export type AdminSessionResult = AdminSessionOk | AdminSessionFail;

const refreshLocks = new Map<string, Promise<AdminSessionResult>>();

function parseTokenResponse(raw: unknown): TokenResponse | null {
  if (!raw || typeof raw !== 'object') return null;
  const body = raw as TokenResponse & {
    success?: boolean;
    data?: TokenResponse | null;
  };
  if (typeof body.accessToken === 'string' && typeof body.refreshToken === 'string') {
    return body;
  }
  if (
    body.data &&
    typeof body.data.accessToken === 'string' &&
    typeof body.data.refreshToken === 'string'
  ) {
    return body.data;
  }
  return null;
}

/** 페이지 가드. 재발급은 하지 않는다. */
export async function hasAdminSession() {
  const jar = await cookies();
  const access = jar.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value?.trim();
  const refresh = jar.get(ADMIN_REFRESH_TOKEN_COOKIE)?.value?.trim();
  return Boolean(access || refresh);
}

export async function refreshAdminViaSpringLocked(
  refreshToken: string,
): Promise<AdminSessionResult> {
  const lockKey = `admin-refresh:${refreshToken.slice(-24)}`;
  const existing = refreshLocks.get(lockKey);
  if (existing) return existing;

  const task = (async (): Promise<AdminSessionResult> => {
    try {
      const res = await fetch(`${SPRING_BASE_URL}${springEndpoints.admin.refresh}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refreshToken } satisfies RefreshTokenRequest),
        cache: 'no-store',
      });
      const raw = await res.json().catch(() => null);

      if (!res.ok) {
        return {
          ok: false,
          clearCookies: res.status === 401 || res.status === 403,
          message: 'REFRESH_UNAUTHORIZED',
        };
      }

      const tokens = parseTokenResponse(raw);
      if (!tokens?.accessToken || !tokens.refreshToken) {
        console.error('[admin-auth] refresh response missing tokens', raw);
        return { ok: false, clearCookies: false, message: 'REFRESH_FAILED' };
      }

      return { ok: true, accessToken: tokens.accessToken, tokens };
    } catch (err) {
      console.error('[admin-auth] refresh failed', err);
      return { ok: false, clearCookies: false, message: 'REFRESH_FAILED' };
    } finally {
      refreshLocks.delete(lockKey);
    }
  })();

  refreshLocks.set(lockKey, task);
  return task;
}

/** access 가 있으면 그대로, 없으면 관리자 refresh 로 재발급 */
export async function resolveAdminSessionFromCookies(): Promise<AdminSessionResult> {
  const jar = await cookies();
  const accessToken = jar.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value?.trim();
  const refreshToken = jar.get(ADMIN_REFRESH_TOKEN_COOKIE)?.value?.trim();
  if (accessToken) return { ok: true, accessToken };
  if (!refreshToken) {
    return { ok: false, clearCookies: false, message: 'UNAUTHORIZED' };
  }
  return refreshAdminViaSpringLocked(refreshToken);
}

export async function requireAdminSession(): Promise<AdminSessionResult> {
  const session = await resolveAdminSessionFromCookies();
  if (!session.ok) {
    if (session.clearCookies) await clearAdminAuthCookieJar();
    return session;
  }
  if (session.tokens) await applyAdminTokensToCookieJar(session.tokens);
  return session;
}
