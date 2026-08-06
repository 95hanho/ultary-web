import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/health — GET */
export async function GET() {
  console.log('[API] 헬스체크');
  try {
    // TODO: springFetch 연동
    return notImplemented('health GET');
  } catch (err) {
    return handleBffError(err);
  }
}
