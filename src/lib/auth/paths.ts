/**
 * 페이지 인증 화이트리스트 / 공유 단건 경로.
 * share/docs/auth-access.md
 */

/** 비로그인 허용 (인증 플로우) */
export const AUTH_PUBLIC_PREFIXES = [
  '/login',
  '/signup',
] as const;

/** 공유 게시글 단건 — `/feeds/123` (하위 경로 없음) */
const SHARED_FEED_PATH = /^\/feeds\/[^/]+$/;

export function isAuthPublicPath(pathname: string): boolean {
  if (AUTH_PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  return SHARED_FEED_PATH.test(pathname) || /^\/myultary\/[^/]+$/.test(pathname);
}

export function isSharedFeedPath(pathname: string): boolean {
  return SHARED_FEED_PATH.test(pathname);
}

/** 관리자 화면. 회원 세션 가드 밖에 두고 관리자 쿠키만 본다 */
export function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

export function loginRedirectUrl(requestUrl: string): string {
  return new URL('/login', requestUrl).toString();
}
