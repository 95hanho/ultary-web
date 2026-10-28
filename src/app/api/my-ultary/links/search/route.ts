import { springEndpoints } from '@/lib/api/endpoints';
import { bearer, handleBffError, ok, queryParams, withAuth } from '@/lib/api/bffRoute';
import { springGet } from '@/lib/api/springFetch';
export const GET = withAuth(async ({ request, accessToken }) => {
  try {
    return ok(
      await springGet(
        springEndpoints.myUltary.linksSearch,
        queryParams(request),
        bearer(accessToken),
      ),
    );
  } catch (error) {
    return handleBffError(error);
  }
});
