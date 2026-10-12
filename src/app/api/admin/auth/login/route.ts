import { NextRequest, NextResponse } from 'next/server';
import { springEndpoints } from '@/lib/api/endpoints';
import { handleBffError } from '@/lib/api/bffRoute';
import { springPostJson } from '@/lib/api/springFetch';
import { setAdminAuthCookies } from '@/lib/auth/cookies';
import type { AdminLoginRequest, TokenResponse } from '@/types/api';

/** BFF /api/admin/auth/login — POST (loginId + password) */
export async function POST(request: NextRequest) {
  console.log('[API] 관리자 로그인');
  try {
    const body = (await request.json()) as AdminLoginRequest;
    const loginId = body.loginId?.trim();
    if (!loginId || !body.password) {
      return NextResponse.json(
        { message: 'INVALID_INPUT', detail: '아이디와 비밀번호를 입력해주세요.' },
        { status: 400 },
      );
    }

    const tokens = await springPostJson<TokenResponse, AdminLoginRequest>(
      springEndpoints.admin.login,
      { loginId, password: body.password },
    );

    const response = NextResponse.json(
      { success: true, message: 'LOGIN_SUCCESS' },
      { status: 200 },
    );
    setAdminAuthCookies(response, tokens);
    return response;
  } catch (err) {
    return handleBffError(err);
  }
}
