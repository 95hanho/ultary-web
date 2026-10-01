import { NextRequest, NextResponse } from 'next/server';
import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springPatchJson } from '@/lib/api/springFetch';
import { validateNickname } from '@/lib/auth/signup-rules';
import type { ChangeNicknameRequest } from '@/types/api';

/** BFF /api/auth/me/nickname — PATCH 닉네임 변경 */
export async function PATCH(request: NextRequest) {
  console.log('[API] 닉네임 변경');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;

    const body = (await request.json()) as ChangeNicknameRequest;
    const nickname = body.nickname?.trim();
    if (!nickname) {
      return NextResponse.json(
        { message: 'INVALID_INPUT', detail: '닉네임을 입력해주세요.' },
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

    const data = await springPatchJson(
      springEndpoints.auth.changeNickname,
      { nickname },
      bearer(accessToken),
    );

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err) {
    return handleBffError(err);
  }
}
