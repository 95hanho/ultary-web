import { springEndpoints } from '@/lib/api/endpoints';
import { bearer, handleBffError, ok, withOptionalAuth } from '@/lib/api/bffRoute';
import { springGet } from '@/lib/api/springFetch';
export const GET = withOptionalAuth<{ userNo: string }>(async ({ accessToken, params }) => {
  try {
    return ok(
      await springGet(
        springEndpoints.users.ultaryLinks,
        params,
        accessToken ? bearer(accessToken) : undefined,
      ),
    );
  } catch (error) {
    return handleBffError(error);
  }
});
