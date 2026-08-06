import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/write/draft-photos — POST */
export async function POST() {
  console.log('[API] 작성 사진 임시저장');
  try {
    // TODO: springFetch 연동
    return notImplemented('write/draft-photos POST');
  } catch (err) {
    return handleBffError(err);
  }
}
