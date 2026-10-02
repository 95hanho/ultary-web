import { NextRequest } from 'next/server';
import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  queryParams,
  readJsonBody,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springGet, springPatchJson } from '@/lib/api/springFetch';

/** BFF /api/settings/notifications — GET */
export async function GET(request: NextRequest) {
  console.log('[API] 알림 설정 조회');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const data = await springGet(
      springEndpoints.settings.notifications,
      queryParams(request),
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}

/** BFF /api/settings/notifications — PATCH. 넣은 필드만 전달 */
export async function PATCH(request: NextRequest) {
  console.log('[API] 알림 설정 변경');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const body = await readJsonBody(request);
    const data = await springPatchJson(
      springEndpoints.settings.notifications,
      body,
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
