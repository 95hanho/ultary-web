import { NextRequest, NextResponse } from 'next/server';
import { springEndpoints } from '@/lib/api/endpoints';
import { handleBffError } from '@/lib/api/bffRoute';
import {
  springDelete,
  springGet,
  springPatchJson,
} from '@/lib/api/springFetch';
import { clearAuthCookies, getAccessToken } from '@/lib/auth/cookies';
import type { MeResponse, UpdateMeRequest } from '@/types/api';

/** BFF /api/auth/me — GET */
export async function GET() {
  console.log('[API] 내 회원정보 조회');
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { message: 'UNAUTHORIZED', detail: '로그인이 필요합니다.' },
        { status: 401 },
      );
    }

    const me = await springGet<MeResponse>(springEndpoints.auth.me, undefined, {
      Authorization: `Bearer ${accessToken}`,
    });

    return NextResponse.json({ success: true, data: me }, { status: 200 });
  } catch (err) {
    return handleBffError(err);
  }
}

/** BFF /api/auth/me — PATCH 회원정보 변경 */
export async function PATCH(request: NextRequest) {
  console.log('[API] 회원정보 변경');
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { message: 'UNAUTHORIZED', detail: '로그인이 필요합니다.' },
        { status: 401 },
      );
    }

    const body = (await request.json()) as UpdateMeRequest;
    const data = await springPatchJson(springEndpoints.auth.updateMe, body, {
      Authorization: `Bearer ${accessToken}`,
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
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { message: 'UNAUTHORIZED', detail: '로그인이 필요합니다.' },
        { status: 401 },
      );
    }

    const data = await springDelete(springEndpoints.auth.withdraw, undefined, {
      Authorization: `Bearer ${accessToken}`,
    });

    const response = NextResponse.json({ success: true, data }, { status: 200 });
    clearAuthCookies(response);
    return response;
  } catch (err) {
    return handleBffError(err);
  }
}
