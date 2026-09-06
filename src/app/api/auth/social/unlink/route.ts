import { NextRequest } from 'next/server';
import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  queryParams,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springDelete } from '@/lib/api/springFetch';

/** BFF /api/auth/social/unlink — DELETE */
export async function DELETE(request: NextRequest) {
  console.log('[API] 소셜 계정 연동 해제');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const data = await springDelete(
      springEndpoints.auth.socialUnlink,
      queryParams(request),
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
