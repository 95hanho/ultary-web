import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/tags/search — GET */
export async function GET() {
  console.log('[API] 태그 검색');
  try {
    // TODO: springFetch 연동
    return notImplemented('tags/search GET');
  } catch (err) {
    return handleBffError(err);
  }
}
