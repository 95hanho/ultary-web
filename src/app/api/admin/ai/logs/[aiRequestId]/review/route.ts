import { springEndpoints } from '@/lib/api/endpoints';
import { bearer, handleBffError, isUnauthorized, ok, requireAdminAccessToken, readJsonBody } from '@/lib/api/bffRoute';
import { springPostJson } from '@/lib/api/springFetch';

export async function POST(request: Request, { params }: { params: Promise<{ aiRequestId: string }> }) {
  try {
    const token = await requireAdminAccessToken();
    if (isUnauthorized(token)) return token;
    const { aiRequestId } = await params;
    const body = await readJsonBody(request);
    const path = springEndpoints.admin.aiLog.replace(':aiRequestId', encodeURIComponent(aiRequestId));
    return ok(await springPostJson(`${path}/review`, { status: body.status }, bearer(token)));
  } catch (error) { return handleBffError(error); }
}
