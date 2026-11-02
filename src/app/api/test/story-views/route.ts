import { springEndpoints } from '@/lib/api/endpoints';
import { bearer, handleBffError, isUnauthorized, ok, requireAccessToken } from '@/lib/api/bffRoute';
import { springDelete } from '@/lib/api/springFetch';

/**
 * BFF DELETE /api/test/story-views
 * 운영 체험 도구: 인증된 본인의 스토리 읽음만 초기화한다.
 */
export async function DELETE() {
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
