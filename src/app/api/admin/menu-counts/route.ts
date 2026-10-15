import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  requireAdminAccessToken,
} from '@/lib/api/bffRoute';
import { springGet } from '@/lib/api/springFetch';

/** BFF /api/admin/menu-counts — GET */
export async function GET() {
  console.log('[API] 관리자 메뉴 건수');
  try {
    const accessToken = await requireAdminAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const data = await springGet(springEndpoints.admin.menuCounts, undefined, bearer(accessToken));
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
