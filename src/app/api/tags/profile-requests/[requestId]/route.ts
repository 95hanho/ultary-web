import { springEndpoints } from '@/lib/api/endpoints';
import { bearer, handleBffError, ok, withAuth } from '@/lib/api/bffRoute';
import { springDelete } from '@/lib/api/springFetch';

type Ctx = { requestId: string };

/** BFF /api/tags/profile-requests/[requestId] — DELETE (PENDING·미검토만) */
export const DELETE = withAuth<Ctx>(async ({ accessToken, params }) => {
  console.log('[API] 태그 설명 요청 삭제');
  try {
    const { requestId } = params;
    const data = await springDelete(
      springEndpoints.tags.profileRequestById,
      { requestId },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
});
