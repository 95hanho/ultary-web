import 'server-only';

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { SocialProvider } from '@/types/api';
import { isProd } from '@/lib/env.server';

const OAUTH_STATE_COOKIE = 'oauth_state';
const OAUTH_STATE_MAX_AGE = 60 * 10;

export type OAuthStatePayload = {
  provider: SocialProvider;
  nonce: string;
};

export function createOAuthState(provider: SocialProvider): string {
  const nonce = crypto.randomUUID().replace(/-/g, '');
  return `${provider}.${nonce}`;
}

export function parseOAuthState(state: string): OAuthStatePayload | null {
  const [provider, nonce] = state.split('.');
  if ((provider !== 'GOOGLE' && provider !== 'KAKAO') || !nonce) return null;
  return { provider, nonce };
}

export function setOAuthStateCookie(response: NextResponse, state: string) {
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: OAUTH_STATE_MAX_AGE,
  });
}

export async function getOAuthStateCookie() {
  const jar = await cookies();
  return jar.get(OAUTH_STATE_COOKIE)?.value;
}

export function clearOAuthStateCookie(response: NextResponse) {
  response.cookies.set(OAUTH_STATE_COOKIE, '', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
