import 'server-only';

import { APP_URL, KAKAO_CLIENT_SECRET, KAKAO_REST_API_KEY } from '@/lib/env.server';

export function assertKakaoOAuthConfigured() {
  if (!KAKAO_REST_API_KEY) {
    throw new Error('KAKAO_REST_API_KEY 환경변수가 필요합니다.');
  }
}

export function getKakaoAuthorizeUrl(state: string) {
  assertKakaoOAuthConfigured();
  const redirectUri = `${APP_URL}/api/auth/social/kakao/callback`;
  console.log('redirectUri', redirectUri);
  console.log('KAKAO_REST_API_KEY', KAKAO_REST_API_KEY);
  const url = new URL('https://kauth.kakao.com/oauth/authorize');
  url.searchParams.set('client_id', KAKAO_REST_API_KEY);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('state', state);
  return url.toString();
}

type KakaoTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
};

type KakaoUserResponse = {
  id: number;
  kakao_account?: {
    email?: string;
    profile?: {
      nickname?: string;
    };
  };
};

export async function exchangeKakaoCode(code: string) {
  assertKakaoOAuthConfigured();
  const redirectUri = `${APP_URL}/api/auth/social/kakao/callback`;

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: KAKAO_REST_API_KEY,
    redirect_uri: redirectUri,
    code,
  });
  if (KAKAO_CLIENT_SECRET) {
    body.set('client_secret', KAKAO_CLIENT_SECRET);
  }

  const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(`Kakao token exchange failed: ${text}`);
  }

  const tokenJson = (await tokenRes.json()) as KakaoTokenResponse;

  const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    cache: 'no-store',
  });

  if (!userRes.ok) {
    const text = await userRes.text();
    throw new Error(`Kakao userinfo failed: ${text}`);
  }

  const user = (await userRes.json()) as KakaoUserResponse;
  if (user.id == null) throw new Error('Kakao userinfo missing id');

  return {
    providerUserId: String(user.id),
    email: user.kakao_account?.email ?? null,
    name: user.kakao_account?.profile?.nickname ?? null,
  };
}
