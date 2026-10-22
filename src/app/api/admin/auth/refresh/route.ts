import { NextResponse } from 'next/server';
import { handleBffError } from '@/lib/api/bffRoute';
import {
  applyAdminTokensToCookieJar,
  clearAdminAuthCookieJar,
  getAdminRefreshToken,
  setAdminAuthCookies,
} from '@/lib/auth/cookies';
import { refreshAdminViaSpringLocked } from '@/lib/auth/admin-session';

/** BFF /api/admin/auth/refresh — POST */
export async function POST() {
  console.log('[API] 관리자 토큰 재발급');
  try {
    const refreshToken = await getAdminRefreshToken();
    if (!refreshToken) {
      return NextResponse.json(
        { message: 'UNAUTHORIZED', detail: '리프레시 토큰이 없습니다.' },
        { status: 401 },
      );
    }

    const session = await refreshAdminViaSpringLocked(refreshToken);
    if (!session.ok) {
      if (session.clearCookies) await clearAdminAuthCookieJar();
      return NextResponse.json(
        { message: session.message, detail: session.message === 'REFRESH_RETRY_EXHAUSTED' ? '일시적인 오류가 발생했습니다.' : '로그인이 필요합니다.' },
        { status: session.message === 'REFRESH_RETRY_EXHAUSTED' ? 503 : 401 },
      );
    }

    if (!session.tokens) {
      return NextResponse.json(
        { message: 'REFRESH_FAILED', detail: '토큰 재발급에 실패했습니다.' },
        { status: 500 },
      );
    }

    await applyAdminTokensToCookieJar(session.tokens);
    const response = NextResponse.json(
      { success: true, message: 'REFRESH_SUCCESS' },
      { status: 200 },
    );
    setAdminAuthCookies(response, session.tokens);
    return response;
  } catch (err) {
    return handleBffError(err);
  }
}
