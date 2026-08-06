import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/neighbors/[neighborId] — DELETE */
export async function DELETE() {
  console.log('[API] 주민 요청 취소·이웃 해제');
  try {
    // TODO: springFetch 연동
    return notImplemented('neighbors/:neighborId: DELETE');
  } catch (err) {
    return handleBffError(err);
  }
}
