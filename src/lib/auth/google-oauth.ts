import 'server-only';

import {
  APP_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
} from '@/lib/env.server';

export function assertGoogleOAuthConfigured() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error(
      'GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET 환경변수가 필요합니다.',
    );
  }
}

export function getGoogleAuthorizeUrl(state: string) {
  assertGoogleOAuthConfigured();
  const redirectUri = `${APP_URL}/api/auth/social/google/callback`;
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', state);
  url.searchParams.set('access_type', 'online');
  url.searchParams.set('prompt', 'select_account');
  return url.toString();
}

type GoogleTokenResponse = {
  access_token: string;
  id_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
};

type GoogleUserInfo = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

export async function exchangeGoogleCode(code: string) {
  assertGoogleOAuthConfigured();
  const redirectUri = `${APP_URL}/api/auth/social/google/callback`;

  const body = new URLSearchParams({
    code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(`Google token exchange failed: ${text}`);
  }

  const tokenJson = (await tokenRes.json()) as GoogleTokenResponse;

  const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    cache: 'no-store',
  });

  if (!userRes.ok) {
    const text = await userRes.text();
    throw new Error(`Google userinfo failed: ${text}`);
  }

  const user = (await userRes.json()) as GoogleUserInfo;
  if (!user.sub) throw new Error('Google userinfo missing sub');

  return {
    providerUserId: user.sub,
    email: user.email ?? null,
    name: user.name ?? null,
  };
}
