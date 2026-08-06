import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/my-ultary/stories/[storyId] — DELETE */
export async function DELETE() {
  console.log('[API] 스토리 삭제');
  try {
    // TODO: springFetch 연동
    return notImplemented('my-ultary/stories/:storyId: DELETE');
  } catch (err) {
    return handleBffError(err);
  }
}
