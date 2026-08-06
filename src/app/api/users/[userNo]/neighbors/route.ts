import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/users/[userNo]/neighbors — GET */
export async function GET() {
  console.log('[API] 주민·이웃 목록 조회');
  try {
    // TODO: springFetch 연동
    return notImplemented('users/:userNo:/neighbors GET');
  } catch (err) {
    return handleBffError(err);
  }
}
