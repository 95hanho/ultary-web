import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/notifications/[notificationId]/read — PATCH */
export async function PATCH() {
  console.log('[API] 알림 단건 읽음');
  try {
    // TODO: springFetch 연동
    return notImplemented('notifications/:notificationId:/read PATCH');
  } catch (err) {
    return handleBffError(err);
  }
}
