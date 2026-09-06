import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springPostForm } from '@/lib/api/springFetch';

/** BFF /api/admin/tags/[tagId]/reject — POST */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ tagId: string }> },
) {
  console.log('[API] 관리자 태그 거절');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { tagId } = await params;
    const data = await springPostForm(
      springEndpoints.admin.tagReject,
      { tagId },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
