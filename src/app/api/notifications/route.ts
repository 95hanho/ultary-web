import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/notifications — GET */
export async function GET() {
  console.log('[API] 알림 목록 조회');
  try {
    // TODO: springFetch 연동
    return notImplemented('notifications GET');
  } catch (err) {
    return handleBffError(err);
  }
}
