import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springDelete, springPostForm } from '@/lib/api/springFetch';

type Ctx = { params: Promise<{ feedId: string; commentId: string }> };

/** BFF /api/feeds/[feedId]/comments/[commentId]/like — POST */
export async function POST(_request: Request, { params }: Ctx) {
  console.log('[API] 댓글 좋아요');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { feedId, commentId } = await params;
    const data = await springPostForm(
      springEndpoints.feeds.commentLike,
      { feedId, commentId },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}

/** BFF /api/feeds/[feedId]/comments/[commentId]/like — DELETE */
export async function DELETE(_request: Request, { params }: Ctx) {
  console.log('[API] 댓글 좋아요 취소');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { feedId, commentId } = await params;
    const data = await springDelete(
      springEndpoints.feeds.commentLike,
      { feedId, commentId },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
