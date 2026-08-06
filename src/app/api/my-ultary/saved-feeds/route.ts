import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/my-ultary/saved-feeds — GET */
export async function GET() {
  console.log('[API] 저장한 게시글 조회');
  try {
    // TODO: springFetch 연동
    return notImplemented('my-ultary/saved-feeds GET');
  } catch (err) {
    return handleBffError(err);
  }
}
