import { NextRequest } from 'next/server';
import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  queryParams,
  readJsonBody,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springGet, springPostForm } from '@/lib/api/springFetch';

type Ctx = { params: Promise<{ roomId: string }> };

/** BFF /api/dm/rooms/[roomId]/messages — GET */
export async function GET(request: NextRequest, { params }: Ctx) {
  console.log('[API] DM 메시지 조회');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { roomId } = await params;
    const data = await springGet(
      springEndpoints.dm.messages,
      { roomId, ...queryParams(request) },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}

/** BFF /api/dm/rooms/[roomId]/messages — POST */
export async function POST(request: NextRequest, { params }: Ctx) {
  console.log('[API] DM 메시지 전송');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { roomId } = await params;
    const body = await readJsonBody(request);
    const data = await springPostForm(
      springEndpoints.dm.messages,
      { roomId, ...body },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
