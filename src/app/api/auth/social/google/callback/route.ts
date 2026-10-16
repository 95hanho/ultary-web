import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken, setAuthCookies } from '@/lib/auth/cookies';
import { exchangeGoogleCode } from '@/lib/auth/google-oauth';
import {
  clearOAuthStateCookie,
  getOAuthIntentCookie,
  getOAuthReturnCookie,
  getOAuthStateCookie,
  parseOAuthState,
} from '@/lib/auth/oauth-state';
import {
  linkFailureRedirectCode,
  linkWithSpringSocial,
  loginFailureRedirectCode,
  loginWithSpringSocial,
} from '@/lib/auth/social-login';
import { APP_URL } from '@/lib/env.server';

/** BFF /api/auth/social/google/callback — GET */
export async function GET(request: NextRequest) {
  console.log('[API] 구글 소셜 OAuth 콜백');
  const intent = await getOAuthIntentCookie();
  const returnPath =
    intent === 'link'
      ? (await getOAuthReturnCookie()) || '/settings/mypage'
      : await getOAuthReturnCookie();
  const failRedirect = (code: string) => {
    if (intent === 'link') {
      const url = new URL(returnPath, APP_URL);
      url.searchParams.set('error', code);
      const response = NextResponse.redirect(url);
      clearOAuthStateCookie(response);
      return response;
    }
    return NextResponse.redirect(
      `${APP_URL}/login?error=${encodeURIComponent(code)}`,
    );
  };

  try {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const oauthError = searchParams.get('error');

    if (oauthError) {
      return failRedirect(oauthError);
    }

    if (!code || !state) {
      return failRedirect('missing_code');
    }

    const savedState = await getOAuthStateCookie();
    const parsed = parseOAuthState(state);
    if (!savedState || savedState !== state || parsed?.provider !== 'GOOGLE') {
      return failRedirect('invalid_state');
    }

    const profile = await exchangeGoogleCode(code);

    if (intent === 'link') {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        return failRedirect('UNAUTHORIZED');
      }
      await linkWithSpringSocial(accessToken, {
        provider: 'GOOGLE',
        providerUserId: profile.providerUserId,
        email: profile.email,
        name: profile.name,
      });
      const redirectUrl = new URL(returnPath, APP_URL);
      redirectUrl.searchParams.set('linked', 'GOOGLE');
      const response = NextResponse.redirect(redirectUrl);
      clearOAuthStateCookie(response);
      return response;
    }

    const tokens = await loginWithSpringSocial({
      provider: 'GOOGLE',
      providerUserId: profile.providerUserId,
      email: profile.email,
      name: profile.name,
    });

    const redirectUrl = new URL(returnPath, APP_URL);
    if (tokens.defaultNickname) {
      redirectUrl.searchParams.set('needNickname', '1');
    }

    const response = NextResponse.redirect(redirectUrl);
    setAuthCookies(response, tokens);
    clearOAuthStateCookie(response);
    return response;
  } catch (err) {
    console.error('[API] 구글 소셜 OAuth 콜백 실패', err);
    if (intent === 'link') {
      return failRedirect(linkFailureRedirectCode(err, 'google_link_failed'));
    }
    return NextResponse.redirect(
      `${APP_URL}/login?error=${loginFailureRedirectCode(err, 'google_failed')}`,
    );
  }
}
