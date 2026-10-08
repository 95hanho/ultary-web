import { NextRequest } from 'next/server';
import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springDelete } from '@/lib/api/springFetch';

/** BFF /api/reports/[reportId] — DELETE 신고요청 취소 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  console.log('[API] 신고 취소');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { reportId } = await params;
    const data = await springDelete(
      springEndpoints.users.reportCancel,
      { reportId },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
