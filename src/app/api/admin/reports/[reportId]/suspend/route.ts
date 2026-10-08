import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springPostForm } from '@/lib/api/springFetch';

/** BFF /api/admin/reports/[reportId]/suspend — POST */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ reportId: string }> },
) {
  console.log('[API] 관리자 신고 회원 정지');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { reportId } = await params;
    const data = await springPostForm(
      springEndpoints.admin.reportSuspend,
      { reportId },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
