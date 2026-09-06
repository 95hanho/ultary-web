import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springPostForm } from '@/lib/api/springFetch';

/** BFF /api/dm/rooms/[roomId]/read — POST */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  console.log('[API] DM 읽음 처리');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { roomId } = await params;
    const data = await springPostForm(
      springEndpoints.dm.roomRead,
      { roomId },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
