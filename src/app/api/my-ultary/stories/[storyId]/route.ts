import { springEndpoints } from '@/lib/api/endpoints';
import {
  badRequest,
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { isRecord } from '@/lib/api/error';
import { springDelete, springPutJson } from '@/lib/api/springFetch';

/** BFF /api/my-ultary/stories/[storyId] — PUT 스토리 수정 (본인만) */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ storyId: string }> },
) {
  console.log('[API] 스토리 수정');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { storyId } = await params;
    const body = await request.json().catch(() => null);
    if (!isRecord(body)) return badRequest('INVALID_BODY', 'JSON 객체가 필요합니다.');
    const data = await springPutJson(
      springEndpoints.myUltary.story,
      { ...body, storyId },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}

/** BFF /api/my-ultary/stories/[storyId] — DELETE */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ storyId: string }> },
) {
  console.log('[API] 스토리 삭제');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { storyId } = await params;
    const data = await springDelete(
      springEndpoints.myUltary.story,
      { storyId },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
