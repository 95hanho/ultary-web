import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springPatchForm } from '@/lib/api/springFetch';

/** BFF /api/notifications/[notificationId]/read — PATCH */
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ notificationId: string }> },
) {
  console.log('[API] 알림 단건 읽음');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { notificationId } = await params;
    const data = await springPatchForm(
      springEndpoints.notifications.read,
      { notificationId },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
