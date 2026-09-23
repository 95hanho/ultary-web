import { NextResponse } from 'next/server';
import { handleBffError } from '@/lib/api/bffRoute';
import { getRefreshToken, setAuthCookies } from '@/lib/auth/cookies';
import {
  applyTokensToCookieJar,
  clearAuthCookieJar,
  refreshViaSpringLocked,
} from '@/lib/auth/session';

/** BFF /api/auth/refresh — POST (공유 락으로 로테이션 레이스 방지) */
export async function POST() {
  console.log('[API] 로그인 토큰 재발급');
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      return NextResponse.json(
        { message: 'UNAUTHORIZED', detail: '리프레시 토큰이 없습니다.' },
        { status: 401 },
      );
    }

    const session = await refreshViaSpringLocked(refreshToken);
    if (!session.ok) {
      if (session.clearCookies) await clearAuthCookieJar();
      return NextResponse.json(
        { message: session.message, detail: '로그인이 필요합니다.' },
        { status: 401 },
      );
    }

    if (!session.tokens) {
      return NextResponse.json(
        { message: 'REFRESH_FAILED', detail: '토큰 재발급에 실패했습니다.' },
        { status: 500 },
      );
    }

    await applyTokensToCookieJar(session.tokens);
    const response = NextResponse.json(
      { success: true, message: 'REFRESH_SUCCESS' },
      { status: 200 },
    );
    setAuthCookies(response, session.tokens);
    return response;
  } catch (err) {
    return handleBffError(err);
  }
}
