import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springPostForm } from '@/lib/api/springFetch';

/** BFF /api/users/[userNo]/neighbors/request — POST */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ userNo: string }> },
) {
  console.log('[API] 주민 요청');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { userNo } = await params;
    const data = await springPostForm(
      springEndpoints.users.neighborRequest,
      { userNo },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
