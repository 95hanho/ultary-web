import { bearer, handleBffError, isUnauthorized, ok, requireAdminAccessToken } from '@/lib/api/bffRoute';
import { springEndpoints } from '@/lib/api/endpoints';
import { springGet } from '@/lib/api/springFetch';

export async function GET(_request: Request, { params }: { params: Promise<{ aiRequestId: string }> }) {
  try {
    const token = await requireAdminAccessToken();
    if (isUnauthorized(token)) return token;
    const { aiRequestId } = await params;
    return ok(await springGet(springEndpoints.admin.aiLogPreview, { aiRequestId }, bearer(token)));
  } catch (error) {
    return handleBffError(error);
  }
}
