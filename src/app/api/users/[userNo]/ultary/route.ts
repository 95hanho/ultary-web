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

/** BFF /api/users/[userNo]/ultary — GET */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userNo: string }> },
) {
  console.log('[API] 다른 유저 울타리 정보');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { userNo } = await params;
    const data = await springGet(
      springEndpoints.users.ultary,
      { userNo, ...queryParams(request) },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
