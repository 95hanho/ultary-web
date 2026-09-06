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
import { springPostJson } from '@/lib/api/springFetch';

/** BFF /api/auth/social/link — POST */
export async function POST(request: NextRequest) {
  console.log('[API] 소셜 계정 연동');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const body = await readJsonBody(request);
    const data = await springPostJson(
      springEndpoints.auth.socialLink,
      body,
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
