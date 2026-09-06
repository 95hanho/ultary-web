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

/** ì£¼ë? ?¤í† ë¦?ì¡°íšŒ */
export async function GET(request: NextRequest) {
  console.log('[API] ì£¼ë? ?¤í† ë¦?ì¡°íšŒ');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;

    const data = await springGet(
      springEndpoints.main.stories,
      { ...queryParams(request) },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
