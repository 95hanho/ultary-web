import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/write/photo-tags — POST */
export async function POST() {
  console.log('[API] 사진 태그 저장');
  try {
    // TODO: springFetch 연동
    return notImplemented('write/photo-tags POST');
  } catch (err) {
    return handleBffError(err);
  }
}
