import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/main/stories — GET */
export async function GET() {
  console.log('[API] 주민 스토리 조회');
  try {
    // TODO: springFetch 연동
    return notImplemented('main/stories GET');
  } catch (err) {
    return handleBffError(err);
  }
}
