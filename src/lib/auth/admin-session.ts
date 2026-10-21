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
import { requestRefreshTokens } from '@/lib/auth/refresh-request';
import type { TokenResponse } from '@/types/api';

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
      return await requestRefreshTokens(springEndpoints.admin.refresh, refreshToken);
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
