import { NextRequest, NextResponse } from 'next/server';
import { handleBffError } from '@/lib/api/bffRoute';
import { springEndpoints } from '@/lib/api/endpoints';
import { springPostJson } from '@/lib/api/springFetch';
import type { PhoneAuthRequest, PhoneAuthResponse } from '@/types/api';

/** BFF /api/auth/phone — POST */
export async function POST(request: NextRequest) {
  console.log('[API] 휴대폰 인증');
  try {
    const body = (await request.json()) as PhoneAuthRequest;
    if (!body.phone?.trim()) {
      return NextResponse.json(
        { message: 'INVALID_INPUT', detail: '휴대폰 번호를 입력해주세요.' },
        { status: 400 },
      );
    }

    const data = await springPostJson<PhoneAuthResponse, PhoneAuthRequest>(
      springEndpoints.auth.phone,
      { phone: body.phone.trim() },
    );

    return NextResponse.json(
      { success: true, message: 'PHONE_AUTH_SENT', data },
      { status: 200 },
    );
  } catch (err) {
    return handleBffError(err);
  }
}
