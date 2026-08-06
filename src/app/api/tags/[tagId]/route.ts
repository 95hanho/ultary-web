import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/tags/[tagId] — GET */
export async function GET() {
  console.log('[API] 태그 정보 조회');
  try {
    // TODO: springFetch 연동
    return notImplemented('tags/:tagId: GET');
  } catch (err) {
    return handleBffError(err);
  }
}
