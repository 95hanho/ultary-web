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

/** BFF /api/tags/[tagId] — GET */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tagId: string }> },
) {
  console.log('[API] 태그 정보 조회');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { tagId } = await params;
    const data = await springGet(
      springEndpoints.tags.detail,
      { tagId, ...queryParams(request) },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
