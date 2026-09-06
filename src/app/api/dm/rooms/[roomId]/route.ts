import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springDelete } from '@/lib/api/springFetch';

/** BFF /api/dm/rooms/[roomId] — DELETE */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  console.log('[API] DM 방 나가기');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { roomId } = await params;
    const data = await springDelete(
      springEndpoints.dm.room,
      { roomId },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
