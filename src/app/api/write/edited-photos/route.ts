import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/write/edited-photos — POST */
export async function POST() {
  console.log('[API] 편집 사진 저장');
  try {
    // TODO: springFetch 연동
    return notImplemented('write/edited-photos POST');
  } catch (err) {
    return handleBffError(err);
  }
}
