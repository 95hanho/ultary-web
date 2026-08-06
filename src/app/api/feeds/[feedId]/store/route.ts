import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/feeds/[feedId]/store — POST/DELETE */
export async function POST() {
  console.log('[API] 게시글 저장');
  try {
    // TODO: springFetch 연동
    return notImplemented('feeds/:feedId:/store POST');
  } catch (err) {
    return handleBffError(err);
  }
}

export async function DELETE() {
  console.log('[API] 게시글 저장 해제');
  try {
    // TODO: springFetch 연동
    return notImplemented('feeds/:feedId:/store DELETE');
  } catch (err) {
    return handleBffError(err);
  }
}
