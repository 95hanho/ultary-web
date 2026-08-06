import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/auth/social/kakao/callback — GET */
export async function GET() {
  console.log('[API] 카카오 소셜 로그인 콜백');
  try {
    // TODO: springFetch 연동
    return notImplemented('auth/social/kakao/callback GET');
  } catch (err) {
    return handleBffError(err);
  }
}
