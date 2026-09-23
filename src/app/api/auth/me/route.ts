import { NextRequest, NextResponse } from 'next/server';
import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import {
  springDelete,
  springGet,
  springPatchJson,
} from '@/lib/api/springFetch';
import { clearAuthCookies } from '@/lib/auth/cookies';
import type { MeResponse, UpdateMeRequest } from '@/types/api';

/** BFF /api/auth/me — GET (access 없으면 refresh 시도) */
export async function GET() {
  console.log('[API] 내 회원정보 조회');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;

    const me = await springGet<MeResponse>(
      springEndpoints.auth.me,
      undefined,
      bearer(accessToken),
    );

    return NextResponse.json({ success: true, data: me }, { status: 200 });
  } catch (err) {
    return handleBffError(err);
  }
}

/** BFF /api/auth/me — PATCH 회원정보 변경 */
export async function PATCH(request: NextRequest) {
  console.log('[API] 회원정보 변경');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;

    const body = (await request.json()) as UpdateMeRequest;
    const data = await springPatchJson(springEndpoints.auth.updateMe, body, {
      ...bearer(accessToken),
    });

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err) {
    return handleBffError(err);
  }
}

/** BFF /api/auth/me — DELETE 회원탈퇴 */
export async function DELETE() {
  console.log('[API] 회원탈퇴');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;

    const data = await springDelete(springEndpoints.auth.withdraw, undefined, {
      ...bearer(accessToken),
    });

    const response = NextResponse.json({ success: true, data }, { status: 200 });
    clearAuthCookies(response);
    return response;
  } catch (err) {
    return handleBffError(err);
  }
}
