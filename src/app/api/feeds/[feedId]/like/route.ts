import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/feeds/[feedId]/like — POST/DELETE */
export async function POST() {
  console.log('[API] 게시글 좋아요');
  try {
    // TODO: springFetch 연동
    return notImplemented('feeds/:feedId:/like POST');
  } catch (err) {
    return handleBffError(err);
  }
}

export async function DELETE() {
  console.log('[API] 게시글 좋아요 취소');
  try {
    // TODO: springFetch 연동
    return notImplemented('feeds/:feedId:/like DELETE');
  } catch (err) {
    return handleBffError(err);
  }
}
