import { NextRequest, NextResponse } from 'next/server';
import { handleBffError } from '@/lib/api/bffRoute';
import { springEndpoints } from '@/lib/api/endpoints';
import { springPostJson } from '@/lib/api/springFetch';
import { validateNickname } from '@/lib/auth/signup-rules';
import { setAuthCookies } from '@/lib/auth/cookies';
import type { SignupRequest, TokenResponse } from '@/types/api';

/** BFF /api/auth/signup — POST */
export async function POST(request: NextRequest) {
  console.log('[API] 회원가입');
  try {
    const body = (await request.json()) as SignupRequest;
    if (!body.phoneAuthCompleteToken?.trim()) {
      return NextResponse.json(
        {
          message: 'INVALID_INPUT',
          detail: '휴대폰 인증을 완료해주세요.',
        },
        { status: 400 },
      );
    }
    const nickname = body.nickname?.trim() ?? '';
    if (!body.password || !nickname) {
      return NextResponse.json(
        {
          message: 'INVALID_INPUT',
          detail: '비밀번호와 닉네임을 입력해주세요.',
        },
        { status: 400 },
      );
    }
    const nicknameError = validateNickname(nickname);
    if (nicknameError) {
      return NextResponse.json(
        { message: 'INVALID_INPUT', detail: nicknameError },
        { status: 400 },
      );
    }

    const payload: SignupRequest = {
      phoneAuthCompleteToken: body.phoneAuthCompleteToken.trim(),
      password: body.password,
      nickname,
      name: body.name?.trim() || undefined,
      email: body.email?.trim() || undefined,
    };

    const tokens = await springPostJson<TokenResponse, SignupRequest>(
      springEndpoints.auth.signup,
      payload,
    );

    const response = NextResponse.json(
      { success: true, message: 'SIGNUP_SUCCESS' },
      { status: 200 },
    );
    setAuthCookies(response, tokens);
    return response;
  } catch (err) {
    return handleBffError(err);
  }
}
