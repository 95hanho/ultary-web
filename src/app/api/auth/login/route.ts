import { NextRequest, NextResponse } from 'next/server';
import { springEndpoints } from '@/lib/api/endpoints';
import { handleBffError } from '@/lib/api/bffRoute';
import { springPostJson } from '@/lib/api/springFetch';
import { setAuthCookies } from '@/lib/auth/cookies';
import type { LoginRequest, TokenResponse } from '@/types/api';

/** BFF /api/auth/login — POST (email|phone + password) */
export async function POST(request: NextRequest) {
  console.log('[API] 로그인');
  try {
    const body = (await request.json()) as LoginRequest;
    if (!body.password) {
      return NextResponse.json(
        { message: 'INVALID_INPUT', detail: '비밀번호를 입력해주세요.' },
        { status: 400 },
      );
    }
    if (!body.email && !body.phone) {
      return NextResponse.json(
        {
          message: 'INVALID_INPUT',
          detail: '이메일 또는 휴대폰번호를 입력해주세요.',
        },
        { status: 400 },
      );
    }

    const tokens = await springPostJson<TokenResponse, LoginRequest>(
      springEndpoints.auth.login,
      body,
    );

    const response = NextResponse.json(
      { success: true, message: 'LOGIN_SUCCESS' },
      { status: 200 },
    );
    setAuthCookies(response, tokens);
    return response;
  } catch (err) {
    return handleBffError(err);
  }
}
