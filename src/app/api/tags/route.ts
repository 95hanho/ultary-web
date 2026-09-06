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

/** BFF /api/tags — POST */
export async function POST(request: NextRequest) {
  console.log('[API] 태그 등록');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const body = await readJsonBody(request);
    const data = await springPostForm(
      springEndpoints.tags.root,
      body,
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
