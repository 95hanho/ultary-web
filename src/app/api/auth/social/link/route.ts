import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/auth/social/link — POST */
export async function POST() {
  console.log('[API] 소셜 계정 연동');
  try {
    // TODO: springFetch 연동
    return notImplemented('auth/social/link POST');
  } catch (err) {
    return handleBffError(err);
  }
}
