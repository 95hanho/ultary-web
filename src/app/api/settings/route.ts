import { NextRequest } from 'next/server';
import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  readJsonBody,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springGet, springPatchForm } from '@/lib/api/springFetch';

/** BFF /api/settings — GET */
export async function GET() {
  console.log('[API] 설정 조회');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const data = await springGet(
      springEndpoints.settings.root,
      undefined,
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}

/** BFF /api/settings — PATCH */
export async function PATCH(request: NextRequest) {
  console.log('[API] 설정 변경');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const body = await readJsonBody(request);
    const data = await springPatchForm(
      springEndpoints.settings.root,
      body,
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
