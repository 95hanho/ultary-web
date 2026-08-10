import { NextResponse } from 'next/server';
import { springEndpoints } from '@/lib/api/endpoints';
import { handleBffError } from '@/lib/api/bffRoute';
import { springPostJson } from '@/lib/api/springFetch';
import {
  getRefreshToken,
  setAuthCookies,
} from '@/lib/auth/cookies';
import type { RefreshTokenRequest, TokenResponse } from '@/types/api';

/** BFF /api/auth/refresh — POST */
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

    const tokens = await springPostJson<TokenResponse, RefreshTokenRequest>(
      springEndpoints.auth.refresh,
      { refreshToken },
    );

    const response = NextResponse.json(
      { success: true, message: 'REFRESH_SUCCESS' },
      { status: 200 },
    );
    setAuthCookies(response, tokens);
    return response;
  } catch (err) {
    return handleBffError(err);
  }
}
