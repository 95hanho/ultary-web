import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/admin/tags/[tagId]/approve — POST */
export async function POST() {
  console.log('[API] 관리자 태그 승인');
  try {
    // TODO: springFetch 연동
    return notImplemented('admin/tags/:tagId:/approve POST');
  } catch (err) {
    return handleBffError(err);
  }
}
