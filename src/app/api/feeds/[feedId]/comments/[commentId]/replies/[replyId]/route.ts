import { NextRequest } from 'next/server';
import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  readJsonBody,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springDelete, springPatchForm } from '@/lib/api/springFetch';

type Ctx = {
  params: Promise<{ feedId: string; commentId: string; replyId: string }>;
};

/** BFF reply — PATCH */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  console.log('[API] 답글 수정');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { feedId, commentId, replyId } = await params;
    const body = await readJsonBody(request);
    const data = await springPatchForm(
      springEndpoints.feeds.reply,
      { feedId, commentId, replyId, ...body },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}

/** BFF reply — DELETE */
export async function DELETE(_request: Request, { params }: Ctx) {
  console.log('[API] 답글 삭제');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { feedId, commentId, replyId } = await params;
    const data = await springDelete(
      springEndpoints.feeds.reply,
      { feedId, commentId, replyId },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
