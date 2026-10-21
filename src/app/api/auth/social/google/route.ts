import { NextRequest, NextResponse } from 'next/server';
import { handleBffError } from '@/lib/api/bffRoute';
import { getAccessToken } from '@/lib/auth/cookies';
import { getGoogleAuthorizeUrl } from '@/lib/auth/google-oauth';
import {
  createOAuthState,
  parseOAuthIntent,
  setOAuthIntentCookie,
  setOAuthReturnCookie,
  setOAuthStateCookie,
} from '@/lib/auth/oauth-state';
import { APP_URL } from '@/lib/env.server';

/** BFF /api/auth/social/google — GET OAuth 시작
 *  ?intent=link&returnUrl=/settings/mypage → 로그인된 계정에 구글 연동
 *  intent 생략·login → 소셜 로그인·가입
 */
export async function GET(request: NextRequest) {
  console.log('[API] 구글 소셜 OAuth 시작');
  try {
    const returnUrl = request.nextUrl.searchParams.get('returnUrl');
    const intent = parseOAuthIntent(request.nextUrl.searchParams.get('intent'));
    if (intent === 'link') {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        const login = new URL('/login', APP_URL);
        login.searchParams.set('error', 'UNAUTHORIZED');
        return NextResponse.redirect(login);
      }
    }
    const state = createOAuthState('GOOGLE');
    const authorizeUrl = getGoogleAuthorizeUrl(state);
    const response = NextResponse.redirect(authorizeUrl);
    setOAuthStateCookie(response, state);
    setOAuthIntentCookie(response, intent);
    setOAuthReturnCookie(
      response,
      intent === 'link' ? returnUrl || '/settings/mypage' : '/',
    );
    return response;
  } catch (err) {
    console.error('[API] 구글 소셜 OAuth 시작 실패', err);
    return handleBffError(err);
  }
}
