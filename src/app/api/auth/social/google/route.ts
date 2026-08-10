import { NextResponse } from 'next/server';
import { handleBffError } from '@/lib/api/bffRoute';
import { getGoogleAuthorizeUrl } from '@/lib/auth/google-oauth';
import {
  createOAuthState,
  setOAuthStateCookie,
} from '@/lib/auth/oauth-state';

/** BFF /api/auth/social/google — GET OAuth 시작 */
export async function GET() {
  console.log('[API] 구글 소셜 로그인 시작');
  try {
    const state = createOAuthState('GOOGLE');
    const authorizeUrl = getGoogleAuthorizeUrl(state);
    const response = NextResponse.redirect(authorizeUrl);
    setOAuthStateCookie(response, state);
    return response;
  } catch (err) {
    console.error('[API] 구글 소셜 로그인 시작 실패', err);
    return handleBffError(err);
  }
}
