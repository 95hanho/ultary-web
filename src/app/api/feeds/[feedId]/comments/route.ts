import { NextRequest } from 'next/server';
import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  queryParams,
  readJsonBody,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springGet, springPostForm } from '@/lib/api/springFetch';

type Ctx = { params: Promise<{ feedId: string }> };

/** BFF /api/feeds/[feedId]/comments — GET */
export async function GET(request: NextRequest, { params }: Ctx) {
  console.log('[API] 댓글 목록');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { feedId } = await params;
    const data = await springGet(
      springEndpoints.feeds.comments,
      { feedId, ...queryParams(request) },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}

/** BFF /api/feeds/[feedId]/comments — POST */
export async function POST(request: NextRequest, { params }: Ctx) {
  console.log('[API] 댓글 작성');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { feedId } = await params;
    const body = await readJsonBody(request);
    const data = await springPostForm(
      springEndpoints.feeds.comments,
      { feedId, ...body },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
