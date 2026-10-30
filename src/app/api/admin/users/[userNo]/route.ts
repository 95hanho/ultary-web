import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  requireAdminAccessToken,
} from '@/lib/api/bffRoute';
import { springGet } from '@/lib/api/springFetch';

export async function GET(_request: Request, { params }: { params: Promise<{ userNo: string }> }) {
  try {
    const token = await requireAdminAccessToken();
    if (isUnauthorized(token)) return token;
    const { userNo } = await params;
    return ok(
      await springGet(
        springEndpoints.admin.user.replace(':userNo', encodeURIComponent(userNo)),
        undefined,
        bearer(token),
      ),
    );
  } catch (error) {
    return handleBffError(error);
  }
}
