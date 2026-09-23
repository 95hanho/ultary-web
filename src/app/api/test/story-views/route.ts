import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springDelete } from '@/lib/api/springFetch';
import { isProd } from '@/lib/env.server';
import { NextResponse } from 'next/server';

/**
 * BFF DELETE /api/test/story-views
 * Spring local: DELETE /api/v1/test/story-views — 내 스토리 읽음 전부 삭제
 * FE는 development에서만 호출 (share §13)
 */
export async function DELETE() {
  if (isProd) {
    return NextResponse.json(
      { message: 'NOT_FOUND', detail: '테스트 API는 개발 환경에서만 사용합니다.' },
      { status: 404 },
    );
  }

  console.log('[API] 테스트 · 스토리 읽음 초기화');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;

    const data = await springDelete(
      springEndpoints.test.storyViews,
      undefined,
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
