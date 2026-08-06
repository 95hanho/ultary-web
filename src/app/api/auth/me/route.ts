import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/auth/me — GET/PATCH/DELETE */
export async function GET() {
  console.log('[API] 내 회원정보 조회');
  try {
    // TODO: springFetch 연동
    return notImplemented('auth/me GET');
  } catch (err) {
    return handleBffError(err);
  }
}

export async function PATCH() {
  console.log('[API] 회원정보 변경');
  try {
    // TODO: springFetch 연동
    return notImplemented('auth/me PATCH');
  } catch (err) {
    return handleBffError(err);
  }
}

export async function DELETE() {
  console.log('[API] 회원탈퇴');
  try {
    // TODO: springFetch 연동
    return notImplemented('auth/me DELETE');
  } catch (err) {
    return handleBffError(err);
  }
}
