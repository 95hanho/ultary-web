import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springDelete } from '@/lib/api/springFetch';

/** BFF /api/neighbors/[neighborId] — DELETE */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ neighborId: string }> },
) {
  console.log('[API] 주민 요청 취소 / 이웃 해제');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { neighborId } = await params;
    const data = await springDelete(
      springEndpoints.users.neighborCancel,
      { neighborId },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
