import { NextRequest, NextResponse } from 'next/server';
import { handleBffError } from '@/lib/api/bffRoute';
import { getAccessToken } from '@/lib/auth/cookies';
import { getKakaoAuthorizeUrl } from '@/lib/auth/kakao-oauth';
import {
  createOAuthState,
  parseOAuthIntent,
  setOAuthIntentCookie,
  setOAuthReturnCookie,
  setOAuthStateCookie,
} from '@/lib/auth/oauth-state';
import { APP_URL } from '@/lib/env.server';

/** BFF /api/auth/social/kakao — GET OAuth 시작
 *  ?intent=link&returnUrl=/settings/mypage → 로그인된 계정에 카카오 연동
 *  intent 생략·login → 소셜 로그인·가입
 */
export async function GET(request: NextRequest) {
  console.log('[API] 카카오 소셜 OAuth 시작');
  try {
    const returnUrl = request.nextUrl.searchParams.get('returnUrl');
    const intent = parseOAuthIntent(request.nextUrl.searchParams.get('intent'));
    if (intent === 'link') {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        const login = new URL('/login', APP_URL);
        login.searchParams.set('error', 'UNAUTHORIZED');
        login.searchParams.set(
          'returnUrl',
          returnUrl?.startsWith('/') ? returnUrl : '/settings/mypage',
        );
        return NextResponse.redirect(login);
      }
    }
    const state = createOAuthState('KAKAO');
    const authorizeUrl = getKakaoAuthorizeUrl(state);
    const response = NextResponse.redirect(authorizeUrl);
    setOAuthStateCookie(response, state);
    setOAuthIntentCookie(response, intent);
    setOAuthReturnCookie(
      response,
      intent === 'link' ? returnUrl || '/settings/mypage' : returnUrl,
    );
    return response;
  } catch (err) {
    console.error('[API] 카카오 소셜 OAuth 시작 실패', err);
    return handleBffError(err);
  }
}
