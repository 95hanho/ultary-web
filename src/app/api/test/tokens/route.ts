import { NextResponse } from 'next/server';
import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springDelete } from '@/lib/api/springFetch';
import {
  clearRefreshTokenCookie,
  clearRefreshTokenCookieJar,
} from '@/lib/auth/cookies';
import { isProd } from '@/lib/env.server';

/**
 * BFF DELETE /api/test/tokens
 * Spring local: DELETE /api/v1/test/tokens — 내 리프레시 토큰 행 전부 폐기.
 * 액세스 JWT는 DB에 없으므로 access 쿠키는 지우지 않는다.
 */
export async function DELETE() {
  if (isProd) {
    return NextResponse.json(
      { message: 'NOT_FOUND', detail: '테스트 API는 개발 환경에서만 사용합니다.' },
      { status: 404 },
    );
  }

  console.log('[API] 테스트 · 리프레시 토큰 폐기');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;

    const data = await springDelete(
      springEndpoints.test.tokens,
      undefined,
      bearer(accessToken),
    );
    await clearRefreshTokenCookieJar();
    const response = ok(data);
    clearRefreshTokenCookie(response);
    return response;
  } catch (err) {
    return handleBffError(err);
  }
}
