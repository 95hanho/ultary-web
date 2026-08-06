import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/my-ultary/feeds — GET */
export async function GET() {
  console.log('[API] MY 게시글 그리드 조회');
  try {
    // TODO: springFetch 연동
    return notImplemented('my-ultary/feeds GET');
  } catch (err) {
    return handleBffError(err);
  }
}
