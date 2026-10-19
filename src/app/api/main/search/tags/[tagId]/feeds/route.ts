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

/** BFF /api/main/search/tags/[tagId]/feeds — GET */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tagId: string }> },
) {
  console.log('[API] 태그 게시글 그리드');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { tagId } = await params;
    const data = await springGet(
      springEndpoints.main.searchTagFeeds,
      { tagId, ...queryParams(request) },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
