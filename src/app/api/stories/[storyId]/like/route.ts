import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springDelete, springPostForm } from '@/lib/api/springFetch';

type Ctx = { params: Promise<{ storyId: string }> };

/** BFF /api/stories/[storyId]/like — POST */
export async function POST(_request: Request, { params }: Ctx) {
  console.log('[API] 스토리 공감');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { storyId } = await params;
    const data = await springPostForm(
      springEndpoints.stories.like,
      { storyId },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}

/** BFF /api/stories/[storyId]/like — DELETE */
export async function DELETE(_request: Request, { params }: Ctx) {
  console.log('[API] 스토리 공감 취소');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { storyId } = await params;
    const data = await springDelete(
      springEndpoints.stories.like,
      { storyId },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
