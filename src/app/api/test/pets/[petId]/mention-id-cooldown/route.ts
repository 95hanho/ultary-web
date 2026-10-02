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
 * BFF POST /api/test/pets/:petId/mention-id-cooldown
 * Spring local: POST /api/v1/test/pets/{petId}/mention-id-cooldown
 * mention_id_changed_at 을 올해 1월 1일로 되돌려 30일 쿨다운을 푼다.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ petId: string }> },
) {
  if (isProd) {
    return NextResponse.json(
      { message: 'NOT_FOUND', detail: '테스트 API는 개발 환경에서만 사용합니다.' },
      { status: 404 },
    );
  }

  console.log('[API] 테스트 · 펫 멘션 ID 변경 기간 초기화');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { petId } = await params;

    const data = await springPostJson(
      springEndpoints.test.mentionIdCooldown,
      { petId },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
