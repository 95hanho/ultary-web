import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springDelete, springPostForm } from '@/lib/api/springFetch';

type Ctx = { params: Promise<{ feedId: string }> };

/** BFF /api/feeds/[feedId]/store — POST */
export async function POST(_request: Request, { params }: Ctx) {
  console.log('[API] 게시글 저장');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { feedId } = await params;
    const data = await springPostForm(
      springEndpoints.feeds.store,
      { feedId },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}

/** BFF /api/feeds/[feedId]/store — DELETE */
export async function DELETE(_request: Request, { params }: Ctx) {
  console.log('[API] 게시글 저장 해제');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { feedId } = await params;
    const data = await springDelete(
      springEndpoints.feeds.store,
      { feedId },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
