import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/users/[userNo]/block — POST/DELETE */
export async function POST() {
  console.log('[API] 유저 차단');
  try {
    // TODO: springFetch 연동
    return notImplemented('users/:userNo:/block POST');
  } catch (err) {
    return handleBffError(err);
  }
}

export async function DELETE() {
  console.log('[API] 유저 차단 해제');
  try {
    // TODO: springFetch 연동
    return notImplemented('users/:userNo:/block DELETE');
  } catch (err) {
    return handleBffError(err);
  }
}
