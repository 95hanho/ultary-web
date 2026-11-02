import { springEndpoints } from '@/lib/api/endpoints';
import { bearer, handleBffError, isUnauthorized, ok, requireAccessToken } from '@/lib/api/bffRoute';
import { springGet } from '@/lib/api/springFetch';

export async function GET() {
  try {
    const token = await requireAccessToken();
    if (isUnauthorized(token)) return token;
    return ok(await springGet(springEndpoints.main.feedAdvertisements, undefined, bearer(token)));
  } catch (error) {
    return handleBffError(error);
  }
}
