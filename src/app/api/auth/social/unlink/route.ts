import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/auth/social/unlink — DELETE */
export async function DELETE() {
  console.log('[API] 소셜 계정 연동 해제');
  try {
    // TODO: springFetch 연동
    return notImplemented('auth/social/unlink DELETE');
  } catch (err) {
    return handleBffError(err);
  }
}
