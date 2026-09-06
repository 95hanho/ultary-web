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
import { springDelete, springGet, springPatchForm } from '@/lib/api/springFetch';

type Ctx = { params: Promise<{ feedId: string }> };

/** BFF /api/feeds/[feedId] — GET */
export async function GET(request: NextRequest, { params }: Ctx) {
  console.log('[API] 게시글 상세 조회');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { feedId } = await params;
    const data = await springGet(
      springEndpoints.feeds.detail,
      { feedId, ...queryParams(request) },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}

/** BFF /api/feeds/[feedId] — PATCH */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  console.log('[API] 게시글 수정');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { feedId } = await params;
    const body = await readJsonBody(request);
    const data = await springPatchForm(
      springEndpoints.feeds.detail,
      { feedId, ...body },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}

/** BFF /api/feeds/[feedId] — DELETE */
export async function DELETE(_request: Request, { params }: Ctx) {
  console.log('[API] 게시글 삭제');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { feedId } = await params;
    const data = await springDelete(
      springEndpoints.feeds.detail,
      { feedId },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
