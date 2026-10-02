import { NextRequest, NextResponse } from 'next/server';
import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springPutJson } from '@/lib/api/springFetch';
import { clearAuthCookies } from '@/lib/auth/cookies';
import type { ChangeMyPasswordRequest } from '@/types/api';

/** BFF /api/auth/password/me — PUT. 성공 시 서버가 기존 토큰을 폐기하므로 쿠키도 지운다. */
export async function PUT(request: NextRequest) {
  console.log('[API] 로그인 중 비밀번호 변경');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;

    const body = (await request.json()) as ChangeMyPasswordRequest;
    const newPassword = body.newPassword?.trim();
    if (!newPassword) {
      return NextResponse.json(
        { message: 'INVALID_INPUT', detail: '새 비밀번호를 입력해주세요.' },
        { status: 400 },
      );
    }

    const payload: ChangeMyPasswordRequest = { newPassword };
    const currentPassword = body.currentPassword?.trim();
    if (currentPassword) payload.currentPassword = currentPassword;

    const data = await springPutJson(
      springEndpoints.auth.passwordMe,
      payload,
      bearer(accessToken),
    );
    const response = NextResponse.json({ success: true, data }, { status: 200 });
    clearAuthCookies(response);
    return response;
  } catch (err) {
    return handleBffError(err);
  }
}
