import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/auth/password — PUT */
export async function PUT() {
  console.log('[API] 비밀번호 변경');
  try {
    // TODO: springFetch 연동
    return notImplemented('auth/password PUT');
  } catch (err) {
    return handleBffError(err);
  }
}
