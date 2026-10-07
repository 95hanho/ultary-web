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

/** 울타리에 고정한 게시글 조회 */
export async function GET(request: NextRequest) {
  console.log('[API] 고정한 게시글 조회');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;

    const data = await springGet(
      springEndpoints.myUltary.pinnedFeeds,
      { ...queryParams(request) },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
