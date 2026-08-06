import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/reports — POST */
export async function POST() {
  console.log('[API] 신고');
  try {
    // TODO: springFetch 연동
    return notImplemented('reports POST');
  } catch (err) {
    return handleBffError(err);
  }
}
