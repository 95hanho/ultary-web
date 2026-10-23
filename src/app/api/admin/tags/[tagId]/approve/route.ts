import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  requireAdminAccessToken,
} from '@/lib/api/bffRoute';
import { springPostForm } from '@/lib/api/springFetch';

/** BFF /api/admin/tags/[tagId]/approve — POST */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ tagId: string }> },
) {
  console.log('[API] 관리자 태그 승인');
  try {
    const accessToken = await requireAdminAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { tagId } = await params;
    const body = await request.json().catch(() => ({}));
    const requestId = typeof body.requestId === 'number' && Number.isSafeInteger(body.requestId) && body.requestId > 0 ? body.requestId : undefined;
    const data = await springPostForm(
      springEndpoints.admin.tagApprove,
      { tagId, requestId },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
