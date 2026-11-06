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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userNo: string }> },
) {
  try {
    const token = await requireAdminAccessToken();
    if (isUnauthorized(token)) return token;
    const { userNo } = await params;
    const body = await readJsonBody(request);
    return ok(
      await springPostJson(
        springEndpoints.admin.userTimelineAction.replace(':userNo', encodeURIComponent(userNo)),
        {
          type: body.type,
          id: body.id,
          reason: body.reason,
        },
        bearer(token),
      ),
    );
  } catch (error) {
    return handleBffError(error);
  }
}
