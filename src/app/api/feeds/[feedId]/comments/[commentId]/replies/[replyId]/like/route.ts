import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springDelete, springPostForm } from '@/lib/api/springFetch';

type Ctx = {
  params: Promise<{ feedId: string; commentId: string; replyId: string }>;
};

/** BFF /api/feeds/.../replies/[replyId]/like — POST */
export async function POST(_request: Request, { params }: Ctx) {
  console.log('[API] 답글 좋아요');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { feedId, commentId, replyId } = await params;
    const data = await springPostForm(
      springEndpoints.feeds.replyLike,
      { feedId, commentId, replyId },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}

/** BFF /api/feeds/.../replies/[replyId]/like — DELETE */
export async function DELETE(_request: Request, { params }: Ctx) {
  console.log('[API] 답글 좋아요 취소');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { feedId, commentId, replyId } = await params;
    const data = await springDelete(
      springEndpoints.feeds.replyLike,
      { feedId, commentId, replyId },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
