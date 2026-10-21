import { NextResponse } from 'next/server';
import { springEndpoints } from '@/lib/api/endpoints';
import { handleBffError } from '@/lib/api/bffRoute';
import { springPostJson } from '@/lib/api/springFetch';
import { clearAdminAuthCookieJar, clearAdminAuthCookies, getAdminRefreshToken } from '@/lib/auth/cookies';

/** BFF /api/admin/auth/logout — POST */
export async function POST() {
  console.log('[API] 관리자 로그아웃');
  try {
    const refreshToken = await getAdminRefreshToken();
    if (refreshToken) {
      try {
        await springPostJson(springEndpoints.admin.logout, { refreshToken });
      } catch (err) {
        console.error('[API] Spring 관리자 로그아웃 호출 실패(쿠키는 삭제)', err);
      }
    }

    await clearAdminAuthCookieJar();
    const response = NextResponse.json(
      { success: true, message: 'LOGOUT_SUCCESS' },
      { status: 200 },
    );
    clearAdminAuthCookies(response);
    return response;
  } catch (err) {
    return handleBffError(err);
  }
}
