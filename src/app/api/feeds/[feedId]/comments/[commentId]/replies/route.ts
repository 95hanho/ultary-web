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

type Ctx = { params: Promise<{ feedId: string; commentId: string }> };

/** BFF replies — GET */
export async function GET(request: NextRequest, { params }: Ctx) {
  console.log('[API] 답글 목록');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { feedId, commentId } = await params;
    const data = await springGet(
      springEndpoints.feeds.replies,
      { feedId, commentId, ...queryParams(request) },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}

/** BFF replies — POST */
export async function POST(request: NextRequest, { params }: Ctx) {
  console.log('[API] 답글 작성');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { feedId, commentId } = await params;
    const body = await readJsonBody(request);
    const data = await springPostForm(
      springEndpoints.feeds.replies,
      { feedId, commentId, ...body },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
