import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/feeds/[feedId]/likers — GET */
export async function GET() {
  console.log('[API] 게시글 좋아요한 사람 목록');
  try {
    // TODO: springFetch 연동
    return notImplemented('feeds/:feedId:/likers GET');
  } catch (err) {
    return handleBffError(err);
  }
}
