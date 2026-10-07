import { NextResponse } from 'next/server';
import { ok } from '@/lib/api/bffRoute';
import { clearAccessTokenCookie } from '@/lib/auth/cookies';
import { isProd } from '@/lib/env.server';

/**
 * BFF POST /api/dev/access-token/reset
 * development 전용. access 쿠키와 패널용 만료 표시만 비운다.
 * 리프레시 토큰은 서버·쿠키 모두 그대로 둔다.
 */
export async function POST() {
  if (isProd) {
    return NextResponse.json(
      { message: 'NOT_FOUND', detail: '테스트 API는 개발 환경에서만 사용합니다.' },
      { status: 404 },
    );
  }

  console.log('[API] 테스트 · access 토큰 쿠키 초기화');
  const response = ok({ cleared: true });
  clearAccessTokenCookie(response);
  return response;
}
