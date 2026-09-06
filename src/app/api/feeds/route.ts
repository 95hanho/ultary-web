import { NextRequest } from 'next/server';
import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springPostMultipart } from '@/lib/api/springFetch';

/** BFF /api/feeds — POST */
export async function POST(request: NextRequest) {
  console.log('[API] 게시글 등록');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const formData = await request.formData();
    const data = await springPostMultipart(
      springEndpoints.feeds.root,
      formData,
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
