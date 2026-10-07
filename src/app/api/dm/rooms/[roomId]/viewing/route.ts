import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  readJsonBody,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springPostJson } from '@/lib/api/springFetch';

/** BFF /api/dm/rooms/[roomId]/viewing — POST { viewing } */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  console.log('[API] DM 보는 중');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { roomId } = await params;
    const body = await readJsonBody(request);
    const data = await springPostJson(
      springEndpoints.dm.roomViewing,
      { roomId, ...body },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
