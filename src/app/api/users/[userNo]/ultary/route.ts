import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/users/[userNo]/ultary — GET */
export async function GET() {
  console.log('[API] 다른 유저 울타리 정보 조회');
  try {
    // TODO: springFetch 연동
    return notImplemented('users/:userNo:/ultary GET');
  } catch (err) {
    return handleBffError(err);
  }
}
