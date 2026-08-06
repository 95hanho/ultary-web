import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/my-ultary/profile-image — PATCH */
export async function PATCH() {
  console.log('[API] 프로필 사진 변경');
  try {
    // TODO: springFetch 연동
    return notImplemented('my-ultary/profile-image PATCH');
  } catch (err) {
    return handleBffError(err);
  }
}
