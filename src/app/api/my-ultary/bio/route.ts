import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/my-ultary/bio — PATCH */
export async function PATCH() {
  console.log('[API] 소개글 변경');
  try {
    // TODO: springFetch 연동
    return notImplemented('my-ultary/bio PATCH');
  } catch (err) {
    return handleBffError(err);
  }
}
