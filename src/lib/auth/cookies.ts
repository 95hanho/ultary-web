import 'server-only';

import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import { isProd } from '@/lib/env.server';

export const ACCESS_TOKEN_COOKIE = 'accessToken';
export const REFRESH_TOKEN_COOKIE = 'refreshToken';

/** access 기본 30분 */
export const ACCESS_TOKEN_MAX_AGE = 60 * 30;
/** refresh 기본 14일 */
export const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 14;

const baseCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax' as const,
  path: '/',
};

export async function getAccessToken() {
  const jar = await cookies();
  return jar.get(ACCESS_TOKEN_COOKIE)?.value;
}

export async function getRefreshToken() {
  const jar = await cookies();
  return jar.get(REFRESH_TOKEN_COOKIE)?.value;
}

export function setAuthCookies(
  response: NextResponse,
  tokens: { accessToken: string; refreshToken: string; expiresIn?: number },
) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...baseCookieOptions,
    maxAge: tokens.expiresIn ?? ACCESS_TOKEN_MAX_AGE,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...baseCookieOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, '', {
    ...baseCookieOptions,
    maxAge: 0,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, '', {
    ...baseCookieOptions,
    maxAge: 0,
  });
}
