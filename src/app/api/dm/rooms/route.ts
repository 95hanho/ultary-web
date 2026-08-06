import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/dm/rooms — GET/POST */
export async function GET() {
  console.log('[API] DM 대화방 리스트 조회');
  try {
    // TODO: springFetch 연동
    return notImplemented('dm/rooms GET');
  } catch (err) {
    return handleBffError(err);
  }
}

export async function POST() {
  console.log('[API] DM 대화방 생성');
  try {
    // TODO: springFetch 연동
    return notImplemented('dm/rooms POST');
  } catch (err) {
    return handleBffError(err);
  }
}
