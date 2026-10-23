import { NextRequest } from 'next/server';
import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  readJsonBody,
  requireAdminAccessToken,
} from '@/lib/api/bffRoute';
import { springPostJson } from '@/lib/api/springFetch';

/** BFF /api/admin/tags/[tagId]/reject — POST */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tagId: string }> },
) {
  console.log('[API] 관리자 태그 거절');
  try {
    const accessToken = await requireAdminAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { tagId } = await params;
    const body = await readJsonBody(request);
    const requestId = Number(body.requestId);
    const rejectMessage = typeof body.rejectMessage === 'string' ? body.rejectMessage.trim() : '';
    const data = await springPostJson(
      springEndpoints.admin.tagReject,
      {
        tagId: Number(tagId),
        ...(Number.isSafeInteger(requestId) && requestId > 0 ? { requestId } : {}),
        ...(rejectMessage ? { rejectMessage } : {}),
      },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
