import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/pets/tags/[feedPetId]/approve — POST */
export async function POST() {
  console.log('[API] 피드 반려동물 태그 승인');
  try {
    // TODO: springFetch 연동
    return notImplemented('pets/tags/:feedPetId:/approve POST');
  } catch (err) {
    return handleBffError(err);
  }
}
