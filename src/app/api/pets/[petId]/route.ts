import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/pets/[petId] — PATCH/DELETE */
export async function PATCH() {
  console.log('[API] 반려동물 수정');
  try {
    // TODO: springFetch 연동
    return notImplemented('pets/:petId: PATCH');
  } catch (err) {
    return handleBffError(err);
  }
}

export async function DELETE() {
  console.log('[API] 반려동물 삭제');
  try {
    // TODO: springFetch 연동
    return notImplemented('pets/:petId: DELETE');
  } catch (err) {
    return handleBffError(err);
  }
}
