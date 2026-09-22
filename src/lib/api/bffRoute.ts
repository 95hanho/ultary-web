import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { toErrorResponse } from '@/lib/api/error';
import type { Params, RequestHeaders } from '@/lib/api/http';
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE,
} from '@/lib/auth/cookie-names';
import { isProd, SPRING_BASE_URL } from '@/lib/env.server';
import { springEndpoints } from '@/lib/api/endpoints';
import type { RefreshTokenRequest, TokenResponse } from '@/types/api';

export { runAuthed, withAuth, withOptionalAuth } from '@/lib/auth/withAuth';

/** Spring 연동 전 BFF 스켈레톤 응답 */
export function notImplemented(feature: string) {
  return NextResponse.json(
    {
      success: false,
      code: 'NOT_IMPLEMENTED',
      message: `${feature} is not implemented yet`,
      data: null,
    },
    { status: 501 },
  );
}

export function handleBffError(err: unknown) {
  const { status, payload } = toErrorResponse(err);
  return NextResponse.json(payload, { status });
}

/** 성공 응답 `{ success, data }` */
export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function unauthorized(detail = '로그인이 필요합니다.') {
  return NextResponse.json(
    { message: 'UNAUTHORIZED', detail },
    { status: 401 },
  );
}

export function badRequest(message: string, detail?: string) {
  return NextResponse.json(
    { message, detail: detail ?? message },
    { status: 400 },
  );
}

/** Bearer 헤더 */
export function bearer(accessToken: string): RequestHeaders {
  return { Authorization: `Bearer ${accessToken}` };
}

const cookieOpts = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax' as const,
  path: '/',
};

async function refreshViaSpring(refreshToken: string): Promise<TokenResponse | null> {
  try {
    const res = await fetch(`${SPRING_BASE_URL}${springEndpoints.auth.refresh}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refreshToken } satisfies RefreshTokenRequest),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const raw = (await res.json()) as TokenResponse & {
      success?: boolean;
      data?: TokenResponse;
    };
    if (typeof raw.accessToken === 'string' && typeof raw.refreshToken === 'string') {
      return raw;
    }
    if (raw.data?.accessToken && raw.data?.refreshToken) return raw.data;
    return null;
  } catch {
    return null;
  }
}

/**
 * access 쿠키 필수. 없으면 refresh로 Spring 재발급 후 cookies().set.
 * (미들웨어에서는 재발급하지 않음 — shop 교훈)
 */
export async function requireAccessToken(): Promise<string | NextResponse> {
  const jar = await cookies();
  const access = jar.get(ACCESS_TOKEN_COOKIE)?.value?.trim();
  if (access) return access;

  const refresh = jar.get(REFRESH_TOKEN_COOKIE)?.value?.trim();
  if (!refresh) return unauthorized();

  const tokens = await refreshViaSpring(refresh);
  if (!tokens) {
    jar.set(ACCESS_TOKEN_COOKIE, '', { ...cookieOpts, maxAge: 0 });
    jar.set(REFRESH_TOKEN_COOKIE, '', { ...cookieOpts, maxAge: 0 });
    return unauthorized('세션이 만료되었습니다. 다시 로그인해 주세요.');
  }

  jar.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...cookieOpts,
    maxAge: tokens.expiresIn ?? ACCESS_TOKEN_MAX_AGE,
  });
  jar.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...cookieOpts,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
  return tokens.accessToken;
}

export function isUnauthorized(
  value: string | NextResponse,
): value is NextResponse {
  return typeof value !== 'string';
}

/** Request URL query → plain object */
export function queryParams(request: Request): Record<string, string> {
  const { searchParams } = new URL(request.url);
  return Object.fromEntries(searchParams.entries());
}

/** JSON body (실패 시 빈 객체) — Spring form 전달용 */
export async function readJsonBody(request: Request): Promise<Params> {
  try {
    return (await request.json()) as Params;
  } catch {
    return {};
  }
}
