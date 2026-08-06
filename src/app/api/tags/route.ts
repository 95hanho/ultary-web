import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/tags — POST */
export async function POST() {
  console.log('[API] 태그 등록');
  try {
    // TODO: springFetch 연동
    return notImplemented('tags POST');
  } catch (err) {
    return handleBffError(err);
  }
}
