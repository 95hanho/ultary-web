import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springPostJson } from '@/lib/api/springFetch';
import { isProd } from '@/lib/env.server';
import { NextResponse } from 'next/server';

/**
 * BFF POST /api/test/nickname-cooldown
 * Spring local: POST /api/v1/test/nickname-cooldown
 * nickname_changed_at 을 올해 1월 1일로 되돌려 7일 쿨다운을 푼다.
 * FE는 development에서만 호출 (share §13)
 */
export async function POST() {
  if (isProd) {
    return NextResponse.json(
      { message: 'NOT_FOUND', detail: '테스트 API는 개발 환경에서만 사용합니다.' },
      { status: 404 },
    );
  }

  console.log('[API] 테스트 · 닉네임 변경 기간 초기화');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;

    const data = await springPostJson(
      springEndpoints.test.nicknameCooldown,
      {},
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
