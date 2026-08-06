import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/main/feeds — GET */
export async function GET() {
  console.log('[API] 주민 게시글 조회');
  try {
    // TODO: springFetch 연동
    return notImplemented('main/feeds GET');
  } catch (err) {
    return handleBffError(err);
  }
}
