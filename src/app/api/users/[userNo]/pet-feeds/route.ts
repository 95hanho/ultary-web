import { springEndpoints } from '@/lib/api/endpoints';
import { bearer, handleBffError, ok, queryParams, withOptionalAuth } from '@/lib/api/bffRoute';
import { springGet } from '@/lib/api/springFetch';
export const GET = withOptionalAuth<{ userNo: string }>(
  async ({ request, accessToken, params }) => {
    try {
      return ok(
        await springGet(
          springEndpoints.users.petFeeds,
          { ...params, ...queryParams(request) },
          accessToken ? bearer(accessToken) : undefined,
        ),
      );
    } catch (error) {
      return handleBffError(error);
    }
  },
);
