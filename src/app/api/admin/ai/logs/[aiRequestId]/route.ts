import { springEndpoints } from '@/lib/api/endpoints';
import { bearer, handleBffError, isUnauthorized, ok, requireAdminAccessToken } from '@/lib/api/bffRoute';
import { springGet } from '@/lib/api/springFetch';

export async function GET(_request: Request, context: { params: Promise<{ aiRequestId: string }> }) {
  try {
    const token = await requireAdminAccessToken();
    if (isUnauthorized(token)) return token;
    const { aiRequestId } = await context.params;
    const path = springEndpoints.admin.aiLog.replace(':aiRequestId', encodeURIComponent(aiRequestId));
    return ok(await springGet(path, undefined, bearer(token)));
  } catch (err) {
    return handleBffError(err);
  }
}
