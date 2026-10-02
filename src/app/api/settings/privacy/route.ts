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

/** BFF /api/settings/privacy — GET */
export async function GET(request: NextRequest) {
  console.log('[API] 공개 범위 조회');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const data = await springGet(
      springEndpoints.settings.privacy,
      queryParams(request),
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}

/** BFF /api/settings/privacy — PATCH. 넣은 필드만 전달 */
export async function PATCH(request: NextRequest) {
  console.log('[API] 공개 범위 변경');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const body = await readJsonBody(request);
    const data = await springPatchJson(
      springEndpoints.settings.privacy,
      body,
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
