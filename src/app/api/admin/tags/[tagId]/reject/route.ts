import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/admin/tags/[tagId]/reject — POST */
export async function POST() {
  console.log('[API] 관리자 태그 거절');
  try {
    // TODO: springFetch 연동
    return notImplemented('admin/tags/:tagId:/reject POST');
  } catch (err) {
    return handleBffError(err);
  }
}
