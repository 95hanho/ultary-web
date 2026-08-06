import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/auth/login — POST */
export async function POST() {
  console.log('[API] 로그인');
  try {
    // TODO: springFetch 연동
    return notImplemented('auth/login POST');
  } catch (err) {
    return handleBffError(err);
  }
}
