import 'server-only';

import { SPRING_BASE_URL } from '@/lib/env.server';
import { springEndpoints } from '@/lib/api/endpoints';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from '@/lib/auth/cookie-names';
import { clearAuthCookies, setAuthCookies } from '@/lib/auth/cookies';
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
  clearCookies: boolean;
  message: string;
};

export type SessionResult = SessionOk | SessionFail;

/** 인스턴스 내 동시 refresh 중복 완화 (멀티 인스턴스·Edge와는 공유 안 함) */
const refreshLocks = new Map<string, Promise<SessionResult>>();

function readCookie(request: NextRequest, name: string) {
  return request.cookies.get(name)?.value?.trim() || undefined;
}

/**
 * access 있으면 그대로 사용.
 * 없고 refresh만 있으면 Spring `/auth/refresh` 호출 (토큰 발급·로테이션은 Spring 담당).
 * JWT 검증/생성은 BFF에서 하지 않음.
 */
export async function resolveSession(request: NextRequest): Promise<SessionResult> {
  const accessToken = readCookie(request, ACCESS_TOKEN_COOKIE);
  const refreshToken = readCookie(request, REFRESH_TOKEN_COOKIE);

  if (accessToken) {
    return { ok: true, accessToken };
  }

  if (!refreshToken) {
    return { ok: false, clearCookies: false, message: 'UNAUTHORIZED' };
  }

  const lockKey = `refresh:${refreshToken.slice(-16)}`;
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

      const raw = (await res.json().catch(() => null)) as
        | (TokenResponse & { success?: boolean; data?: TokenResponse })
        | null;

      if (!res.ok) {
        return {
          ok: false,
          clearCookies: res.status === 401 || res.status === 403,
          message: 'REFRESH_UNAUTHORIZED',
        };
      }

      const tokens: TokenResponse | null =
        raw && typeof raw.accessToken === 'string'
          ? raw
          : raw && raw.data && typeof raw.data.accessToken === 'string'
            ? raw.data
            : null;

      if (!tokens?.accessToken || !tokens.refreshToken) {
        return { ok: false, clearCookies: true, message: 'REFRESH_UNAUTHORIZED' };
      }

      return { ok: true, accessToken: tokens.accessToken, tokens };
    } catch {
      return { ok: false, clearCookies: false, message: 'REFRESH_FAILED' };
    } finally {
      refreshLocks.delete(lockKey);
    }
  })();

  refreshLocks.set(lockKey, task);
  return task;
}

export function applySessionCookies(response: NextResponse, session: SessionOk) {
  if (session.tokens) setAuthCookies(response, session.tokens);
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
