import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/dm/rooms/[roomId] — DELETE */
export async function DELETE() {
  console.log('[API] DM 대화방 나가기');
  try {
    // TODO: springFetch 연동
    return notImplemented('dm/rooms/:roomId: DELETE');
  } catch (err) {
    return handleBffError(err);
  }
}
