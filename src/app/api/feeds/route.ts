import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/feeds — POST */
export async function POST() {
  console.log('[API] 게시글 등록');
  try {
    // TODO: springFetch 연동
    return notImplemented('feeds POST');
  } catch (err) {
    return handleBffError(err);
  }
}
