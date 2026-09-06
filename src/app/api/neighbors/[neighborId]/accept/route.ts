import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springPostForm } from '@/lib/api/springFetch';

/** BFF /api/neighbors/[neighborId]/accept — POST */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ neighborId: string }> },
) {
  console.log('[API] 주민 요청 수락');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { neighborId } = await params;
    const data = await springPostForm(
      springEndpoints.users.neighborAccept,
      { neighborId },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
