import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springPostForm } from '@/lib/api/springFetch';

/** BFF /api/notifications/read-all — POST */
export async function POST() {
  console.log('[API] 알림 전체 읽음');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const data = await springPostForm(
      springEndpoints.notifications.readAll,
      {},
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
