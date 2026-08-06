import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/my-ultary/tagged-feeds — GET */
export async function GET() {
  console.log('[API] 태그된 게시글 조회');
  try {
    // TODO: springFetch 연동
    return notImplemented('my-ultary/tagged-feeds GET');
  } catch (err) {
    return handleBffError(err);
  }
}
