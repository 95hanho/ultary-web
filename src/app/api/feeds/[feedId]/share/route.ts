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
import { springPostForm } from '@/lib/api/springFetch';

/** BFF /api/feeds/[feedId]/share — POST */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ feedId: string }> },
) {
  console.log('[API] 게시글 공유');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { feedId } = await params;
    const body = await readJsonBody(request);
    const data = await springPostForm(
      springEndpoints.feeds.share,
      { feedId, ...body },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
