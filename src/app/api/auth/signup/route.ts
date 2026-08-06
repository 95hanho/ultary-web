import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/auth/signup — POST */
export async function POST() {
  console.log('[API] 회원가입');
  try {
    // TODO: springFetch 연동
    return notImplemented('auth/signup POST');
  } catch (err) {
    return handleBffError(err);
  }
}
