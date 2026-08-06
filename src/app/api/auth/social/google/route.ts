import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/auth/social/google — GET */
export async function GET() {
  console.log('[API] 구글 소셜 로그인 시작');
  try {
    // TODO: springFetch 연동
    return notImplemented('auth/social/google GET');
  } catch (err) {
    return handleBffError(err);
  }
}
