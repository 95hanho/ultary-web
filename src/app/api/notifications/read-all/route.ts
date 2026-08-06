import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/notifications/read-all — POST */
export async function POST() {
  console.log('[API] 알림 전체 읽음');
  try {
    // TODO: springFetch 연동
    return notImplemented('notifications/read-all POST');
  } catch (err) {
    return handleBffError(err);
  }
}
