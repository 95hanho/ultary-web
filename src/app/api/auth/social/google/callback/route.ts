import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/auth/social/google/callback — GET */
export async function GET() {
  console.log('[API] 구글 소셜 로그인 콜백');
  try {
    // TODO: springFetch 연동
    return notImplemented('auth/social/google/callback GET');
  } catch (err) {
    return handleBffError(err);
  }
}
