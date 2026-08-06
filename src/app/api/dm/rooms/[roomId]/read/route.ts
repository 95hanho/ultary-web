import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/dm/rooms/[roomId]/read — POST */
export async function POST() {
  console.log('[API] DM 읽음 처리');
  try {
    // TODO: springFetch 연동
    return notImplemented('dm/rooms/:roomId:/read POST');
  } catch (err) {
    return handleBffError(err);
  }
}
