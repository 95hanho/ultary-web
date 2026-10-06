import { NextResponse } from 'next/server';
import { isProd } from '@/lib/env.server';
import { clearRefreshTokenCookie } from '@/lib/auth/cookies';
import { ok } from '@/lib/api/bffRoute';

/**
 * BFF POST /api/dev/refresh-token/reset
 * development 전용. httpOnly refreshToken 쿠키와 a토큰 만료 표시 쿠키를 비운다.
 * access 쿠키는 유지한다. 이후 재발급되면 패널이 새 만료 시각을 다시 그린다.
 */
export async function POST() {
  if (isProd) {
    return NextResponse.json(
      { message: 'NOT_FOUND', detail: '테스트 API는 개발 환경에서만 사용합니다.' },
      { status: 404 },
    );
  }

  console.log('[API] 테스트 · refresh 토큰 쿠키 초기화');
  const response = ok({ cleared: true });
  clearRefreshTokenCookie(response);
  return response;
}
