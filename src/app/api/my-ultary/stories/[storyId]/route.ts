import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springDelete } from '@/lib/api/springFetch';

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
