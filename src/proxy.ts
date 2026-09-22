import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from '@/lib/auth/cookie-names';
import {
  isAuthPublicPath,
  loginRedirectUrl,
} from '@/lib/auth/paths';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js 16+: 기존 middleware 역할 (파일명 proxy).
 * 페이지 가드만 수행. 토큰 재발급은 하지 않음 (BFF withAuth/runAuthed에서 Spring refresh).
 * share/docs/auth-access.md
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isAuthPublicPath(pathname)) {
    return NextResponse.next();
  }

  const access = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value?.trim();
  const refresh = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value?.trim();

  // refresh 또는 access 중 하나라도 있으면 페이지 통과 (만료 access는 API에서 refresh)
  if (access || refresh) {
    return NextResponse.next();
  }

  return NextResponse.redirect(loginRedirectUrl(request.url, pathname, search));
}

export const config = {
  // 정적 자산·api·확장자 파일 제외 (페이지 가드만)
  matcher: ['/((?!_next/static|_next/image|api|.*\\..*).*)'],
};
