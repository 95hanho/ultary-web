import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/users/[userNo]/neighbors/request — POST */
export async function POST() {
  console.log('[API] 주민 요청');
  try {
    // TODO: springFetch 연동
    return notImplemented('users/:userNo:/neighbors/request POST');
  } catch (err) {
    return handleBffError(err);
  }
}
