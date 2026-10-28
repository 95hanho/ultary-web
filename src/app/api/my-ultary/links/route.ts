import { springEndpoints } from '@/lib/api/endpoints';
import { bearer, handleBffError, ok, readJsonBody, withAuth } from '@/lib/api/bffRoute';
import { springPostJson } from '@/lib/api/springFetch';
export const POST = withAuth(async ({ request, accessToken }) => {
  try {
    return ok(
      await springPostJson(
        springEndpoints.myUltary.links,
        await readJsonBody(request),
        bearer(accessToken),
      ),
    );
  } catch (error) {
    return handleBffError(error);
  }
});
