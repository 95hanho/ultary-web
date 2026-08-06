import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/neighbors/[neighborId]/accept — POST */
export async function POST() {
  console.log('[API] 주민 요청 수락');
  try {
    // TODO: springFetch 연동
    return notImplemented('neighbors/:neighborId:/accept POST');
  } catch (err) {
    return handleBffError(err);
  }
}
