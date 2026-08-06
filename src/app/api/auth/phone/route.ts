import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/auth/phone — POST */
export async function POST() {
  console.log('[API] 휴대폰 인증');
  try {
    // TODO: springFetch 연동
    return notImplemented('auth/phone POST');
  } catch (err) {
    return handleBffError(err);
  }
}
