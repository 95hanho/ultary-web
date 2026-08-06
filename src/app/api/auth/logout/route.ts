import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/auth/logout — POST */
export async function POST() {
  console.log('[API] 로그아웃');
  try {
    // TODO: springFetch 연동
    return notImplemented('auth/logout POST');
  } catch (err) {
    return handleBffError(err);
  }
}
