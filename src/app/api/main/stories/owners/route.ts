import { NextRequest } from 'next/server';
import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  queryParams,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springGet } from '@/lib/api/springFetch';

/**
 * 주민 스토리 보유 목록 (링 메타만).
 * FileSummary / 프로필 URL 없음 — hasUnviewed 등. 미디어는 GET /main/stories?userNo=
 */
export async function GET(request: NextRequest) {
  console.log('[API] 주민 스토리 보유 목록 조회');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;

    const data = await springGet(
      springEndpoints.main.storyOwners,
      { ...queryParams(request) },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
