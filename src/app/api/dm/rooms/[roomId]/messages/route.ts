import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/dm/rooms/[roomId]/messages — GET/POST */
export async function GET() {
  console.log('[API] DM 메시지 조회');
  try {
    // TODO: springFetch 연동
    return notImplemented('dm/rooms/:roomId:/messages GET');
  } catch (err) {
    return handleBffError(err);
  }
}

export async function POST() {
  console.log('[API] DM 메시지 전송');
  try {
    // TODO: springFetch 연동
    return notImplemented('dm/rooms/:roomId:/messages POST');
  } catch (err) {
    return handleBffError(err);
  }
}
