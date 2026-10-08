import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springPostForm } from '@/lib/api/springFetch';

/** BFF /api/admin/reports/[reportId]/hold — POST */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ reportId: string }> },
) {
  console.log('[API] 관리자 신고 보류');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { reportId } = await params;
    const data = await springPostForm(
      springEndpoints.admin.reportHold,
      { reportId },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
