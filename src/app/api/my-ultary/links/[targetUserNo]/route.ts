import { springEndpoints } from '@/lib/api/endpoints';
import { bearer, handleBffError, ok, withAuth } from '@/lib/api/bffRoute';
import { springDelete } from '@/lib/api/springFetch';
export const DELETE = withAuth<{ targetUserNo: string }>(async ({ accessToken, params }) => {
  try {
    return ok(await springDelete(springEndpoints.myUltary.link, params, bearer(accessToken)));
  } catch (error) {
    return handleBffError(error);
  }
});
