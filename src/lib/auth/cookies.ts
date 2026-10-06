import 'server-only';

import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import { isProd } from '@/lib/env.server';
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE,
  DEV_ACCESS_EXPIRES_AT_COOKIE,
  DEV_ACCESS_ISSUED_AT_COOKIE,
  DEV_ACCESS_VIA_REFRESH_COOKIE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE,
} from '@/lib/auth/cookie-names';

export {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE,
} from '@/lib/auth/cookie-names';

const baseCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax' as const,
  path: '/',
};

const devCookieOptions = {
  httpOnly: false,
  secure: isProd,
  sameSite: 'lax' as const,
  path: '/',
};

const DEV_ACCESS_COOKIES = [
  DEV_ACCESS_EXPIRES_AT_COOKIE,
  DEV_ACCESS_ISSUED_AT_COOKIE,
  DEV_ACCESS_VIA_REFRESH_COOKIE,
] as const;

function devAccessEntries(expiresIn: number | undefined, viaRefresh: boolean) {
  if (process.env.NODE_ENV === 'production') return [];
  const now = Date.now();
  const maxAge = expiresIn ?? ACCESS_TOKEN_MAX_AGE;
  return [
    { name: DEV_ACCESS_EXPIRES_AT_COOKIE, value: String(now + maxAge * 1000), maxAge },
    { name: DEV_ACCESS_ISSUED_AT_COOKIE, value: String(now), maxAge },
    { name: DEV_ACCESS_VIA_REFRESH_COOKIE, value: viaRefresh ? '1' : '0', maxAge },
  ];
}

function writeDevAccessJar(expiresIn: number | undefined, viaRefresh: boolean) {
  return cookies().then((jar) => {
    for (const entry of devAccessEntries(expiresIn, viaRefresh)) {
      jar.set(entry.name, entry.value, { ...devCookieOptions, maxAge: entry.maxAge });
    }
  });
}

function clearDevAccessJar() {
  return cookies().then((jar) => {
    for (const name of DEV_ACCESS_COOKIES) {
      jar.set(name, '', { ...devCookieOptions, maxAge: 0 });
    }
  });
}

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
  viaRefresh = false,
) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...baseCookieOptions,
    maxAge: tokens.expiresIn ?? ACCESS_TOKEN_MAX_AGE,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...baseCookieOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
  for (const entry of devAccessEntries(tokens.expiresIn, viaRefresh)) {
    response.cookies.set(entry.name, entry.value, {
      ...devCookieOptions,
      maxAge: entry.maxAge,
    });
  }
}

/** requireAccessToken 이 cookies() 로 재발급할 때 개발 패널용 시각도 같이 쓴다 */
export function rememberDevAccessRefresh(expiresIn?: number) {
  return writeDevAccessJar(expiresIn, true);
}

export function clearDevAccessCookies(response: NextResponse) {
  for (const name of DEV_ACCESS_COOKIES) {
    response.cookies.set(name, '', { ...devCookieOptions, maxAge: 0 });
  }
}

/**
 * development 테스트.
 * refresh 쿠키와 a토큰 예상 만료 표시를 지운다.
 * access 쿠키는 다음 API가 재발급할 때까지 둔다.
 */
export function clearRefreshTokenCookie(response: NextResponse) {
  response.cookies.set(REFRESH_TOKEN_COOKIE, '', {
    ...baseCookieOptions,
    maxAge: 0,
  });
  clearDevAccessCookies(response);
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
  clearDevAccessCookies(response);
}

export function clearDevAccessCookieJar() {
  return clearDevAccessJar();
}
