import { NextRequest, NextResponse } from 'next/server';
import { setAuthCookies } from '@/lib/auth/cookies';
import { exchangeKakaoCode } from '@/lib/auth/kakao-oauth';
import {
  clearOAuthStateCookie,
  getOAuthStateCookie,
  parseOAuthState,
} from '@/lib/auth/oauth-state';
import { loginWithSpringSocial } from '@/lib/auth/social-login';
import { APP_URL } from '@/lib/env.server';

/** BFF /api/auth/social/kakao/callback — GET */
export async function GET(request: NextRequest) {
  console.log('[API] 카카오 소셜 로그인 콜백');
  try {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const oauthError = searchParams.get('error');

    if (oauthError) {
      return NextResponse.redirect(
        `${APP_URL}/login?error=${encodeURIComponent(oauthError)}`,
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(`${APP_URL}/login?error=missing_code`);
    }

    const savedState = await getOAuthStateCookie();
    const parsed = parseOAuthState(state);
    if (!savedState || savedState !== state || parsed?.provider !== 'KAKAO') {
      return NextResponse.redirect(`${APP_URL}/login?error=invalid_state`);
    }

    const profile = await exchangeKakaoCode(code);
    const tokens = await loginWithSpringSocial({
      provider: 'KAKAO',
      providerUserId: profile.providerUserId,
      email: profile.email,
      name: profile.name,
    });

    const redirectUrl = new URL('/', APP_URL);
    if (tokens.defaultNickname) {
      redirectUrl.searchParams.set('needNickname', '1');
    }

    const response = NextResponse.redirect(redirectUrl);
    setAuthCookies(response, tokens);
    clearOAuthStateCookie(response);
    return response;
  } catch (err) {
    console.error('[API] 카카오 소셜 로그인 콜백 실패', err);
    return NextResponse.redirect(`${APP_URL}/login?error=kakao_failed`);
  }
}
