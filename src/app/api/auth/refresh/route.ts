import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/auth/refresh — POST */
export async function POST() {
  console.log('[API] 로그인 토큰 재발급');
  try {
    // TODO: springFetch 연동
    return notImplemented('auth/refresh POST');
  } catch (err) {
    return handleBffError(err);
  }
}
