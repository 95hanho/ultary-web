import { NextResponse } from 'next/server';
import { springEndpoints } from '@/lib/api/endpoints';
import { handleBffError } from '@/lib/api/bffRoute';
import { springPostJson } from '@/lib/api/springFetch';
import {
  clearAuthCookies,
  getRefreshToken,
} from '@/lib/auth/cookies';

/** BFF /api/auth/logout — POST */
export async function POST() {
  console.log('[API] 로그아웃');
  try {
    const refreshToken = await getRefreshToken();

    if (refreshToken) {
      try {
        await springPostJson(
          springEndpoints.auth.logout,
          { refreshToken },
        );
      } catch (err) {
        console.error('[API] Spring 로그아웃 호출 실패(쿠키는 삭제)', err);
      }
    }

    const response = NextResponse.json(
      { success: true, message: 'LOGOUT_SUCCESS' },
      { status: 200 },
    );
    clearAuthCookies(response);
    return response;
  } catch (err) {
    return handleBffError(err);
  }
}
