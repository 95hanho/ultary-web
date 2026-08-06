import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/feeds/[feedId]/comments/[commentId]/replies/[replyId] — PATCH/DELETE */
export async function PATCH() {
  console.log('[API] 답글 수정');
  try {
    // TODO: springFetch 연동
    return notImplemented('feeds/:feedId:/comments/:commentId:/replies/:replyId: PATCH');
  } catch (err) {
    return handleBffError(err);
  }
}

export async function DELETE() {
  console.log('[API] 답글 삭제');
  try {
    // TODO: springFetch 연동
    return notImplemented('feeds/:feedId:/comments/:commentId:/replies/:replyId: DELETE');
  } catch (err) {
    return handleBffError(err);
  }
}
