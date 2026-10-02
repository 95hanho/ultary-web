import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springGet } from '@/lib/api/springFetch';

/** BFF /api/notifications/unread-count — GET. 읽음 처리하지 않는다. */
export async function GET() {
  console.log('[API] 안 읽은 알림 수');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const data = await springGet(
      springEndpoints.notifications.unreadCount,
      undefined,
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
