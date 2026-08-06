import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/main/search — GET */
export async function GET() {
  console.log('[API] 검색');
  try {
    // TODO: springFetch 연동
    return notImplemented('main/search GET');
  } catch (err) {
    return handleBffError(err);
  }
}
