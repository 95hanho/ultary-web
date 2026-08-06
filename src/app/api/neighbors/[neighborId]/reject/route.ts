import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/neighbors/[neighborId]/reject — POST */
export async function POST() {
  console.log('[API] 주민 요청 거절');
  try {
    // TODO: springFetch 연동
    return notImplemented('neighbors/:neighborId:/reject POST');
  } catch (err) {
    return handleBffError(err);
  }
}
