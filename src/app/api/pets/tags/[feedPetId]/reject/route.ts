import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/pets/tags/[feedPetId]/reject — POST */
export async function POST() {
  console.log('[API] 피드 반려동물 태그 거절');
  try {
    // TODO: springFetch 연동
    return notImplemented('pets/tags/:feedPetId:/reject POST');
  } catch (err) {
    return handleBffError(err);
  }
}
