import 'server-only';

import { cookies } from 'next/headers';
import { springEndpoints } from '@/lib/api/endpoints';
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE,
} from '@/lib/auth/cookie-names';
import {
  clearAuthCookies,
  clearDevAccessCookieJar,
  rememberDevAccessRefresh,
} from '@/lib/auth/cookies';
import { isProd } from '@/lib/env.server';
import { requestRefreshTokens } from '@/lib/auth/refresh-request';
import type { TokenResponse } from '@/types/api';
import { NextRequest, NextResponse } from 'next/server';

export type SessionOk = {
  ok: true;
  accessToken: string;
  /** refresh로 새로 받은 경우 Set-Cookie용 */
  tokens?: TokenResponse;
};

export type SessionFail = {
  ok: false;
  /** 실제 인증 거부일 때만 true. 서버·통신 장애에서는 세션을 보존한다. */
  clearCookies: boolean;
  message: string;
};

export type SessionResult = SessionOk | SessionFail;

/** 인스턴스 내 동시 refresh 중복 완화 (로테이션 레이스 방지) */
const refreshLocks = new Map<string, Promise<SessionResult>>();

const cookieOpts = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax' as const,
  path: '/',
};

function readCookie(request: NextRequest, name: string) {
  return request.cookies.get(name)?.value?.trim() || undefined;
}

/**
 * Spring refresh (락 적용).
 * 토큰 로테이션 시 병렬 호출하면 두 번째가 실패하므로 반드시 공유 락 사용.
 */
export async function refreshViaSpringLocked(
  refreshToken: string,
): Promise<SessionResult> {
  const lockKey = `refresh:${refreshToken.slice(-24)}`;
  const existing = refreshLocks.get(lockKey);
  if (existing) return existing;

  const task = (async (): Promise<SessionResult> => {
    try {
      return await requestRefreshTokens(springEndpoints.auth.refresh, refreshToken);
    } finally {
      refreshLocks.delete(lockKey);
    }
  })();

  refreshLocks.set(lockKey, task);
  return task;
}

async function resolveWithTokens(
  accessToken: string | undefined,
  refreshToken: string | undefined,
): Promise<SessionResult> {
  if (accessToken) {
    return { ok: true, accessToken };
  }
  if (!refreshToken) {
    return { ok: false, clearCookies: false, message: 'UNAUTHORIZED' };
  }
  return refreshViaSpringLocked(refreshToken);
}

/**
 * access 있으면 그대로 사용.
 * 없고 refresh만 있으면 Spring `/auth/refresh` (발급·로테이션은 Spring).
 */
export async function resolveSession(request: NextRequest): Promise<SessionResult> {
  return resolveWithTokens(
    readCookie(request, ACCESS_TOKEN_COOKIE),
    readCookie(request, REFRESH_TOKEN_COOKIE),
  );
}

/** Route Handler에서 cookies() 기준 세션 해석 (requireAccessToken용) */
export async function resolveSessionFromCookies(): Promise<SessionResult> {
  const jar = await cookies();
  return resolveWithTokens(
    jar.get(ACCESS_TOKEN_COOKIE)?.value?.trim(),
    jar.get(REFRESH_TOKEN_COOKIE)?.value?.trim(),
  );
}

/** refresh로 받은 토큰을 cookies() jar에 반영 */
export async function applyTokensToCookieJar(tokens: TokenResponse) {
  const jar = await cookies();
  jar.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...cookieOpts,
    maxAge: tokens.expiresIn ?? ACCESS_TOKEN_MAX_AGE,
  });
  jar.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...cookieOpts,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
  await rememberDevAccessRefresh(tokens.expiresIn);
}

export async function clearAuthCookieJar() {
  const jar = await cookies();
  jar.set(ACCESS_TOKEN_COOKIE, '', { ...cookieOpts, maxAge: 0 });
  jar.set(REFRESH_TOKEN_COOKIE, '', { ...cookieOpts, maxAge: 0 });
  await clearDevAccessCookieJar();
}

export function sessionUnauthorized(session: SessionFail) {
  const unavailable = session.message === 'REFRESH_RETRY_EXHAUSTED';
  const response = NextResponse.json(
    { status: unavailable ? 503 : 401, code: session.message, message: session.message, detail: unavailable ? '일시적인 오류가 발생했습니다.' : '로그인이 필요합니다.' },
    { status: unavailable ? 503 : 401 },
  );
  if (session.clearCookies) clearAuthCookies(response);
  return response;
}
