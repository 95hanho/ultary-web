import { NextRequest } from 'next/server';
import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  queryParams,
  requireAdminAccessToken,
} from '@/lib/api/bffRoute';
import { springGet } from '@/lib/api/springFetch';

export async function GET(request: NextRequest) {
  try {
    const token = await requireAdminAccessToken();
    if (isUnauthorized(token)) return token;
    return ok(await springGet(springEndpoints.admin.users, queryParams(request), bearer(token)));
  } catch (error) {
    return handleBffError(error);
  }
}
