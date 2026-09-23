import { NextRequest, NextResponse } from 'next/server';
import { handleBffError } from '@/lib/api/bffRoute';
import { getKakaoAuthorizeUrl } from '@/lib/auth/kakao-oauth';
import {
  createOAuthState,
  setOAuthReturnCookie,
  setOAuthStateCookie,
} from '@/lib/auth/oauth-state';

/** BFF /api/auth/social/kakao — GET OAuth 시작 */
export async function GET(request: NextRequest) {
  console.log('[API] 카카오 소셜 로그인 시작');
  try {
    const returnUrl = request.nextUrl.searchParams.get('returnUrl');
    const state = createOAuthState('KAKAO');
    const authorizeUrl = getKakaoAuthorizeUrl(state);
    const response = NextResponse.redirect(authorizeUrl);
    setOAuthStateCookie(response, state);
    setOAuthReturnCookie(response, returnUrl);
    return response;
  } catch (err) {
    console.error('[API] 카카오 소셜 로그인 시작 실패', err);
    return handleBffError(err);
  }
}
