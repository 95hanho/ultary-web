import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/feeds/[feedId]/share — POST */
export async function POST() {
  console.log('[API] 게시글 공유');
  try {
    // TODO: springFetch 연동
    return notImplemented('feeds/:feedId:/share POST');
  } catch (err) {
    return handleBffError(err);
  }
}
