import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/feeds/[feedId] — GET/PATCH/DELETE */
export async function GET() {
  console.log('[API] 게시글 상세 조회');
  try {
    // TODO: springFetch 연동
    return notImplemented('feeds/:feedId: GET');
  } catch (err) {
    return handleBffError(err);
  }
}

export async function PATCH() {
  console.log('[API] 게시글 수정');
  try {
    // TODO: springFetch 연동
    return notImplemented('feeds/:feedId: PATCH');
  } catch (err) {
    return handleBffError(err);
  }
}

export async function DELETE() {
  console.log('[API] 게시글 삭제');
  try {
    // TODO: springFetch 연동
    return notImplemented('feeds/:feedId: DELETE');
  } catch (err) {
    return handleBffError(err);
  }
}
