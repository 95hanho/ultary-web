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

/** BFF /api/feeds/[feedId]/likers — GET */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ feedId: string }> },
) {
  console.log('[API] 좋아요한 사람 목록');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { feedId } = await params;
    const data = await springGet(
      springEndpoints.feeds.likers,
      { feedId, ...queryParams(request) },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
