import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/my-ultary/stories — POST */
export async function POST() {
  console.log('[API] 스토리 등록');
  try {
    // TODO: springFetch 연동
    return notImplemented('my-ultary/stories POST');
  } catch (err) {
    return handleBffError(err);
  }
}
