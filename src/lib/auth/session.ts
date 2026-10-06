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
  setAuthCookies,
} from '@/lib/auth/cookies';
import { isProd, SPRING_BASE_URL } from '@/lib/env.server';
import type { RefreshTokenRequest, TokenResponse } from '@/types/api';
import { NextRequest, NextResponse } from 'next/server';

export type SessionOk = {
  ok: true;
  accessToken: string;
  /** refresh로 새로 받은 경우 Set-Cookie용 */
  tokens?: TokenResponse;
};

export type SessionFail = {
  ok: false;
  /** Spring이 refresh를 거부(401/403)한 경우에만 true — 그 외 실패는 refresh 쿠키 유지 */
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
      const res = await fetch(`${SPRING_BASE_URL}${springEndpoints.auth.refresh}`, {
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
        // 응답 형식 이상 — refresh 쿠키는 유지 (다음에 재시도 가능)
        console.error('[auth] refresh response missing tokens', raw);
        return { ok: false, clearCookies: false, message: 'REFRESH_FAILED' };
      }

      return { ok: true, accessToken: tokens.accessToken, tokens };
    } catch (err) {
      console.error('[auth] refresh failed', err);
      return { ok: false, clearCookies: false, message: 'REFRESH_FAILED' };
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

export function applySessionCookies(response: NextResponse, session: SessionOk) {
  if (session.tokens) setAuthCookies(response, session.tokens, true);
  return response;
}

export function sessionUnauthorized(session: SessionFail) {
  const response = NextResponse.json(
    { message: session.message, detail: '로그인이 필요합니다.' },
    { status: 401 },
  );
  if (session.clearCookies) clearAuthCookies(response);
  return response;
}
