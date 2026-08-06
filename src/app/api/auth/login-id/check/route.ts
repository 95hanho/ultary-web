import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/auth/login-id/check — GET */
export async function GET() {
  console.log('[API] 아이디 중복확인');
  try {
    // TODO: springFetch 연동
    return notImplemented('auth/login-id/check GET');
  } catch (err) {
    return handleBffError(err);
  }
}
