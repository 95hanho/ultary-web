import { NextRequest, NextResponse } from 'next/server';
import { handleBffError } from '@/lib/api/bffRoute';
import { springEndpoints } from '@/lib/api/endpoints';
import { springPostJson } from '@/lib/api/springFetch';
import type { PhoneVerifyRequest, PhoneVerifyResponse } from '@/types/api';

/** BFF /api/auth/phone/verify — POST */
export async function POST(request: NextRequest) {
  console.log('[API] 휴대폰 인증 확인');
  try {
    const body = (await request.json()) as PhoneVerifyRequest;
    if (!body.code?.trim() || !body.phoneAuthToken?.trim()) {
      return NextResponse.json(
        {
          message: 'INVALID_INPUT',
          detail: '인증번호와 인증 토큰이 필요합니다.',
        },
        { status: 400 },
      );
    }

    const data = await springPostJson<PhoneVerifyResponse, PhoneVerifyRequest>(
      springEndpoints.auth.phoneVerify,
      {
        code: body.code.trim(),
        phoneAuthToken: body.phoneAuthToken.trim(),
      },
    );

    return NextResponse.json(
      { success: true, message: 'PHONE_VERIFY_SUCCESS', data },
      { status: 200 },
    );
  } catch (err) {
    return handleBffError(err);
  }
}
