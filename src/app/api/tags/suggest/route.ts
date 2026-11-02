import { NextRequest } from 'next/server';
import { springEndpoints } from '@/lib/api/endpoints';
import { bearer, handleBffError, isUnauthorized, ok, queryParams, requireAccessToken } from '@/lib/api/bffRoute';
import { springGet } from '@/lib/api/springFetch';

export async function GET(request: NextRequest) {
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    return ok(await springGet(springEndpoints.tags.suggest, queryParams(request), bearer(accessToken)));
  } catch (error) {
    return handleBffError(error);
  }
}
