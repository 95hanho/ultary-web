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

/** BFF /api/settings/activities — GET */
export async function GET(request: NextRequest) {
  console.log('[API] 내 활동');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const data = await springGet(
      springEndpoints.settings.activities,
      queryParams(request),
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
