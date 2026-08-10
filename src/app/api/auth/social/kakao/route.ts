import { NextResponse } from 'next/server';
import { handleBffError } from '@/lib/api/bffRoute';
import { getKakaoAuthorizeUrl } from '@/lib/auth/kakao-oauth';
import {
  createOAuthState,
  setOAuthStateCookie,
} from '@/lib/auth/oauth-state';

/** BFF /api/auth/social/kakao — GET OAuth 시작 */
export async function GET() {
  console.log('[API] 카카오 소셜 로그인 시작');
  try {
    const state = createOAuthState('KAKAO');
    const authorizeUrl = getKakaoAuthorizeUrl(state);
    const response = NextResponse.redirect(authorizeUrl);
    setOAuthStateCookie(response, state);
    return response;
  } catch (err) {
    console.error('[API] 카카오 소셜 로그인 시작 실패', err);
    return handleBffError(err);
  }
}
