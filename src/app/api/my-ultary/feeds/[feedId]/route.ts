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

/** MY 게시글 상세 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ feedId: string }> },
) {
  console.log('[API] MY 게시글 상세');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { feedId } = await params;

    const data = await springGet(
      springEndpoints.myUltary.feedDetail,
      { feedId, ...queryParams(request) },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
