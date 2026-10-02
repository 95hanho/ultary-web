import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springPostForm } from '@/lib/api/springFetch';

/**
 * BFF /api/stories/[storyId]/view — POST
 * ultary_story_view INSERT IGNORE. 응답에 viewedByMe, likedByMe.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ storyId: string }> },
) {
  console.log('[API] 스토리 읽음');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { storyId } = await params;
    const data = await springPostForm(
      springEndpoints.stories.view,
      { storyId },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
