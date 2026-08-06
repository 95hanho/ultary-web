import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/feeds/[feedId]/comments — GET/POST */
export async function GET() {
  console.log('[API] 댓글 목록 조회');
  try {
    // TODO: springFetch 연동
    return notImplemented('feeds/:feedId:/comments GET');
  } catch (err) {
    return handleBffError(err);
  }
}

export async function POST() {
  console.log('[API] 댓글 작성');
  try {
    // TODO: springFetch 연동
    return notImplemented('feeds/:feedId:/comments POST');
  } catch (err) {
    return handleBffError(err);
  }
}
