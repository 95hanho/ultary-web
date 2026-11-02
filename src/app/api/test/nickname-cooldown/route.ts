import { springEndpoints } from '@/lib/api/endpoints';
import { bearer, handleBffError, isUnauthorized, ok, requireAccessToken } from '@/lib/api/bffRoute';
import { springPostJson } from '@/lib/api/springFetch';

/**
 * BFF POST /api/test/nickname-cooldown
 * 운영 체험 도구: 인증된 본인의 변경 시각을 31일 전으로 되돌린다.
 */
export async function POST() {
  console.log('[API] 테스트 · 닉네임태그 변경 기간 초기화');
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
