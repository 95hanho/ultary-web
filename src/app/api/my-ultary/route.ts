import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/my-ultary — GET */
export async function GET() {
  console.log('[API] 마이울타리 정보 조회');
  try {
    // TODO: springFetch 연동
    return notImplemented('my-ultary GET');
  } catch (err) {
    return handleBffError(err);
  }
}
