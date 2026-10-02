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
import { springGet } from '@/lib/api/springFetch';

/** BFF /api/users/blocks — GET */
export async function GET(request: NextRequest) {
  console.log('[API] 차단한 사용자 목록');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const data = await springGet(
      springEndpoints.users.blocks,
      queryParams(request),
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
