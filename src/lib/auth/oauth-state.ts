import 'server-only';

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { SocialProvider } from '@/types/api';
import { isProd } from '@/lib/env.server';
import { sanitizeReturnUrl } from '@/lib/auth/return-url';

const OAUTH_STATE_COOKIE = 'oauth_state';
const OAUTH_RETURN_COOKIE = 'oauth_return';
const OAUTH_INTENT_COOKIE = 'oauth_intent';
const OAUTH_STATE_MAX_AGE = 60 * 10;

/** login: 소셜 로그인·가입. link: 로그인된 계정에 SNS 연동 */
export type OAuthIntent = 'login' | 'link';

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

const cookieBase = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: OAUTH_STATE_MAX_AGE,
};

export function setOAuthStateCookie(response: NextResponse, state: string) {
  response.cookies.set(OAUTH_STATE_COOKIE, state, cookieBase);
}

export function setOAuthReturnCookie(
  response: NextResponse,
  returnUrl: string | null | undefined,
) {
  const safe = sanitizeReturnUrl(returnUrl, '');
  if (!safe || safe === '/') {
    response.cookies.set(OAUTH_RETURN_COOKIE, '', { ...cookieBase, maxAge: 0 });
    return;
  }
  response.cookies.set(OAUTH_RETURN_COOKIE, safe, cookieBase);
}

export function setOAuthIntentCookie(
  response: NextResponse,
  intent: OAuthIntent,
) {
  response.cookies.set(OAUTH_INTENT_COOKIE, intent, cookieBase);
}

export function parseOAuthIntent(raw: string | null | undefined): OAuthIntent {
  return raw === 'link' ? 'link' : 'login';
}

export async function getOAuthStateCookie() {
  const jar = await cookies();
  return jar.get(OAUTH_STATE_COOKIE)?.value;
}

export async function getOAuthReturnCookie() {
  const jar = await cookies();
  return sanitizeReturnUrl(jar.get(OAUTH_RETURN_COOKIE)?.value);
}

export async function getOAuthIntentCookie(): Promise<OAuthIntent> {
  const jar = await cookies();
  return parseOAuthIntent(jar.get(OAUTH_INTENT_COOKIE)?.value);
}

export function clearOAuthStateCookie(response: NextResponse) {
  response.cookies.set(OAUTH_STATE_COOKIE, '', { ...cookieBase, maxAge: 0 });
  response.cookies.set(OAUTH_RETURN_COOKIE, '', { ...cookieBase, maxAge: 0 });
  response.cookies.set(OAUTH_INTENT_COOKIE, '', { ...cookieBase, maxAge: 0 });
}
