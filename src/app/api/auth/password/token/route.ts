import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/auth/password/token — POST */
export async function POST() {
  console.log('[API] 비밀번호 변경 토큰 생성');
  try {
    // TODO: springFetch 연동
    return notImplemented('auth/password/token POST');
  } catch (err) {
    return handleBffError(err);
  }
}
